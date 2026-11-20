# Deliverable 2 – Preliminary Electrical Schematic (Rev B)

Text schematics in sheet form. Net names are UPPER_CASE and shared across sheets. Reference
designators match [03-circuit-schedules.md](03-circuit-schedules.md) and the BOM. **(P)** =
provisional value, re-run `tools/wire_calc.py` after measurement.

```
──┤F├──  fuse     ──|>|──  diode (anode→cathode)     ─o/o─  relay NO contact    ─o\o─ relay NC contact
[K n]    relay coil         ─▷|─  Zener/TVS            ⏚  PDCC ground stud (never sheet metal)
```

Everything on sheets 1–4 and 6 lives inside the **PDCC** (cab, driver side). Sheet 5 is the passive
headlamp.

---

## Sheet 1 – Battery, main fuse, PDCC distribution, grounds

```
 BATTERY(+) ─┤FM 30A (P) MRBF/MIDI, ≤300 mm├── 8 AWG (P), loomed, firewall grommet ──► PDCC VBUS stud
 BATTERY(−) ───────────────────────────────── 8 AWG (P) ─────────────────────────────► PDCC ⏚ stud

 VBUS ─┤F1 5A (P)├─o/o─[K2]─ LO_L_PWR ──────► J-HLL-1
 VBUS ─┤F2 5A (P)├─o/o─[K3]─ LO_R_PWR ──────► J-HLR-1
 VBUS ─┤F3 5A (P)├─o/o─[K4]─ HI_L_PWR ──────► J-HLL-2
 VBUS ─┤F4 5A (P)├─o/o─[K5]─ HI_R_PWR ──────► J-HLR-2
 VBUS ─┤F5 10A(P)├─o/o─[K8]─ VDECO_RAW ─────► LCM power entry (sheet 4)
 VBUS ─┤F6 3A    ├───────── CTRL_BATT ──────► LCM latch (sheet 3)
 VBUS ─┤F7 5A    ├─o/o─[K1]─ IGN_SW ────────► coil bus (sheet 2), LCM IGN sense
 VBUS ─┤F8 5A    ├───────── EMER_FEED ──────► J-EMER-1 → S1
 VBUS ───────────o/o─[K6]─ MKR_BUS ─┬─┤F12 2A├─ MARKER_L ─► J-HLL-8
                                    └─┤F13 2A├─ MARKER_R ─► J-HLR-8
 VBUS ─┤F11 3A   ├─o/o─[K9]─ AMB_FS ─────────► LCM amber OR node (sheet 4)
 F10 AUX spare · F14 spare · F16 spare

 ⏚ PDCC ground stud ─┬─ J-HLL-3 PRJ_RTN_L (16 AWG)    ─┬─ J-HLL-9 DECO_RTN_L (14 AWG)
                     ├─ J-HLR-3 PRJ_RTN_R (16 AWG)     └─ J-HLR-9 DECO_RTN_R (14 AWG)
                     ├─ LCM PGND (internal, 14 AWG) and LCM LGND (internal, 18 AWG)
                     └─ K1–K9 coil returns (K9 via the fail-ON driver, sheet 4)
```

* The 8 AWG between the battery and FM is the only unprotected conductor: shortest possible, loomed,
  clamped.
* The RTMR is rear-terminal (each cavity is wired individually), so fuse-after-relay arrangements like
  MKR_BUS → F12/F13 are made with internal jumpers.

---

## Sheet 2 – Relay logic & factory interface (no MCU)

```
 Factory IGN RUN ─┤F0 1A├─[K1 coil]─⏚          (tap point per O-6; K1 contact makes IGN_SW, sheet 1)
 EMER_FEED ─[S1 guarded, illuminated toggle]─ EMER_SW

 LOW BEAMS     IGN_SW ─|>|D1─┐
               HI_REQ ─|>|D2─┼─ LO_COIL ─┬─[K2 coil]─⏚
               EMER_SW ─|>|D3┘           └─[K3 coil]─⏚
 HIGH BEAMS    HI_REQ ───────── HI_COIL ─┬─[K4 coil]─⏚
                                         └─[K5 coil]─⏚
 MARKERS       IGN_SW ─|>|D4─┬─[K6 coil]─⏚
               EMER_SW ─|>|D5┘
 PARK SIGNAL   IGN_SW ─|>|D6─┬─[K7 coil]─⏚    K7 contact (dry): J-VEH-7 PARK_SIG ─o/o─ J-VEH-8 PARK_REF
               EMER_SW ─|>|D7┘                 → old switch pins 1 and (2/4 or 5), per 09 §4.2
 DECORATIVE    IGN_SW ─────────[K8 coil]─⏚    (no EMER: decorative stays off in emergency)
 AMBER FAIL-ON IGN_SW ─|>|D8─┬─[K9 coil]─ FS_DRV (LCM fail-ON driver, sheet 4)
               EMER_SW ─|>|D9┘
 STALK FEED    IGN_SW ─|>|D10┐
               EMER_SW ─|>|D11┴─┤F9 2A├─ J-VEH-3 STALK_FEED ─► stalk dimmer common (re-pinned, 09 §2.1)
               stalk HI / flash-to-pass ─► J-VEH-4 HI_REQ
 HI INDICATOR  HI_REQ ─┤F15 1A├─ J-VEH-9 ─► cluster high-beam indicator input (09 §4.4)

 D1–D11: 1 A ≥ 100 V rectifier, AEC-Q101 preferred (on a small diode board inside the PDCC, or RTMR
         plug-in diode modules [VERIFY]).
 K1–K9: ISO micro 280, 12 V, resistor-suppressed coil, ≥ 20 A contacts.
```

