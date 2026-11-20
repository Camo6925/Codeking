# Deliverable 3 – Component & Circuit Schedules (Rev A)

All sized values come from [`tools/wire_calc.py`](../../tools/wire_calc.py) (85 °C conductor
temperature, dedicated return wires, 3 % voltage-drop limit for lighting). **Every fuse and wire size
here is PROVISIONAL.** Re-run the tool after:
(1) the HELLA technical data sheet is obtained,
(2) projector and decorative inrush is scoped,
(3) decorative LED products are chosen and measured, and
(4) harness lengths are measured on the truck.

## 3.1 Load analysis

| Circuit | Load | Basis | Design current | Status |
|---|---|---|---|---|
| LO_L / LO_R | HELLA L4060 low | max 20 W ÷ 10 V design minimum (constant-power driver) | 2.0 A each | P [SECONDARY]; inrush [MEASURE] |
| HI_L / HI_R | HELLA L4060 high | assumed 20 W ÷ 10 V | 2.0 A each | [ESTIMATE] |
| HONEY_L/R | Honeycomb backlight | budget | 1.5 A each | [ESTIMATE] (O-4) |
| DRL_L/R | White DRL strip | budget | 1.5 A each | [ESTIMATE] (O-4) |
| AMB_L/R (park) | Amber running | budget | 1.0 A each | [ESTIMATE] (O-4) |
| AMB turn | Amber turn element | Factory flasher circuit (factory fuse) | — | Not on new distribution |
| CTRL | LCM logic + HMI | HMI 5 V 450 mA [VERIFIED] + LCM ≈ 1 W [ESTIMATE] | 0.6 A @ 12 V | Partly verified |
| IGN_SW | 8 relay coils | ≈ 0.15 A each [ESTIMATE; take from relay datasheet] | 1.2 A | [ESTIMATE] |
| **Main feed** | All on, high beam, 10 V | Sum | **17.8 A** | P |

Tool output (Rev A):

```
Circuit   I_d A  AWG  RT m   Vd V  Vd %  Fuse WireMax
LO_L       2.00   16   2.4  0.079  0.59     5      15
LO_R       2.00   16   4.4  0.146  1.08     5      15
HI_L       2.00   16   2.4  0.079  0.59     5      15
HI_R       2.00   16   4.4  0.146  1.08     5      15
HONEY_L/R  1.50   18   6.0  0.237  1.75     3      10
DRL_L/R    1.50   18   6.0  0.237  1.75     3      10
AMB_L/R    1.00   18   6.0  0.158  1.17     3      10
VDECO      8.00   14   4.0  0.333  2.47    10      20
CTRL       0.60   18   4.0  0.063  0.47     1→3*   10
IGN_SW     1.20   18   1.0  0.032  0.23     2→5*   10
HMI_5V     0.45   18   4.0  0.047  0.95     1      10
Main: 17.8 A → ≥ 25 A fuse → ≥ 12 AWG
```

\* Raised to cover bulk-capacitor charging (CTRL) and relay pull-in surge (IGN_SW). Both stay well
inside the 18 AWG guideline limit.

**Main feed decision (P):** the calculated minimum is a 25 A fuse on 12 AWG. **Specify a 30 A MRBF
fuse on 10 AWG** for margin and future accessories. 30 A is also the smallest MRBF rating. The owner's
preliminary 8 AWG is acceptable but not required.

### Methods and assumptions

* **Design current** = maximum power ÷ minimum operating voltage. LED modules with integrated
  switching drivers draw *more* current as voltage falls.
* **Voltage drop** uses the round trip (feed + dedicated return) and copper resistance corrected to
  85 °C (×1.255 vs. 20 °C).
* **Fuse** ≥ 1.25 × continuous current and ≥ inrush allowance, and ≤ the maximum fuse for the wire
  (the fuse protects the *wire*). The per-gauge maximum fuse table in the tool is a conservative
  bundled-under-hood guideline. **Confirm against the wire manufacturer's derating data** and the
  connector contact ratings.
* **Bundling/ambient:** the 85 °C conductor assumption covers engine-bay routing. Runs inside the
  cab could use 60 °C, but are kept at 85 °C for margin.
* **Protection coordination:** branch fuses (3–10 A) are far below FM (30 A), so a branch fault clears
  its own fuse first. PROFET short-circuit trips (tens of amps, µs–ms) act before the output fuses.
  Output fuses cover sustained overloads below the PROFET trip and a failed-shorted PROFET.
* **Lengths** are estimates assuming the battery and RTMR sit at the driver-side front and the LCM is
  behind the passenger kick panel or glovebox. **[MEASURE]** on the truck.

