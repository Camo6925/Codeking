# Deliverable 2 – Preliminary Electrical Schematic (Rev A)

These are text schematics, organized as sheets the way a KiCad project would be. Net names are
UPPER_CASE and are shared across sheets. Reference designators are unique across the package and
match [03-circuit-schedules.md](03-circuit-schedules.md) and the BOM.

Symbols used:

```
──┤F├──  fuse          ──|>|──  diode (anode→cathode)      ─/ ─  switch contact
[K n]    relay coil    ─o/o─   relay NO contact            ─┴─   ground bus / return
─▷|─     Zener/TVS     ⏚        system ground bus (never sheet metal unless stated)
```

All values marked (P) are **PROVISIONAL**. They are sized from estimates and are re-run with
`tools/wire_calc.py` once real loads are measured.

---

## Sheet 1 – Battery, main fuse, distribution, grounds

```
                         ≤300 mm, 10 AWG (P)
 BATTERY(+) ──────┤FM 30 A (P) MRBF/MIDI├────────────────────────┬──► RTMR INPUT STUD (VBUS)
  (side-post: use surface-mount holder, O-5)                     │
                                                                 │  (RTMR internal bus)
 VBUS ─┤F1 5A (P) ├─o/o─[K2]──── LO_L_PWR ─────────────► J-HLL-P pin 1
 VBUS ─┤F2 5A (P) ├─o/o─[K3]──── LO_R_PWR ─────────────► J-HLR-P pin 1
 VBUS ─┤F3 5A (P) ├─o/o─[K4]──── HI_L_PWR ─────────────► J-HLL-P pin 3
 VBUS ─┤F4 5A (P) ├─o/o─[K5]──── HI_R_PWR ─────────────► J-HLR-P pin 3
 VBUS ─┤F5 10A (P)├─o/o─[K8]──── VDECO_RAW ────────────► LCM J1-1   (decorative power)
 VBUS ─┤F6 3A     ├───────────── CTRL_BATT ────────────► LCM J1-3   (always hot, latch input)
 VBUS ─┤F7 5A     ├─o/o─[K1]──── IGN_SW ───────────────► coil bus (sheet 2), LCM J4-1
 VBUS ─┤F8 5A     ├───────────── EMER_FEED ────────────► S1 emergency switch (sheet 2)
 VBUS ─┤F9 5A (opt)├─o/o─[K6]─── HEAD_FEED (feed option only, sheet 2)
 VBUS ─┤F11 AUX   ├───────────── (future)
 VBUS ─┤F12 spare ├

 BATTERY(−) ───────── 10 AWG (P) ─────────────── ⏚ SYSTEM GROUND BUS (stud beside RTMR)
                                                 ├── LO_L_RTN, LO_R_RTN, HI_L_RTN, HI_R_RTN (16 AWG each)
                                                 ├── LCM_PGND (J1-2, 14 AWG (P))
                                                 ├── LCM_LGND (J1-4, 18 AWG)
                                                 ├── relay coil returns (K1–K8)
                                                 └── (factory battery−/engine/body bond is unchanged)
```

Notes

* FM sits as close to the battery as physically possible. The 10 AWG run upstream of FM is the only
  unprotected conductor and must be loomed and secured against chafe.
* The ground bus is a dedicated stud with **one** 10 AWG lead to the battery negative post. No return
  current flows through painted sheet metal or mounting screws.
* F9/K6 "feed option" is only used if the service manual (O-1) shows that paralleling the factory HEAD
  contact is impractical. Otherwise F9 is a spare.

---

## Sheet 2 – Projector relay logic & factory interface (no MCU in this sheet)

