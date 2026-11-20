# Deliverable 3 – Component & Circuit Schedules (Rev B)

Sized values come from [`tools/wire_calc.py`](../../tools/wire_calc.py) (85 °C conductor, 3 % per
branch, 5 % battery-to-lamp). **All fuse and wire sizes are PROVISIONAL** until:
(1) the HELLA technical data sheet is obtained,
(2) inrush is scoped,
(3) decorative and amber/marker products are chosen and measured, and
(4) harness lengths are measured.

Rev B harness rule (D-4): **each headlight = one 12-way sealed connector, home-run to the PDCC.**
No fuses, relays or electronics on the headlights.

## 3.1 Load analysis

| Circuit | Basis | Design current | Status |
|---|---|---|---|
| LO_L/R, HI_L/R | HELLA L4060 max 20 W ÷ 10 V | 2.0 A each | Low: [SECONDARY]; high: [ESTIMATE]; inrush [MEASURE] |
| PRJ_RTN_L/R | Low + high together | 4.0 A | Derived |
| HONEY, DRL (each side) | Budget | 1.5 A | [ESTIMATE] O-4 |
| AMB_PARK (each side) | Budget | 1.0 A | [ESTIMATE] O-4 |
| AMB_TURN (each side) | Factory flasher powered | 1.0 A | [ESTIMATE]. Returns on DECO_RTN |
| MARKER (each side) | Budget | 0.5 A | [ESTIMATE] |
| AUX (each side) | Optional fan | 0.5 A | [ESTIMATE] |
| DECO_RTN_L/R | Sum of all decorative, amber, marker and aux | 6.0 A | Derived |
| CTRL | HMI 450 mA @ 5 V [VERIFIED] + LCM | 0.6 A | Partly verified |
| Coils | 9 × 0.15 A | 1.35 A | [ESTIMATE]; relay datasheet |
| **Main feed** | All on, high beam, 10 V | **20.0 A** | P |

## 3.2 Tool output (Rev B)

```
Conductor    AWG    I A  L m   Vd V  Fuse  Max  Check
MAIN+/MAIN-    8  19.95  2.0  0.103    25   50  OK
LO_L / HI_L   16   2.00  2.5  0.083     5   15  OK
PRJ_RTN_L     16   4.00  2.5  0.165     -   15  OK
LO_R / HI_R   16   2.00  3.5  0.116     5   15  OK
PRJ_RTN_R     16   4.00  3.5  0.231     -   15  OK
HONEY/DRL_R   18   1.50  3.5  0.138     3   10  OK
AMB_PARK_R    18   1.00  3.5  0.092     3   10  OK
MARKER_R      18   0.50  3.5  0.046     2   10  OK
DECO_RTN_R    14   6.00  3.5  0.218     -   20  OK     (16 AWG would give 3.6 % branch drop → FAIL)

Path         Branch %  Total %
LO_R / HI_R      2.57     4.10   OK
HONEY_R          2.64     4.16   OK
AMB_PARK_R       2.30     3.82   OK
Main 20.0 A → FM ≥ 25 A → specify 30 A (smallest MRBF), 8 AWG
```

The main feed is **8 AWG** in Rev B (it was 10 AWG in Rev A). With the PDCC in the cab, the 2 m main
run's voltage drop adds to every lamp's total. 8 AWG keeps every battery-to-lamp path under 5 %.

## 3.3 Fuse schedule (PDCC, 16 positions)

| ID | Circuit | Rating (P) | Protects | Fed / switched by |
|---|---|---|---|---|
| FM | Main feed (at battery) | 30 A MRBF/MIDI | 8 AWG main | — |
| F0 | Factory IGN tap → K1 coil | 1 A | tap lead | at tap point |
| F1 | LO_L | 5 A | 16 AWG | K2 |
| F2 | LO_R | 5 A | 16 AWG | K3 |
| F3 | HI_L | 5 A | 16 AWG | K4 |
| F4 | HI_R | 5 A | 16 AWG | K5 |
| F5 | VDECO → LCM | 10 A | internal 14 AWG | K8 |
| F6 | CTRL_BATT → LCM latch | 3 A | internal 18 AWG | always hot |
| F7 | IGN_SW bus | 5 A | coil bus | K1 |
| F8 | Emergency switch feed | 5 A | 18 AWG to S1 | always hot |
| F9 | Stalk feed | 2 A | 20 AWG to column | IGN_SW / EMER |
| F10 | AUX spare | — | — | — |
| F11 | Amber fail-ON feed | 3 A | internal | K9 |
| F12 | MARKER_L | 2 A | 18 AWG | K6 |
| F13 | MARKER_R | 2 A | 18 AWG | K6 |
| F14 | Spare | — | — | — |
| F15 | High-beam indicator | 1 A | 20 AWG to cluster | HI_REQ |
| F16 | Spare | — | — | — |
| F21–F28 | LCM outputs HONEY/DRL/AMB/AUX × L/R | 3 A | 18 AWG branches | PROFETs |

