// SVCP Phase 2 — gauge cluster rendering, driven by fake data for now.
// See README.md for how Phase 3 swaps the fake data source for real
// Teensy data without touching the Gauge class or render logic.

class Gauge {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    this.value = config.min;
    this.valid = true;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cssWidth = rect.width;
    this.cssHeight = rect.height;
  }

  setValue(value, valid) {
    this.value = value;
    this.valid = valid;
  }

  valueToAngle(value) {
    const { min, max, startAngle, sweepAngle } = this.config;
    const clamped = Math.max(min, Math.min(max, value));
    const fraction = (clamped - min) / (max - min);
    return (startAngle + fraction * sweepAngle) * (Math.PI / 180);
  }

  render() {
    const { ctx, cssWidth: w, cssHeight: h, config } = this;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.42;

    const style = getComputedStyle(document.documentElement);
    const tickColor = style.getPropertyValue('--tick-color').trim();
    const tickLabelColor = style.getPropertyValue('--tick-label-color').trim();
    const needleColor = style.getPropertyValue('--needle-color').trim();
    const redlineColor = style.getPropertyValue('--redline-color').trim();
    const digitalColor = style.getPropertyValue('--digital-color').trim();
    const staleColor = style.getPropertyValue('--stale-color').trim();
    const unitColor = style.getPropertyValue('--unit-color').trim();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outer tick arc, with a redline segment overlaid where configured.
    ctx.lineWidth = radius * 0.03;
    ctx.strokeStyle = tickColor;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, this.valueToAngle(config.min), this.valueToAngle(config.max));
    ctx.stroke();

    if (config.redlineStart !== undefined) {
      ctx.strokeStyle = redlineColor;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, this.valueToAngle(config.redlineStart), this.valueToAngle(config.max));
      ctx.stroke();
    }

    // Major ticks + numeric labels around the arc.
    ctx.font = `${radius * 0.09}px sans-serif`;
    for (let v = config.min; v <= config.max; v += config.majorTick) {
      const angle = this.valueToAngle(v);
      const inRedline = config.redlineStart !== undefined && v >= config.redlineStart;

      const x1 = cx + Math.cos(angle) * radius * 0.85;
      const y1 = cy + Math.sin(angle) * radius * 0.85;
      const x2 = cx + Math.cos(angle) * radius;
      const y2 = cy + Math.sin(angle) * radius;

      ctx.strokeStyle = inRedline ? redlineColor : tickColor;
      ctx.lineWidth = radius * 0.02;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.fillStyle = tickLabelColor;
      const lx = cx + Math.cos(angle) * radius * 0.72;
      const ly = cy + Math.sin(angle) * radius * 0.72;
      ctx.fillText(config.tickLabel(v), lx, ly);
    }

    // Needle — dims to the "stale" color instead of updating position
    // smoothly whenever the current value isn't backed by a fresh reading.
    const needleAngle = this.valueToAngle(this.value);
    const needleLength = radius * 0.78;
    const activeColor = this.valid ? needleColor : staleColor;

    ctx.strokeStyle = activeColor;
    ctx.lineWidth = radius * 0.035;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(needleAngle) * needleLength, cy + Math.sin(needleAngle) * needleLength);
    ctx.stroke();

    ctx.fillStyle = activeColor;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Digital readout, centered below the hub.
    ctx.fillStyle = this.valid ? digitalColor : staleColor;
    ctx.font = `bold ${radius * 0.32}px sans-serif`;
    ctx.fillText(Math.round(this.value).toString(), cx, cy + radius * 0.42);

    ctx.fillStyle = unitColor;
    ctx.font = `${radius * 0.1}px sans-serif`;
    ctx.fillText(config.label, cx, cy + radius * 0.58);

    if (!this.valid) {
      ctx.fillStyle = redlineColor;
      ctx.font = `${radius * 0.09}px sans-serif`;
      ctx.fillText('NO SIGNAL', cx, cy - radius * 0.35);
    }
  }
}

const GAUGES = {
  rpm: {
    min: 0,
    max: 7000,
    majorTick: 1000,
    redlineStart: 6000,
    startAngle: 135,
    sweepAngle: 270,
    label: 'RPM',
    tickLabel: (v) => (v / 1000).toString(),
  },
  mph: {
    min: 0,
    max: 140,
    majorTick: 20,
    startAngle: 135,
    sweepAngle: 270,
    label: 'MPH',
    tickLabel: (v) => v.toString(),
  },
};

const rpmGauge = new Gauge(document.getElementById('rpm-gauge'), GAUGES.rpm);
const mphGauge = new Gauge(document.getElementById('mph-gauge'), GAUGES.mph);

// --- Phase 3 hook point -----------------------------------------------
// Whatever eventually relays the Teensy's serial data into this page
// (a local WebSocket bridge — see firmware/svcp_can_reader/README.md
// for the wire format it's forwarding) should call this exact function
// with real values. Nothing above this line needs to change for that.
function updateGaugeData({ rpm, mph, rpmValid, mphValid }) {
  rpmGauge.setValue(rpm, rpmValid);
  mphGauge.setValue(mph, mphValid);
}

function renderLoop() {
  rpmGauge.render();
  mphGauge.render();
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

// --- Fake data source (Phase 2 only) -----------------------------------
// Replaced entirely in Phase 3 by the real serial bridge calling
// updateGaugeData() above. Press 'D' to toggle a simulated signal
// dropout and confirm the stale-data rendering (dimmed needle, "NO
// SIGNAL") without needing the Teensy connected.
let simulateDropout = false;
window.addEventListener('keydown', (e) => {
  if (e.key === 'd' || e.key === 'D') {
    simulateDropout = !simulateDropout;
  }
});

function fakeDataTick() {
  const t = performance.now() / 1000;
  const rpm = 3500 + Math.sin(t * 0.4) * 3000 + (Math.random() - 0.5) * 60;
  const mph = 60 + Math.sin(t * 0.25 + 1) * 55 + (Math.random() - 0.5) * 2;

  updateGaugeData({
    rpm: Math.max(0, rpm),
    mph: Math.max(0, mph),
    rpmValid: !simulateDropout,
    mphValid: !simulateDropout,
  });
}

setInterval(fakeDataTick, 50); // matches the 20Hz cadence the Teensy sends at in Phase 3