```
                FACTORY IGN RUN tap (verify circuit, O-6)
                     │
                 ┤F0 1A├  (fuse tap / inline, at tap point)
                     │
                    [K1 K-IGN coil]───⏚           K1 contact: VBUS ─F7─o/o─ IGN_SW
                     
 IGN_SW ──┬──|>|D1──┬────────────────────────┬──[K2 K-LO-L coil]──⏚
          │         │                        └──[K3 K-LO-R coil]──⏚
          │   LO_REQ ──|>|D2──┤  (node LO_COIL)
          │   HI_REQ ──|>|D3──┤
          │ EMER_SW  ──|>|D4──┘
          │
          │   HI_REQ ──|>|D5──┬──[K4 K-HI-L coil]──⏚
          │                   └──[K5 K-HI-R coil]──⏚
          │
          ├──|>|D6──┬──[K6 K-HEADREQ coil]──⏚
          │ EMER_SW ─|>|D7─┘
          ├──|>|D8──┬──[K7 K-PARKREQ coil]──⏚
          │ EMER_SW ─|>|D9─┘
          └─────────[K8 K-DECO coil]──⏚        (NOT fed from EMER_SW: decorative stays off in emergency)

 EMERGENCY:  EMER_FEED ──[S1 guarded toggle, lit]── EMER_SW

 FACTORY INTERFACE (via plug-in pigtails, no cutting):
   Factory 9006 (low) connector, LH, feed pin  ──► LO_REQ  (one side only; RH 9006 pigtail capped & stored)
   Factory 9005 (high) connector, LH, feed pin ──► HI_REQ  (requires factory DRL disabled, O-1)
   Factory 9005/9006 ground pins: NOT used. Coil returns go to the system ground bus.

   K6 K-HEADREQ contacts ─o/o─ wired IN PARALLEL with factory headlamp switch HEAD contact  (parallel option)
   K7 K-PARKREQ contacts ─o/o─ wired IN PARALLEL with factory headlamp switch PARK contact
   (exact pins/wire colors: O-1, service manual)

 D1–D9: 1 A / ≥ 100 V automotive rectifier (e.g. S1x / 1N400x class, AEC-Q101 preferred),
        mounted as RTMR plug-in diode modules if available [VERIFY], else in a sealed inline diode pack.
 K1–K8: ISO micro (280) relays, 12 V coil, RESISTOR-suppressed (avoids polarity mistakes in a diode-OR network),
        contact rating ≥ 20 A.
```

Logic summary (hardware truth table, IGN_SW = ignition RUN):

| IGN | Stalk | Emergency | K-LO (L,R) | K-HI (L,R) | Result |
|---|---|---|---|---|---|
| off | — | off | off | off | All projectors off |
| RUN | low | off | **on** | off | Low beams |
| RUN | high | off | **on** (via D3) | on | **Low + high** |
| RUN | flash | off | on | on (momentary) | Flash-to-pass |
| off | flash | off | on via D3 | on | Flash-to-pass, if the factory flash circuit is battery-fed [VERIFY O-1] |
| any | any | **on** | on | via stalk (K6 energized) | Emergency headlamps |

---

## Sheet 3 – LCM power entry, 10-second hardware latch, regulators, watchdog

