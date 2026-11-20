# Deliverable 2 – Preliminary Electrical Schematic (Rev D)

Text schematics in sheet form. Net names UPPER_CASE, shared across sheets. **(P)** = provisional,
re-run `tools/wire_calc.py` with as-built lengths and measured loads.

```
──┤F├── fuse   ──|>|── diode   ─o/o─ relay NO contact   [K n] relay coil   ⏚ FRB ground stud (never sheet metal)
```

Sheets 1, 2 and 5 are the **FRB** (independent fuse/relay box, under hood). Sheets 3 and 4 are the
**LCM** (cab). Sheet 6 is the passive headlamp. Sheet 7 covers the trunks and vehicle interface.

---

## Sheet 1 – Battery, main fuse, FRB distribution

```
 BATTERY(+) top post ─[Blue Sea 5191 + 30 A MRBF]─ 10 AWG (P) ─► FRB VBUS stud
 BATTERY(−) ───────────────────────────────────── 10 AWG (P) ─► FRB ⏚ stud

 PROJECTORS                         DECORATIVE BRANCH FUSES (inputs from LCM via T1)
 VBUS─┤F1 5A├─o/o[K2]─► J-HLL-1     T1-5  HONEY_L   ─┤F11 3A├─► J-HLL-4
 VBUS─┤F2 5A├─o/o[K3]─► J-HLR-1     T1-9  HONEY_R   ─┤F12 3A├─► J-HLR-4
 VBUS─┤F3 5A├─o/o[K4]─► J-HLL-2     T1-6  DRL_L     ─┤F13 3A├─► J-HLL-5
 VBUS─┤F4 5A├─o/o[K5]─► J-HLR-2     T1-10 DRL_R     ─┤F14 3A├─► J-HLR-5
                                    T1-7  AMB_RUN_L ─┤F15 2A├─► J-HLL-6
 SUPPLIES                           T1-11 AMB_RUN_R ─┤F16 2A├─► J-HLR-6
 VBUS─┤F5 10A├─o/o[K8]─► T1-1 VDECO T1-8  AUX_L     ─┤F19 3A├─► J-HLL-12
 VBUS─┤F6 3A ├─────────► T1-3 CTRL  T1-12 AUX_R     ─┤F20 3A├─► J-HLR-12
 VBUS─┤F7 5A ├─o/o[K1]─► IGN_SW
 VBUS─┤F8 5A ├─────────► T3-7 EMER_FEED              TURN (from TIM, sheet 5)
 VBUS─┤F10 5A├─────────► TIM VS (always hot)         TIM OUT0 ─┤F17 3A├─► J-HLL-7
                                                     TIM OUT1 ─┤F18 3A├─► J-HLR-7
 ⏚ ─┬─ J-HLL-3 / J-HLR-3 PRJ_RTN (16 AWG)
    ├─ J-HLL-9 / J-HLR-9 DECO_RTN (14 AWG)
    ├─ T1-2 PGND (14 AWG), T1-4 LGND (18 AWG)
    └─ coil returns, TIM GND, T3-2 SIG_GND
```

The RTMR is rear-terminal (each cavity wired individually), so fuses after relays and fuses on
returned LCM outputs are made with internal wiring.

---

## Sheet 2 – FRB relay logic (no MCU)

```
 IP fuse 11 tap ─┤F0 1A├─ T3-1 IGN_TAP ─[K1 coil]─⏚          K1 contact → IGN_SW (sheet 1)
 EMER_FEED ─ T3-7 ─[S1 guarded, lit]─ T3-8 ─ EMER_SW

 IGN_SW ─|>|D1─┐
 HI_REQ ─|>|D2─┼─ LO_COIL ─┬─[K2]─⏚        HI_REQ ── HI_COIL ─┬─[K4]─⏚
 EMER_SW─|>|D3─┘           └─[K3]─⏚                           └─[K5]─⏚
 IGN_SW ─|>|D6─┬─[K7 coil]─⏚   K7 dry contact: T3-5 PARK_SIG ─o/o─ T3-6 SW_REF (old switch pin 1 ↔ ref)
 EMER_SW─|>|D7─┘
 IGN_SW ────────[K8 coil]─⏚
 IGN_SW ─|>|D10─┐
 EMER_SW─|>|D11─┴─┤F9 2A├─ T3-3 STALK_FEED → stalk dimmer common;  stalk HI → T3-4 HI_REQ

 D1–D11: 1 A ≥100 V rectifiers (AEC-Q101 preferred) on a small diode board in the FRB.
 K1–K5, K7, K8: ISO micro 280, 12 V, resistor-suppressed coils, ≥ 20 A contacts. (K6, K9 deleted in Rev D.)
```

