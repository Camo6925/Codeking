# 2001 Chevrolet S10 – Standalone Custom LED Headlight System

Engineering package, revision **A (preliminary)** — 2026-11-20.

Vehicle: 2001 Chevrolet S10 Extended Cab, 2WD, originally 2.2L automatic.

This folder is the working engineering record for the custom headlight assembly and its
standalone power/control system. It is organized in the deliverable order requested.

| # | Document | Status |
|---|----------|--------|
| 0 | [Component research & verification log](08-component-research.md) | Rev A – key parts verified, decorative LEDs open |
| 1 | [System architecture](01-system-architecture.md) | Rev A – architecture frozen pending open items O-1…O-4 |
| 2 | [Electrical schematic](02-electrical-schematic.md) | Rev A – preliminary, sheet-by-sheet |
| 3 | [Circuit schedules (fuses, wire, connectors, pinouts, relays, sensors)](03-circuit-schedules.md) | Rev A – provisional values flagged |
| 4 | [Bill of materials](04-bom.md) / [bom.csv](bom.csv) | Rev A – priced where verified |
| 5 | [Controller firmware architecture](05-firmware-architecture.md) | Rev A – architecture only, no code yet |
| 6 | [Assembly & installation plan](06-assembly-installation.md) | Rev A |
| 7 | [Validation & safety checklist](07-validation-checklist.md) | Rev A |
| — | [`tools/wire_calc.py`](../../tools/wire_calc.py) | Re-runs voltage-drop / fuse checks from measured loads |

## Verification legend (used in every document)

| Tag | Meaning |
|-----|---------|
| **[VERIFIED]** | Taken from manufacturer documentation (datasheet, manufacturer product page). |
| **[SECONDARY]** | From a retailer listing, press release or trade article. Confirm at purchase. |
| **[ESTIMATE]** | Engineering placeholder. Must be replaced by a measured or datasheet value before finalizing. |
| **[MEASURE]** | Must be physically measured on the truck or on the bench. |
| **[UNVERIFIED]** | Candidate part whose specifications could not be confirmed from a primary source. |
| **[PROVISIONAL]** | A sized value (fuse, wire, threshold) computed from estimates; re-run when inputs are known. |

## Established requirements (not up for re-decision)

1. Three logical PWM channels: CH1 honeycomb, CH2 white DRL strip, CH3 amber running.
2. Standalone battery-fed power with its own main fuse, branch fuses and dedicated returns.
3. Ignition RUN is an **enable signal only**, never the lighting power source.
4. Ignition OFF → lighting off immediately; controller stays powered 10 s, then a **hardware** timer removes power.
5. Amber turn signal overrides amber running brightness, at full legal intensity, independent L/R.
6. Low and high beam projectors both lit on high beam.
7. Essential headlights and turn signals work with the touchscreen and microcontrollers dead.

## Architecture in one paragraph

Projector headlights are switched by **plain plug-in relays** in a sealed fuse/relay module. Their
coils are driven by hardwired logic: ignition, the factory dimmer stalk, a guarded emergency switch.
No microcontroller is in that path. Decorative lighting (3 PWM channels × L/R = 6 outputs) is driven by
a custom **Lighting Control Module (LCM)** built around Infineon PROFET™+2 automotive smart high-side
switches, one channel per side per function, each with its own output fuse and current sense. The
**touchscreen (HMI)** is only a user interface: it talks to the LCM over CAN. If the HMI fails, the LCM
keeps running on its saved settings. If the LCM fails, decorative lighting defaults OFF and the
headlights are unaffected. The front amber **turn** function is powered directly by the factory
flasher circuit, so turn and hazard signals do not depend on any custom electronics.

## Open items that block finalization

| ID | Item | Why it matters | Resolve by |
|----|------|----------------|-----------|
| O-1 | 2001 S10 factory headlamp / DRL / auto-headlamp / park-lamp wiring diagram (GM service manual, ALLDATA or Mitchell) | Sets exactly where the factory-interface relays connect, which circuit carries the dimmer-stalk feed, and how to disable the series-high-beam DRL mode | Get the diagram; confirm with a meter |
| O-2 | What happens to the factory headlamp switch when the touchscreen takes its place | The switch also controls park/tail/marker/license lamps and instrument-panel dimming. These must keep working, and the switch is the manual fallback | **User decision** (see question Q1) |
| O-3 | Physical housing envelope (width × height × depth available behind the grille opening) | Decides whether two 90 mm modules fit side by side, or the compact Hella 60 mm modules are needed | **[MEASURE]** |
| O-4 | Decorative LED products (honeycomb, DRL strip, amber pods) | Their current, inrush and PWM compatibility set the LCM switch part, output fuses and 18 AWG branch sizing | Choose products, then bench-measure |
| O-5 | Battery terminal style (GM side-post expected) | A battery-post fuse block needs a top post; side-post needs a surface-mount fuse holder | **[MEASURE]** / look |
| O-6 | Which ignition circuit stays hot in CRANK | Decides whether headlamps blink during cranking | Meter check |
| O-7 | Factory flasher type and LED compatibility | The amber LED front turn lamps will change the factory flasher's load | Identify flasher; test |

## Questions for the owner (essential only)

* **Q1 – Factory headlamp switch fate.** Recommended: keep the factory switch working, relocated to a
  discreet spot (under the dash edge or in a console) using an extension harness. It is then the manual
  fallback and still drives tail lamps and panel dimming. The alternative is removing it entirely, which
  needs extra circuits to take over tail/park/panel-dimmer control.
* **Q2 – Daytime behavior.** Recommended for rev A: low beams ON whenever the ignition is in RUN (the
  simplest arrangement, legal in the US, and fail-safe). An "auto daytime-off" mode is provisioned in
  hardware as a fail-ON inhibit but not populated.
* **Q3 – Amber corner role.** Will the amber pods *replace* the factory front park/turn/side-marker
  lamps (which makes them legally required lamps), or *supplement* them?
