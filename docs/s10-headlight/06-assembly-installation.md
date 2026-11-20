# Deliverable 6 – Assembly & Installation Plan (Rev E)

**Wire it in this order: screen → control module → standalone fuse box → headlight connectors.**
Each lamp pair has one control wire and one fuse. The fuse box splits each pair to the left and right
harnesses. Only the turn signals are per side.

> Prerequisites: open items O-1 (service manual wiring), O-3 (housing envelope), O-4 (decorative
> parts) and O-5 (battery type) are closed, and `tools/wire_calc.py` has been re-run with measured
> lengths and loads.
> **Disconnect the battery negative before any wiring work.**

## 6.1 Build sequence overview

1. Bench-build and bench-test the LCM (D7 §7.1–7.4) **before** it goes in the truck.
2. Build the headlamp housings and bench-test them on a current-limited supply.
3. Build harnesses on a layout board using measured lengths plus a 10 % service loop.
4. Install distribution (FM, RTMR, ground bus), then the harnesses, LCM and HMI.
5. Make the factory interface connections last, after the stand-alone system has been verified.
6. Run power-up, functional, fault and road validation (D7).

## 6.2 Wiring assembly

* Use **TXL** inside looms and GXL where abrasion is likely. Never use PVC "primary wire".
* Cut lengths from the measured routing plus a 10 % service loop at each connector.
* Each circuit has its own return conductor. Twist each feed with its return (about 20 twists/m) for
  the decorative and NTC pairs. This lowers EMI and keeps returns paired.
* Splices (only at the turn-sense taps): sealed crimp splice with adhesive-lined heat shrink, or
  solder + adhesive heat shrink with strain relief either side. No T-taps or scotch-locks.
* Label both ends of every wire with the circuit ID from D3 (heat-shrink labels).
* Loom: split convolute or braided PET sleeving, closed with tape or heat shrink at the ends. Secure
  every ≤ 300 mm with automotive cable ties or P-clips. Keep ≥ 150 mm from exhaust manifolds and add
  heat sleeve where closer.
* Firewall: use an existing grommet if it has room. Otherwise install a new rubber grommet or a DT
  bulkhead pass-through, sealed with polyurethane sealant. No bare holes.

## 6.3 Connector assembly (Deutsch DT)

1. Strip 6.3 mm (verify in the TE spec for the contact size). No nicked strands.
2. Crimp with the **HDT-48-00** using the correct contact for the gauge. Inspect: no strands outside
   the barrel, insulation stops at the inspection hole.
3. Pull-test each crimp (pull firmly by hand; use the TE spec force if a gauge is available).
4. Insert the contact from the rear until it clicks, then tug to confirm it's retained.
5. Insert the wedgelock. Fit cavity plugs in **every** unused position, or the seal is compromised.
6. Mate, confirm the latch click, and support the harness within 150 mm of the connector so vibration
   doesn't load the seal.
7. Check continuity against the D3 pinout table for every connector before first power.

## 6.3a Headlamp harness (one plug at each end)

**Lengths are set during the build:** route the harness on the truck, cut to fit plus a service loop,
then run `python3 tools/wire_calc.py --main <m> --left <m> --right <m> --trunk <m>`. If any line says
UPSIZE or FAIL, use the next heavier gauge for that conductor (for the VDECO/PGND trunk, move it to a
separate DTP 2-way with 12 AWG; see schematic sheet 7).

* Each headlamp harness is a single 12-conductor cable: a DT06-12S plug at the headlamp end and a
  DT06-12S plug at the **FRB** end (left key A, right key B). Wire it pin-for-pin per D3 §3.6.
* Route along the inner fender and radiator support in loom from the FRB to each headlamp. The headlamp
  harnesses stay entirely in the engine bay.
* Each headlamp pigtail ends in a DT04-12P (A or B), so the headlamp itself carries no fuses or
  electronics and unplugs as one unit.

## 6.4 Fuse distribution installation

