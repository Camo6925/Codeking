# SVCP Phase 2 — Gauge Cluster App (Display #1)

A plain HTML/CSS/JS app, rendered on `<canvas>`, driven by fake data for
now. No frameworks, no build step, no CDN/external assets — just three
files you can open directly.

## Plain-terms explanation

- **`index.html`** — just two `<canvas>` elements side by side, one for
  the RPM gauge, one for MPH. All the real work happens in `app.js`.
- **`style.css`** — colors live here as CSS variables (`--needle-color`,
  `--bg-color`, etc). This is the file to edit when you want to change
  the look later — swap values, nothing else needs to change.
- **`app.js`** — a `Gauge` class that knows how to draw *one* dial (tick
  marks, needle, digital readout) from a config object (min/max value,
  where redline starts, label). Both gauges reuse the same class with
  different config, so adding a third gauge later (oil pressure,
  coolant temp) is mostly copy-pasting a config block, not writing new
  drawing code.

The needle position is calculated by mapping the current value onto an
angle: `0%` of the gauge's range points to the bottom-left, `100%`
points to the bottom-right, sweeping clockwise through the top — the
standard automotive dial layout.

## The "valid" concept, explained now so it isn't a surprise in Phase 3

Every gauge tracks not just a value but whether that value is currently
*trustworthy*. In Phase 1, the Teensy firmware marks a reading invalid
if the PCM doesn't answer a request in time — meaning the number it's
showing is the last one it knew, not a live one. This app renders that
distinction visually: an invalid reading dims the needle/digital
readout and shows "NO SIGNAL", instead of silently freezing the needle
in a position that looks live but isn't.

You can see this right now, without any real hardware: press **`D`**
in the browser to toggle a simulated dropout.

## Placeholder values you'll want to confirm

I set the RPM gauge to a 0–7000 range with redline starting at 6000 —
that's a reasonable placeholder for an LS build, but I don't have your
actual redline/shift point from the reference docs. Adjust `GAUGES.rpm`
in `app.js` (`max`, `redlineStart`) once you know the real number for
your combo. Same for MPH's 0–140 range if you want something different.

## Previewing (no Pi needed)

This is just static files — open `index.html` directly in any browser
on your own computer (double-click it, or `file:///path/to/index.html`)
to see it running with fake data.

## Running fullscreen on the Pi (Display #1)

Once you're ready to test on actual hardware, point Chromium at this
folder in kiosk mode on whichever display is connected as Display #1:

```
chromium-browser --kiosk --incognito --noerrdialogs --disable-infobars \
  --app=file:///home/pi/svcp/pi/gauge_cluster/index.html
```

Getting this to launch automatically and land on the *correct* physical
display (not whichever OpenAuto Pro claims) is a Phase 6 boot-sequencing
problem — for now, just confirm it runs and renders correctly at all.

## What's next (Phase 3)

Delete/disable the "Fake data source" block at the bottom of `app.js`
(everything from `simulateDropout` down) and replace it with whatever
receives the Teensy's serial stream and calls `updateGaugeData({ rpm,
mph, rpmValid, mphValid })` with real numbers. Nothing above that line
in `app.js` changes. That receiving piece will most likely be a small
local process (Python or Node) that reads the Teensy's USB serial port
and forwards parsed lines to this page over a local WebSocket, since
browsers can't open a serial port directly without extra permission
prompts that don't work well in an unattended kiosk boot — we'll land
on the specifics when we get there.