```
 J1-3 CTRL_BATT (always hot, F6 3 A)
   │
   ├──▷| TVS2 (SM8S-class, select per §4 of research log)──⏚
   │
   └── VS  ┌──────────────────────────┐ OUT0 ──|>|D20 (AEC-Q101 Schottky, 2 A) ── VCTRL
           │ U10 PROFET+2 (BTS7200-   │                                           │
  LATCH_IN─┤ IN0      2EPC class)     │                                     C 47µF/50V + 100nF
           │ DEN,DSEL,IN1 → GND       │                                           │
           └──────────────────────────┘                                          ⏚
   (U10 sleep current ≤ 1 µA class → key-off drain)

 VCTRL ──► U11 LMR36015-Q1 (4.2–60 V in) ─► +5V_HMI  (1.5 A max; HMI verified 450 mA)
 VCTRL ──► U12 LMR36015-Q1                ─► +3V3     (ESP32-S3, logic)
 +5V_HMI ──► U13 5 V LDO (or tap from U11) ─► +5V_TMR  (timer comparator supply; may simply be +5V_HMI)

 ── IGN logic ─────────────────────────────────────────────────────────────────
 J4-1 IGN_SW ──R1 47k──┬──R2 10k──⏚        (13.5 V → 2.37 V)
                       ├──▷| DZ1 3.6 V──⏚
                       └──C1 100nF──⏚ ──► U14 SN74LVC1G17-Q1 (Schmitt) ──► IGN_OK (3.3 V logic)

 IGN_SW ──R3 22k──┬──R4 10k──⏚     (13.5 V → 4.2 V; ≤ 5.1 V by DZ2)
                  ├──▷| DZ2 5.1 V──⏚
                  └──── IGN_5V

 ── 10 s RC hold (fully retriggerable, no MCU) ───────────────────────────────
 IGN_5V ──|>|D21 BAT54──R5 1k──┬──── V_CT
                               ├── CT  10 µF X7R 25 V (or film) ──⏚
                               └── RT  470 k–1 M (SELECT ON TEST for 10.0 s ±1 s) ──⏚
 Comparator U15A (LM2903-Q1), supplied from +5V_TMR:
     IN+ = V_CT,   IN− = V_TH = +5V_TMR × 59k/(100k+59k) ≈ 1.86 V,  + 1 MΩ positive feedback (hysteresis)
     OUT (open collector) ── pull-up 10k to +5V_TMR ── HOLD
     t_hold ≈ RT·CT·ln(V_CT0/V_TH)  → ≈ RT·CT when V_CT0 ≈ 5 V

 LATCH_IN = diode-OR:   IGN_5V ──|>|D22──┐
                        HOLD   ──|>|D23──┴──R6 4.7k (R_IN)── U10 IN0,  R7 47k pull-down to ⏚

 Sequence at key-off:  IGN_5V → 0  ⇒  CT discharges through RT  ⇒  HOLD stays high until V_CT < V_TH
                       ⇒ LATCH_IN low ⇒ U10 off ⇒ VCTRL collapses ⇒ comparator unpowered ⇒ stays off.
 Key back on during hold: CT recharges, U10 stays on. No reset race (unlike a 555 monostable).

 ── Watchdog ──────────────────────────────────────────────────────────────────
 U16 TPS3431-Q1: VDD = +3V3, WDI ← MCU GPIO WD_KICK, WD-EN ← MCU GPIO (pull-down 100k),
                 CWD → timeout ≈ 1 s (set by capacitor, per datasheet table)
                 WDO (open drain) ── 10k pull-up ── WDOK ──► sheet 4 gating, and ──► ESP32 EN via 1k (reset)
```

---

## Sheet 4 – LCM decorative output stages (3 logical PWM channels → 6 protected L/R outputs + 2 AUX)

