# Deliverable 4 – Preliminary Bill of Materials (Rev E)

The machine-readable BOM is [`bom.csv`](bom.csv) (51 lines). Prices appear only where a real listing
was seen on 2026-11-20 ([SECONDARY]). Everything else is **TBD**; nothing has been estimated.

## Priced so far

| Item | Description | Qty | Unit | Extended | Source |
|---|---|---|---|---|---|
| 1 | HELLA L4060 low beam (012488121) | 2 | $298.57 | $597.14 | partshubdirect.com |
| 2 | HELLA L4060 high beam (011988031) | 2 | $215.45 | $430.90 | partshubdirect.com |
| 5 | Diode Dynamics FlexLight Cool White (honeycomb) | 2 | $39.96 | $79.92 | diodedynamics.com |
| 6 | Diode Dynamics FlexLight Cool White (DRL) | 2 | $39.96 | $79.92 | diodedynamics.com |
| 7 | Waveshare ESP32-S3-Touch-LCD-3.5 screen | 1 | $35.99 | $35.99 | Amazon |
| 9 | Blue Sea 5191 MRBF terminal block | 1 | $37.99 | $37.99 | currentconnected.com |
| 23 | TI LMR36015-Q1 buck | 2 | $4.10 | $8.20 | Digi-Key |
| | **Verified-price subtotal** | | | **$1,270.06** | |

The SS3 Sport amber pods (item 4) still need a price. The only SS3 price seen was the White **Pro**
pair at $399.95, which isn't the model specified.

## Groups

| Group | Items | Notes |
|---|---|---|
| Projectors | 1–3 | Confirm variant and mounting kit |
| Amber pod | 4 | SS3 Sport yellow with amber backlight |
| Decorative | 5–6 | FlexLight; current and PWM bench test pending |
| Screen | 7, 49 | Waveshare 3.5" + CAN transceiver breakout |
| **Standalone fuse box** | 8–14 | 16 fuses (one per pair + turn L/R + supplies), 6 relays |
| **Turn Interface Module (TIM)** | 15–18 | Opto inputs + dual PROFET; carry a spare |
| Control module | 19–33 | 2 dual smart switches = 3 pair channels + fan; dash-dimmer photorelays |
| Connectors | 34–39, 51 | DT family throughout |
| Vehicle interface | 40–41 | 7 fuse taps (turn + rear-light sense + ignition); electronic flasher |
| Wire, sensors, housing | 42–45 | |
| Optional | 46–49 | Projector current sense, fans, compact projectors, GPIO expander |
| Tooling | 50 | Plus open-barrel crimper, heat gun, DMM, clamp meter, scope, bench supply |

Removed in Rev D: Truck-Lite 4050A and 10250Y, the fail-ON amber relay with its driver and OR diodes,
the marker relay and fuses, and the combined PDCC enclosure.

Removed in Rev E: the 4.3" screen, per-side decorative channels (2 of 4 smart switches), the interior
photorelays, and 6 fuse positions.
