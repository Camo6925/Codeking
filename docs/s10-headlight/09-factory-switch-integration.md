# Factory Headlamp Switch Removal & Vehicle Integration (Rev B)

Owner decision **D-1**: the factory headlamp switch is **removed**. The new system takes over every
function the switch performed. This document records what the switch does, what replaces each function,
and the meter procedure for confirming every wire on **your** truck before anything is connected.

## 1. What the 1998–2004 S10 headlamp switch actually is

On this generation the headlamp switch **does not carry lamp power**. It sends low-current signals to
the park-lamp relay, the headlamp relay, the instrument-panel dimming circuit and the body control
module (BCM). The DRL module (series-high-beam DRL plus automatic headlamps) also sits in this system.

Connector pinout, as reported by owners for a 2002 (same generation as the 2001). The colours match an
independent report of the 9 wires on a 1999 switch (turquoise/lt-blue, orange, white, orange, black,
blue-white, purple-white, purple, green). **[SECONDARY]**: confirm on your truck with the procedure in §4.

| Pin | Colour | Function (as reported) | Rev B disposition |
|---|---|---|---|
| 1 | LT BLU | Park lamp signal (commands factory park-lamp relay) | **Emulated** by K7 dry relay contact. Ignition RUN → factory park relay ON → rear tail, rear marker and license lamps on factory power and fuses |
| 2 | ORN | Battery supply voltage | Reference for K7 if the park signal is "switch-to-B+" type (§4); otherwise insulate |
| 3 | WHT | Headlamp relay coil supply | **Insulate.** Factory headlamp relay is never energized; remove the relay (§3) |
| 4 | ORN | Battery positive voltage | Insulate (or K7 reference, see pin 2) |
| 5 | BLK | Ground | Reference for K7 / dimmer emulation if those signals are "switch-to-ground" type |
| 6 | — | Not used | — |
| 7 | DK BLU/WHT | Courtesy lamp switch signal (knob "dome on") | Insulate. Dome lamps keep working from the door switches **[VERIFY]** |
| 8 | PPL/WHT | Headlamps OFF signal (auto-headlamp override) | Insulate. No effect once the DRL/auto-headlamp module is disabled **[VERIFY]** |
| 9 | PPL | Interior lamp defeat signal | Insulate. Interior lamps work normally with doors **[VERIFY]** |
| 10 | DK GRN | Instrument-panel lamps dimmer signal | **Emulated**: resistor network (Rev B), LCM-controlled (later rev). See §2.3 |

Do **not** cut the factory harness. Unplug the switch and plug a **mating pigtail** into the factory
connector. The pigtail lands on the new harness's vehicle-interface connector (J-VEH). Unused pins
are individually insulated inside the pigtail. Plugging the original switch back into the factory
connector returns the truck to stock.

## 2. How each switch function is replaced

| Factory function | Replacement | Depends on MCU? |
|---|---|---|
| Headlamps on | Low beams on whenever ignition is in RUN (owner decision D-2), via K1 → K2/K3 | No |
| High beam | Factory **dimmer stalk** contacts reused as a pure signal switch. Stalk fed from IGN_SW (F9), HI output drives K4/K5 (and K2/K3 stay on) | No |
| Flash-to-pass | Same stalk contacts. Works with the ignition on | No |
| High-beam indicator | HI_REQ → F15 1 A → cluster high-beam indicator input (pigtail at cluster connector) **[identify pin, §4]** | No |
| Park / tail / rear markers / license | K7 dry contact emulates switch pin 1 → factory park relay | No |
| Front park + front side marker | Now in the new headlamps: amber pod PARK input (CH3) and a marker element fed by K6 | Marker: no. Amber park: **fail-ON hardware**, see architecture §1.7 |
| Front turn | Factory flasher outputs (LF/RF) picked up **in the cab** and routed through the PDCC to each headlamp's single connector | No |
| Instrument-panel dimming | Resistor emulation of the dimmer signal (Rev B) | No |
| Dome override / interior defeat | Not replaced (doors still control the dome). Can be added as HMI buttons later | — |
| Auto headlamps / DRL | **Disabled** (DRL fuse and factory headlamp relay removed) | — |
| Headlamps-on chime | No longer triggers: lamps follow ignition, so they can't be left on | — |

### 2.1 Dimmer stalk as a signal switch

The multifunction-switch dimmer contacts are isolated from the factory headlamp circuit and used as a
dry contact.

* Unplug the multifunction (column) switch connector. Identify the dimmer **common**, **HI** and
  **flash-to-pass** contacts by continuity on the *switch side* while operating the stalk (§4.3).
* Re-pin those switch-side contacts through a pigtail to J-VEH: `STALK_FEED` (common) and `HI_REQ` (HI,
  plus flash-to-pass if it is a separate contact). The factory harness wires for those positions are
  insulated inside the pigtail. Turn-signal and wiper positions pass through unchanged.
