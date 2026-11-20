# Deliverable 7 – Validation & Safety Checklist (Rev D)

Record every result (value, date, initials). Any **FAIL** in a ★ item blocks road use.

Equipment: bench supply 0–30 V ≥ 10 A with current limit, DMM, DC clamp meter, oscilloscope with
current probe, thermocouple meter, IR thermometer, stopwatch, water spray bottle or hose.

## 7.1 Bench – LCM bare board

- [ ] Visual/AOI inspection; no solder bridges on the TSDSO-14 PROFETs.
- [ ] Powered at 13.5 V through a 0.5 A limit with IGN low: draw ≤ 100 µA (latch off). **Record.**
- [ ] ★ Reverse-polarity: apply −13.5 V to J1 for 60 s with current limit. No damage; no output activity.
- [ ] +3V3 and +5V_HMI within ±3 % at 6, 13.5 and 16 V input.
- [ ] Overvoltage: 24 V for 60 s (jump start) with no damage. Load-dump-type pulse **only** with
      proper test equipment; otherwise mark "not tested".

## 7.2 Bench – ignition & 10 s power-down ★

- [ ] IGN high → VCTRL up < 50 ms; MCU boots; decorative outputs stay at 0 V for ≥ 1 s (blanking).
- [ ] IGN low → every decorative output < 0.5 V within **10 ms** (scope; hardware gating).
- [ ] IGN low → VCTRL remains for **10 s ± 1 s** (adjust RT and record its final value), then
      collapses. Repeat 10× and at −20 °C / +70 °C if possible.
- [ ] IGN toggled off/on/off within 5 s: the hold restarts from the last off-edge (retriggerable).
- [ ] Settings changed 1 s before key-off are restored at next key-on (NVS save during hold).
- [ ] MCU held in reset (EN low) during key-off: power still removed at about 10 s (MCU not needed).
- [ ] Key-off current after timeout: **< 100 µA. Record.**

## 7.3 Bench – outputs, PWM, synchronization

- [ ] Each channel 0–100 % slider: L and R duty match on scope (same edge timing ± 5 µs).
- [ ] PWM frequency 250 Hz ± 5 %; minimum non-zero duty ≥ 5 % renders without flicker.
- [ ] Each output's current reading within ±15 % of a clamp meter at 100 % duty (record per channel).
- [ ] Watchdog: halt the MCU (debug break) → outputs off within the watchdog timeout; MCU resets.
- [ ] Removing the HMI or CAN cable → lighting unchanged; HMI shows "COMM LOST".

## 7.4 Bench – fault injection

- [ ] ★ Dead short on each decorative output: PROFET trips; the other 7 outputs unaffected; LCM
      reports the correct channel; no fuse damage beyond the faulted branch.
- [ ] Overload (2× nominal via resistor): firmware OVERCURRENT; fuse holds or clears per design.
- [ ] Open load on each output (duty ≥ 20 %): OPEN reported within 3 s; **no** OPEN report during
      key-on, soft-start or cranking simulation.
- [ ] NTC open and NTC short each give "SENSOR FAULT" plus a 50 % derate.
- [ ] Turn input steady high (failed flasher) → that side's running amber blanked.

## 7.5 Vehicle – stationary power-up

- [ ] Before connecting the battery: insulation check, every circuit to ground (DMM, > 1 MΩ, or
      megger at 50 V if available); no shorts at FM output.
- [ ] Connect the battery with a 1 A test lamp or meter in series first. Key-off draw = factory
      baseline + < 0.1 mA.
- [ ] Ignition RUN: low beams on (both), decorative ramps up, park/tail lamps on, HMI shows status.
- [ ] Ignition OFF: everything off immediately; controller off at about 10 s.

## 7.6 Cranking-voltage test ★

- [ ] Scope VBAT, VCTRL and one decorative output during 5 cold cranks.
- [ ] No MCU reset (or, if VBAT < 4.2 V, a clean recovery with no false faults logged).
- [ ] Decorative suspends below 9.0 V and re-ramps after crank. **No** flicker storms.
- [ ] Low beams: record whether they stay on in CRANK (depends on IGN circuit, O-6). Acceptable either way;
      must recover within 1 s after crank.

