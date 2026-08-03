# SVCP Phase 1 — Teensy CAN Reader

Reads live RPM and vehicle speed off the S10's OBDII CAN bus and streams
them to the Pi over USB serial. This is the first SVCP software phase —
testable entirely on the bench, no Pi required yet.

## What this firmware actually does

Your LS swap kept the factory GM PCM, which puts standard high-speed
GMLAN CAN (500kbps) on the OBDII connector's pins 6 (CAN-H) and 14
(CAN-L). Rather than sniffing GM's proprietary broadcast frames, this
firmware sends standard **SAE J1979 Mode 01** PID requests — the same
request/response protocol any generic OBD-II scan tool uses — and reads
the PCM's replies. That works regardless of the PCM's exact calendar
year, as long as it's OBD-II/emissions compliant, which it has to be to
pass a scan tool check.

It requests PID `0x0C` (RPM) and PID `0x0D` (vehicle speed) back to back,
in a loop, and pushes a status line out over USB serial 20 times a
second.

## Hardware / wiring

- **Teensy 4.0 or 4.1** — native onboard CAN1 controller, no MCP2515
  module needed (see `PARTS_LIST.md` at the repo root for why).
- **SN65HVD230 CAN transceiver breakout** — 3.3V native, matches the
  Teensy's logic level directly. Do not substitute a 5V transceiver
  (e.g. TJA1050) without a level shifter on its TX line into the
  Teensy — Teensy GPIO is not 5V-tolerant.

Wiring:

| Teensy | SN65HVD230 |
|---|---|
| 3.3V | VCC |
| GND | GND |
| Pin 22 (CTX1) | D (driver input / TX) |
| Pin 23 (CRX1) | R (receiver output / RX) |

| SN65HVD230 | OBDII connector |
|---|---|
| CANH | Pin 6 |
| CANL | Pin 14 |

**Double-check pins 22/23 against the pinout card that ships with your
specific Teensy board (or PJRC's site) before wiring** — I'm confident in
the CAN1-vs-CAN2 pin assignment but you should verify against the
physical board rather than trust it from a written spec alone. Getting a
GPIO pin wrong here just means "no CAN traffic," not damage, but it'll
save you a debugging session.

Ground the transceiver to the same common ground distribution block as
the rest of SVCP's low-voltage electronics (per `PROJECT_REFERENCE.md`)
— don't ground it back to the OBDII connector's ground pin directly, to
keep it on the same ground reference as everything else.

**Do not add a CAN termination resistor.** A CAN bus needs exactly two
120Ω termination resistors, one at each physical end — and the S10's
factory CAN bus already has both of them built in (near the PCM and
near the DLC/gateway). You're tapping into that existing bus, not
building a new one, so it's already terminated. Many SN65HVD230
breakout boards ship with an onboard 120Ω termination resistor enabled
by a solder jumper or pull-up pad (often intended for standalone
bench testing without a real bus). **Check your specific board and
make sure that jumper is open/removed** before connecting to the
vehicle — leaving it in adds a third termination point to the bus,
which improperly loads the line and can cause corrupted or dropped
frames on the whole vehicle bus, not just your reads.

## Software setup

1. Install [Teensyduino](https://www.pjrc.com/teensy/teensyduino.html)
   (adds Teensy board support to the Arduino IDE).
2. In the Arduino IDE, open Library Manager and install **FlexCAN_T4**
   by tonton81.
3. Open `svcp_can_reader.ino`, select your board (Teensy 4.0 or 4.1)
   and USB Type "Serial" under Tools, then upload.

## Bench-testing before it ever sees the truck

1. Upload the firmware, open the Arduino Serial Monitor at 115200 baud.
2. With nothing wired to the transceiver, you should see a steady
   stream of status lines with `rpm_valid` and `mph_valid` both `0`
   (no CAN bus present, so every request times out) — that confirms the
   firmware loop and serial output are alive.
3. Once wired to the OBDII connector with the ignition on (engine can
   be off — the PCM responds to Mode 01 requests as long as it's
   powered and awake), you should see `rpm_valid`/`mph_valid` flip to
   `1` and real numbers appear.

### If `valid` stays `0` once wired to the truck

- **Termination jumper** — see above; the most common cause of "wired
  correctly but nothing comes back" with these breakout boards.
- **CAN-H/CAN-L swapped** — an easy mixup and CAN is differential, so
  a swap won't damage anything, it just won't communicate. Worth
  trying if everything else checks out.
- **Response on a different ID** — this firmware only listens for
  replies on `0x7E8` (the standard engine-ECU response address). If
  your specific PCM/swap harness answers on a different ID (e.g.
  `0x7E9`), you'd need a CAN logic analyzer or a cheap USB-CAN adapter
  to see what's actually on the bus and adjust `OBD_RESPONSE_ID`
  accordingly. Unlikely for a stock engine PCM, but possible with some
  standalone harnesses.
- **Ignition-on but PCM asleep** — some PCMs need a couple of seconds
  after key-on before they start answering OBD requests; give it a
  moment before concluding it's not working.

## Serial protocol

One line per output tick, NMEA-style with a checksum so the Pi can
detect and discard a corrupted line instead of trusting garbage:

```
$SVCP,<rpm>,<mph>,<rpm_valid>,<mph_valid>,<seq>*<checksum>
```

- `rpm`, `mph` — latest known values (integers). If `*_valid` is `0`,
  treat these as stale/last-known, not live.
- `rpm_valid`, `mph_valid` — `1` if that value was refreshed from a real
  CAN response recently; `0` if the last request to the PCM timed out.
- `seq` — increments every line, wraps eventually; lets the Pi notice
  dropped serial data.
- `checksum` — 2 hex digits, XOR of every byte in the sentence body
  (between `$` and `*`).

Example: `$SVCP,2534,37,1,1,10452*5A`

The Teensy also blinks its onboard LED at 10Hz once it's running, so you
can confirm it's alive in the vehicle without a laptop plugged in.

## What's next (Phase 3)

This firmware is consumed later by the Pi-side integration layer, which
will parse this exact line format, verify the checksum, and feed
RPM/MPH into the gauge cluster app. Phase 2 builds the gauge cluster
app itself against fake data first, so this firmware and the rendering
app can be developed and tested independently before being wired
together.