| IGN | Stalk | S1 | Lows | Highs | Markers / rear park | Amber park |
|---|---|---|---|---|---|---|
| OFF | any | off | off | off | off | off |
| RUN | low | off | **on** | off | on | PWM (or full if LCM unhealthy) |
| RUN | high / FTP | off | **on** | **on** | on | same |
| any | low | **on** | on | off | on | full (K9) or PWM |
| any | high | **on** | on | on | on | same |

---

## Sheet 3 – LCM power, 10 s hardware latch, regulators, watchdog

Unchanged from Rev A:

```
 CTRL_BATT ─▷|TVS2─⏚ ; ─ VS of U10 (PROFET+2, BTS7200-2EPC class) ─ OUT0 ─|>|D20 Schottky─ VCTRL
 VCTRL ─► U11 LMR36015-Q1 → +5V_HMI (HMI 450 mA verified) ; ─► U12 LMR36015-Q1 → +3V3

 IGN_SW ─47k─┬─10k─⏚ ; DZ1 3.6V ; 100nF → U14 SN74LVC1G17-Q1 → IGN_OK
 IGN_SW ─22k─┬─10k─⏚ ; DZ2 5.1V → IGN_5V

 10 s RC hold:  IGN_5V ─|>|BAT54─1k─┬─ V_CT ── CT 10 µF ─⏚ ; RT 470k–1M (select on test, 10 s ±1 s) ─⏚
   U15A LM2903-Q1: IN+ V_CT, IN− 1.86 V (100k/59k from +5V), 1 MΩ hysteresis → HOLD (10k pull-up)
 LATCH_IN = IGN_5V ─|>|─┐
            HOLD   ─|>|─┴─4.7k─ U10 IN0 ; 47k pull-down
 U16 TPS3431-Q1 watchdog (≈1 s): WDI ← MCU, WDO → WDOK (pull-up) → gating (sheet 4) + ESP32 EN
```

---

## Sheet 4 – LCM outputs: 3 PWM channels → protected L/R outputs, amber OR node, fail-ON driver

```
 VDECO_RAW ─▷|TVS1─ Q1 N-MOSFET ideal diode (U17 LM74700-Q1) ─ VDECO ─ bulk 100 µF + 100 nF per PROFET

 Gating (U18/U19 SN74LVC08A-Q1, +3V3; every MCU output has a 100k pull-down):
   G1 EN      = IGN_OK · WDOK            G5 CH3_L_G = CH3_G · ALLOW_L   (turn blanking)
   G2 CH1_G   = PWM1 · EN  (honeycomb)   G6 CH3_R_G = CH3_G · ALLOW_R
   G3 CH2_G   = PWM2 · EN  (DRL strip)   G7 AUX_L_G = AUX_L · EN
   G4 CH3_G   = PWM3 · EN  (amber park)  G8 HEALTHY = MCU_OK · WDOK
   Each gated channel → separate 4.7 kΩ R_IN to the LEFT and RIGHT PROFET inputs.

 PROFET+2 dual channels, grouped by side (part per O-4):
   U1 LEFT-A : IN0 CH1_G   → OUT0 ─┤F21 3A├─ HONEY_L+  ─► J-HLL-4
               IN1 CH2_G   → OUT1 ─┤F22 3A├─ DRL_L+    ─► J-HLL-5
   U2 LEFT-B : IN0 CH3_L_G → OUT0 ─┤F23 3A├─|>|D34─┐
               IN1 AUX_L_G → OUT1 ─┤F24 3A├─ AUX_L+    ─► J-HLL-12
                                  AMB_FS ─|>|D32───┴─ AMB_PARK_L ─► J-HLL-6
   U3 RIGHT-A: IN0 CH1_G   → OUT0 ─┤F25 3A├─ HONEY_R+  ─► J-HLR-4
               IN1 CH2_G   → OUT1 ─┤F26 3A├─ DRL_R+    ─► J-HLR-5
   U4 RIGHT-B: IN0 CH3_R_G → OUT0 ─┤F27 3A├─|>|D35─┐
               IN1 AUX_R_G → OUT1 ─┤F28 3A├─ AUX_R+    ─► J-HLR-12
                                  AMB_FS ─|>|D33───┴─ AMB_PARK_R ─► J-HLR-6
   D32–D35: AEC-Q101 Schottky ≥ 3 A ≥ 40 V. They isolate the K9 bypass, the PROFET outputs and the two
   sides from each other. A sense tap after D34/D35 lets firmware confirm amber voltage.

 Fail-ON driver for K9 (powered from IGN_SW, works with the LCM unpowered):
   K9 coil(−) = FS_DRV ── Q5 drain ; Q5 = logic-level automotive N-MOSFET, source ⏚
   Q5 gate ── R 47k ── IGN_SW (gate clamped by a 10 V zener to source). There is deliberately NO gate
               pull-down: Q5 must default ON whenever IGN_SW is present.
   Q6 (small N-MOSFET/NPN): collector/drain on Q5 gate, base/gate ← HEALTHY (G8) via 10k, 100k pull-down
   → HEALTHY high: Q6 on → Q5 off → K9 open → amber under PWM control
   → HEALTHY low / LCM dead / no +3V3: Q6 off → Q5 on → K9 closed → amber park full

 Diagnostics: DEN and DSEL common to U1–U4. IS_n ─R_SENSE─⏚, ─4.7k─ADC─4.7µF─⏚ (τ ≈ 22 ms averages 250 Hz PWM).
```

