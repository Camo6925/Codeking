# Deliverable 4 – Preliminary Bill of Materials (Rev B)

The machine-readable BOM is [`bom.csv`](bom.csv) (47 lines). This page summarizes it.

**Pricing policy:** a price appears only when it was seen on a real listing on 2026-11-20 (tagged
[SECONDARY]). Everything else is **TBD**. No prices have been estimated or invented.

## Priced so far

| Item | Description | Qty | Unit | Extended | Source |
|---|---|---|---|---|---|
| 1 | HELLA L4060 90 mm LED low beam (012488121) | 2 | $298.57 | $597.14 | partshubdirect.com |
| 2 | HELLA L4060 90 mm LED high beam (011988031) | 2 | $215.45 | $430.90 | partshubdirect.com |
| 16 | TI LMR36015-Q1 buck | 2 | $4.10 | $8.20 | Digi-Key |
| | **Verified-price subtotal** | | | **$1,036.24** | |

Other reference prices seen: HELLA plain L4060 high beam $335.28 (fiperformance.com); Blue Sea 5191
MRBF block $37.99 (currentconnected.com, top-post only); Eaton RTMR 15305-1 20-fuse base with cover
$37 (connectorconcepts.com).

The projectors dominate the cost: about 98 % of the priced items. Every other required item is a
commodity automotive part, but it stays TBD until it has an exact part number.

## Required components by group

| Group | Items (bom.csv) | Status |
|---|---|---|
| Projectors | 1–3 | Family verified; **confirm SAE/DOT variant** and mounting kit |
| HMI | 4 | Specs verified; price TBD |
| Distribution & protection | 5–11 | RTMR configuration and side-post fuse holder TBD |
| Lighting Control Module (custom PCB, inside PDCC) | 12–25 | Key ICs verified; PROFET variant waits on O-4 |
| Connectors | 26–30 | DT family chosen; contact P/Ns per gauge |
| Wire & loom | 31–32 | Gauges provisional |
| Sensors | 33 | NTC part TBD |
| Decorative LEDs | 34–35 | **Open (O-4)** |
| Required amber lamps (park/turn pod, side marker) | 36, 43 | **Open (O-4)**. Must be SAE certified (D-3) |
| PDCC enclosure, amber OR diodes, fail-ON driver, dimmer resistor | 44–47 | Rev B additions |
| Vehicle interface | 37 | LED flasher **open (O-7)** |
| Housing | 38 | Vent part TBD |

## Optional upgrades (separate from required)

| Item | Description | When needed |
|---|---|---|
| 39 | Projector current sensing ×4 (shunt + INA180-Q1) | Phase 2: detects a failed projector module, not only a failed fuse or relay |
| 40 | Housing cooling fans on AUX channels | Only if the thermal test (D7 §7.8) shows the housing exceeds limits with low + high on |
| 41 | HELLA Module 60 LED (compact) | Only if the 90 mm modules don't fit (O-3) |

## Tooling (one-time)

| Item | Description |
|---|---|
| 42 | Deutsch HDT-48-00 solid-contact crimp tool |
| — | Open-barrel terminal crimper (for RTMR terminals, per Eaton spec) |
| — | Heat gun, adhesive-lined heat shrink |
| — | DC clamp meter, multimeter, oscilloscope with current probe (needed for inrush measurements) |
| — | Bench supply 0–30 V / ≥ 10 A with current limit (needed for validation) |
