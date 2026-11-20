# Deliverable 1 – System Architecture (Rev E)

Rev E owner decisions (see [README](README.md)):

* **D-13:** every lamp pair is grouped: **one control signal and one fuse per pair**, split to left and
  right after the fuse. Only the turn signals are per side.
* **D-14:** the system is wired and documented as a chain: **3.5" control screen → control portion →
  standalone fuse box → one connector per headlight.**
* **D-15:** 3.5" control screen (Waveshare ESP32-S3-Touch-LCD-3.5).
* **D-16:** the system makes sure the **rear lights** work with the headlights, and the screen shows
  their status.
* **D-17:** the **interior light works by the doors**, as factory.

Still in force: off-road use (D-9), no side markers (D-10), SS3 square amber pod (D-11), independent
fuse box (D-12), factory headlamp switch removed (D-1), lows on with the ignition (D-2).

## 1.1 The chain (how to read and wire the system)

```
 ┌──────────────────┐   CAN + 5 V    ┌──────────────────────┐  3 pair outputs ┌───────────────────────────┐
 │ 3.5" CONTROL     │ ─────────────► │ CONTROL MODULE       │ ──────────────► │ STANDALONE FUSE BOX       │
 │ SCREEN (dash)    │                │ (behind dash)        │  (honeycomb,    │ (under hood, at battery)  │
 │ brightness,      │ ◄───────────── │ 3 PWM pair channels  │   DRL, amber    │ one fuse per pair         │
 │ status, rear-    │  status/faults │ settings memory      │   run)          │ relays: low pair, high    │
 │ light status,    │                │ 10 s hardware latch  │                 │ pair, ign, decorative     │
 │ dash brightness  │                │ watchdog             │ ◄────────────── │ supply, tail lamps        │
 └──────────────────┘                └──────────────────────┘  power feed +   │ Turn Interface Module     │
                                                               sense lines    └──────┬─────────────┬──────┘
                                                                                     │ split L / R │
                                                                                     ▼             ▼
                                                                         LEFT HEADLIGHT       RIGHT HEADLIGHT
                                                                         one 12-way plug      one 12-way plug
                                                                         low · high ·         low · high ·
                                                                         honeycomb · DRL ·    honeycomb · DRL ·
                                                                         SS3 amber pod        SS3 amber pod
```

**Power source (one sentence):** battery → 30 A main fuse on the post → standalone fuse box. The fuse
box powers every lamp and also sends one fused feed back to the control module so it can drive the
three pair outputs.

## 1.2 Per-headlight content and control grouping

| Function | Lamp in each headlight | Control signal | Fuse | Switched by |
|---|---|---|---|---|
| Low beam | HELLA L4060 low | **Pair**: ignition RUN | 1 for both | Relay K2 (both sides) |
| High beam | HELLA L4060 high | **Pair**: stalk HIGH / flash-to-pass | 1 for both | Relay K3 (both sides) |
| Honeycomb | FlexLight behind honeycomb | **Pair**: PWM CH1 | 1 for both | Control module, one channel |
| DRL strip | FlexLight | **Pair**: PWM CH2 | 1 for both | Control module, one channel |
| Amber running | SS3 backlight | **Pair**: PWM CH3 | 1 for both | Control module, one channel |
| Amber turn | SS3 main beam | **Per side**: factory turn signal L / R | 1 per side | Turn Interface Module |

Left and right brightness are identical by construction: each pair is one wire, one fuse, one
switch, split in the fuse box.

**Trade-off of pairing:** one fuse or relay failure darkens that function on both sides. That includes
both low beams through K2/F1. Mitigation: plug-in relay and fuses, carry spares, and the HMI names the
failed pair.

## 1.3 Criticality

| Tier | Functions | Hardware | Controller/screen failure |
|---|---|---|---|
| T1 Essential | Low pair, high pair, turn/hazard, tail lamps | Relays + Turn Interface Module, **no microcontroller** | Unaffected |
| T2 Decorative | Honeycomb, DRL, amber running | Control module PWM | Off |
| T3 Screen | Settings, status, rear-light display, dash brightness | 3.5" screen | Lighting unaffected (control module keeps saved levels) |

## 1.4 Fuse box (16 positions: the owner's original idea now fits)

