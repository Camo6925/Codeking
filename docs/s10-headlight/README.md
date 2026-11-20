# 2001 Chevrolet S10 – Standalone Custom LED Headlight System

Engineering package, revision **B (preliminary)** — 2026-11-20.

Vehicle: 2001 Chevrolet S10 Extended Cab, 2WD, originally 2.2L automatic.

| # | Document | Status |
|---|----------|--------|
| 0 | [Component research & verification log](08-component-research.md) | Key parts verified; decorative/amber products open |
| 1 | [System architecture](01-system-architecture.md) | **Rev B** |
| 2 | [Electrical schematic](02-electrical-schematic.md) | **Rev B**, preliminary |
| 3 | [Circuit schedules (fuses, wire, connectors, pinouts, relays, sensors)](03-circuit-schedules.md) | **Rev B**, provisional values flagged |
| 4 | [Bill of materials](04-bom.md) / [bom.csv](bom.csv) | Rev B |
| 5 | [Controller firmware architecture](05-firmware-architecture.md) | Rev B |
| 6 | [Assembly & installation plan](06-assembly-installation.md) | Rev B |
| 7 | [Validation & safety checklist](07-validation-checklist.md) | Rev B |
| 9 | [Factory headlamp switch removal & vehicle integration](09-factory-switch-integration.md) | **New in Rev B** |
| — | [`tools/wire_calc.py`](../../tools/wire_calc.py) | Verifies wire/fuse/voltage drop; exits non-zero on failure |

## Verification legend

| Tag | Meaning |
|-----|---------|
| **[VERIFIED]** | From manufacturer documentation. |
| **[SECONDARY]** | From a retailer listing, press release, trade article or owner forum. Confirm before relying on it. |
| **[ESTIMATE]** | Engineering placeholder; replace with a measured or datasheet value. |
| **[MEASURE]** | Must be physically measured. |
| **[UNVERIFIED]** | Candidate part whose specifications could not be confirmed from a primary source. |
| **(P) / [PROVISIONAL]** | Sized from estimates; re-run `tools/wire_calc.py` when the inputs are known. |

## Established requirements

1. Three logical PWM channels: CH1 honeycomb, CH2 white DRL strip, CH3 amber running.
2. Standalone battery-fed power with its own main fuse, branch fuses and dedicated returns.
3. Ignition RUN is an enable signal only.
4. Ignition OFF → lighting off immediately; controller held 10 s by a **hardware** timer, then unpowered.
5. Amber turn overrides amber running at full legal intensity, independent L/R.
6. Low and high projectors both lit on high beam.
7. Essential lighting works with the touchscreen and microcontrollers dead.

## Owner decisions (Rev B)

| ID | Decision | Consequence |
|---|---|---|
| **D-1** | Factory headlamp switch **removed** | New system replaces park/tail request, high-beam request (stalk), high-beam indicator and panel dimming. See doc 09 |
| **D-2** | Low beams **on whenever ignition is in RUN** | No headlamp switch needed; simplest fail-safe |
| **D-3** | Amber corner pods **replace** factory front park/turn/side-marker lamps | They are legally required lamps: SAE-certified dual-input park/turn plus side marker; amber park gets a **fail-ON** relay and a brightness floor |
| **D-4** | Each headlight is passive, with **one plug**, home-run to the custom fuse/control box; nothing is mounted on the lights | Single 12-way DT per headlight; all fuses, relays and electronics in one **PDCC** under the driver-side dash |

## Architecture summary

One box, the **Power Distribution & Control Center (PDCC)**, sits under the driver-side dash. It holds a
sealed 16-fuse/9-relay module and the Lighting Control Module PCB.

* **Main feed:** the battery feeds the box through a 30 A main fuse and 8 AWG wire.
* **Headlight harnesses:** each headlight connects through one 12-wire harness with a DT 12-way plug at
  each end.
* **Headlamps and markers:** low beams, high beams, front side markers and the rear park-lamp request
  are switched by relays driven by hardwired logic (ignition, the factory dimmer stalk, an emergency
  switch).
* **Decorative lighting:** honeycomb and DRL strip are driven by PROFET smart switches under ESP32-S3
  control, and fail OFF.
* **Amber parking lamp:** dimmable on CH3, and fails ON to full certified intensity through a hardware
  bypass relay.
* **Turn signals:** come from the factory flasher, picked up in the cab.
* **Touchscreen:** talks to the controller over CAN and is never in a lighting path.

## Open items

| ID | Item | Resolve by |
|----|------|-----------|
| O-1 | Confirm switch, stalk, cluster and front-turn wiring on **this** truck | Meter procedure in doc 09 §4 (switch pinout already found: [SECONDARY]) |
| O-3 | Housing envelope (two 90 mm modules + honeycomb + DRL + amber per side) | [MEASURE] |
| O-4 | Decorative products + **SAE-certified** amber park/turn pod and side marker | Select, then bench-measure |
| O-5 | Battery terminal style | Look |
| O-6 | Which ignition circuit stays hot in CRANK | Meter |
| O-7 | LED-compatible flasher | Identify factory flasher; test |
| O-8 | Harness lengths, battery → PDCC and PDCC → each headlamp | [MEASURE]; re-run tool |
| O-9 | DT size-16 contact for 14 AWG (DECO_RTN) | TE datasheet |