---

## Sheet 3 – LCM power, 10 s hardware latch, regulators, watchdog (unchanged)

```
 T1-3 CTRL_BATT ─TVS─ U10 PROFET+2 (latch) ─|>|D20─ VCTRL ─► U11 LMR36015-Q1 → +5V_HMI ; U12 → +3V3
 T2-1 IGN_SW ─47k/10k, 3.6 V Zener, Schmitt U14 → IGN_OK ;  ─22k/10k, 5.1 V Zener → IGN_5V
 IGN_5V ─|>|─1k─ CT 10 µF ∥ RT 470k–1M (select on test for 10 s ±1 s); U15 LM2903-Q1 vs 1.86 V → HOLD
 LATCH_IN = IGN_5V OR HOLD (diodes) → 4.7k → U10 IN ; 47k pull-down
 U16 TPS3431-Q1 watchdog ≈1 s → WDOK → gating + ESP32 EN
```

---

## Sheet 4 – LCM decorative outputs (3 PWM channels → 6 L/R outputs + 2 AUX) and interior

```
 T1-1 VDECO ─TVS─ LM74700-Q1 ideal diode ─ VDECO_P (bulk 100 µF + 100 nF per PROFET)

 Gating (SN74LVC08A-Q1; all MCU outputs 100k pull-down → OFF on reset/crash):
   EN = IGN_OK·WDOK; CH1_G = PWM1·EN; CH2_G = PWM2·EN; CH3_G = PWM3·EN;
   CH3_L_G = CH3_G·ALLOW_L; CH3_R_G = CH3_G·ALLOW_R; AUX_x_G = AUX_x·EN
   Each gated signal → separate 4.7 kΩ R_IN to the LEFT and RIGHT PROFET inputs (L/R synchronized).

 U1 LEFT-A : CH1_G → OUT0 → T1-5 HONEY_L     CH2_G   → OUT1 → T1-6 DRL_L
 U2 LEFT-B : CH3_L_G → OUT0 → T1-7 AMB_RUN_L AUX_L_G → OUT1 → T1-8 AUX_L
 U3 RIGHT-A: CH1_G → OUT0 → T1-9 HONEY_R     CH2_G   → OUT1 → T1-10 DRL_R
 U4 RIGHT-B: CH3_R_G → OUT0 → T1-11 AMB_RUN_R AUX_R_G → OUT1 → T1-12 AUX_R
 (Branch fuses are in the FRB, F11–F16, F19, F20. The trunk wires are protected by F5 + PROFET limits.)
 IS sense → R_SENSE → RC (τ≈22 ms) → ADC.  DEN/DSEL common.

 Interior (J-INT to the old headlamp-switch pigtail), photorelays PR1–PR6, all open when the LCM is off:
   PR1 COURTESY_SIG ─o/o─ SW_REF → interior ON        PR2 DEFEAT_SIG ─o/o─ SW_REF → interior OFF
   DIM_SIG ─ R_base ─ R1 ─ R2 ─ R4 ─ R8 ─ DIM_REF, each R shorted by PR3…PR6 → dash level
```

---

## Sheet 5 – Turn Interface Module (TIM), in the FRB, no microcontroller

```
 Factory LT TURN fuse tap ─┤1A├─ J-TURN-1 ── R 10k ──► OC1 LED ──⏚     (≈1 mA load on the factory circuit)
 Factory RT TURN fuse tap ─┤1A├─ J-TURN-2 ── R 10k ──► OC2 LED ──⏚      reverse diode + 100 nF across each LED
 OC1/OC2: dual-channel automotive optocouplers (AEC-Q101 class, [UNVERIFIED part]):
   channel A transistor: pulls TIM U5 INx high from a local 5 V (from F10 via TPS7B69-Q1-class LDO, [UNVERIFIED])
   channel B transistor: open collector → T2-2 / T2-3 TURN_x_SNS to the LCM (isolated status)
 U5 PROFET+2 dual (BTS7120-2EPA class, 2–2.5 A/ch), VS = F10 (always hot):
   IN0 ← OC1A → OUT0 → F17 → J-HLL-7 (SS3 main beam, 1.1 A)
   IN1 ← OC2A → OUT1 → F18 → J-HLR-7
   10k pull-downs on IN0/IN1 → OFF when no signal. Sleep current µA class (key-off drain).
 Result: turn and hazard flash exactly with the factory flasher, key on or off, at full SS3 brightness,
 powered entirely from the independent fuse box. Galvanically isolated from the factory circuit.
```