```
 VDECO power entry:
 J1-1 VDECO_RAW ─▷| TVS1 (per LM74700-Q1 §10.1.1.3) ── Q1 N-MOSFET (ideal diode) ── VDECO ──┬── bulk 100 µF/50 V
                                    U17 LM74700-Q1 gate drive, EN tied to VDECO_RAW          └── 100 nF per PROFET VS

 Hardware gating (U18, U19 = SN74LVC08A-Q1 quad AND, +3V3):
   G1: EN      = IGN_OK · WDOK
   G2: CH1_G   = PWM1  · EN          (honeycomb)
   G3: CH2_G   = PWM2  · EN          (DRL strip)
   G4: CH3_G   = PWM3  · EN          (amber running)
   G5: CH3_L_G = CH3_G · ALLOW_L     (turn blanking, left)
   G6: CH3_R_G = CH3_G · ALLOW_R     (turn blanking, right)
   G7: AUX_L_G = AUX_L · EN
   G8: AUX_R_G = AUX_R · EN
   All MCU outputs (PWM1..3, ALLOW_L/R, AUX_L/R) have 100 k pull-downs → OFF during reset/boot/crash.

 Split: each gated channel signal fans out to its left and right PROFET inputs through SEPARATE
 R_IN = 4.7 kΩ resistors, so a fault on one input pin cannot drag the other side.

 PROFET placement (grouped BY SIDE, so one IC failure affects one side only):
   U1 (LEFT A):   IN0 ← CH1_G  → OUT0 ─┤F21 3A(P)├─ HONEY_L+  (J2-1)
                  IN1 ← CH2_G  → OUT1 ─┤F22 3A(P)├─ DRL_L+    (J2-3)
   U2 (LEFT B):   IN0 ← CH3_L_G→ OUT0 ─┤F23 3A(P)├─ AMB_PARK_L+ (J2-5)
                  IN1 ← AUX_L_G→ OUT1 ─┤F24 3A(P)├─ AUX_L+    (J2-9)
   U3 (RIGHT A):  IN0 ← CH1_G  → OUT0 ─┤F25 3A(P)├─ HONEY_R+  (J3-1)
                  IN1 ← CH2_G  → OUT1 ─┤F26 3A(P)├─ DRL_R+    (J3-3)
   U4 (RIGHT B):  IN0 ← CH3_R_G→ OUT0 ─┤F27 3A(P)├─ AMB_PARK_R+ (J3-5)
                  IN1 ← AUX_R_G→ OUT1 ─┤F28 3A(P)├─ AUX_R+    (J3-9)
   U1–U4: PROFET+2 12V dual, TSDSO-14. Part chosen after O-4 (BTS7200-2EPC / BTS7120-2EPA / BTS7008-2EPA).
   Each OUTn: C_OUT 10 nF to PGND (EMI, per datasheet application circuit).
   F21–F28: PCB-mount mini-blade fuse holders. They protect the 18 AWG branch wire against overloads
            below the PROFET trip level and against a failed-shorted PROFET.

 Diagnostics per IC:
   DEN (all ICs, common) ← MCU DIAG_EN;  DSEL (all ICs, common) ← MCU DIAG_SEL
   IS_n ──R_SENSE (1.2 k, final value per chosen part's k_ILIS)──⏚
        └─ 4.7 k ── ADC_IS_n ── 4.7 µF ──⏚   (τ ≈ 22 ms averages the 250 Hz PWM; BAT54S clamp to 3V3/GND)
   Load current while ON:  I_on ≈ (V_ADC / R_SENSE) · k_ILIS / duty
   IS fault level (4.4–10 mA for BTS7008-class) → ADC saturates high → hard-fault flag.

 Returns: HONEY_L_RTN, DRL_L_RTN, AMB_L_RTN, AUX_L_RTN (and R) → LCM PGND plane → J1-2 → ground bus.
```

Why this topology: the requirement is three synchronized logical channels without pushing
left+right high-current loads through one undersized switch. The design gives each L/R branch its own
protected switch channel, its own fuse and its own current sense, while one timer output per logical
channel guarantees L/R synchronization. Grouping by side (rather than by function) means a single IC
failure cannot take out the same function on both sides, and diagnostics can name the failed side.

---

## Sheet 5 – Headlamp assembly internal wiring (each side identical, mirrored)