| Fuse | Circuit | Rating (P) |
|---|---|---|
| F1 | Low beam pair (via K2) | 7.5 A |
| F2 | High beam pair (via K3) | 7.5 A |
| F3 | Honeycomb pair (from control CH1) | 3 A |
| F4 | DRL pair (from control CH2) | 3 A |
| F5 | Amber running pair (from control CH3) | 1 A |
| F6 | Turn left (Turn Interface Module) | 3 A |
| F7 | Turn right (Turn Interface Module) | 3 A |
| F8 | Turn Interface Module supply (always hot) | 5 A |
| F9 | Control module decorative supply (via K4) | 7.5 A |
| F10 | Control module logic / latch (always hot) | 3 A |
| F11 | Ignition bus (via K1) | 5 A |
| F12 | Emergency headlamp switch | 5 A |
| F13 | Stalk feed | 2 A |
| F14 | Fan pair (optional, from control AUX) | 3 A |
| F15–F16 | Spare | — |

Relays: **K1** ignition, **K2** low pair, **K3** high pair, **K4** decorative supply, **K5** tail
lamps (park request), plus 1 spare.

## 1.5 Rear lights (D-16)

| Rear function | Who switches it | How the system ensures it |
|---|---|---|
| Tail / rear marker / license | Factory park relay on factory fuses | **K5** (hardware, ignition) commands it whenever the headlights are on. Screen shows L/R tail status (sense on factory `LR PRK` / `RR PRK` fuses) and flags "TAIL LIGHTS NOT ON" |
| Brake | Factory | Screen shows brake status (sense on factory `STOPLP` fuse) |
| Reverse | Factory | Screen shows reverse status (sense on factory `B/U LP` fuse) |
| Rear turn / hazard | Factory flasher | Same signal the front turn module uses. Screen shows the arrows |

All rear sensing is high-impedance and read-only (≈0.24 mA per input via 1 A fuse taps). The screen
can't switch rear lights off; the tails follow the headlights by hardware.

## 1.6 Hardware logic (no microcontroller)

| Relay / module | Driven by | Effect |
|---|---|---|
| K1 | Factory ignition RUN (IP fuse 11 tap) | Ignition bus |
| K2 low pair | Ignition bus · HI request · emergency (diode-OR) | Lows on with ignition, stay on in high beam |
| K3 high pair | Stalk HIGH / flash-to-pass | Highs |
| K4 | Ignition bus | Decorative supply to the control module |
| K5 | Ignition bus · emergency | Tail lamps via factory park relay |
| Turn Interface Module | Factory turn signal → optocoupler | SS3 main beam per side, always-hot supply (hazards work key-off) |

The SS3 gives its main beam priority over the backlight internally, so a turn flash always overrides
the amber running light without a separate per-pod signal.

## 1.7 Ignition behaviour

* **ON:** lows, tail lamps and decorative supply energize immediately (relays). The control module
  boots, restores saved pair levels, and ramps in 500 ms.
* **OFF:** relays drop and every lamp goes off at once. Hazards still work. The control module saves
  and holds for 10 s on its hardware latch, then powers off with the screen.
* **Key-off drain:** target < 100 µA **[MEASURE]**.

## 1.8 Interior and dash (D-17)

* **Interior/dome light:** factory door operation through the BCM. The old switch's dome-ON and
  interior-defeat wires are simply insulated. Nothing in this system touches the dome circuit.
* **Dash brightness:** set on the screen. The control module switches a resistor ladder on the old
  switch's dimmer wire.

## 1.9 Fail-safe summary

| Fault | Lows | Highs | Turn/hazard | Tails | Decorative |
|---|---|---|---|---|---|
| Screen dead | ✔ | ✔ | ✔ | ✔ | ✔ saved levels |
| Control module dead | ✔ | ✔ | ✔ | ✔ | off |
| K1 / ignition tap | emergency switch | ✔ (via emergency) | ✔ | ✔ (via emergency) | off |
| K2 or F1 | **both lows off**: swap relay/fuse | ✔ | ✔ | ✔ | ✔ |
| Turn module | ✔ | ✔ | front ✘ (rear factory ✔) | ✔ | ✔ |