Hyperflash: the factory flasher now sees only the opto load (≈1 mA per side). An **electronic,
load-independent flasher** is required (O-7).

---

## Sheet 6 – Passive headlamp (one 12-way connector)

```
 J-HL* DT04-12P on the headlamp pigtail (left key A, right key B) / DT06-12S on the harness
  1 LO_PWR   → HELLA low module (+)          7 AMB_TURN+ → SS3 main beam (+)
  2 HI_PWR   → HELLA high module (+)         8 SPARE (cavity plug)
  3 PRJ_RTN  ← both HELLA modules (−)        9 DECO_RTN  ← FlexLights, SS3 ground, fan (−)
  4 HONEY+   → FlexLight behind honeycomb   10 NTC_A ┐ 10 kΩ NTC on inner housing wall
  5 DRL+     → FlexLight DRL strip          11 NTC_B ┘ (twisted pair)
  6 AMB_RUN+ → SS3 backlight (blue, pod pin 3) 12 AUX+ → optional fan
 SS3 pod connector: integrated Deutsch DT 3-pin. Pin 3 = backlight [VERIFIED]; pins 1/2 = main + / ground
 [VERIFY on the pigtail]. Plug the pod's pigtail into an internal DT06-3S so the pod unplugs separately.
```

---

## Sheet 7 – Trunks and vehicle interface

```
 T1 FRB↔LCM power/outputs (DT 12, key A)    T2 FRB↔LCM sense (DT 12, key B)     T3 FRB↔cab interface (DT 12, key C)
  1 VDECO (14)     7 AMB_RUN_L               1 IGN_SW       7 RLY_HI_R          1 IGN_TAP (IP fuse 11, F0)
  2 PGND (14)      8 AUX_L                   2 TURN_L_SNS   8 HI_REQ            2 SIG_GND
  3 CTRL_BATT      9 HONEY_R                 3 TURN_R_SNS   9 NTC_L_A           3 STALK_FEED
  4 LGND          10 DRL_R                   4 RLY_LO_L    10 NTC_L_B           4 HI_REQ
  5 HONEY_L       11 AMB_RUN_R               5 RLY_LO_R    11 NTC_R_A           5 PARK_SIG (old sw pin 1)
  6 DRL_L         12 AUX_R                   6 RLY_HI_L    12 NTC_R_B           6 SW_REF   (old sw pin 2/4 or 5)
                                                                                7 EMER_FEED  8 EMER_SW
                                                                                9 S1_LAMP   10–12 spare
 J-TURN (FRB, DT 4): 1 TURN_L_IN  2 TURN_R_IN  3 GND  4 spare      (from the underhood fuse taps)
 J-INT (LCM, DT 6): 1 SW_REF 2 COURTESY_SIG 3 DEFEAT_SIG 4 DIM_SIG 5 DIM_REF 6 spare (old switch pigtail)
 J-HMI (LCM, DT 4): 1 +5V 2 GND 3 CANH 4 CANL
 If measured decorative current or as-built lengths fail the tool, move VDECO/PGND from T1 to a separate
 DTP 2-way (size 12 contacts, 12 AWG) and use the freed T1 pins as spares.
```

## ESP32-S3 (LCM) pin budget

PWM ×5, ALLOW_L/R, DIAG_EN/SEL, WD_KICK/EN (6), PR1–PR6 (6), ADC ×9 (IS ×4, VDECO, VCTRL, NTC ×3),
inputs: IGN_OK, HI_REQ, TURN_L/R_SNS, RLY ×4 (8), CAN ×2 → **36**. Feasible on WROOM-1. Put PR1–PR6
on an I²C expander if routing is tight.