The rear park/tail lamps stay on **factory** power and fusing (the K7 contact only replaces the switch
signal). Record the measured factory park current here: ______ A.

## 3.4 Wire schedule

SAE J1128 **TXL** unless noted.

| Circuit | From → To | Gauge (P) | Suggested colour | Length (one way, est.) |
|---|---|---|---|---|
| MAIN+ | Battery → FM → PDCC | 8 AWG | Red | 2.0 m |
| MAIN− | PDCC ground stud → battery − | 8 AWG | Black | 2.0 m |
| **Left headlamp harness** (one cable, 12 wires) | PDCC J-HLL → left headlamp | see pinout | — | 2.5 m |
| **Right headlamp harness** (one cable, 12 wires) | PDCC J-HLR → right headlamp | see pinout | — | 3.5 m |
| IGN tap | Factory IGN → F0 → J-VEH-1 | 20 AWG | Pink | ≤ 1 m |
| Stalk feed / HI_REQ | J-VEH → column pigtail | 20 AWG | Brown / Lt green | ≤ 1 m |
| TURN_L / TURN_R | In-cab splice → J-VEH | 18 AWG (carries amber turn current) | Lt blue / Dk blue | ≤ 1.5 m |
| PARK_SIG / PARK_REF | J-VEH → old switch pigtail | 20 AWG | Lt blue / Orange or Black | ≤ 1 m |
| DIM_SIG / DIM_REF | J-VEH → old switch pigtail | 20 AWG | Dk green / ref | ≤ 1 m |
| HI_IND | J-VEH → cluster pigtail | 20 AWG | Lt green/white | ≤ 1 m |
| HMI 5 V / GND, CAN | PDCC → HMI | 18 AWG; 20 AWG twisted pair | Red/Black; Yellow/Green | ≤ 1 m |
| Emergency switch | PDCC → S1 | 18 AWG | Red-White / White | ≤ 1 m |

Each headlamp harness: 12 conductors in one braided-PET or convoluted loom, with the 16 AWG and 14 AWG
wires paired (feed with its return) and the NTC pair twisted.

## 3.5 Connector schedule

TE/Deutsch **DT** series, size-16 solid contacts, wedgelocks, and cavity plugs in unused positions.
**[VERIFY]**: the DT size-16 contact range covers **14 AWG** for DECO_RTN (if not, use a 14→16 AWG
pigtail splice within 100 mm of the connector, or move to the Deutsch HD/DTP family).

| Ref | Location | Housing (mating) | Pos. | Keying |
|---|---|---|---|---|
| J-HLL | Left headlamp ↔ harness | DT04-12PA (lamp pigtail) / DT06-12SA (harness) | 12 | A |
| J-HLR | Right headlamp ↔ harness | DT04-12PB / DT06-12SB | 12 | B (cannot be swapped with the left) |
| PDCC-HLL / PDCC-HLR | Harness ↔ PDCC | DT04-12PA / PB bulkhead on the PDCC; DT06-12SA / SB on the harness | 12 | A / B |
| J-VEH | PDCC ↔ vehicle-interface pigtails | DT04-12PC / DT06-12SC | 12 | C |
| J-HMI | PDCC ↔ HMI | DT04-4P / DT06-4S | 4 | — |
| J-EMER | PDCC ↔ S1 | DT04-4P / DT06-4S (different colour) | 4 | — |
| Main power | PDCC studs | M6/M8 studs, ring terminals, insulating boots | — | — |
| Factory pigtails | Old headlamp switch, column switch, cluster | Mating connectors to the factory housings | — | — |

Each headlamp harness therefore has **one plug at the light** and **one plug at the PDCC**, so a
headlamp or its harness can be swapped as a unit.

## 3.6 Headlamp pinout (J-HLL / J-HLR, identical functions)

