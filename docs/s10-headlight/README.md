# 2001 Chevrolet S10 – Standalone Custom LED Headlight System

Engineering package, revision **D (preliminary)** — 2026-11-20. **Off-road vehicle; not intended for road use.**

Vehicle: 2001 Chevrolet S10 Extended Cab, 2WD, originally 2.2L automatic.

| # | Document | Status |
|---|----------|--------|
| 0 | [Component research & verification log](08-component-research.md) | Key parts verified; decorative/amber products open |
| 1 | [System architecture](01-system-architecture.md) | **Rev D** |
| 2 | [Electrical schematic](02-electrical-schematic.md) | **Rev D**, preliminary |
| 3 | [Circuit schedules (fuses, wire, connectors, pinouts, relays, sensors)](03-circuit-schedules.md) | **Rev D**, provisional values flagged |
| 4 | [Bill of materials](04-bom.md) / [bom.csv](bom.csv) | Rev D |
| 5 | [Controller firmware architecture](05-firmware-architecture.md) | Rev D |
| 6 | [Assembly & installation plan](06-assembly-installation.md) | Rev D |
| 7 | [Validation & safety checklist](07-validation-checklist.md) | Rev D |
| 9 | [Factory headlamp switch removal & vehicle integration](09-factory-switch-integration.md) | Rev D |
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
7. Essential lighting works ## Owner decisions

| ID | Decision | Consequence |
|---|---|---|
| D-1 | Factory headlamp switch removed | System replaces park request, high-beam request (stalk), interior and dash dimming (doc 09) |
| D-2 | Low beams on whenever ignition is in RUN | No headlamp switch needed |
| D-4 | Passive headlamps, **one plug each**, home-run to the fuse box | Single 12-way DT per headlamp |
| D-5 | Top-post battery; lengths set during build | Blue Sea 5191 + 30 A MRBF on the post; `wire_calc.py` checks as-built lengths |
| D-6 | No high-beam dash indicator | Touchscreen icon only |
| D-7 | Interior lights and dash dimming via the touchscreen | LCM photorelays on the old switch lines; BCM door logic kept |
| **D-9** | **Off-road truck**: road-lighting regulations are not constraints | Fail-ON amber relay, brightness floor, SAE-certified lamp requirement and compliance checklist removed |
| **D-10** | No side markers | K6, F12/F13 and the marker lamps removed; headlamp pin 8 spare |
| **D-11** | Amber corner = **square pod** matching the other lights | **Diode Dynamics SS3** (amber, amber backlight): backlight = dimmable running light (CH3), main beam = turn signal. The pod gives main beam priority over backlight internally |
| **D-12** | **Independent fuse box**, as in the original power architecture | Standalone sealed Fuse/Relay Box (FRB) near the battery fuses **every** lamp branch, turn lamps included. LCM is a separate module in the cab. Factory circuits provide signals only (turn signals through optocouplers) |

Superseded: D-3 (amber lamps as legally required lamps, replaced by D-9/D-11) and D-8's lamp choices
(Truck-Lite 4050A/10250Y, replaced by the SS3; FlexLight retained).

## Architecture summary

```
BATTERY → 30 A MAIN FUSE (on post) → INDEPENDENT FUSE/RELAY BOX (FRB) → fused branches →
   ├─ each headlamp: one 12-way harness (low, high, honeycomb, DRL, amber run, amber turn, NTC, fan)
   ├─ LCM (cab): decorative PWM switching; outputs return through FRB branch fuses
   └─ TIM (in FRB): factory turn/hazard signal → optocoupler → smart switch → SS3 main beam
```

* **Headlights:** low and high beams are switched by plug-in relays with hardwired logic (ignition,
  stalk, emergency switch). No microcontroller is in the path.
* **Turn signals and hazards:** work with the key off. They are independent of the controller and
  powered from the FRB.
* **Decorative lighting:** honeycomb, DRL and amber running light are on three PWM channels with L/R
  synchronized, and fail OFF.
* **Touchscreen:** controls brightness, interior and dash lighting, and diagnostics over CAN. It is
  never in a lighting path.

## Open items

| ID | Item | Resolve by |
|----|------|-----------|
| O-1 | Five short meter checks | Doc 09 §5 |
| O-3 | Housing fit: two 90 mm projectors + SS3 (3.3" × 3.8" envelope per DD guide) + honeycomb + DRL | [MEASURE] |
| O-4 | Bench: FlexLight current + 250 Hz PWM; SS3 backlight PWM; SS3 pin 1/2 assignment | Bench |
| O-6 | IP fuse 11 hot in CRANK | Meter (doc 09 §5.1) |
| O-7 | Load-independent electronic flasher (factory flasher now sees only opto loads) | Identify and fit |
| O-9 | DT size-16 contact for 14 AWG | TE datasheet |
| O-10 | FRB RTMR configuration (≥ 22 fuses, ≥ 7 relays, room for TIM + diode board) | Eaton datasheet |
| O-11 | Confirm the SS3 matches your other pods (if they're a different brand or size, any square pod with a separate backlight wire drops in the same way) | Owner |
