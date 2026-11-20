# Deliverable 6 – Assembly & Installation Plan (Rev A)

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

## 6.4 Fuse distribution installation

* **FM:** mount within 300 mm of the battery positive. Side-post GM battery: surface-mount MRBF or
  sealed MIDI holder on a bracket, fed from a side-post auxiliary stud adapter [VERIFY O-5]. Top-post:
  Blue Sea 5191 on the terminal stud. Fit the insulating cap.
* **RTMR:** mount on the inner fender or radiator support away from direct heat and splash, cable
  entry facing **down**, fasteners per Eaton torque spec. Install the cover, cable seals and cavity
  plugs: IP66 depends on all three.
* Load relays K1–K8 and fuses per the D3 fuse schedule. Fit a printed fuse/relay map inside the cover.
* **Ground bus:** a sealed or covered stud terminal next to the RTMR, with one 10 AWG lead to the
  battery negative post. Clean, unpainted mounting. Coat finished terminals with corrosion inhibitor.

## 6.5 Grounding plan

```
 Battery − ──10 AWG── GROUND BUS ─┬─ LO_L_RTN, LO_R_RTN, HI_L_RTN, HI_R_RTN (16 AWG each)
                                  ├─ LCM PGND (14 AWG) ── LCM: PGND plane ─┐ single joining point
                                  ├─ LCM LGND (18 AWG) ── LCM: LGND plane ─┘ on the LCM PCB
                                  └─ K1–K8 coil returns, S1 lamp return
 Headlamp decorative returns → LCM PGND (not the ground bus), so the PROFET current sense sees the full loop.
 HMI ground → LCM via J5 only (avoids a ground loop through the dash).
```

* Do not use painted metal, mounting screws or the headlamp bucket as a return.
* Check the battery-to-engine and engine-to-body factory grounds while you're at it: clean and
  tighten. They carry the factory flasher return for the amber turn element.

## 6.6 Housing wiring plan

* Inside each housing, run every element to a **sealed internal junction**: either a small potted PCB
  carrying the amber diode-OR (option B) and the NTC, or individual sealed in-line connectors.
  Individual elements must stay replaceable.
* Pigtails exit through **sealed cable glands** (IP68) or a potted bulkhead to the DT4 and DT12
  connectors, with 150–250 mm of pigtail.
* Mount the NTC on the inner housing wall in the hottest region next to the projector heat sinks. Bond
  it with thermally conductive epoxy.
* Fit a membrane vent at the highest point of the housing so condensation doesn't pump in.
* Keep wiring off the projector heat sinks and lens path, and give it ≥ 10 mm clearance from any
  surface above 85 °C.
* Before closing the housing: run the 30-minute low+high thermal soak (D7 §7.8) with the housing
  closed and a thermocouple inside.

## 6.7 Controller wiring

* **LCM location:** behind the passenger kick panel or glovebox, in an IP65+ enclosure mounted
  vertically with connectors facing down, away from the HVAC blower outlet and heater core.
* Connector order: J1 power last on connection, first on disconnection.
* **HMI:** temporary mount for commissioning. The final mount in the headlamp-knob location is out of
  scope. The J5 run is twisted CAN plus 18 AWG 5 V/GND.
* **Factory interface** (follow the O-1 service manual pins; values below are the intent only):
  1. Remove the DRL fuse (or the procedure the service manual specifies) to disable series-high-beam
     DRL/automatic headlamps. **Confirm** the factory high-beam feed is now 0 V with the stalk in LOW,
     the headlamp switch ON and the engine running.
  2. Plug the 9006 and 9005 male pigtails into the LH factory headlamp sockets → LO_REQ / HI_REQ. Cap
     and stow the RH factory sockets (with a reversion pigtail in the glovebox).
  3. Wire K6/K7 contacts in parallel with the factory headlamp switch HEAD/PARK contacts at the
     switch connector (or the relocated switch's extension harness), using pigtails, not cuts.
  4. Tap ignition RUN with a fuse-tap (F0, 1 A) at the circuit identified in O-6.
  5. Intercept the front turn feeds at the factory front park/turn lamp connectors with pigtails →
     J-HL*-S pin 6, plus the LCM TURN sense splice.
  6. Fit an LED-compatible flasher if the flash rate changes (O-7).

## 6.8 Commissioning and testing

Follow [D7](07-validation-checklist.md) in order: bench → stationary vehicle → cranking → road.

## 6.9 Troubleshooting guide

| Symptom | Likely cause | Check |
|---|---|---|
| One low beam out | F1/F2 blown, K2/K3 failed, connector, or module | HMI shows "FEED FAULT"? Swap K2↔K3 (identical relays). Measure J-HL*-P pin 1 with ignition on. |
| Both low beams out, ignition on | K1 K-IGN, F7, F0/IGN tap, or the coil diode network | Measure IGN_SW at RTMR. Use emergency switch S1 to get home. |
| High beam doesn't come on, low stays | HI_REQ missing (DRL module still active? stalk? K6 not closing?) | Measure the 9005 pigtail with stalk HIGH. Check K6. |
| High beams on in daytime with stalk in LOW | Factory DRL still active (series high-beam mode) | Repeat the DRL disable step and confirm with a meter. |
| Low beam turns off on high beam | Diode D3 open or missing | Measure the K2/K3 coils with stalk HIGH. |
| Turn signal hyperflash | LED load on factory flasher | Fit LED-compatible flasher (O-7). |
| Rear turn bulb glows dimly with running amber on | Back-feed: missing/failed D31 (single-input pod) or dual-input pod internally linked | Check diode; measure pod input isolation. |
| Decorative all off, headlamps fine | IGN_OK/WDOK gating low, VDECO missing (F5/K8), LCM fault | HMI fault page; measure VDECO at J1-1; watchdog reset counter. |
| One decorative branch off | PROFET channel latched (short/OT), branch fuse F21–F28, open circuit | HMI shows the exact channel. Check fuse, connector pin, element. Re-cycle ignition to clear latch. |
| Screen blank, lighting normal | HMI power/CAN/HMI hardware | +5 V at J5 pin 1; CAN termination 60 Ω across H–L with power off. |
| Controller never powers off | Latch hold stuck (U15/U10), IGN_SW back-fed | Measure IGN_SW = 0 V with key off; measure V_CT decaying. |
| Battery drain | Latch stuck on, emergency switch left on, factory switch left on | Measure key-off current at the battery (target < 100 µA for this system alone). |
