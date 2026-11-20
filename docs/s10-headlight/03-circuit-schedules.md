# Deliverable 3 – Component & Circuit Schedules (Rev D)

Sized with [`tools/wire_calc.py`](../../tools/wire_calc.py) (85 °C conductor, 3 % branch, 5 %
battery-to-lamp). **Provisional** until FlexLight current is measured and as-built lengths are entered:
`python3 tools/wire_calc.py --main <m> --left <m> --right <m> --trunk <m>`.

## 3.1 Load analysis

| Load | Part | Current | Status |
|---|---|---|---|
| Low beam ×2 | HELLA L4060 low | 2.0 A each (20 W at 10 V) | [SECONDARY] power; inrush [MEASURE] |
| High beam ×2 | HELLA L4060 high | 2.0 A each | [ESTIMATE] until HELLA data sheet |
| Honeycomb ×2 | Diode Dynamics FlexLight Cool White 50 cm | 0.75 A budget | [MEASURE] (not published) |
| DRL strip ×2 | Diode Dynamics FlexLight Cool White 50 cm | 0.75 A budget | [MEASURE] |
| Amber running ×2 | Diode Dynamics SS3 backlight | 0.03 A @ 12.8 V | **[VERIFIED]** DD info guide |
| Amber turn ×2 | Diode Dynamics SS3 **Sport** main beam | 1.1 A @ 12.8 V (14.5 W) | **[VERIFIED]** |
| Fan ×2 (optional) | — | 0.5 A budget | [ESTIMATE] |
| LCM + HMI | — | 0.6 A | HMI 450 mA @ 5 V [VERIFIED] |
| Relay coils ×7 | ISO micro | ≈0.15 A each | [ESTIMATE] |
| **Main feed** | all on, high beam, both turns lit, 10 V | **15.9 A** | P |

## 3.2 Tool output (defaults: main 0.6 m, left 1.3 m, right 2.3 m, trunk 2.2 m)

```
Path       Branch %  Total %          Conductor sizes
LO/HI_L        0.96     1.53  OK      MAIN ± 10 AWG (30 A MRBF)
LO/HI_R        1.69     2.27  OK      Projector feeds 16 AWG, PRJ_RTN 16 AWG
HONEY/DRL_L    2.20     2.78  OK      Decorative feeds/trunk 18 AWG, DECO_RTN 14 AWG
HONEY/DRL_R    2.59     3.16  OK      VDECO / PGND trunk 14 AWG
AMB_RUN_R      1.96     2.54  OK      Turn feeds 18 AWG
TURN_R         1.05     1.63  OK
Main 15.9 A → FM ≥ 20 A → 30 A MRBF (smallest MRBF rating) on 10 AWG (guideline max 30 A)
```

## 3.3 Fuse schedule: independent Fuse/Relay Box (FRB)

| ID | Circuit | Rating (P) | Wire | Switched by |
|---|---|---|---|---|
| FM | Main (Blue Sea 5191 on the battery + post) | 30 A MRBF | 10 AWG | — |
| F0 | IGN signal tap (IP fuse 11 fuse tap) → K1 coil | 1 A | 20 AWG | — |
| F1 / F2 | Low beam L / R | 5 A | 16 AWG | K2 / K3 |
| F3 / F4 | High beam L / R | 5 A | 16 AWG | K4 / K5 |
| F5 | VDECO → LCM | 10 A | 14 AWG | K8 |
| F6 | CTRL_BATT → LCM latch | 3 A | 18 AWG | always hot |
| F7 | IGN_SW bus | 5 A | 18 AWG | K1 |
| F8 | Emergency switch feed | 5 A | 18 AWG | always hot |
| F9 | Stalk feed | 2 A | 20 AWG | IGN_SW / EMER |
| F10 | TIM supply (turn lamps) | 5 A | 18 AWG | **always hot** |
| F11 / F12 | Honeycomb L / R | 3 A | 18 AWG | LCM CH1 |
| F13 / F14 | DRL strip L / R | 3 A | 18 AWG | LCM CH2 |
| F15 / F16 | Amber running (SS3 backlight) L / R | 2 A | 18 AWG | LCM CH3 |
| F17 / F18 | Amber turn (SS3 main) L / R | 3 A | 18 AWG | TIM |
| F19 / F20 | AUX/fan L / R | 3 A | 18 AWG | LCM AUX |
| — | Spares | ≥ 2 positions | | |

**FRB hardware:** a sealed Eaton Bussmann Series 15300 RTMR configuration with **≥ 22 mini-fuse and
≥ 7 micro-relay positions** (or a fuse module plus a relay module side by side), plus room for the diode
board and the TIM. Choose the exact configuration from the Eaton datasheet. The owner's original
"16-position" idea is too small once every L/R branch has its own fuse.

