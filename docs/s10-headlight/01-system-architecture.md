# Deliverable 1 – System Architecture (Rev D)

Rev D owner decisions (see [README](README.md)):

* **D-9:** off-road truck. Road-lighting regulations (FMVSS 108 / SAE photometry) are not design
  constraints.
* **D-10:** no side markers.
* **D-11:** amber corner = **square pod** matching the other lights: Diode Dynamics SS3 (amber, with
  amber backlight).
* **D-12:** the lighting system has its **own independent fuse box**, as in the original power
  architecture. All lighting power, including the amber turn lamps, comes from that box. Factory circuits
  provide **signals only**.

## 1.1 Design principles

1. **Power architecture (from the original requirement):**
   ```
   BATTERY → MAIN FUSE → INDEPENDENT FUSE/RELAY BOX → INDEPENDENT FUSED BRANCHES → LAMPS / CONTROLLER
   ```
   No lamp is powered from a factory fuse or factory lighting circuit. The factory truck supplies four
   things, all signals:
   * the ignition-RUN enable (one relay coil),
   * the dimmer-stalk high-beam contact,
   * the front turn/hazard signals (optically isolated, high-impedance),
   * the old headlamp-switch signal lines (park request, interior, dash dimmer).
2. **Criticality partitioning.**

   | Tier | Functions | Implemented with | On controller failure |
   |---|---|---|---|
   | **T1 – Essential** | Low beam, high beam, front turn/hazard, rear park/tail request | Relays and the Turn Interface Module (opto + smart switch) in the fuse box. **No microcontroller** | Unaffected |
   | **T2 – Decorative** | Honeycomb (CH1), DRL strip (CH2), amber running backlight (CH3) | Lighting Control Module (PROFET + ESP32-S3) | **OFF** |
   | **T3 – Interface** | Touchscreen, settings, diagnostics | HMI (ESP32-S3 4.3") | No lighting effect |
   | **T3-I – Interior** | Dome AUTO/ON/OFF, dash brightness | LCM photorelays on the old switch lines | Factory door behaviour, default dash level |
3. **Hardware owns safety; software owns comfort.**
4. **Passive headlamps.** Lamps, an NTC sensor and wiring to **one** sealed 12-way plug. No fuses or
   electronics on the lights.
5. **Serviceable and non-destructive:** plug-in fuses and relays, DT connectors, factory connectors
   reached through mating pigtails or fuse taps.

## 1.2 Physical architecture

```
 ENGINE BAY                                                             CAB
 ┌────────────────────────────────────────────────────────┐            ┌─────────────────────────────────┐
 │ BATTERY + top post ─ Blue Sea 5191 + 30 A MRBF          │            │ LCM (Lighting Control Module)   │
 │      │ 10 AWG                                           │  T1 power/ │  ESP32-S3, 8 PROFET channels,  │
 │      ▼                                                  │  outputs   │  10 s latch, watchdog,          │
 │ ┌───────────────── FRB: INDEPENDENT FUSE/RELAY BOX ───┐ │◄══════════►│  interior photorelays           │
 │ │ sealed IP66 (Eaton RTMR family)                     │ │  T2 sense  │                                 │
 │ │ F1–F20 branch fuses · K1–K5, K7, K8 relays          │ │◄══════════►│  J-INT ─ old headlamp-switch    │
 │ │ Turn Interface Module (TIM): 2 opto inputs +        │ │  T3 cab    │          pigtail (interior/dash)│
 │ │   dual PROFET, always-hot, no MCU                   │ │◄══════════►│  J-HMI ─ touchscreen            │
 │ │ ground stud ◄── 10 AWG ── BATTERY −                 │ │  interface │ cab side of T3: IGN tap (IP     │
 │ └──┬───────────────────────┬──────────────────────────┘ │            │  fuse 11), stalk, K7 park       │
 │    │ one 12-way plug        │ one 12-way plug           │            │  signal, emergency switch S1    │
 │    ▼                        ▼                           │            └─────────────────────────────────┘
 │ LEFT HEADLAMP (passive)   RIGHT HEADLAMP (passive)      │
 │ factory LT/RT TURN fuse taps ─ signal only ─► FRB TIM   │
 └────────────────────────────────────────────────────────┘
```

* **FRB (Fuse/Relay Box):** under the hood near the battery, standalone. Every lamp branch is fused here.
* **LCM:** in the cab (benign temperatures for the ESP32-S3 and the touchscreen link). It switches the
  decorative channels. Their outputs return to the FRB through the T1 trunk and pass through their own
  branch fuses before going to the headlamps, so **all** headlamp branches are fused in one box.
* **Each headlamp:** one harness, one plug at the lamp, one plug at the FRB.

## 1.3 Power flow

```
BATTERY (+) ─ 30 A MRBF (Blue Sea 5191 on post) ─ 10 AWG ─ FRB VBUS
FRB:
  F1  5 A ─ K2 ─► LEFT  pin 1  low beam          F11 3 A ◄─ LCM HONEY_L   ─► LEFT  pin 4
  F2  5 A ─ K3 ─► RIGHT pin 1  low beam          F12 3 A ◄─ LCM HONEY_R   ─► RIGHT pin 4
  F3  5 A ─ K4 ─► LEFT  pin 2  high beam         F13 3 A ◄─ LCM DRL_L     ─► LEFT  pin 5
  F4  5 A ─ K5 ─► RIGHT pin 2  high beam         F14 3 A ◄─ LCM DRL_R     ─► RIGHT pin 5
  F5 10 A ─ K8 ─► T1 VDECO → LCM PROFETs         F15 2 A ◄─ LCM AMB_RUN_L ─► LEFT  pin 6 (SS3 backlight)
  F6  3 A ─────► T1 CTRL_BATT → LCM latch        F16 2 A ◄─ LCM AMB_RUN_R ─► RIGHT pin 6
  F7  5 A ─ K1 ─► IGN_SW bus (coils, sense)      F17 3 A ◄─ TIM TURN_L     ─► LEFT  pin 7 (SS3 main)
  F8  5 A ─────► T3 → emergency switch S1        F18 3 A ◄─ TIM TURN_R     ─► RIGHT pin 7
  F9  2 A ◄ IGN_SW/EMER ► T3 → stalk common      F19 3 A ◄─ LCM AUX_L      ─► LEFT  pin 12 (fan, opt.)
  F10 5 A ─────► TIM supply (ALWAYS HOT: hazards work key-off)    F20 3 A ◄─ LCM AUX_R ─► RIGHT pin 12
BATTERY (−) ─ 10 AWG ─ FRB ground stud ─┬─ PRJ_RTN_L/R (16 AWG, pin 3) ─┬─ DECO_RTN_L/R (14 AWG, pin 9)
                                        ├─ T1 PGND / LGND → LCM         └─ coil returns, TIM ground
```

## 1.4 Hardware logic (no MCU)

| Device | Driven by | Effect |
|---|---|---|
| K1 K-IGN | Factory IGN RUN (IP fuse 11 tap, F0 1 A) | Creates IGN_SW |
| K2/K3 low beam | IGN_SW · HI_REQ · EMER (diode-OR) | Lows on with ignition; stay on during high beam |
| K4/K5 high beam | HI_REQ (stalk HIGH / flash-to-pass) | Highs |
| K7 park signal | IGN_SW · EMER | Dry contact replaces the old switch's park signal → factory rear tail/license lamps |
| K8 decorative power | IGN_SW | VDECO to the LCM |
| **TIM** | Factory LT/RT TURN signal → optocoupler → PROFET IN | SS3 main beam flashes at full brightness, powered from F10 (always hot). Hazards work with the key off. |

**Turn override:** the SS3 gives its main beam priority over its backlight internally (manufacturer
statement). While a side flashes, the LCM also holds that side's backlight off for the whole signaling
period (`ALLOW_L/R` gate) so the flash is clean. If the LCM is dead, the backlight is off anyway and
the turn signals still work.

## 1.5 Ignition behavior

| Event | Hardware | Firmware |
|---|---|---|
| Ignition → RUN | K1 → IGN_SW → lows on, K7 rear park request, K8 VDECO. LCM latch on. | Boot → load settings → 1 s blank → 500 ms ramp of CH1–CH3 |
| Cranking | Per IGN circuit (fuse 11 checked hot in CRANK) | VBAT < 9 V > 200 ms → decorative suspended; resume > 10.5 V |
| Ignition → OFF | All relays drop → lamps off immediately; IGN_OK gates PROFETs off; TIM still follows hazards | ISR → duty 0 → save NVS → `LCM_SHUTDOWN` |
| +10 s (8–12 s) | Hardware latch releases; LCM and HMI off | — |
| Key-off drain | Latch PROFET + TIM PROFET sleep (µA class) + opto leakage. Target < 100 µA **[MEASURE]** | — |

## 1.6 Factory headlamp switch removed

See [09-factory-switch-integration.md](09-factory-switch-integration.md). Lows follow the ignition, the
stalk's dimmer contact is the high-beam request, K7 replaces the park signal, and the LCM photorelays
replace the dome-ON, interior-defeat and dimmer contacts (touchscreen controlled). Factory DRL/automatic
headlamps are disabled by removing fuses.

## 1.7 Fail-safe matrix

| Fault | Low | High | Turn/hazard | Rear park | Decorative (CH1–CH3) | Interior/dash |
|---|---|---|---|---|---|---|
| HMI dead / CAN lost | ✔ | ✔ | ✔ | ✔ | ✔ saved levels | ✔ last setting |
| LCM crash or unpowered | ✔ | ✔ | ✔ | ✔ | OFF | Factory default |
| K1 / IGN tap failed | S1 emergency | ✔ via S1 | ✔ | ✔ via S1 | OFF | Factory default |
| One projector relay | Other side lit | ✔ | ✔ | ✔ | ✔ | ✔ |
| TIM failed | ✔ | ✔ | ✘ front (rear still factory) | ✔ | ✔ | ✔ |
| Main fuse open | ✘ | ✘ | ✘ front | ✔ (factory) | ✘ | ✔ |

The TIM is a small, single-purpose, MCU-free board with fixed logic (two optocouplers and one dual
smart switch). It is separate from the LCM so a controller fault can never touch the turn signals.
Carry a spare.
