# Component Research & Verification Log (Rev A)

Research date: 2026-11-20. Prices are what the listed source showed on that date. Re-check before
purchase. Nothing in this file is invented: where a value could not be found it is marked
**[MEASURE]**, **[UNVERIFIED]** or **TBD**.

---

## 1. Projector modules (critical decision #1)

### Selected for Rev A: HELLA 90 mm "L4060" LED modules — dedicated low and dedicated high

| Attribute | Low beam module | High beam module | Source / status |
|---|---|---|---|
| Manufacturer | HELLA | HELLA | — |
| Family | 90 mm Performance L4060 | 90 mm Performance L4060 | [VERIFIED] HELLA brochure / HELLA catalog |
| Example part numbers | 1BL 012 488-001 (low beam only); 012488121 (low + DRL + position, as listed by retailer) | 011988031 (high/driving + DRL + position, retailer); plain high-beam variant listed by several retailers | Catalog [VERIFIED] for -001; retailer numbers [SECONDARY]. **Confirm SAE/DOT-marked variant when ordering**: some numbers are ECE-only. |
| Approval | SAE/DOT and ECE | SAE/DOT and ECE | [SECONDARY] HELLA press release / retailer |
| System voltage | 12 V and 24 V systems | same | [SECONDARY] HELLA press release ("Rated for operation in 12V and 24V") |
| Operating voltage range | **TBD** — obtain HELLA technical data sheet | TBD | Must obtain |
| Power | max 20 W | **TBD** (assume 20 W until data sheet is obtained) | Low: [SECONDARY] HELLA press release "max. 20 watts". High: [ESTIMATE] |
| Driver / ballast | Integrated electronics, no external driver | Integrated | [SECONDARY] "integrated driver" |
| Dimming | **Not supported for PWM. Do not PWM.** Switch on/off only. | same | Rule 4 of the project |
| Inrush current | **[MEASURE]** with scope and current probe | [MEASURE] | Not published in sources found |
| Low + high at the same time | Yes. HELLA literature describes the high beam "supplemented by low beam during driving" | — | [VERIFIED] HELLA 90 mm brochure |
| Extra functions | Variants with built-in DRL + position light inputs (can be left unused, or used as a certified white DRL later) | Variants with DRL/position or with turn indicator | [VERIFIED] brochure |
| Life | "more than 15,000 operating hours" | same | [SECONDARY] retailer |
| Connector | **TBD** — check data sheet / module pigtail | TBD | — |
| Dimensions | 90 mm lens; full envelope in HELLA dimensional sketch (obtain) | same | Must obtain |
| Price | $298.57 (012488121, partshubdirect) | $215.45 (011988031, partshubdirect); $335.28 plain high beam (fiperformance) | [SECONDARY] |

**Why this choice:** It is the only commercially available option found that meets every projector
requirement at once: dedicated single-function low and high modules, SAE/DOT approval, the
manufacturer's own integrated driver, designed for low+high to run together, and published
manufacturer documentation.

**Risks:** cost (about $1,000–1,300 for four modules), and size (two 90 mm modules side by side per
headlight, see open item O-3).

**Compact alternative (if O-3 fails):** HELLA "Module 60 LED" family (60 mm). The brochure shows LED
low+high and LED high-beam variants carrying ECE/SAE marks. **[UNVERIFIED]** for exact SAE part number,
power and current. Obtain the data sheet before choosing it.

**Cost-down alternative, not recommended:** aftermarket bi-LED retrofit projectors (Morimoto etc.).
They are bi-function: a "high beam" unit also emits a low pattern, which breaks the
dedicated-low/dedicated-high requirement, and none found publishes a full electrical data sheet.
**[UNVERIFIED]**.

---

## 2. Touchscreen HMI (critical decision #2)

### Selected: Waveshare ESP32-S3-Touch-LCD-4.3B (SKU 27848; boxed version SKU 28141)

| Attribute | Value | Status |
|---|---|---|
| MCU | ESP32-S3 (WROOM-1-N16R8), dual-core LX7 240 MHz, 16 MB flash, 8 MB PSRAM | [VERIFIED] Waveshare docs |
| Display | 4.3", 800×480, 550 cd/m², 160° viewing angle | [VERIFIED] |
| Touch | Capacitive, 5-point, I²C | [VERIFIED] |
| Power input | USB-C 5 V **or** DC 7–36 V terminal | [VERIFIED] |
| Power consumption | 5 V, 450 mA | [VERIFIED] (Waveshare "Power Consumption 5V 450mA") |
| Interfaces | CAN (2.0), RS485, I²C, USB, TF card, isolated DI (5–36 V, optocoupler) and isolated DO (open-drain, 450 mA max) | [VERIFIED] |
| RTC | PCF85063 + CR927 holder | [VERIFIED] |
| IO expander | CH422G | [VERIFIED] |
| **Operating temperature** | **0 °C to 65 °C** | [VERIFIED] — **not automotive grade** |
| Dimensions | 112.4 × 75.1 mm (bare); 116.3 × 79 mm (cased) | [VERIFIED] |
| Price | TBD (check Waveshare / Amazon listing) | — |

