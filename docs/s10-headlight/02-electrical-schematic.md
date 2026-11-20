# Deliverable 2 – Preliminary Electrical Schematic (Rev E, paired branches)

Text schematics drawn in the chain order the owner specified:
**screen → control module → standalone fuse box → headlight connectors.** **(P)** = provisional, re-run
`tools/wire_calc.py`.

```
──┤F├── fuse   ──|>|── diode   ─o/o─ relay contact   [K] relay coil   ⏚ fuse-box ground stud
```

---

## Sheet 1 – 3.5" control screen

```
 Waveshare ESP32-S3-Touch-LCD-3.5 (ST7796 SPI display, FT6336 touch, USB-C 5 V)
   +5 V / GND  ◄── J-HMI 1/2 from the control module (5 V regulated, protected)
   GPIO (header) ─► CAN transceiver breakout (TCAN1042-Q1 class, 3.3 V I/O) ─► J-HMI 3/4 CANH/CANL
   120 Ω termination at the screen end and at the control module end
```

---

## Sheet 2 – Control module (behind dash)

```
 POWER (from fuse box via T1)
   T1-3 CTRL_BATT (F10, always hot) ─ TVS ─ U10 PROFET latch ─|>|─ VCTRL ─► LMR36015-Q1 → +5 V (screen)
                                                                       └► LMR36015-Q1 → +3.3 V (logic)
   T1-1 + T1-9 VDECO (F9 via K4, 2 pins ‖) ─ TVS ─ LM74700-Q1 ideal diode ─ VDECO_P
   T1-2 + T1-10 PGND (2 pins ‖) ;  T1-4 LGND
 10 s LATCH: IGN_5V or HOLD (RC 10 s ±1 s, LM2903-Q1 comparator) → U10 IN   (unchanged design)
 WATCHDOG: TPS3431-Q1 → WDOK

 PAIR OUTPUTS (one channel per pair; outputs held off by pull-downs and gating EN = IGN_OK · WDOK)
   U1 PROFET+2 dual (BTS7120-2EPA class, 2–2.5 A/ch):
       IN0 ← PWM1 · EN → OUT0 ─► T1-5  HONEY_PAIR
       IN1 ← PWM2 · EN → OUT1 ─► T1-6  DRL_PAIR
   U2 PROFET+2 dual:
       IN0 ← PWM3 · EN → OUT0 ─► T1-7  AMB_RUN_PAIR
       IN1 ← AUX · EN  → OUT1 ─► T1-8  FAN_PAIR (optional)
   IS pins → R_SENSE → RC (τ ≈ 22 ms) → ADC (pair current; ≈50 % drop = one side out)

 DASH DIMMER (J-INT → old headlamp-switch pigtail)
   DIM_SIG ─ R_base ─ R1 ─ R2 ─ R4 ─ R8 ─ DIM_REF,  photorelays PR1–PR4 short R1/R2/R4/R8
   (values from doc 09 §5.2; all open = default level when the module is off)
 SENSE INPUTS (via T2, 47k/10k dividers): IGN_SW, TURN_L/R (isolated from TIM), LOW_FEED, HIGH_FEED,
   HI_REQ, TAIL_L, TAIL_R, BRAKE, REVERSE, NTC_L, NTC_R
```

---

## Sheet 3 – Standalone fuse box (under hood, at battery)