---

## Sheet 5 – Passive headlamp (each side identical; ONE connector)

```
 J-HL* : DT04-12P on the headlamp pigtail (left key A, right key B) / DT06-12S on the harness
  1 LO_PWR ──────► HELLA low module (+)          7 AMB_TURN+ ─► amber pod TURN input
  2 HI_PWR ──────► HELLA high module (+)         8 MARKER+   ─► front side-marker element (+)
  3 PRJ_RTN ◄───── both HELLA modules (−)        9 DECO_RTN  ◄─ honeycomb, DRL, amber, marker, fan (−)
  4 HONEY+ ──────► honeycomb LEDs (+)           10 NTC_A ─┐ 10 kΩ NTC on inner housing wall
  5 DRL+   ──────► white DRL strip (+)          11 NTC_B ─┘ (twisted pair)
  6 AMB_PARK+ ───► amber pod PARK input         12 AUX+   ─► optional housing fan (+)

 Inside the housing: each element on its own sealed internal plug so it can be replaced individually;
 internal return bus for pins 3 and 9 is a crimped multi-wire splice, sealed; membrane vent at top;
 pigtail exits through an IP68 gland. NO fuses, relays, diodes or electronics in the headlamp.
```

---

## Sheet 6 – Vehicle interface (J-VEH) and HMI

```
 J-VEH (DT 12-way, key C) → pigtails to factory connectors:
   1 IGN_TAP     ← factory IGN RUN (via F0 1 A at the tap)
   2 SIG_GND     — reference
   3 STALK_FEED  → stalk dimmer common          (column connector pigtail)
   4 HI_REQ      ← stalk HI / flash-to-pass      (column connector pigtail)
   5 TURN_L      ← factory LF front turn output  (sealed in-cab splice)
   6 TURN_R      ← factory RF front turn output  (sealed in-cab splice)
   7 PARK_SIG    ↔ old switch connector pin 1 (LT BLU)
   8 PARK_REF    ↔ old switch pin 2/4 (ORN) or 5 (BLK), per measurement
   9 HI_IND      → cluster high-beam indicator input
  10 DIM_SIG     ↔ old switch pin 10 (DK GRN)  ┐ panel-dimmer resistor emulation
  11 DIM_REF     ↔ old switch pin 2/4 or 5     ┘ (resistor inside the PDCC so it can be changed)
  12 spare

 Sense inputs to LCM (47k/10k divider, 10 nF, BAT54S clamp → GPIO): IGN_SW, HI_REQ, TURN_L, TURN_R,
   RLY_LO_L/R, RLY_HI_L/R (taken after F1–F4), MKR_BUS, AMB_PARK_L/R. Load < 0.3 mA each.

 J-HMI (DT 4-way): 1 +5V_HMI  2 GND  3 CANH  4 CANL (twisted). 120 Ω at the LCM and at the HMI.
 J-EMER (DT 4-way): 1 EMER_FEED  2 EMER_SW  3 S1 lamp +  4 GND.
```

## ESP32-S3 (LCM) pin budget

| Function | Count |
|---|---|
| PWM1–3, AUX_L, AUX_R | 5 |
| ALLOW_L/R, MCU_OK, DIAG_EN, DIAG_SEL, WD_KICK, WD_EN | 7 |
| ADC: IS ×4, VDECO, VCTRL, NTC_L, NTC_R, NTC_BOARD | 9 (ADC1) |
| Digital in: IGN_OK, HI_REQ, TURN_L/R, RLY ×4, MKR_BUS, AMB_PARK_L/R | 11 |
| CAN TX/RX | 2 |
| **Total** | **34** (fits ESP32-S3-WROOM-1, avoiding strapping/flash pins) |