**Why this choice:** It is a real 4.3" ESP32-S3 board that has a **CAN transceiver on board**, so it can
talk to the LCM over a robust automotive bus instead of fragile GPIO wiring, and it has wide-input power.

**Automotive caveats and how the design handles them:**
* 0–65 °C rating: a parked truck's cabin can exceed this. The HMI is **non-essential by design**. If it
  fails or overheats, lighting continues on the LCM's saved settings.
* Not designed for ISO 16750 / ISO 7637 transients: the HMI is fed a **regulated, protected 5 V** from
  the LCM (450 mA verified load), never raw vehicle 12 V.
* The N16R8 module's octal PSRAM has a reduced temperature rating per Espressif module documentation.
  **[VERIFY]** against the ESP32-S3-WROOM-1 datasheet. This is another reason the HMI is kept off the
  critical path.

---

## 3. Smart high-side switches for decorative outputs (critical decision #3)

### Selected family: Infineon PROFET™+2 12V (AEC-Q100 Grade 1, TSDSO-14)

Verified for **BTS7008-2EPA** (from Infineon datasheet):

| Parameter | Value | Status |
|---|---|---|
| Channels / R_DS(on) | 2 × 8 mΩ (16 mΩ max at T_J 150 °C) | [VERIFIED] |
| Nominal load current | 7.5 A per channel (T_A 85 °C) | [VERIFIED] |
| Operating voltage | 4.1 V min at switch-on; 3.1 V min during cranking; 28 V max | [VERIFIED] |
| Load dump | 35 V (suppressed, ISO 16750-2:2010, R_i = 2 Ω) | [VERIFIED] |
| Sleep current | 0.6 µA max (T_J ≤ 85 °C) | [VERIFIED] |
| Switching | t_ON typ 60 µs / max 110 µs; t_OFF typ 50 µs / max 100 µs; slew 0.6 V/µs typ | [VERIFIED] |
| Overload detection | 77–99 A at 25 °C (this is a short-circuit trip, **not** a wire-protecting fuse) | [VERIFIED] |
| Overtemperature | Shutdown at T_J(ABS) 150–200 °C or ΔT 80 K; auto-retry, then latches off after repeated retries | [VERIFIED] |
| Current sense | k_ILIS ≈ 5400–5450; accuracy ±13.5 % at 1 A, ±29.5 % at 250 mA, ±4 % at 5.5 A | [VERIFIED] |
| IS fault current | 4.4–10 mA | [VERIFIED] |
| Input threshold | 0.8–2.0 V (3.3 V logic compatible) | [VERIFIED] |
| Reverse battery | "ReverseON": outputs switched on in reverse polarity; current limited only by the load | [VERIFIED] |
| Open load | ON-state via current sense; OFF-state with external pull-up/pull-down | [VERIFIED] |

Family members (Infineon PROFET+2 FAQ, [VERIFIED]): BTS7008-2EPA (7–7.5 A dual), **BTS7120-2EPA
(2–2.5 A dual)**, **BTS7200-2EPC (1–1.5 A dual, "5 W, LED")**.

**Selection rule:** choose the family member whose nominal current best matches the *measured*
decorative load (open item O-4). For LED loads under about 1.5 A, BTS7200-2EPC or BTS7120-2EPA give far
better current-sense accuracy at low current than BTS7008-2EPA (which is only ±29.5 % at 250 mA). Lay
out the PCB for the shared TSDSO-14 package so the final part can be fitted late. **[VERIFY]**
pin-compatibility across the chosen members from their datasheets before ordering PCBs.

**Why PROFET instead of discrete MOSFETs:** a single AEC-Q100 part gives the high-side switch,
short-circuit trip, overtemperature shutdown, load-dump rating, cranking operation, current sense,
open-load detection and sub-µA sleep current. Building that from discrete MOSFETs means a gate driver,
shunt, amplifier, comparator and thermal sensing for every channel. That is more parts, more failure
modes and more cost.

**PWM frequency:** with t_ON + t_OFF up to about 210 µs, a 250 Hz PWM (4 ms period) keeps minimum
reliable duty near 5 %. 250 Hz is the default; it is configurable.

---

## 4. Power management ICs (LCM board)

