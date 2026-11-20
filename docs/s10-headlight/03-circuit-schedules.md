# Deliverable 3 – Component & Circuit Schedules (Rev E, paired branches)

Sized with [`tools/wire_calc.py`](../../tools/wire_calc.py). **Provisional** until the FlexLight current
is measured and as-built lengths are entered:
`python3 tools/wire_calc.py --main <m> --left <m> --right <m> --trunk <m>`.

## 3.1 Loads

| Pair | Per side | Pair total | Status |
|---|---|---|---|
| Low beams (HELLA L4060) | 2.0 A | 4.0 A | [SECONDARY] 20 W max |
| High beams (HELLA L4060) | 2.0 A | 4.0 A | [ESTIMATE] |
| Honeycomb (FlexLight) | 0.75 A | 1.5 A | budget, [MEASURE] |
| DRL strip (FlexLight) | 0.75 A | 1.5 A | budget, [MEASURE] |
| Amber running (SS3 backlight) | 0.03 A | 0.06 A | [VERIFIED] |
| Turn (SS3 Sport main), per side | 1.1 A | — | [VERIFIED] |
| Fan (optional) | 0.5 A | 1.0 A | budget |
| **Main** | | **15.6 A** → 30 A MRBF, 10 AWG | P |

## 3.2 Tool output (defaults: main 0.6 / left 1.3 / right 2.3 / trunk 2.2 m)

```
Path       Branch %  Total %      Key sizes
LO/HI_L        0.96     1.53 OK   Main ± 10 AWG
LO/HI_R        1.69     2.26 OK   Pair feeds: projector 16 AWG per side, decorative 18 AWG per side
HONEY/DRL_L    2.24     2.82 OK   Projector return 16 AWG, decorative return 14 AWG
HONEY/DRL_R    2.63     3.21 OK   VDECO and PGND trunk: 2 × 16 AWG each (two T1 pins in parallel)
TURN_R         1.05     1.62 OK   Pair-to-fuse-box trunk outputs 18 AWG
```

## 3.3 Fuse schedule (standalone fuse box, 16 positions)

| Fuse | Circuit | Rating (P) | Feeds |
|---|---|---|---|
| FM | Main, on battery + post (Blue Sea 5191) | 30 A MRBF | fuse box |
| F0 | Ignition signal tap, IP fuse 11 | 1 A | K1 coil |
| F1 | **Low beam pair** (K2) | 7.5 A | L + R pin 1 |
| F2 | **High beam pair** (K3) | 7.5 A | L + R pin 2 |
| F3 | **Honeycomb pair** (control CH1) | 3 A | L + R pin 4 |
| F4 | **DRL pair** (control CH2) | 3 A | L + R pin 5 |
| F5 | **Amber running pair** (control CH3) | 1 A | L + R pin 6 |
| F6 | Turn left (TIM) | 3 A | L pin 7 |
| F7 | Turn right (TIM) | 3 A | R pin 7 |
| F8 | TIM supply (always hot) | 5 A | Turn module |
| F9 | Control module decorative supply (K4) | 7.5 A | T1-1/9 |
| F10 | Control module logic/latch (always hot) | 3 A | T1-3 |
| F11 | Ignition bus (K1) | 5 A | coils, sense |
| F12 | Emergency switch | 5 A | S1 |
| F13 | Stalk feed | 2 A | stalk common |
| F14 | **Fan pair** (optional) | 3 A | L + R pin 12 |
| F15, F16 | Spare | — | — |
| (taps) | Rear sense: LR PRK, RR PRK, STOPLP, B/U LP; turn sense: LT TURN, RT TURN | 1 A each | signal only |

Each pair fuse feeds a short internal bus in the fuse box with two output wires: left harness and right
harness.

## 3.4 Relays

| Relay | Function | Coil |
|---|---|---|
| K1 | Ignition bus | factory IGN RUN (F0) |
| K2 | Low beam **pair** | ignition bus · HI request · emergency |
| K3 | High beam **pair** | stalk HIGH / flash-to-pass |
| K4 | Decorative supply to control module | ignition bus |
| K5 | Tail lamps (dry contact on old switch park signal) | ignition bus · emergency |
| spare | — | — |

## 3.5 Headlight connector (left key A / right key B, identical pinout)

| Pin | Signal | Wire | Fuse |
|---|---|---|---|
| 1 | Low + | 16 | F1 (pair) |
| 2 | High + | 16 | F2 (pair) |
| 3 | Projector return | 16 | — |
| 4 | Honeycomb + | 18 | F3 (pair) |
| 5 | DRL + | 18 | F4 (pair) |
| 6 | Amber running + (SS3 backlight) | 18 | F5 (pair) |
| 7 | Turn + (SS3 main) | 18 | F6 L / F7 R |
| 8 | Spare | — | — |
| 9 | Decorative return | 14 | — |
| 10 | NTC | 20 | — |
| 11 | NTC return | 20 | — |
| 12 | Fan + (optional) | 18 | F14 (pair) |

## 3.6 Connectors

| Ref | Where | Housing |
|---|---|---|
| J-HLL / J-HLR | Headlight ↔ harness ↔ fuse box | DT 12, key A / B |
| T1 / T2 / T3 | Control ↔ fuse box (power/outputs), control ↔ fuse box (sense), fuse box ↔ cab | DT 12, keys A/B/C (different colour) |
| J-TURN | Fuse box | DT 4 |
| J-REAR | Fuse box | DT 6 |
| J-INT | Control module (dash dimmer) | DT 4 |
| J-HMI | Control module ↔ screen | DT 4 |
| SS3 internal | Inside headlight | DT06-3S |

## 3.7 Wire summary (SAE J1128 TXL)

Main 10 AWG · projector feeds and return 16 · decorative feeds 18 · decorative return 14 · VDECO and PGND
2 × 16 in parallel · signals and sense 20 · CAN twisted pair 20. Lengths are cut at build and checked with
the tool.

## 3.8 Sensors / status inputs

| Input | Source | Screen use |
|---|---|---|
| LOW_FEED, HIGH_FEED | after F1/F2 | "LOW BEAMS: F1/K2 FAULT" |
| Pair currents (IS) | control module | "HONEYCOMB: ONE SIDE OUT" (≈50 % current) |
| NTC L/R | headlights | Decorative derate/off at 80 °C (FlexLight 85 °C max) |
| TAIL_L, TAIL_R | factory LR/RR PRK fuses | Tail status + "TAIL LIGHTS NOT ON" |
| BRAKE, REVERSE | factory STOPLP, B/U LP fuses | Status icons |
| TURN_L, TURN_R | TIM isolated outputs | Arrows |
| HI_REQ | stalk | High-beam icon |
| VDECO, VCTRL | control module | System voltage |
