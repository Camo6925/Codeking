# Deliverable 1 – System Architecture (Rev B)

Rev B incorporates owner decisions D-1 to D-4 (see [README](README.md)):
the factory headlamp switch is removed, low beams follow the ignition, the amber pods replace the factory
front park/turn/side-marker lamps, and each headlight is a passive assembly with **one** plug,
home-run to a single custom distribution box.

## 1.1 Design principles

1. **Criticality partitioning.** No tier depends on a tier below it.

   | Tier | Functions | Implemented with | On controller failure |
   |---|---|---|---|
   | **T1 – Essential** | Low beam, high beam, front turn/hazard, front side markers, rear park/tail request | Relays, diodes, factory flasher, factory stalk | Unaffected |
   | **T1-F – Required, dimmable** | Amber front parking lamp (CH3) | LCM PWM, plus a **fail-ON** hardware bypass relay | Goes to **full certified park intensity** |
   | **T2 – Decorative** | Honeycomb (CH1), white DRL strip (CH2) | LCM (PROFET + ESP32-S3) | **OFF** |
   | **T3 – Interface** | Touchscreen, settings, diagnostics display | HMI (ESP32-S3 4.3") | No lighting effect |

   Amber running moved from T2 to T1-F because it is now the truck's legally required front parking
   lamp (D-3). A required lamp must not go dark because a controller crashed.

2. **Hardware owns safety; software owns comfort.** Ignition cutoff, watchdog cutoff, the 10 s
   power-down, the amber fail-ON, short-circuit protection and wire protection are all hardware.
3. **Passive headlamps.** No fuses, relays or electronics are mounted on the headlights. Each headlight
   contains only lamps, an NTC sensor and wiring to one sealed connector.
4. **Non-destructive vehicle integration.** The vehicle interface is made with mating pigtails at the
   factory headlamp-switch, column-switch and cluster connectors, so reversing it means re-plugging.
5. **Serviceability.** Every fuse and relay is plug-in and in one box. A headlamp is removed by
   unplugging one connector.

## 1.2 Physical architecture

```
  ┌──────────── ENGINE BAY ─────────────┐        ┌──────────────── CAB ─────────────────────────┐
  │                                     │        │                                              │
  │ BATTERY + ─ FM 30 A (≤300 mm) ══════╪═8 AWG══╪══►┐                                          │
  │ BATTERY − ══════════════════════════╪═8 AWG══╪══►┤  PDCC  (driver-side under-dash/kick panel)│
  │                                     │ firewall│   │  ┌─────────────┐ ┌───────────────────┐   │
  │ LEFT HEADLAMP ◄═══ one 12-way DT ═══╪═════════╪═══╡  │ RTMR fuses  │ │ LCM PCB           │   │
  │ (passive)        home-run harness   │ grommet │   │  │ & relays    │ │ PROFETs, ESP32-S3 │   │
  │                                     │         │   │  │ F1–F16      │ │ 10 s latch, WDT   │   │
  │ RIGHT HEADLAMP ◄══ one 12-way DT ═══╪═════════╪═══╡  │ K1–K9       │ │ fail-ON driver    │   │
  │ (passive)        home-run harness   │         │   │  └─────────────┘ └───────────────────┘   │
  │                                     │         │   ├── J-VEH ── pigtails: old switch conn.,   │
  │ old factory lamp sockets: sealed &  │         │   │            column switch, cluster, IGN   │
  │ abandoned                           │         │   ├── J-HMI ── touchscreen (old knob location)│
  └─────────────────────────────────────┘         │   └── J-EMER ─ emergency headlamp switch     │
                                                  └──────────────────────────────────────────────┘
```

**Why the PDCC is in the cab (driver side):**
* The ESP32-S3 module, the LCM electronics and the HMI are not rated for engine-bay temperatures. The
  cab is the benign location.
* Everything it connects to is within reach: the old headlamp-switch connector, column/stalk
  connector, cluster, HMI location and front turn feeds.
* Only three things cross the firewall: the 8 AWG battery feed and ground pair, and the two headlamp
  home-run harnesses.

The cost of this location is longer headlamp runs and the main feed through the firewall. Both are
covered in the sizing (8 AWG main, 14 AWG decorative return), and all checks pass in
`tools/wire_calc.py`.

## 1.3 Power flow

```
BATTERY (+) ─ FM 30 A MRBF/MIDI (≤ 300 mm from battery) ─ 8 AWG ─ PDCC power stud (VBUS)
  ├─ F1  5 A ─ K2 K-LO-L ──────────────► Left headlamp pin 1  (low beam)
  ├─ F2  5 A ─ K3 K-LO-R ──────────────► Right headlamp pin 1
  ├─ F3  5 A ─ K4 K-HI-L ──────────────► Left headlamp pin 2  (high beam)
  ├─ F4  5 A ─ K5 K-HI-R ──────────────► Right headlamp pin 2
  ├─ F5 10 A ─ K8 K-DECO ──────────────► LCM VDECO (CH1/CH2/CH3/AUX power)
  ├─ F6  3 A ──────────────────────────► LCM CTRL_BATT (always hot → hardware latch)
  ├─ F7  5 A ─ K1 K-IGN ───────────────► IGN_SW bus (relay coils, IGN sense)
  ├─ F8  5 A ──────────────────────────► Emergency switch S1
  ├─ F9  2 A ◄─ IGN_SW / EMER (diodes) ► Stalk common (STALK_FEED)
  ├─ K6 K-MARKER ─┬─ F12 2 A ──────────► Left headlamp pin 8  (front side marker)
  │               └─ F13 2 A ──────────► Right headlamp pin 8
  ├─ F11 3 A ─ K9 K-AMB-FS (fail-ON) ──► amber park nodes L/R (diode-ORed with PROFET CH3)
  ├─ F15 1 A ◄─ HI_REQ ────────────────► Cluster high-beam indicator
  ├─ F10 AUX spare   F14 spare   F16 spare
BATTERY (−) ─ 8 AWG ─ PDCC ground stud ─┬─ PRJ_RTN_L, PRJ_RTN_R  (16 AWG, headlamp pin 3)
                                        ├─ DECO_RTN_L, DECO_RTN_R (14 AWG, headlamp pin 9)
                                        ├─ LCM PGND / LGND (joined once on the LCM)
                                        └─ relay coil returns
FACTORY CIRCUITS (signal level only):
  IGN RUN tap ─ F0 1 A ─ K1 coil
  K7 dry contact ─ old switch pins (park signal) → factory park relay → rear tail/marker/license
  Factory LF/RF flasher outputs → PDCC → headlamp pin 7 (amber TURN) + LCM sense
```

## 1.4 Control logic (hardware, no MCU)

| Coil | Energized by (diode-OR) | Effect |
|---|---|---|
| K1 K-IGN | Factory IGN RUN tap | Creates IGN_SW |
| K2/K3 K-LO-L/R | IGN_SW · HI_REQ · EMER_SW | Low beams on with ignition; stay on during high beam |
| K4/K5 K-HI-L/R | HI_REQ (stalk HI or flash-to-pass) | High beams |
| K6 K-MARKER | IGN_SW · EMER_SW | Front side markers |
| K7 K-PARK-SIG | IGN_SW · EMER_SW | Emulates factory switch PARK → rear tail/marker/license |
| K8 K-DECO | IGN_SW | Decorative power available |
| K9 K-AMB-FS | IGN_SW · EMER_SW, coil return through **fail-ON driver** | Amber park at full certified intensity unless the LCM is healthy |

**Fail-ON driver (K9):** the K9 coil return goes through an N-MOSFET whose gate is pulled **up** from
IGN_SW. The LCM can switch it off (amber under PWM control) only while `HEALTHY = MCU_OK · WDOK` is
true. If the LCM is unpowered, crashed, resetting or watchdog-faulted, the MOSFET stays on, K9 closes,
and the amber parking lamps light at full certified intensity. With the ignition off, the coil has no
supply and everything is off.

## 1.5 Ignition behavior

| Event | Hardware | Firmware |
|---|---|---|
| Ignition → RUN | K1 → IGN_SW. Lows, side markers and rear park lamps on **within relay pull-in time**. K9 energizes (amber park full) because the LCM isn't healthy yet. Latch powers the LCM and HMI. | Boot → load settings → 1 s blanking → assert HEALTHY. K9 releases and amber hands over to PWM at the saved level (never below the legal floor) → decorative ramps over 500 ms. |
| Cranking | Relays per IGN circuit behavior (O-6). PROFETs to 3.1 V. | VBAT < 9.0 V > 200 ms: decorative suspended; amber held at the floor or handed to K9. Resume > 10.5 V. |
| Ignition → OFF | IGN_SW drops: all relays off, all lamps off **immediately**. IGN_OK gates PROFETs off. The latch's RC hold keeps the LCM and HMI powered. | ISR → duty 0 → save NVS → CAN `LCM_SHUTDOWN` → idle. |
| +10 s (8–12 s) | Latch releases. LCM and HMI unpowered. | — |
| Key-off | Target drain < 100 µA for the whole system **[MEASURE]**. | — |

## 1.6 Factory headlamp switch removed

The switch is replaced function by function. See
[09-factory-switch-integration.md](09-factory-switch-integration.md) for the pinout, dispositions and
the meter verification procedure. In short:

* **Headlamps:** follow ignition (no switch needed).
* **High beam:** the factory stalk's dimmer contacts are re-pinned as a dry signal switch fed from
  IGN_SW.
* **Rear park/tail:** the K7 dry contact replicates the switch's park signal into the factory park relay.
  The factory power and fusing for the rear lamps are unchanged.
* **Panel dimming:** resistor emulation of the switch's dimmer signal (Rev B), with a touchscreen-controlled
  option later.
* **High-beam indicator:** fed from HI_REQ (the factory headlamp circuit is no longer used).
* **Factory DRL / automatic headlamps:** disabled (DRL fuse and headlamp relay removed).

## 1.7 Amber corner: turn override and parking-lamp fail-safe

The amber pod must be an **SAE-certified dual-function park/turn lamp** (separate PARK and TURN
inputs) with a certified front side marker element (or a separate marker lamp). These are legally
required lamps now (D-3).

```
 Factory flasher L ────────────────────────────────────────────► TURN input (full intensity)
 LCM PROFET CH3-L ──|>|──┐
                         ├─► AMB_PARK_L node ──────────────────► PARK input
 K9 (fail-ON) ──F11──|>|─┘     (right side identical, own diodes)
 K6 ── F12 ────────────────────────────────────────────────────► SIDE MARKER
```

* **Turn override:** turn and hazard come straight from the factory flasher on the TURN input, so
  firmware can't dim, delay or block them. While a side is signaling, the LCM also drops that side's
  CH3 PWM to 0 (per-side `ALLOW_L/R` gate) for maximum flash contrast. This is an enhancement: like the
  factory 3157 bulb (park filament steady, turn filament flashing), the certified lamp is legal with
  park on during turn.
* **Brightness floor:** CH3 adjustment runs from `AMB_MIN_DUTY` (set from the photometric check so the
  lamp stays above the SAE J222 minimum) to 100 %. The HMI cannot go below the floor.
* **Fail-ON:** if the LCM fails, K9 feeds the PARK input at full voltage, which is the lamp's certified
  park intensity.

## 1.8 Fail-safe matrix

| Fault | Low | High | Turn/hazard | Side markers / rear park | Amber park | Honeycomb / DRL strip |
|---|---|---|---|---|---|---|
| HMI dead / CAN lost | ✔ | ✔ | ✔ | ✔ | ✔ saved level | ✔ saved level |
| LCM MCU crash | ✔ | ✔ | ✔ | ✔ | ✔ full (K9) | OFF |
| LCM unpowered (F6) | ✔ | ✔ | ✔ | ✔ | ✔ full (K9) | OFF |
| F5 / VDECO lost | ✔ | ✔ | ✔ | ✔ | ✔ full (firmware sees VDECO lost → drops HEALTHY → K9) | OFF |
| K1 or IGN tap failed | **S1 emergency switch** | ✔ via S1 → stalk feed | ✔ | ✔ via S1 | ✔ full (K9 via S1) | OFF |
| One projector relay failed | Other side lit; swap relay | ✔ | ✔ | ✔ | ✔ | ✔ |
| Decorative branch short | ✔ | ✔ | ✔ | ✔ | ✔ | Faulted branch off |
| Main fuse FM open | ✘ | ✘ | ✔ (factory) | Rear ✔ (factory); front ✘ | ✘ | ✘ |

The last row is the only total-loss case. It is a single 30 A fuse in a protected location; carry a
spare.

## 1.9 What the owner gives up

* **There is no headlamps-off with the engine running.** Lows follow the ignition by design (D-2). If
  that's ever needed (camping, drive-ins), a later revision can add a guarded HMI or hardware
  "lights off" that only works with the transmission in Park.
* **Dome override and interior-defeat knob functions** are not replaced in Rev B.
