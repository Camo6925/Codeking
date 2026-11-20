# Deliverable 5 – Controller Firmware Architecture (Rev D)

Architecture only. Implementation starts after the schematic is captured and decorative loads are
known.

## 5.1 Ground rules

1. **Firmware never replaces hardware protection.** Ignition-off cutoff, watchdog cutoff, the 10 s
   power-down, short-circuit/overtemperature protection (PROFET) and wire protection (fuses) all work
   with the MCU halted. Firmware adds brightness control, diagnostics, derating and messages.
2. **Firmware has no authority over the projectors or turn signals.** The LCM only *observes* them.
3. **Fail OFF.** Every PROFET output has a hardware pull-down and is ANDed with `IGN_OK · WDOK`. A
   crash, reset or brownout turns all three channels (honeycomb, DRL strip, amber running backlight)
   off. Turn signals are on the separate, MCU-free Turn Interface Module in the fuse box. The LCM only
   observes them (isolated `TURN_x_SNS`).
4. **Single source of truth.** The LCM owns the settings and stores them in its NVS. The HMI only
   displays them and requests changes, so losing the HMI never changes lighting behavior.

## 5.2 Platform

| | LCM | HMI |
|---|---|---|
| Hardware | ESP32-S3-WROOM-1-N8 on custom PCB | Waveshare ESP32-S3-Touch-LCD-4.3B |
| Framework | ESP-IDF (FreeRTOS) | ESP-IDF + LVGL (Waveshare provides ESP-IDF/LVGL examples) |
| Radios | Wi-Fi/BT **disabled** (frees ADC2, lowers EMI and attack surface) | Disabled in production; optional BLE for service later |
| Storage | NVS (wear-levelled, power-fail-safe commits) | None required (it may cache UI state) |
| Watchdogs | ESP-IDF task WDT + interrupt WDT + **external TPS3431-Q1** | ESP-IDF task WDT |

## 5.3 LCM task structure

| Task | Rate | Priority | Responsibility |
|---|---|---|---|
| `io_task` | 1 kHz tick | High | Debounce digital inputs (IGN_OK, TURN_L/R, LO/HI/PARK_REQ, RLY ×4); timestamp turn edges |
| `pwm_task` | 100 Hz | High | Compute duty per channel (setpoint × gamma × derate × ramp); apply per-side turn blanking (`ALLOW_L/R`); drive LEDC |
| `diag_task` | 50 Hz | Medium | Read ADC (IS ×4, voltages, NTCs); estimate currents; run fault state machines |
| `power_task` | event + 10 Hz | High | Ignition state machine, cranking suspend, shutdown/save sequence |
| `can_task` | event + 10 Hz TX | Medium | Status broadcast, command reception, HMI heartbeat supervision |
| `storage_task` | on demand | Low | Debounced NVS commits (2 s after the last change), and an immediate commit at shutdown |
| `interior_task` | event | Low | Interior mode (AUTO/ON/OFF → PR1/PR2, never both closed) and dash level (→ PR3–PR6 code). Restores saved values at INIT. Opens all photorelays in SHUTDOWN. |
| `wd_task` | 4 Hz | Highest | Kick TPS3431-Q1 **only if** every other task has checked in during this window (supervised kick) |

## 5.4 LCM state machine

```
           power applied (latch on)
                  │
              ┌───▼───┐  outputs held off by hardware pull-downs
              │ BOOT  │  self-test: ADC sanity, NVS load (defaults if CRC bad), CAN init
              └───┬───┘
                  │ IGN_OK high
              ┌───▼────┐ 1.0 s blanking (no fault evaluation); enable watchdog
              │ INIT   │
              └───┬────┘
              ┌───▼────────┐ 500 ms linear ramp 0 → setpoint (avoids an inrush step on every channel)
              │ SOFT_START │
              └───┬────────┘
              ┌───▼───┐◄──────── VBAT recovers > 10.5 V for 500 ms (re-ramp)
              │  RUN  │──────────► CRANK_SUSPEND (VBAT < 9.0 V for > 200 ms: duty 0, fault eval paused)
              └───┬───┘
                  │ IGN_OK falls (GPIO ISR; hardware has ALREADY cut outputs)
              ┌───▼──────┐ duty := 0; commit NVS if dirty; CAN LCM_SHUTDOWN; stop diag
              │ SHUTDOWN │ idle and wait. The hardware latch removes power at about 10 s.
              └───┬──────┘ If IGN_OK returns before power-off → INIT (warm restart)
                  ▼
               (power off)
```