| Pin | Signal | Wire | Source in PDCC | Notes |
|---|---|---|---|---|
| 1 | LO_PWR | 16 AWG | K2/K3 via F1/F2 | Low-beam projector + |
| 2 | HI_PWR | 16 AWG | K4/K5 via F3/F4 | High-beam projector + |
| 3 | PRJ_RTN | 16 AWG | Ground stud | Low + high shared return |
| 4 | HONEY+ | 18 AWG | U1/U3 OUT0 via F21/F25 | PWM CH1 |
| 5 | DRL+ | 18 AWG | U1/U3 OUT1 via F22/F26 | PWM CH2 |
| 6 | AMB_PARK+ | 18 AWG | Amber OR node (PROFET CH3 + K9 fail-ON) | Required parking lamp |
| 7 | AMB_TURN+ | 18 AWG | Factory flasher (TURN_L/R) | Full intensity, factory controlled |
| 8 | MARKER+ | 18 AWG | K6 via F12/F13 | Front side marker |
| 9 | DECO_RTN | **14 AWG** | Ground stud | Returns for 4–8 and 12 |
| 10 | NTC_A | 20 AWG | LCM ADC | Twisted with 11 |
| 11 | NTC_B | 20 AWG | LCM AGND | |
| 12 | AUX+ | 18 AWG | U2/U4 OUT1 via F24/F28 | Optional fan; cavity plug if unused |

## 3.7 J-VEH pinout (vehicle interface)

| Pin | Signal | Goes to | Notes |
|---|---|---|---|
| 1 | IGN_TAP | Factory IGN RUN (F0 1 A at tap) | Drives K1 coil only |
| 2 | SIG_GND | Ground stud | Reference |
| 3 | STALK_FEED | Stalk dimmer common | From F9 |
| 4 | HI_REQ | Stalk HI / flash-to-pass | To K4/K5, K2/K3 (diode), F15 |
| 5 | TURN_L | Factory LF front turn | Splice. Also LCM sense |
| 6 | TURN_R | Factory RF front turn | Splice. Also LCM sense |
| 7 | PARK_SIG | Old switch pin 1 (LT BLU) | K7 dry contact |
| 8 | PARK_REF | Old switch pin 2/4 or 5 | Per measurement |
| 9 | HI_IND | Cluster high-beam indicator input | From F15 |
| 10 | DIM_SIG | Old switch pin 10 (DK GRN) | Resistor emulation |
| 11 | DIM_REF | Old switch pin 2/4 or 5 | Per measurement |
| 12 | Spare | — | Cavity plug |

## 3.8 Relay / switch schedule

| Ref | Function | Coil | Contacts carry |
|---|---|---|---|
| K1 | K-IGN | Factory IGN via F0 | IGN_SW bus ≤ 2 A |
| K2/K3 | Low beam L/R | IGN_SW · HI_REQ · EMER | 2 A each |
| K4/K5 | High beam L/R | HI_REQ | 2 A each |
| K6 | Front side markers | IGN_SW · EMER | ≤ 1 A |
| K7 | Park-signal emulation (dry) | IGN_SW · EMER | Factory switch signal current [MEASURE] |
| K8 | Decorative power | IGN_SW | ≤ 10 A |
| K9 | Amber fail-ON | IGN_SW · EMER, return via fail-ON driver | ≤ 2 A |
| S1 | Emergency headlamps (guarded, illuminated) | — | ≤ 1.5 A coil current |
| U1–U4 | PROFET decorative/amber/aux | LCM | ≤ 1.5 A each (P) |
| U10 | PROFET power latch | IGN or 10 s hold | ≤ 0.6 A |
| D1–D11 | Coil diode-OR | — | ≤ 0.5 A |
| D32–D35 | Amber OR node | — | Amber current |

All relays: ISO micro 280, 12 V, resistor-suppressed, ≥ 20 A. Glovebox spares: 1 relay, mini fuses
1/2/3/5/10 A, 1 × 30 A MRBF.

## 3.9 Sensor schedule

Same as Rev A, plus amber-node voltage sense L/R (confirms the parking lamp is actually powered,
whether from the PROFET or K9) and MKR_BUS sense.

| Ref | Measurand | Use |
|---|---|---|
| NTC-L/R | Headlamp interior temp | Decorative derate/off (never projectors or required lamps) |
| NTC-B | PDCC/LCM board temp | Health |
| IS1–IS4 | Branch current | Open, over-current, short |
| VDECO, VCTRL | Supply voltages | Cranking suspend, OV/UV, display |
| RLY ×4 | Projector feed present | Fuse/relay fault |
| HI_REQ, TURN_L/R, MKR_BUS, AMB_PARK_L/R | Signal/feeds | Status, turn blanking, required-lamp verification |