## 3.4 Wire schedule (SAE J1128 TXL)

| Circuit | From → To | Gauge (P) |
|---|---|---|
| MAIN± | Battery → FRB | 10 AWG |
| Headlamp harness ×2 (12 wires each) | FRB → headlamp | 16 (LO, HI, PRJ_RTN), 18 (HONEY, DRL, AMB_RUN, TURN, AUX), 14 (DECO_RTN), 20 (NTC pair) |
| T1 trunk | FRB ↔ LCM | 14 (VDECO, PGND), 18 (others) |
| T2 trunk | FRB ↔ LCM | 20 (sense, NTC twisted pairs) |
| T3 trunk | FRB ↔ cab | 20 (signals), 18 (EMER) |
| Turn sense | Factory LT/RT TURN fuse taps → FRB J-TURN | 20 AWG |
| J-INT | LCM ↔ old switch pigtail | 20 AWG |
| J-HMI | LCM ↔ HMI | 18 (5 V/GND), 20 twisted (CAN) |

Lengths are cut to fit during the build, then checked with the tool.

## 3.5 Connector schedule (TE Deutsch DT, size-16 contacts; [VERIFY] 14 AWG contact availability)

| Ref | Location | Housing | Keying |
|---|---|---|---|
| J-HLL / J-HLR | Headlamp ↔ harness, and harness ↔ FRB | DT04-12P / DT06-12S | A (left) / B (right) |
| T1 / T2 / T3 | FRB ↔ LCM, FRB ↔ LCM, FRB ↔ cab | DT 12-way | A / B / C (distinct colours from headlamp plugs) |
| J-TURN | FRB | DT 4-way | — |
| J-INT | LCM | DT 6-way | — |
| J-HMI | LCM | DT 4-way | — |
| SS3 internal | Inside headlamp | DT06-3S mating the pod's DT connector | — |

## 3.6 Headlamp pinout (J-HLL / J-HLR)

| Pin | Signal | Wire | Fuse | Load |
|---|---|---|---|---|
| 1 | LO_PWR | 16 | F1/F2 | HELLA low |
| 2 | HI_PWR | 16 | F3/F4 | HELLA high |
| 3 | PRJ_RTN | 16 | — | both HELLA modules |
| 4 | HONEY+ | 18 | F11/F12 | FlexLight behind the honeycomb (CH1) |
| 5 | DRL+ | 18 | F13/F14 | FlexLight DRL strip (CH2) |
| 6 | AMB_RUN+ | 18 | F15/F16 | SS3 backlight, pod pin 3 (CH3) |
| 7 | AMB_TURN+ | 18 | F17/F18 | SS3 main beam (TIM) |
| 8 | Spare | — | — | cavity plug |
| 9 | DECO_RTN | 14 | — | FlexLights, SS3, fan |
| 10 / 11 | NTC_A / NTC_B | 20 tw. | — | housing NTC |
| 12 | AUX+ | 18 | F19/F20 | optional fan |

## 3.7 Relay / switch / module schedule

| Ref | Function | Coil / input | Location |
|---|---|---|---|
| K1 | K-IGN | factory IGN via F0 | FRB |
| K2/K3 | Low beam L/R | IGN_SW · HI_REQ · EMER | FRB |
| K4/K5 | High beam L/R | HI_REQ | FRB |
| K7 | Park-signal dry contact | IGN_SW · EMER | FRB |
| K8 | Decorative power | IGN_SW | FRB |
| TIM | Turn Interface Module: 2 opto inputs + dual PROFET | factory turn signals | FRB |
| S1 | Emergency headlamps | — | Dash |
| U1–U4 | Decorative PROFETs (8 ch) | LCM gated PWM | LCM |
| U10 | Controller power latch | IGN / 10 s hold | LCM |
| PR1–PR6 | Interior ON / defeat / dimmer ladder | LCM | LCM |

Spares to carry: 1 relay, 1 TIM, mini fuses 1/2/3/5/10 A, 1 × 30 A MRBF.

## 3.8 Sensor schedule

| Ref | Measurand | Use |
|---|---|---|
| NTC-L/R | Housing temperature | Decorative derate/off. FlexLight max 85 °C → off at 80 °C (P) |
| NTC-B | LCM board | Health |
| IS1–IS4 | Decorative branch current | Open / over-current / short (SS3 backlight 30 mA too small to detect open reliably) |
| VDECO, VCTRL | Supply | Cranking suspend, display |
| RLY ×4 | Projector feed present | Fuse/relay fault |
| HI_REQ, TURN_x_SNS | Signals | Touchscreen icons, turn blanking |