## 5.5 PWM output management

* LEDC, **250 Hz**, 13-bit resolution, one timer shared by all three logical channels. Left and right
  are electrically the same signal (split after the AND gate), so they are synchronized.
* User brightness 0–100 % → perceptual curve `duty = (b/100)^2.2`. Duties above 0 and below
  `DUTY_MIN` (5 %, from PROFET t_ON/t_OFF ≈ 210 µs worst case) are raised to `DUTY_MIN`.
* CH3 drives the SS3 **backlight** (0.03 A). Full 0–100 % range including OFF (off-road, D-9). Bench-check
  that the backlight dims cleanly at 250 Hz. If it doesn't, lower `pwm_hz` for CH3 only (separate LEDC
  timer) or use on/off.
* Thermal derate: `derate = 1.0` below the warning temperature, falling linearly to 0.5 at the derate
  temperature, and 0 (off) at the cutoff temperature. Thresholds live in config and are set from the
  component ratings.
* Turn blanking: per §1.7 of the architecture. `ALLOW_side` goes low while `turn_active[side]`, and
  hazards blank both sides.

## 5.6 Settings storage (NVS)

```c
struct settings_v1 {
    uint16_t magic, version;
    uint8_t  bright_ch1, bright_ch2, bright_ch3;   // 0–100 %
    uint16_t pwm_hz;                                // default 250
    uint16_t learned_ma[8];                         // per-output nominal current at 100 %
    uint8_t  interior_mode;                         // 0 AUTO, 1 ON, 2 OFF (defeat)
    uint8_t  dash_level;                            // 0..15 → dimmer ladder code (table from doc 09 §5.2)
    int16_t  t_warn_c, t_derate_c, t_off_c;
    uint32_t crc32;
};
```

* Commit 2 s after the last change (limits flash wear while a slider is being dragged), and
  immediately in SHUTDOWN.
* Fault log: ring buffer of 64 entries {timestamp_ign_cycles, code, channel, value}, committed at
  shutdown.

## 5.7 Diagnostics and fault logic

Current estimate per output: `I_on = V_IS_avg / R_SENSE × k_ILIS / duty`. The IS line's RC filter
(τ ≈ 22 ms) averages the 250 Hz PWM, and `DSEL` alternates the channel read on each IC every 100 ms.

| Fault | Condition (all thresholds provisional) | Persistence | Action | HMI message |
|---|---|---|---|---|
| OPEN | duty ≥ 20 % and I_on < 0.5 × learned | 2 s | Flag only (output stays commanded) | "LEFT DRL OPEN CIRCUIT" |
| OVERCURRENT | I_on > 1.5 × learned or > abs limit | 200 ms | Channel off; retry once after 5 s; then latch until next ignition cycle | "RIGHT HONEYCOMB OVERCURRENT" |
| SHORT / OT | IS at fault level (≥ 4.4 mA class) | 3 consecutive samples | Channel off; latch until next ignition cycle | "LEFT AMBER SHORT/OVERTEMP" |
| PROJ FEED | request active and RLY sense low | 300 ms | Flag | "LEFT LOW BEAM: FUSE F1 / RELAY K2" |
| RELAY STUCK | request inactive and RLY sense high | 1 s | Flag | "RIGHT HIGH BEAM RELAY STUCK ON" |
| HOUSING HOT | NTC > warn / derate / off | 5 s | Derate or turn decorative off (never projectors) | "LEFT HOUSING 82 °C – DECORATIVE REDUCED" |
| NTC FAULT | NTC open or short (ADC rail) | 2 s | Assume hot → derate 50 % | "LEFT TEMP SENSOR FAULT" |
| UNDERVOLT | VBAT < 11.0 V (engine running) | 10 s | Warning | "LOW SYSTEM VOLTAGE 10.8 V" |
| OVERVOLT | VBAT > 16.0 V | 1 s | Warning; > 18 V decorative off | "HIGH SYSTEM VOLTAGE" |
| TURN LAMP CHECK | `TURN_x_SNS` active but no amber turn current is seen (optional: TIM IS line to LCM spare ADC) | 3 flashes | Warning | "LEFT TURN LAMP – CHECK F17 / TIM" |
| HMI LOST | no HMI heartbeat | 3 s | Log only; lighting unchanged | (HMI side: "CONTROLLER COMM LOST") |
| WDT RESET | reset reason = watchdog | at boot | Log; increment counter; ≥ 3 in one cycle → decorative disabled for this cycle | "CONTROLLER RESET – DECORATIVE DISABLED" |