## 3.2 Fuse schedule

| ID | Location | Circuit | Rating (P) | Type | Protects | Notes |
|---|---|---|---|---|---|---|
| FM | ≤ 300 mm from battery + | Main feed | 30 A | MRBF (or MIDI if side-post) | 10 AWG main + RTMR bus | |
| F0 | At factory IGN tap | K-IGN coil | 1 A | Mini blade, fuse-tap or sealed inline | 20 AWG tap lead | Only factory-sourced current, about 0.15 A |
| F1 | RTMR | LO_L | 5 A | Mini blade | 16 AWG | Re-check after inrush scope |
| F2 | RTMR | LO_R | 5 A | Mini blade | 16 AWG | " |
| F3 | RTMR | HI_L | 5 A | Mini blade | 16 AWG | " |
| F4 | RTMR | HI_R | 5 A | Mini blade | 16 AWG | " |
| F5 | RTMR | VDECO → LCM | 10 A | Mini blade | 14 AWG | Via K-DECO (IGN) |
| F6 | RTMR | CTRL_BATT → LCM latch | 3 A | Mini blade | 18 AWG | Always hot |
| F7 | RTMR | IGN_SW bus | 5 A | Mini blade | 18 AWG | Via K-IGN |
| F8 | RTMR | Emergency switch feed | 5 A | Mini blade | 18 AWG | Always hot |
| F9 | RTMR | HEAD feed (only if "feed" option) | 5 A | Mini blade | 18 AWG | Spare if parallel option |
| F10 | RTMR | PARK feed (only if "feed" option) | [MEASURE factory park load] | Mini blade | per load | Spare if parallel option |
| F11 | RTMR | AUX (future) | — | — | — | Spare |
| F12 | RTMR | Spare | — | — | — | |
| F21–F28 | LCM PCB | HONEY/DRL/AMB/AUX L & R | 3 A | Mini blade, PCB holder | 18 AWG branch | One per output |

## 3.3 Wire schedule

All wire is **SAE J1128 TXL** (thin-wall, 125 °C) unless noted. GXL is acceptable wherever space allows.

| Circuit | From → To | Gauge (P) | Colour (suggested) | Est. length one way | Notes |
|---|---|---|---|---|---|
| Main + | Battery → FM → RTMR | 10 AWG | Red | 0.3 + 0.7 m | Loomed, secured every 300 mm |
| Main − | Battery − → ground bus | 10 AWG | Black | 0.7 m | |
| LO_L_PWR / RTN | RTMR → LH headlamp | 16 AWG | Brown / Black-Brown | 1.2 m | |
| LO_R_PWR / RTN | RTMR → RH headlamp | 16 AWG | Brown / Black-Brown | 2.2 m | |
| HI_L_PWR / RTN | RTMR → LH headlamp | 16 AWG | Light green / Black-Lt green | 1.2 m | |
| HI_R_PWR / RTN | RTMR → RH headlamp | 16 AWG | Light green / Black-Lt green | 2.2 m | |
| VDECO / PGND | RTMR & ground bus → LCM | 14 AWG | Orange / Black | 2.0 m | Through firewall grommet |
| CTRL_BATT / LGND | RTMR & ground bus → LCM | 18 AWG | Red-White / Black-White | 2.0 m | |
| HONEY / DRL / AMB_PARK / AUX ±, L & R | LCM → headlamps | 18 AWG | White, Blue, Yellow, Grey (+Black stripe = return) | 3.0 m | 2 × 10-wire sub-bundles |
| AMB_TURN L/R | Factory front turn wire → headlamp J-S pin 6 | 18 AWG | Factory colour, or Yellow-Green | 0.5 m | Plug-in pigtail |
| TURN sense L/R | Turn wire → LCM | 20 AWG | Violet / Violet-White | 3.0 m | High impedance |
| LO_REQ / HI_REQ | 9006/9005 pigtails → RTMR diodes and LCM | 18 AWG (coil), 20 AWG (sense) | Tan / Lt blue | 1–3 m | |
| RLY sense ×4, PARK_REQ | RTMR → LCM | 20 AWG | Pink family | 2.0 m | |
| IGN tap | Factory IGN → F0 → K-IGN coil | 20 AWG | Pink | ≤ 1 m | |
| NTC L/R | Headlamp → LCM | 20 AWG twisted pair | Grey / Grey-Black | 3.0 m | |
| HMI 5 V / GND | LCM → HMI | 18 AWG | Red / Black | 2.0 m | |
| CAN H/L | LCM → HMI | 20 AWG twisted pair (or 120 Ω CAN cable) | Yellow / Green | 2.0 m | 120 Ω each end |