* Contact load becomes about 0.4 A (two relay coils, two coils via diode to the low-beam relays, the
  cluster indicator). **[VERIFY]** this is within the switch contact rating. If in doubt, add a single
  interposing relay K-HIREQ.

### 2.2 Front turn signals

The old front park/turn lamps are removed (owner decision D-3). The new headlamp harness is a single
home run to the PDCC, so the front turn feeds are picked up **in the cab**:

* Identify the LF and RF front turn outputs at the turn-signal/multifunction connector or the
  under-dash harness (§4.4). GM front turn circuits are separate from the rear circuits on this era.
  **[VERIFY]** on your truck.
* Sealed splice (crimp + adhesive heat shrink) from each front turn wire → J-VEH `TURN_L` / `TURN_R`.
  Inside the PDCC each one goes to the headlamp connector pin 7 (amber TURN input) **and** the LCM
  high-impedance sense input.
* The original forward wiring to the removed front lamps becomes a dead end. Insulate and seal each
  abandoned connector at the front of the truck.
* The front lamp load changes from incandescent to LED, so fit an **LED-compatible flasher** if the
  flash rate changes (O-7).

### 2.3 Instrument-panel dimming

The DK GRN wire is a *dimmer signal*, not lamp current, so the switch contains a variable resistor or
similar that sets a level read by the BCM or cluster.

1. Measure the switch itself, unplugged: resistance between pin 10 and pins 2/4 and pin 5, at minimum,
   middle and maximum knob positions (§4.2).
2. Rev B: install a fixed resistor (E24 value nearest your preferred mid-brightness reading) between
   the same pins inside the J-VEH pigtail.
3. Later revision (optional): an LCM-controlled digital potentiometer so panel brightness is a
   touchscreen setting. This is a separate interior output, not one of the three headlight PWM channels.

## 3. Factory items removed or disabled

| Item | Action | Why |
|---|---|---|
| Factory headlamp switch | Unplugged and stored | Owner decision D-1 |
| DRL fuse | Removed **[identify fuse from the underhood/IP fuse label or service manual]** | Stops series-high-beam DRL and automatic headlamps |
| Factory headlamp relay | Removed | Nothing should energize the old headlamp circuit |
| Old headlamp 9005/9006 connectors, front park/turn/marker connectors | Insulated, sealed, tied back | Abandoned. The new headlamps use the new harness only |

Everything is reversible: reinstall the fuse, relay and switch.

## 4. Meter verification procedure (do this before building the J-VEH pigtail)

Tools: DMM, test light (LED type), back-probe pins, the switch removed from the dash.

### 4.1 Confirm pinout and wire colours
1. With the switch unplugged, record the colour in every cavity of the factory connector. Compare with
   the table in §1.
2. Ignition OFF: measure each cavity to ground. Expect battery voltage on the ORN wire(s) only.
3. Ignition RUN: re-measure. Note any cavity that changes.

### 4.2 Switch-side measurements (switch on the bench)
1. For each knob position (OFF / PARK / HEAD, and dome/defeat detents), record continuity between
   every pair of pins. This shows whether the park signal (pin 1) is switched **to B+ (pin 2/4)** or
   **to ground (pin 5)**. Wire the K7 contact across the same pair.
2. Dimmer: record resistance pin 10 ↔ 2/4 and pin 10 ↔ 5 at min / mid / max.

### 4.3 Multifunction (stalk) switch
1. Unplug the column switch connector. On the switch side, with the stalk in LOW, HIGH and pulled
   (flash-to-pass), find the contact pair that closes only in HIGH and FTP: that is common + HI.
2. Record the cavity numbers and colours of common, HI, FTP and both front turn outputs (they go live
   with the hazard switch on and the harness plugged back in).

### 4.4 Cluster high-beam indicator
1. With the factory system still intact (before removal), switch to HIGH and find the cluster connector
   cavity that goes to +12 V. That is the indicator input. Record cavity and colour.

### 4.5 Park relay test (after building the pigtail, before installing the PDCC)
1. Temporarily jumper the park signal pair (from 4.2). Confirm the rear tail, rear marker and license
   lamps come on, and the factory park fuse doesn't blow.
2. Measure the park circuit current with a clamp meter and record it in the D3 schedule.

Record all findings in the table below and commit it to this file.

| Item | Cavity | Colour | Measured | Date |
|---|---|---|---|---|
| Park signal pair | | | to B+ / to GND | |
| Dimmer emulation resistance | | | Ω (min/mid/max) | |
| Stalk common / HI / FTP | | | | |
| LF / RF front turn | | | | |
| Cluster HI indicator | | | | |
| IGN RUN tap (stays hot in CRANK?) | | | yes / no | |
| DRL fuse location | | | | |
| Factory park circuit current | | | A | |