**Avoiding false alarms from normal behavior:**

* No fault evaluation during the 1 s INIT blanking, the 500 ms soft-start, 200 ms after any duty change,
  during CRANK_SUSPEND, or while VBAT < 10.5 V.
* OPEN is checked only at duty ≥ 20 %, where IS accuracy is meaningful.
* Thresholds are **relative to a learned baseline**: a service screen "Learn loads" runs each output at
  100 % for 3 s with the engine running and stores `learned_ma`. Until learned, only absolute limits
  apply.
* Every fault needs persistence (consecutive samples), and latching faults clear only at the next
  ignition cycle.
* Projector feed faults are checked only when the matching request has been stable for > 300 ms
  (allows for relay operate and bounce time).

## 5.8 CAN protocol (LCM ↔ HMI), 500 kbit/s, 11-bit IDs

| ID | Dir | Rate | Payload |
|---|---|---|---|
| 0x300 `LCM_STATUS` | LCM→HMI | 10 Hz | state, IGN, LO/HI/PARK req, relay sense bits, turn L/R, setpoints ch1–3, active duty ch1–3, fault summary bits |
| 0x301 `LCM_CURR_L` | LCM→HMI | 2 Hz | mA: honey_L, drl_L, amb_L, aux_L |
| 0x302 `LCM_CURR_R` | LCM→HMI | 2 Hz | mA: honey_R, drl_R, amb_R, aux_R |
| 0x303 `LCM_ENV` | LCM→HMI | 1 Hz | VBAT ×10 mV, VCTRL, T_housing_L/R, T_board |
| 0x304 `LCM_FAULT` | LCM→HMI | on change + 1 Hz | code, channel, value, count |
| 0x30F `LCM_SHUTDOWN` | LCM→HMI | event | reason |
| 0x310 `HMI_SET` | HMI→LCM | on change | ch, brightness 0–100, seq# |
| 0x311 `HMI_HEARTBEAT` | HMI→LCM | 2 Hz | uptime, UI state |
| 0x313 `HMI_INTERIOR` | HMI→LCM | on change | interior_mode, dash_level, seq# (echoed in LCM_STATUS) |
| 0x312 `HMI_SERVICE` | HMI→LCM | event | learn-loads, clear log, set limits (PIN-gated in UI) |

The LCM echoes accepted setpoints in `LCM_STATUS`, and the HMI slider reflects the echo. That
confirms each change end to end. Every frame carries a rolling counter and checksum.

## 5.9 HMI (touchscreen) screens

1. **Main:** three sliders (Honeycomb, DRL, Amber running), each 0–100 %. Live L/R status chips;
   low/high/turn indicators.
1a. **Interior:** dome AUTO / ON / OFF buttons and a dash-brightness slider. A note on screen says
   doors control the dome while the truck is off. A high-beam icon on the main screen replaces the
   cluster indicator (D-6).
2. **Diagnostics:** per-output current (L | R), housing temperatures, system voltage, relay/feed status.
3. **Faults:** active faults (red), logged faults (grey), clear-log (service).
4. **Service (PIN):** learn loads, PWM frequency, temperature thresholds, firmware versions.
   Future option: panel-dimming level (if the digital-potentiometer emulation is fitted, doc 09 §2.3).
5. **Banner layer:** "CONTROLLER COMM LOST" / "DECORATIVE DISABLED" overlay. Headlamp status is still
   shown from what the HMI last received, with a "stale" marker.

HMI power-down: on `LCM_SHUTDOWN` show "Saving…" and blank the backlight. Hardware removes power
about 10 s after key-off.

## 5.10 Ignition, turn and watchdog handling details

* `IGN_OK` falling edge ISR → notify `power_task` (top priority). No flash writes happen in the ISR.
* Turn inputs: rising-edge ISR records `last_edge[side]`. `turn_active = now − last_edge < 1.2 s`. A
  steady-high input (a flasher failed ON) also counts as active.
* Watchdog kick is supervised: each task sets a bit, and `wd_task` kicks the TPS3431-Q1 only when all
  bits are set, then clears them. A single hung task causes WDO → decorative gates off → MCU reset.
* Brownout: the ESP32 brownout detector is enabled. NVS commits are atomic, so a brownout during a
  commit leaves the previous valid settings.

## 5.11 Software verification plan (summary)

Unit tests on the host for duty math, gamma, derate, turn-blanking timing and fault state machines
(table-driven); a hardware-in-the-loop bench with a function generator simulating flasher, ignition
and cranking profiles; and a fault-injection list matching D7 §7.10.