| Function | Part | Key verified facts | Status / price |
|---|---|---|---|
| Reverse-battery ideal diode controller | TI **LM74700-Q1** | AEC-Q100; meets ISO 7637 transient requirements; reverse voltage to –65 V; datasheet includes TVS selection guidance for 12 V systems | [VERIFIED] TI datasheet; price TBD |
| 5 V buck for logic + HMI | TI **LMR36015-Q1** | 4.2–60 V input, 1.5 A, synchronous, designed for automotive | [VERIFIED] TI datasheet; $4.10 qty 1, Digi-Key (LMR36015AQRNXRQ1) [SECONDARY] |
| External watchdog | TI **TPS3431-Q1** | Automotive programmable watchdog with enable; –40 to +125 °C; I_DD 10 µA; 15 % timing accuracy over temp | [VERIFIED] TI datasheet; price TBD |
| 10 s shutdown comparator | TI **LM2903-Q1** (dual comparator) | Common automotive part | [UNVERIFIED in this session] — confirm datasheet |
| Logic gating (outputs off at IGN off / watchdog fault) | TI **SN74LVC08A-Q1** (quad AND) | Automotive logic | [UNVERIFIED in this session] — confirm datasheet |
| Input Schmitt buffer | TI **SN74LVC1G17-Q1** | — | [UNVERIFIED in this session] |
| CAN transceiver (LCM side) | TI **TCAN1042-Q1** or NXP **TJA1051** (automotive grade) | — | [UNVERIFIED in this session] |
| LCM MCU | Espressif **ESP32-S3-WROOM-1-N8** (no octal PSRAM) | Same toolchain as HMI; built-in TWAI (CAN) controller, LEDC/MCPWM PWM, ADC1 | [VERIFY] module temp grade. **Not AEC-Q100.** Acceptable only because no essential function depends on it. |
| Input TVS | Littelfuse **SM8S** series (e.g. SM8S24A) | Must clamp at or below 35 V at the design surge current (PROFET load-dump limit) and stand off a 24 V jump start | [UNVERIFIED] — select with LM74700-Q1 datasheet §10.1.1.3 method |

---

## 5. Distribution and protection hardware

| Item | Part | Verified facts | Status / price |
|---|---|---|---|
| Sealed fuse/relay module (under hood) | Eaton Bussmann **Series 15300 RTMR** (Rear Terminal Mini fuse & Relay) | IP66 with cover, cable seals and cavity plugs installed; mini (2.8 mm) blade fuses, relays and other plug-in components; input terminals up to 80 A per side; 30 A per output terminal | [VERIFIED] Eaton page; [SECONDARY] 80 A/30 A from reseller. 15305-1 (20-fuse base w/ cover) $37 at connectorconcepts [SECONDARY]. **Select the exact relay/fuse configuration from the Eaton datasheet: need ≥ 8 relay and ≥ 12 fuse positions.** |
| Main battery fuse (top-post battery) | Blue Sea **5191** MRBF terminal fuse block | 30–300 A, 58 V DC, mounts on 3/8" terminal stud, M8 output stud | [VERIFIED] Blue Sea; $37.99 currentconnected [SECONDARY] |
| Main battery fuse (side-post battery, expected on 2001 S10) | Blue Sea **5194/5196** MRBF surface-mount block, or a sealed MIDI/AMI bolt-down holder | — | [VERIFY] configuration; price TBD |
| Not chosen: Blue Sea 5026 ST Blade block | 12 circuits, 30 A/circuit, 100 A/block, 32 V DC | [VERIFIED] — **not sealed**; usable only inside the cab |

---

## 6. Connectors

| Item | Part | Notes | Status |
|---|---|---|---|
| Headlamp power (per side) | TE/Deutsch **DT** 4-way (DT04-4P / DT06-4S + wedgelocks) | Size 16 contacts, choose contact part number for wire gauge | Ratings **[VERIFY]** on TE DT datasheet (commonly published as 13 A per size-16 contact) |
| Headlamp signal/decorative (per side) | DT 12-way (DT04-12PA / DT06-12SA), keyed differently from the power plug | Same crimp tool as DT 4-way | [VERIFY] |
| LCM connectors | DT 12-way ×3 (A/B/C keying), DT 6-way, DT 4-way | — | [VERIFY] |
| Crimp tool | Deutsch HDT-48-00 (solid contacts, size 12–20) | — | [VERIFY] |

DT was chosen over DTM for every connector so one contact family, one crimp tool and one set of spares
cover the whole system, and the size-16 contacts take the 14–20 AWG range used here.

---

## 7. Sensors

| Sensor | Part | Status |
|---|---|---|
| Housing temperature (1 per headlamp) | 10 kΩ NTC, β≈3435–3950, epoxy or ring-lug sealed (e.g. TDK/EPCOS B57xxx family) | [UNVERIFIED] select exact part and β |
| Board temperature | 10 kΩ NTC on LCM PCB | — |
| Load current, decorative | PROFET IS pin (built in) | [VERIFIED] |
| Load current, projectors (optional, phase 2) | Shunt + TI INA180-Q1 / INA240-Q1 per branch | [UNVERIFIED] |
| Battery voltage | Resistor divider to ESP32 ADC | — |

