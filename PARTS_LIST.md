# SVCP Dual-Display Build — Shopping List
### Raspberry Pi 5 | Custom Gauge Cluster + OpenAuto Pro (Android Auto) + Teensy CAN Offload + Amp Audio Output

---

## Core Compute
| Part | Notes | Est. Price |
|---|---|---|
| Raspberry Pi 5 (8GB) | Main compute for dual displays + Android Auto | $80 |
| Raspberry Pi 5 Active Cooler (official) | Required — sustained dual-display + video decode load | $5–10 |
| Raspberry Pi 5 27W USB-C PD Power Supply (official) | Do not substitute a generic supply | $12–15 |
| NVMe SSD, 256–500GB (e.g. WD Black SN770 / Crucial P3) | Faster I/O than microSD for logging + UI assets | $30–45 |
| NVMe M.2 HAT/Base (official Pi 5 M.2 HAT or Pimoroni NVMe Base) | PCIe 2.0 connection for above SSD | $12–30 |

---

## Displays
| Part | Notes | Est. Price |
|---|---|---|
| Display #1 — 7"–10" HDMI IPS panel | Dedicated gauge cluster screen | $60–120 |
| Display #2 — 7"–10" HDMI touchscreen | Android Auto + control screens | $70–150 |
| Micro-HDMI to HDMI cables (x2, short/right-angle) | Dash-mounting friendly | $10–15 |

---

## CAN Bus / Sensor Processing (Teensy Offload)
| Part | Notes | Est. Price |
|---|---|---|
| Teensy 4.0 (or 4.1 for extra I/O) | Pre-processes CAN/sensor data before sending to Pi | $23–30 |
| CAN Transceiver (SN65HVD230 or TJA1050 breakout) | Wired directly to Teensy's native onboard CAN controller — decided against the MCP2515 SPI module (Teensy 4.0/4.1 has CAN built into the chip, so a separate CAN controller module is unnecessary) | $3–8 |
| OBDII Connector/Breakout Cable | Clean tap into S10 data line | $10–20 |
| Additional analog sensors (oil pressure, coolant temp) — optional | Only needed if not pulling from PCM | $15–40 ea |

---

## Android Auto Audio Output
| Part | Notes | Est. Price |
|---|---|---|
| HiFiBerry DAC+ (or similar I2S DAC HAT) | Converts digital audio to clean line-level signal | $30–45 |
| RCA Output Cables (DAC → amp line-in) | Confirm amp has open RCA input, or add LOC if not | $10–15 |
| OpenAuto Pro License | One-time software cost, not hardware | ~$18 |

---

## Power & Reliability
| Part | Notes | Est. Price |
|---|---|---|
| Mausberry Circuit (or similar UPS/clean-shutdown controller) | Prevents SD/SSD corruption on power loss | $50–70 |
| Fused Power Distribution Block | Clean 12V taps to Pi PSU, DAC, Teensy | $15–25 |
| Inline Fuses (assorted, properly rated per circuit) | | $5–10 |

---

## Wiring, Mounting, Enclosure
| Part | Notes | Est. Price |
|---|---|---|
| Automotive-grade wiring loom (various gauges) | | $30–50 |
| Weatherproof connectors (Deutsch or similar) | | $20–40 |
| Enclosure/mounting bracket raw material | For your own fabrication | $20–40 |
| Ground distribution block | | $10–15 |

---

## Cost Summary

| Category | Low | High |
|---|---|---|
| Core Compute | $139 | $190 |
| Displays | $140 | $285 |
| CAN / Teensy | $51 | $98 |
| Audio (DAC + license) | $58 | $78 |
| Power / Reliability | $70 | $105 |
| Wiring / Mounting | $80 | $145 |
| **Grand Total** | **~$538** | **~$901** |

**Realistic mid-range build target: ~$650–750**

---

## Notes
- Amp, speakers, and sub are assumed already installed — this list only covers getting a clean digital-to-line-level signal out of the Pi to your existing amp.
- If your amp's RCA inputs are already occupied by a factory harness, you may need a line-output converter (LOC) or RCA input switcher — not included above, flag if needed.
- Programming/software setup (OpenAuto Pro config, gauge cluster app, Teensy firmware) is a separate effort not covered by this parts list.