* **FM:** Blue Sea 5191 MRBF terminal fuse block on the positive post's 3/8" stud with a 30 A MRBF fuse;
  10 AWG ring terminal on its M8 output stud; insulating cap fitted. (If the post has no stud, use a
  top-post terminal with a 3/8" stud.)
* **FRB (independent fuse/relay box):** sealed Eaton RTMR-family module on the inner fender or radiator
  support near the battery. Keep it away from exhaust heat, with cable entry facing **down**. Cover,
  cable seals and cavity plugs must all be installed for IP66. Inside or beside it: the coil diode board
  and the Turn Interface Module (TIM), both potted or conformal-coated in sealed housings.
* **LCM (separate module):** in the cab behind the kick panel or glovebox, in an IP54+ enclosure.
  Connected to the FRB by trunks T1/T2 through a sealed firewall grommet.
* Load relays K1–K5, K7, K8 and fuses per the D3 fuse schedule. Fit a printed fuse/relay map inside the cover.
* **Ground stud:** on the FRB, with one 10 AWG lead to the battery negative post. All headlamp returns
  and the LCM grounds (via T1) land here.
  Use a clean, unpainted mounting and coat finished terminals with corrosion inhibitor.

## 6.5 Grounding plan

```
 Battery − ──10 AWG── FRB GROUND STUD ─┬─ PRJ_RTN_L, PRJ_RTN_R (16 AWG, headlamp pin 3)
                                       ├─ DECO_RTN_L, DECO_RTN_R (14 AWG, headlamp pin 9)
                                       ├─ T1 PGND (14 AWG) ─ LCM PGND plane ─┐ joined once
                                       ├─ T1 LGND (18 AWG) ─ LCM LGND plane ─┘ on the LCM PCB
                                       └─ relay coil returns, TIM ground, T3 SIG_GND
 HMI ground → LCM via J-HMI only (avoids a ground loop through the dash).
```

* All PROFET current sensing is high-side, so the decorative returns go straight to the FRB stud.
* Do not use painted metal, mounting screws or the headlamp bucket as a return.

## 6.6 Housing wiring plan

* Inside each housing, every element has its own sealed internal plug so it stays replaceable: HELLA
  modules (their own connectors), two FlexLights, the SS3 (its integrated DT 3-pin into a DT06-3S), the
  NTC and the optional fan.
* One pigtail exits through a **sealed cable gland** (IP68) to the single DT04-12P headlamp connector,
  with 150–250 mm of pigtail.
* Mount the NTC on the inner housing wall in the hottest region next to the projector heat sinks. Bond
  it with thermally conductive epoxy.
* Fit a membrane vent at the highest point of the housing so condensation doesn't pump in.
* Keep wiring off the projector heat sinks and lens path, and give it ≥ 10 mm clearance from any
  surface above 85 °C. (The FlexLight is rated to 85 °C, so keep the strips away from the projector heat sinks.)
* Before closing the housing: run the 30-minute low+high thermal soak (D7 §7.8) with the housing
  closed and a thermocouple inside.

## 6.7 Controller wiring

* **LCM location:** behind the passenger kick panel or glovebox, in an IP65+ enclosure mounted
  vertically with connectors facing down, away from the HVAC blower outlet and heater core.
* Connector order: J1 power last on connection, first on disconnection.
* **HMI:** temporary mount for commissioning. The final mount in the headlamp-knob location is out of
  scope. The J5 run is twisted CAN plus 18 AWG 5 V/GND.
* **Factory interface:** do the five meter checks in [doc 09](09-factory-switch-integration.md) §5
  first, then build the pigtails per doc 09:
  1. Pull the DRL, HDLP PWR, LT HDLP, RT HDLP and F PRK fuses, and the factory headlamp relay.
  2. Fuse taps (1 A) in the underhood LT TURN and RT TURN fuses → FRB J-TURN (signal only, opto inputs).
  3. Fuse tap in IP fuse 11 → F0 1 A → T3-1 (K1 coil).
  4. Old headlamp-switch connector → mating pigtail → T3 (park signal) and control-module J-INT (dash
     dimmer only). Pins 7 and 9 (dome) are insulated, so the dome stays on door control.
  4a. Rear-status fuse taps (1 A) in LR PRK, RR PRK, STOPLP and B/U LP → fuse box J-REAR.
  5. Column-switch dimmer contacts → T3-3/T3-4 (stalk feed / HI request).
  6. Fit a load-independent electronic flasher (O-7).

## 6.8 Commissioning and testing

Follow [D7](07-validation-checklist.md) in order: bench → stationary vehicle → cranking → trail test.

## 6.9 Troubleshooting guide

| Symptom | Likely cause | Check |
|---|---|---|
| One low beam out (other lit) | Connector, side wire or module on that side (the pair fuse and relay are shared) | Measure pin 1 at that headlight connector with ignition on; check the split in the fuse box. (Swap test: K2↔K3 are identical relays). Measure headlamp connector pin 1 with ignition on. |
| Both low beams out, ignition on | **F1 or K2 (pair)**, or K1, F11, F0/IGN tap, coil diodes | Measure IGN_SW at RTMR. Use emergency switch S1 to get home. |
| High beam doesn't come on, low stays | HI_REQ missing (stalk re-pin, F13 stalk feed), or F2/K3 | Measure T3-4 with stalk HIGH; check F9. |
| High beams on in daytime with stalk in LOW | Factory DRL still active (series high-beam mode) | Repeat the DRL disable step and confirm with a meter. |
| Low beam turns off on high beam | Diode D3 open or missing | Measure the K2/K3 coils with stalk HIGH. |
| Turn signal hyperflash | Factory flasher now sees only opto load | Fit load-independent electronic flasher (O-7). |
| Rear turn bulb glows dimly with running amber on | Back-feed: missing/failed D31 (single-input pod) or dual-input pod internally linked | Check diode; measure pod input isolation. |
| Decorative all off, headlamps fine | IGN_OK/WDOK gating low, VDECO missing (F9/K4), control module fault | HMI fault page; measure VDECO at T1-1; watchdog reset counter. |
| One decorative pair off (both sides) | Control channel latched (short/OT) or pair fuse F3/F4/F5/F14 |
| One side of a pair off | That side's wire, connector pin or strip/pod (screen shows ONE SIDE OUT) | HMI shows the exact channel. Check fuse, connector pin, element. Re-cycle ignition to clear latch. |
| Screen blank, lighting normal | HMI power/CAN/HMI hardware | +5 V at J-HMI pin 1; CAN termination 60 Ω across H–L with power off. |
| Controller never powers off | Latch hold stuck (U15/U10), IGN_SW back-fed | Measure IGN_SW = 0 V with key off; measure V_CT decaying. |
| Battery drain | Latch stuck on, emergency switch left on, factory switch left on | Measure key-off current at the battery (target < 100 µA for this system alone). |