```
 BATTERY(+) ─[Blue Sea 5191 + 30 A MRBF on post]─ 10 AWG ─► VBUS        BATTERY(−) ─ 10 AWG ─► ⏚

 PAIRS (fuse, then split to left and right connectors)
 VBUS ─┤F1 7.5A├─o/o[K2 LOW]──┬─► J-HLL-1      T1-5 HONEY_PAIR ─┤F3 3A├──┬─► J-HLL-4
                              └─► J-HLR-1                                └─► J-HLR-4
 VBUS ─┤F2 7.5A├─o/o[K3 HIGH]─┬─► J-HLL-2      T1-6 DRL_PAIR   ─┤F4 3A├──┬─► J-HLL-5
                              └─► J-HLR-2                                └─► J-HLR-5
                                               T1-7 AMB_RUN_PAIR ┤F5 1A├─┬─► J-HLL-6
                                                                         └─► J-HLR-6
                                               T1-8 FAN_PAIR ─┤F14 3A├───┬─► J-HLL-12
                                                                         └─► J-HLR-12
 PER SIDE (turn only)
 VBUS ─┤F8 5A├─ TIM VS (always hot)    TIM OUT0 ─┤F6 3A├─► J-HLL-7      TIM OUT1 ─┤F7 3A├─► J-HLR-7

 SUPPLIES / LOGIC
 VBUS ─┤F9 7.5A├─o/o[K4]─► T1-1, T1-9 VDECO        VBUS ─┤F10 3A├─► T1-3 CTRL_BATT
 VBUS ─┤F11 5A├─o/o[K1]─► IGN_SW                   VBUS ─┤F12 5A├─► T3-7 → emergency switch S1
 (IGN_SW | EMER) ─diodes─┤F13 2A├─► T3-3 stalk feed

 COILS (diode-OR where shown)
 Factory IGN (IP fuse 11 tap, F0 1 A) → T3-1 → [K1]
 IGN_SW ─|>|─┐  HI_REQ ─|>|─┐  EMER_SW ─|>|─┐ → [K2 LOW]        HI_REQ (T3-4) → [K3 HIGH]
 IGN_SW → [K4]          IGN_SW ─|>|─ / EMER_SW ─|>|─ → [K5 TAIL] : dry contact T3-5 ↔ T3-6 (old switch park signal)

 TURN INTERFACE MODULE (TIM)
 J-TURN-1 (factory LT TURN fuse tap, 1 A) ─10k─► opto 1 ─► U5 IN0 ;  2nd channel → T2 TURN_L (isolated)
 J-TURN-2 (factory RT TURN fuse tap, 1 A) ─10k─► opto 2 ─► U5 IN1 ;  2nd channel → T2 TURN_R
 U5 = PROFET+2 dual (BTS7120-2EPA class), VS = F8. Pull-downs on IN0/IN1.

 REAR-LIGHT SENSE (read-only, 1 A fuse taps in the factory underhood fuse block) → J-REAR → T2
   LR PRK → TAIL_L ;  RR PRK → TAIL_R ;  STOPLP → BRAKE ;  B/U LP → REVERSE

 GROUNDS: ⏚ ─ PRJ_RTN (J-HLx-3, 16 AWG) · DECO_RTN (J-HLx-9, 14 AWG) · T1 PGND ×2 · T1 LGND · coils · TIM
```

---

## Sheet 4 – Headlight connector (identical left and right; one 12-way plug)

```
 DT04-12P on the headlight (left key A, right key B) / DT06-12S on the harness
  1 LOW +      (F1 pair)        7 TURN +      (F6 / F7, per side) → SS3 main beam
  2 HIGH +     (F2 pair)        8 spare
  3 PROJ RTN                    9 DECO RTN    (FlexLights, SS3, fan)
  4 HONEYCOMB + (F3 pair)      10 NTC        → T2 (via fuse box)
  5 DRL +       (F4 pair)      11 NTC RTN    → signal ground
  6 AMBER RUN + (F5 pair) → SS3 backlight (pod pin 3)    12 FAN + (F14 pair, optional)
```

---

## Sheet 5 – Trunks

```
 T1 control ↔ fuse box (DT 12, key A)   T2 sense (DT 12, key B)        T3 fuse box ↔ cab (DT 12, key C)
  1 VDECO      7 AMB_RUN_PAIR            1 IGN_SW     7 TAIL_L          1 IGN_TAP     7 EMER_FEED
  2 PGND       8 FAN_PAIR                2 TURN_L     8 TAIL_R          2 SIG_GND     8 EMER_SW
  3 CTRL_BATT  9 VDECO (2nd)             3 TURN_R     9 BRAKE           3 STALK_FEED  9 S1_LAMP
  4 LGND      10 PGND (2nd)              4 LOW_FEED  10 REVERSE         4 HI_REQ     10–12 spare
  5 HONEY_PAIR 11 spare                  5 HIGH_FEED 11 NTC_L           5 PARK_SIG
  6 DRL_PAIR  12 spare                   6 HI_REQ    12 NTC_R           6 SW_REF
 J-TURN (fuse box, DT 4): LT TURN in, RT TURN in, GND, spare
 J-REAR (fuse box, DT 6): TAIL_L, TAIL_R, BRAKE, REVERSE, GND, spare
 J-INT  (control, DT 4): DIM_SIG, DIM_REF, spare, spare
 J-HMI  (control, DT 4): +5 V, GND, CANH, CANL
```

## Control module ESP32-S3 pin budget

PWM ×4, WD ×2, DIAG ×2, PR1–PR4, ADC: IS ×2, VDECO, VCTRL, NTC ×3; digital inputs: IGN_OK, TURN_L/R,
LOW_FEED, HIGH_FEED, HI_REQ, TAIL_L/R, BRAKE, REVERSE; CAN ×2 → **31 pins**. Fits easily.