## 7.7 Turn signal & hazard ★

- [ ] Left turn: left amber flashes at full intensity; left running amber dark between flashes; right
      running amber unchanged.
- [ ] Right turn: mirror of the above.
- [ ] Hazards with ignition **off**: both front ambers flash (factory power only). Rear and dash
      indicators normal.
- [ ] Hazards with ignition on: both sides flash; both running ambers blanked.
- [ ] Flash rate 60–120 flashes per minute (count for 30 s). Within the factory-normal range; no hyperflash.
- [ ] With the LCM unplugged: turn and hazard still fully functional.
- [ ] Running amber on, no turn: rear turn bulb and dash arrow **dark** (no back-feed).

## 7.7a Switch-removal functions, turn module and interior ★

- [ ] Ignition RUN: rear tail and license lamps on (K7). Ignition OFF: off immediately.
- [ ] Hazards with the **key off**: both SS3 main beams flash (TIM on always-hot F10).
- [ ] Turn L/R with ignition on: that side's SS3 main flashes at full; its backlight stays off for the
      whole signaling period; the other side's backlight unchanged.
- [ ] Unplug T1/T2 (LCM off): turn and hazards still work.
- [ ] Factory turn circuit load: ≈1 mA per side (meter in series). Flash rate normal with the electronic flasher.
- [ ] Touchscreen high-beam icon follows stalk HIGH and flash-to-pass (D-6).
- [ ] Touchscreen interior AUTO / ON / OFF and the dash slider work. Key off: dome follows doors.
- [ ] Pull F6 with the ignition on: interior reverts to AUTO, dash to the default level.
- [ ] With the DRL fuse and factory headlamp relay removed, no factory module turns anything on in
      darkness (cover the ambient sensor).
- [ ] Key-off current of the whole lighting system after the 10 s timeout: < 100 µA (record).

## 7.8 Low/high beam function & thermal ★

- [ ] Stalk LOW → lows only; stalk HIGH → **lows + highs**; flash-to-pass works.
- [ ] Stalk LOW with engine running in daylight → highs **off** (confirms factory DRL disabled).
- [ ] Emergency switch S1 with K1 removed → lows on; highs via stalk.
- [ ] With K1 removed: S1 gives lows and rear park; stalk HIGH gives highs (stalk fed via S1).
- [ ] Remove one low-beam relay → other side stays lit; HMI shows a feed fault for the dark side.
- [ ] Thermal soak: closed housing, lows + highs + all decorative at 100 %, engine idling, hood
      closed, 30 min (and ideally 60 min in hot ambient). Record NTC and thermocouple readings. Must stay
      within the HELLA module and LED ratings with margin. Set firmware warn/derate/off thresholds
      from this data.

## 7.9 Waterproofing

- [ ] All DT connectors: cavity plugs fitted, wedgelocks seated, seals undamaged.
- [ ] RTMR: cover, cable seals and cavity plugs installed.
- [ ] Housings: 10-minute hose spray from all directions, then 30 min running. No water inside; no
      fogging after a cold-water spray on a hot lens (vent works).
- [ ] Re-inspect after the first week and after the first car wash.

## 7.10 Short-circuit & protection coordination ★

- [ ] Short each projector feed at the headlamp connector (through a test fuse holder): only F1–F4
      clears; FM intact; other projectors unaffected.
- [ ] Short IGN_SW: F7 clears; the emergency switch still provides low beams.
- [ ] Remove F5 (VDECO): decorative off and faulted; projectors unaffected.
- [ ] Remove F6 (CTRL): LCM and HMI off; projectors and turn signals unaffected.

## 7.11 Trail test & aiming ★

- [ ] Aim each low beam per the HELLA aiming instructions
      on a level surface at the specified distance, with the truck at normal load and tyre pressure.
- [ ] Aim each high beam per the HELLA instructions.
- [ ] Night test: cutoff sharp and level, no flicker visible in mirrors or
      on camera (PWM 250 Hz check), no EMI noise on the AM/FM radio.
- [ ] 2-week monitoring: review the fault log for intermittent faults.

## 7.12 Use note

Off-road vehicle (D-9). Road-lighting regulations were not used as design constraints, and this
assembly is not intended or certified for public-road use.