## 3.4 Connector schedule

All connectors are TE/Deutsch **DT** series with size-16 solid contacts, wedgelocks, and cavity plugs
in unused positions. Contact current rating and wire range: **[VERIFY]** on the TE DT data sheet.

| Ref | Location | Housing (mating pair) | Positions | Keying | Notes |
|---|---|---|---|---|---|
| J-HLL-P / J-HLR-P | Headlamp power | DT04-4P (lamp pigtail) / DT06-4S (harness) | 4 | Std | Grey or black |
| J-HLL-S / J-HLR-S | Headlamp signal/decorative | DT04-12PA / DT06-12SA | 12 | A | |
| LCM J1 | Power | DT04-6P / DT06-6S | 6 | Std | |
| LCM J2 | Left outputs | DT04-12PA / DT06-12SA | 12 | A | |
| LCM J3 | Right outputs | DT04-12PB / DT06-12SB | 12 | B | Cannot be swapped with J2 |
| LCM J4 | Vehicle signals | DT04-12PC / DT06-12SC | 12 | C | |
| LCM J5 / HMI | HMI link | DT04-4P / DT06-4S | 4 | Std | Different colour from headlamp 4-way |
| Factory 9006 / 9005 pigtails | Old headlamp sockets | Mating 9006 / 9005 harness connectors (male bulb-base pigtails) | 2 | — | Non-destructive |
| Firewall pass-through | Firewall | Sealed grommet, or DT bulkhead receptacles | — | — | [MEASURE] existing grommet |

## 3.5 Pinout tables

### Headlamp power connector J-HL*-P (DT 4-way), identical L and R

| Pin | Signal | Wire | Fuse | Notes |
|---|---|---|---|---|
| 1 | LO_PWR | 16 AWG | F1 (L) / F2 (R) | Low-beam projector + |
| 2 | LO_RTN | 16 AWG | — | to ground bus |
| 3 | HI_PWR | 16 AWG | F3 (L) / F4 (R) | High-beam projector + |
| 4 | HI_RTN | 16 AWG | — | to ground bus |

### Headlamp signal connector J-HL*-S (DT 12-way, key A), identical L and R

| Pin | Signal | Wire | Source | Notes |
|---|---|---|---|---|
| 1 | HONEY+ | 18 AWG | LCM U1/U3 OUT0 via F21/F25 | PWM CH1 |
| 2 | HONEY_RTN | 18 AWG | → LCM PGND | |
| 3 | DRL+ | 18 AWG | LCM U1/U3 OUT1 via F22/F26 | PWM CH2 |
| 4 | DRL_RTN | 18 AWG | → LCM PGND | |
| 5 | AMB_PARK+ | 18 AWG | LCM U2/U4 OUT0 via F23/F27 | PWM CH3 (with per-side turn blanking) |
| 6 | AMB_TURN+ | 18 AWG | **Factory flasher output** | Full intensity, factory controlled |
| 7 | AMB_RTN | 18 AWG | → LCM PGND | Common return, amber element |
| 8 | NTC_A | 20 AWG | LCM ADC | Twisted with pin 9 |
| 9 | NTC_B | 20 AWG | LCM AGND | |
| 10 | AUX+ | 18 AWG | LCM U2/U4 OUT1 via F24/F28 | Optional housing fan |
| 11 | AUX_RTN | 18 AWG | → LCM PGND | |
| 12 | RESERVED | — | — | HELLA DRL/position input, if that variant is fitted; else cavity plug |

### LCM J1 – Power (DT 6-way)

| Pin | Signal | Wire | Source |
|---|---|---|---|
| 1 | VDECO_RAW | 14 AWG | RTMR F5 via K-DECO |
| 2 | PGND | 14 AWG | Ground bus |
| 3 | CTRL_BATT | 18 AWG | RTMR F6 (always hot) |
| 4 | LGND | 18 AWG | Ground bus |
| 5 | Spare | — | Cavity plug |
| 6 | Spare | — | Cavity plug |

### LCM J2 (left, key A) / J3 (right, key B) – identical pin functions

| Pin | Signal | Pin | Signal |
|---|---|---|---|
| 1 | HONEY+ | 7 | NTC_A |
| 2 | HONEY_RTN | 8 | NTC_B |
| 3 | DRL+ | 9 | AUX+ |
| 4 | DRL_RTN | 10 | AUX_RTN |
| 5 | AMB_PARK+ | 11 | Spare |
| 6 | AMB_RTN | 12 | Spare |