```
 J-HL*-P (DT 4-way, power)                      J-HL*-S (DT 12-way, signal/decorative)
  1 LO_PWR ───► HELLA low module (+)             1 HONEY+ ─► honeycomb LED array (+)
  2 LO_RTN ───► HELLA low module (−)             2 HONEY_RTN ◄ honeycomb (−)
  3 HI_PWR ───► HELLA high module (+)            3 DRL+    ─► white DRL strip (+)
  4 HI_RTN ───► HELLA high module (−)            4 DRL_RTN ◄ DRL strip (−)
                                                 5 AMB_PARK+ ─┐
                                                 6 AMB_TURN+ ─┤  (factory flasher output, see below)
                                                 7 AMB_RTN  ◄─┘ amber pod (−)
                                                 8 NTC_A ─┐  10 kΩ NTC, bonded to housing
                                                 9 NTC_B ─┘  inner wall near projector heat sinks
                                                10 AUX+  ─► optional housing fan (+)
                                                11 AUX_RTN ◄
                                                12 RESERVED (HELLA DRL/position input, if that variant is used)

 Amber pod, OPTION A (preferred): dual-input lamp
     AMB_PARK+ → PARK input ;  AMB_TURN+ → TURN input ;  AMB_RTN → common (−)
     Verify by measurement that PARK and TURN inputs are isolated (no back-feed path).

 Amber pod, OPTION B: single-input lamp → diode-OR on a small potted board inside the housing
     AMB_PARK+ ──|>| D30 ─┐
     AMB_TURN+ ──|>| D31 ─┴──► amber (+)        D30/D31: AEC-Q101 Schottky, ≥ 3 A, ≥ 40 V
     D31 blocks the LCM PWM from back-feeding the factory turn circuit (rear turn bulb & dash arrow).
     D30 blocks the factory flasher from back-feeding the PROFET output.

 Housing: sealed, with a membrane pressure-equalization vent (prevents condensation pumping);
          bulkhead-sealed pigtails exit to the DT connectors; strain relief on every pigtail.
```

Front turn feed routing: the factory front turn wire (at the original park/turn lamp connector) runs in
the front harness to J-HL*-S pin 6 through a plug-in pigtail. It is also spliced (sealed solder splice
or IDC-free crimp + heat shrink) to the LCM sense input TURN_* (sheet 6).

---

## Sheet 6 – Signal inputs and HMI link

```
 Each 12 V sense input (TURN_L, TURN_R, LO_REQ, HI_REQ, RLY_LO_L, RLY_LO_R, RLY_HI_L, RLY_HI_R, PARK_REQ):
   IN ──R 47k──┬──R 10k──⏚            load ≈ 0.24 mA at 13.5 V (high impedance, factory-circuit safe)
               ├──C 10nF──⏚
               ├──BAT54S clamp to +3V3 / ⏚
               └──► MCU GPIO (TURN_* on interrupt-capable pins)
   13.5 V → 2.37 V ; 16 V → 2.81 V ; 24 V jump start → clamped.

 Relay-output sense (RLY_*): taken at the RTMR output side of F1–F4, so a missing voltage while the
 matching request is active identifies a blown fuse or failed relay.

 HMI link (J5, DT 4-way):  1 +5V_HMI (18 AWG)   2 GND (18 AWG)   3 CANH   4 CANL  (CAN pair twisted, ≥ 33 twists/m)
   LCM side: U20 automotive CAN transceiver (TCAN1042-Q1 / TJA1051 class) ↔ ESP32-S3 TWAI; 120 Ω termination.
   HMI side: Waveshare 4.3B on-board CAN; enable its 120 Ω termination [VERIFY jumper/setting].
   +5V_HMI enters the HMI through its USB-C 5 V input (power-only pigtail) or 5 V pad [VERIFY].
```

## ESP32-S3 (LCM) pin budget (preliminary)

| Function | Count | Peripheral |
|---|---|---|
| PWM1–3, AUX_L, AUX_R | 5 | LEDC (250 Hz, 13-bit) |
| ALLOW_L, ALLOW_R, DIAG_EN, DIAG_SEL, WD_KICK, WD_EN | 6 | GPIO out |
| ADC_IS_1…4, VDECO_SENSE, VCTRL_SENSE, NTC_L, NTC_R, NTC_BOARD | 9 | ADC1 (GPIO1–10) |
| IGN_OK, TURN_L, TURN_R, LO_REQ, HI_REQ, RLY_×4, PARK_REQ | 10 | GPIO in |
| CAN TX/RX | 2 | TWAI |
| **Total** | **32** | Fits ESP32-S3-WROOM-1 (avoid strapping and flash/PSRAM pins) |
