# Factory Headlamp Switch Removal & Vehicle Integration (Rev E)

Owner decisions: the factory headlamp switch is **removed** (D-1). Dash brightness is set from the
screen; the **interior/dome light keeps working from the doors** as factory (D-17). The high-beam dash indicator
is **not** required by the owner (D-6). The lighting system has its own independent fuse box, and
factory circuits supply **signals only** (D-12). Off-road vehicle (D-9).

Sources: owner forum reports and fuse-box documentation (all **[SECONDARY]**). Two independent reports
(1999 and 2002, same generation as the 2001) give the same switch wire colours. Every item still gets
one confirming meter check (§5) before the pigtails are built.

## 1. Factory headlamp switch connector (10-way, 9 wires used)

| Pin | Colour | Function (as reported) | Rev C disposition |
|---|---|---|---|
| 1 | LT BLU | Park lamp signal → factory park-lamp relay | **K7 dry contact** across pin 1 ↔ SW_REF while the ignition is on → rear tail, rear marker, license lamps (factory power) |
| 2 | ORN | Battery supply | SW_REF candidate (if signals switch to B+), else insulated |
| 3 | WHT | Headlamp relay coil supply | Insulated. Factory headlamp relay removed |
| 4 | ORN | Battery positive | Insulated |
| 5 | BLK | Ground | SW_REF candidate (if signals switch to ground) |
| 6 | — | Not used | — |
| 7 | DK BLU/WHT | Courtesy lamp switch signal (knob "dome ON") | Insulated. Dome works from the doors (D-17) |
| 8 | PPL/WHT | Headlamps OFF signal (auto-headlamp override) | Insulated |
| 9 | PPL | Interior lamp defeat signal | Insulated. Dome works from the doors (D-17) |
| 10 | DK GRN | Instrument-panel lamps dimmer signal | **Touchscreen: Dash brightness** via control-module photorelay-switched resistor ladder PR1–PR4 |

A **mating pigtail** plugs into the factory connector, so nothing is cut. Plugging the original switch
back in returns the truck to stock.

## 2. Interior light and dash brightness

* **Interior/dome light:** unchanged factory operation. The doors switch it through the BCM (fade,
  battery-saver included). The old switch's dome-ON (pin 7) and defeat (pin 9) wires are insulated
  inside the pigtail. This system never touches the dome circuit.
* **Dash brightness:** a screen slider. The control module switches a binary resistor ladder (PR1–PR4
  photorelays) between old-switch pin 10 (DK GRN) and its reference. That is electrically what the
  knob's dimmer did, so the BCM/cluster dims the panel exactly as before. With the module off (key off,
  or a fault) all photorelays are open, giving the default level chosen at build (§5.2).

## 3. Front turn signals (signal pickup only)

The 1999–2004 underhood fuse block has **separate front-turn fuses**: `LT TURN` (left front) and
`RT TURN` (right front), distinct from the rear `LT TRN` / `RT TRN`. **[SECONDARY, fuse-box.info]**

* Install an **add-a-circuit fuse tap** with a **1 A** fuse in each of `LT TURN` and `RT TURN`. The
  tap wire carries only the optocoupler input current (≈1 mA). It is a signal, not lamp power. Match
  the tap to the block's fuse type (mini vs ATO).
* The tap wires run a short distance to the FRB `J-TURN` connector → **Turn Interface Module**: an
  optocoupler (galvanic isolation) switches a smart high-side switch powered from fuse-box fuse F8
  (always hot), which drives the SS3 main beam through F6 (left) / F7 (right). A second opto channel gives the LCM
  an isolated turn status.
* Hazards work with the key off; turn timing stays under the factory flasher.
* The factory forward wires to the removed front lamps become dead ends: insulate and seal them.
* The factory flasher now sees almost no load, so a **load-independent electronic flasher** is
  required (O-7).

## 3a. Rear-light status pickup (D-16, read-only)

Fuse taps with **1 A** fuses in the factory underhood block feed high-impedance sense inputs (≈0.24 mA
each) through the fuse-box `J-REAR` connector to the control module:

| Factory fuse | Meaning | Screen |
|---|---|---|
| `LR PRK` | Left rear park/tail | Tail L |
| `RR PRK` | Right rear park/tail | Tail R |
| `STOPLP` | Stop lamps | Brake |
| `B/U LP` | Back-up lamps | Reverse |

The tails themselves are commanded by relay K5 (dry contact on old switch pin 1) whenever the
ignition is on, with no screen or controller involved.

## 4. Factory items removed or disabled (underhood fuse block unless noted)

| Fuse / item | Action | Why |
|---|---|---|
| `DRL` | Remove | Disables series-high-beam DRL and automatic headlamps |
| `HDLP PWR`, `LT HDLP`, `RT HDLP` | Remove | Old headlamp circuits are abandoned |
| `F PRK` (front parking lamp) | Remove | Factory front park lamps are removed; the SS3 backlight is driven by the LCM |
| `LR PRK`, `RR PRK`, `PARKLP` | **Keep** | Rear park/tail lamps, commanded by K7 |
| `LT TURN`, `RT TURN` | Keep, with 1 A fuse taps (§3) | Front turn **signal** pickup |
| Factory headlamp relay | Remove | Nothing should energize the old headlamp circuit |
| Headlamp switch | Unplug and store | Replaced by pigtail + touchscreen |
| High-beam dash indicator | Not connected (owner decision D-6) | The touchscreen shows a high-beam icon from HI_REQ |

**Ignition tap for K1 (IP fuse block):** use a fuse tap on IP fuse **11** "Cluster, Engine Control
Module" (an ignition-fed circuit). Alternative: fuse **15** "4WD switch, Engine controls". The tap
carries only the K1 coil (≈0.15 A, a signal-level enable) through F0 1 A; K1's contacts switch FRB power. Confirm in §5.1 that it stays hot in CRANK.

Interior-related IP fuses (all stay installed, untouched): **8** "Courtesy Lamps, Inadvertent Power Relay", **12**
"Interior Lights", **5** "Parking Lamps, … BCM, Ashtray Lamp". Leave all installed.

## 5. Remaining meter checks (only what research could not settle)

Tools: DMM, LED test light, back-probes; switch on the bench.

### 5.1 Ignition tap: 2 minutes
IP fuse 11 (then 15 if needed): probe the fuse's test points. OFF = 0 V; RUN = 12 V; **CRANK = must stay
12 V**. Record which fuse passes.

### 5.2 Headlamp switch on the bench: 10 minutes
1. Continuity, knob OFF → PARK: which pin does **1** connect to, **2/4 (B+)** or **5 (GND)**? That pin is
   SW_REF.
3. Dimmer: resistance **pin 10 ↔ SW_REF** at min, ¼, ½, ¾, max. These five numbers set the resistor
   ladder values and the default (all-open) level.

### 5.3 Dimmer stalk (multifunction switch) contacts: 10 minutes
Unplug the column switch connector. On the **switch side**, with the stalk in LOW, HIGH and pulled
(flash-to-pass), find the contact pair that is closed in HIGH and FTP only: common + HI. Record cavity
and colour. Also confirm the contact passes 0.5 A (put a 12 V / 21 W test bulb's worth of current
through it briefly, or use a clamp meter with the relays in place).

### 5.4 Front turn fuses: 2 minutes
Left signal on: the `LT TURN` fuse's load-side test point pulses 0/12 V. Repeat for right. Hazards:
both pulse.

### 5.5 Park relay command: 2 minutes (after the pigtail is built)
Jumper pin 1 ↔ SW_REF: rear tail/marker/license lamps on. Clamp-meter the park circuit current and
record it in D3.

### Results (fill in and commit)

| Check | Result | Date |
|---|---|---|
| IGN tap fuse (hot in CRANK) | 11 / 15 | |
| SW_REF | pin 2/4 (B+) / pin 5 (GND) | |
| Pin 7 & 9 switch to SW_REF | yes / no | |
| Dimmer R (min/¼/½/¾/max) | Ω | |
| Stalk common / HI cavities & colours | | |
| LT/RT TURN fuses pulse | yes / no | |
| Fuse type (mini/ATO) in underhood block | | |
| Rear park circuit current | A | |