### LCM J4 – Vehicle signals (DT 12-way, key C)

| Pin | Signal | Pin | Signal |
|---|---|---|---|
| 1 | IGN_SW sense | 7 | RLY_LO_R sense |
| 2 | LO_REQ sense | 8 | RLY_HI_L sense |
| 3 | HI_REQ sense | 9 | RLY_HI_R sense |
| 4 | TURN_L sense | 10 | PARK_REQ sense |
| 5 | TURN_R sense | 11 | Spare |
| 6 | RLY_LO_L sense | 12 | Signal ground reference |

### LCM J5 / HMI – (DT 4-way)

| Pin | Signal |
|---|---|
| 1 | +5V_HMI |
| 2 | GND |
| 3 | CANH |
| 4 | CANL |

## 3.6 Relay / switch schedule

| Ref | Function | Coil driven by | Contact load | Part class | Location |
|---|---|---|---|---|---|
| K1 | K-IGN: isolates factory IGN, creates IGN_SW | Factory IGN RUN via F0 | ≤ 1.2 A coil bus | ISO micro 280, 12 V, resistor-suppressed, ≥ 20 A | RTMR |
| K2 | K-LO-L | IGN_SW / LO_REQ / HI_REQ / EMER (diode-OR) | 2 A, LED driver input-cap inrush | same | RTMR |
| K3 | K-LO-R | same | same | same | RTMR |
| K4 | K-HI-L | HI_REQ | same | same | RTMR |
| K5 | K-HI-R | HI_REQ | same | same | RTMR |
| K6 | K-HEADREQ | IGN_SW / EMER | Factory HEAD circuit (now relay coils + indicator) | same | RTMR |
| K7 | K-PARKREQ | IGN_SW / EMER | Factory park/tail load [MEASURE] | same | RTMR |
| K8 | K-DECO | IGN_SW | ≤ 10 A | same | RTMR |
| S1 | Emergency headlamp switch | — | ≤ 1 A coil current | Sealed, guarded, illuminated toggle | Dash, within driver reach |
| U1–U4 | Decorative channels (8) | LCM gated PWM | ≤ 1.5 A (P) each | PROFET+2 dual (final part per O-4) | LCM |
| U10 | Controller power latch | IGN or 10 s hold | ≤ 0.6 A | PROFET+2 (BTS7200-2EPC class) | LCM |
| D1–D9 | Coil diode-OR | — | ≤ 0.5 A | 1 A ≥ 100 V rectifier, AEC-Q101 preferred | RTMR plug-in diodes or sealed pack |
| D30/D31 | Amber diode-OR (single-input pods only) | — | Amber current | ≥ 3 A ≥ 40 V Schottky, AEC-Q101 | Inside headlamp |

Spare parts kit (glovebox): one ISO micro relay, one each of the 1, 3, 5 and 10 A mini fuses, one 30 A
MRBF fuse.

## 3.7 Sensor schedule

| Ref | Measurand | Sensor | Interface | Range / thresholds (P) | Purpose |
|---|---|---|---|---|---|
| NTC-L / NTC-R | Headlamp housing interior temp | 10 kΩ NTC, sealed | Divider 10 kΩ to 3.3 V → ADC1 | Warn 70 °C, derate 80 °C, decorative off 90 °C (**set from HELLA/LED ratings**) | Thermal protection with low + high on |
| NTC-B | LCM board temp | 10 kΩ NTC on PCB | ADC1 | Warn 85 °C, derate 95 °C | PROFET/regulator health |
| IS1–IS4 | Decorative branch current | PROFET IS pin | R_SENSE → RC → ADC1 | Learned baseline ± window | Open, over-current, short |
| VDECO_SENSE | Decorative bus voltage | Divider 100k/22k | ADC1 | 0–18 V | Cranking suspend, OV warn |
| VCTRL_SENSE | Controller supply | Divider 100k/22k | ADC1 | 0–18 V | Brownout, system voltage display |
| RLY_* ×4 | Projector feed present | Divider 47k/10k | GPIO | > 8 V = present | Fuse/relay fault detection |
| LO_REQ / HI_REQ / PARK_REQ | Factory requests | Divider 47k/10k | GPIO | > 8 V | Status display, fault cross-check |
| TURN_L/R | Factory flasher output | Divider 47k/10k | GPIO interrupt | > 8 V | Running-light blanking |
| IGN_OK | Ignition | Schmitt | GPIO interrupt + hardware gating | — | Shutdown sequence |
| (Phase 2) PRJ current ×4 | Projector current | Shunt + INA180-Q1 | ADC | — | Detect failed projector module |