---

## 8. Selected lamps (Rev C, owner decision D-8)

### 8.1 Amber corner pod: Truck-Lite 4050A
| Attribute | Value | Status |
|---|---|---|
| Description | Signal-Stat, LED, yellow round, 24 diode, Front/Park/Turn, 12 V, PL-3 | [VERIFIED] Truck-Lite product page |
| Inputs | PL-3 three-wire (ground, park, turn): separate park and turn inputs | [VERIFIED] product title (PL-3) |
| Current | Turn ("major") 0.38 A; park ("minor") 0.03 A | [SECONDARY] retailer spec |
| Size | 4.31" round, about 0.57" deep (retailer) | [SECONDARY]; confirm with sample |
| Mounting | Grommet mount (variants) | [SECONDARY] |
| SAE | Retailer lists "I6". **I6 is the SAE J1395 front-turn class for vehicles ≥ 2032 mm wide.** The S10 is narrower; its front turn class is J588. A J1395 lamp exceeds J588 minimum intensity, but confirm acceptability with your state inspection and check the lamp markings on the sample. | Compliance check |
| Price | TBD | — |
| Why | Real certified dual-function lamp with separate park/turn wires and published currents. Park at 0.03 A means PWM dimming draws almost nothing. | |

Note for design: at 0.03 A the PROFET current sense can't reliably detect an open park element. The LCM
therefore uses the amber node **voltage** sense to confirm the lamp is powered, and a bench "learn"
reading as a coarse open check.

### 8.2 Front side marker: Truck-Lite 10250Y
| Attribute | Value | Status |
|---|---|---|
| Description | 10 Series, LED, yellow round, 2 diode, marker/clearance, **P2**, Fit 'N Forget M/C, 12 V | [VERIFIED] Truck-Lite product page |
| Size | 2.54" (64.5 mm) round, 1.4" (35.6 mm) deep, grommet mount | [VERIFIED] |
| Current | Not published | **[MEASURE]** (budgeted 0.5 A, actual expected far lower) |
| Electronics | Sealed in epoxy | [VERIFIED] |

### 8.3 White DRL strip and honeycomb backlight: Diode Dynamics FlexLight, Cool White 6000K
| Attribute | Value | Status |
|---|---|---|
| Colour / length | Cool White 6000K; 50 cm listed (SKU DD0192P on the product page; confirm the SKU per length and colour) | [VERIFIED] Diode Dynamics page |
| Voltage | 9–16 V | [VERIFIED] |
| Protection | IP67 | [VERIFIED] |
| Operating temperature | −40 °C to 85 °C | [VERIFIED]. Sets the housing NTC cutoff ≤ 80 °C |
| Output | 200 lm (per strip as listed) | [VERIFIED] |
| Current | Not published | **[MEASURE]** (budgeted 1.5 A per branch) |
| Dimming | Listed as "dimmable" by a retailer | [SECONDARY]. **Bench-test 250 Hz PWM at 5–100 %** |
| Price | $39.96 sale / $49.95 regular | [SECONDARY] Diode Dynamics page |
| Why | Dotless diffused output suits a solid DRL bar and even backlighting behind the honeycomb. Automotive voltage range and temperature rating. One product for both functions means common spares. |

**Rejected:** Diode Dynamics HD LED Switchback strip (DD2116). It has an internal multi-function PWM
driver with low/high/turn modes, which conflicts with external PWM on the supply.

## 8a. Original acceptance criteria (still applied at bench test)

No candidate has been verified yet. **Acceptance criteria** for any honeycomb backlight, DRL strip or
amber pod:

1. Published (or bench-measured) current at 13.5 V and at 9–16 V.
2. **Dimmable by PWM of its supply input.** Resistor-limited constant-voltage 12 V LED strips dim
   cleanly. Modules with an internal switching driver often do **not** (flicker, dropout, inrush on every
   PWM edge). Bench test at 250 Hz, 5–100 % duty before accepting.
3. Inrush current per PWM edge measured; must stay within the PROFET channel rating.
4. Sealed (IP67 or better) or installed inside the sealed headlamp housing.
5. Amber pod (Rev B, D-3: replaces the factory front lamps): **must be an SAE-certified dual-function
   park/turn lamp with two separate inputs** (marked for J588 turn and J222 parking), plus a certified
   amber front side marker (integrated or separate). Single-input pods are no longer acceptable.
   Verify by measurement that the PARK and TURN inputs are isolated from each other.
6. Amber park input must tolerate PWM at 250 Hz (bench test). The firmware floor `AMB_MIN_DUTY` is set
   from a photometric check so the dimmed park lamp stays above the J222 minimum.
