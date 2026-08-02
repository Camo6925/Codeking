# SVCP Gauge Cluster + OpenAuto Pro — Project Reference

## Vehicle Platform
- 2001 Chevrolet S10 Extended Cab
- LS swap in progress: 5.3L LS, bored .030 over, 4.000" stroker crank (363 ci), targeting ~480-540 crank HP on pump gas
- Transmission: 4L80E (swapped plan from originally-considered 4L60E), engine set back 1-2" off the firewall to accommodate 4L80E length and minimize transmission tunnel modifications
- Trans plan: running the 4L80E stock initially; internal build (shift kit, trans brake) deferred until turbo upgrade parts are acquired later
- Rear suspension: triangulated 4-link coilover swap, shortened/centered Ford 8.8 axle, axle flip for ~6" drop, C-notched frame rails
- Driver-side inner fender being removed for engine bay clearance/room

## SVCP (Smart Vehicle Control Platform) — Overall System
SVCP is the umbrella project name for the vehicle's Raspberry Pi 5 based smart control ecosystem. Existing planned features beyond the gauge cluster:
- Motorized tailgate and bed cover (VEVOR actuators)
- Electric door poppers
- Remote start
- Full stack (for the broader SVCP, not just gauge cluster): Python backend, BLE communication, simulation environment, backtesting suite, Flutter mobile app

### Hard Constraints (apply system-wide)
- The Pi must never power actuators directly
- Hood input is excluded entirely from the system
- Physical controls must always function independently of Pi state
- BLE latency target under 250ms
- Fully local, no cloud dependency — with one accepted exception: Android Auto itself inherently requires phoning home to Google when active; this exception is scoped only to that feature/screen, not the rest of the system

## This Sub-Project: Dual-Display Gauge Cluster + OpenAuto Pro

### Concept
One Raspberry Pi 5 drives two independent HDMI displays:
- **Display #1**: Custom digital gauge cluster showing MPH, RPM, and potentially other live engine data. Fully custom rendering — no third-party gauge software, built from scratch. Should be visually customizable later (colors, background images/video, layout, multiple skins) but function takes priority over styling initially.
- **Display #2**: Runs OpenAuto Pro for Android Auto phone projection, plus custom SVCP control screens for the other features (tailgate, door poppers, remote start). OpenAuto Pro was chosen over Crankshaft specifically because of its more mature dual-screen/multi-display support and better documented Bluetooth/audio routing. OpenAuto Pro supports picture-in-picture/split layouts (e.g., overlaying a camera feed or widget alongside Android Auto) — this capability should be used for the control app coexistence.

### Data Flow / Architecture
- A Teensy 4.0 (or 4.1) reads the vehicle's OBDII/CAN bus using its **native onboard CAN controller** plus an SN65HVD230 transceiver — decided during Phase 1 against the originally-planned MCP2515 SPI module, since the Teensy 4.x has CAN built into the chip and a separate CAN controller module is redundant. See `firmware/svcp_can_reader/README.md` for wiring and protocol details.
- The LS swap retained the factory GM PCM, which presents standard high-speed GMLAN CAN (500kbps) on the OBDII connector. Firmware polls standard SAE J1979 Mode 01 PIDs (RPM, vehicle speed) rather than proprietary GM broadcast frames, so it isn't tied to the PCM's specific calendar year/model.
- The Teensy pre-processes/parses this CAN data (RPM, speed, and potentially other values) and sends clean structured data to the Pi over serial — this keeps CAN parsing off the Pi's CPU entirely, so the Pi stays dedicated to rendering both displays and running OpenAuto Pro's video decode without contention.
- The Pi's gauge cluster app receives this serial data and updates the gauge visuals in real time.
- Reasoning for this split: running Android Auto video decode + a live CAN-fed gauge cluster + a second control display simultaneously on one Pi 5 is a real workload; offloading CAN parsing to the Teensy was chosen specifically to reduce Pi CPU/GPU contention rather than splitting across two full Raspberry Pis.

### Audio
- OpenAuto Pro's audio output is routed through a HiFiBerry DAC+ (I2S DAC HAT) rather than the Pi's onboard 3.5mm jack, since onboard audio is not suited for a full amp/sub setup.
- The DAC converts the digital audio signal to a clean line-level analog signal, output via RCA cables into the existing amp's line-in.
- The amp, speakers, and sub are already installed in the vehicle — this project only needs to get a clean signal out of the Pi/DAC to the amp's input.
- If the amp's RCA inputs are already occupied by another source (e.g., factory harness), a line-output converter (LOC) or RCA input switcher will be needed — not yet confirmed whether this is required.

### Power & Shutdown
- No physical battery involved in the Pi's power system. A Mausberry Circuit handles clean shutdown: it monitors a switched ignition-sense wire, and when the ignition turns off, it signals the Pi to complete a clean OS shutdown before cutting 5V power entirely.
- This avoids SD card/SSD corruption from sudden power loss, which is a common failure mode for Pi-based automotive installs.
- A fused power distribution block feeds 12V to the Mausberry Circuit and other 12V-powered accessories (DAC, Teensy, etc.), with individually rated fuses per circuit.
- A single common ground distribution block (mounted to bare, unpainted chassis metal) is used for all grounds (Teensy/MCP2515, Mausberry, sensors) to avoid ground loops/electrical noise that could cause flickering displays or CAN read errors.

### Hardware Recommendations Made During Planning
- Raspberry Pi 5 (8GB) — chosen over 4GB for headroom given the combined workload
- Official Raspberry Pi 5 Active Cooler — considered non-negotiable for sustained dual-display + video decode load
- NVMe SSD via M.2 HAT/base (PCIe 2.0) instead of microSD — for better I/O performance under simultaneous logging/UI-asset reads
- Official 27W USB-C PD power supply — generic supplies flagged as a common cause of throttling/instability under this workload

### Budget
Mid-range build target discussed: approximately $650-750 total for the dual-display/Teensy/audio hardware (Pi itself assumed already owned from the broader SVCP build). Full itemized parts list with pricing is in `PARTS_LIST.md`.

## What's Explicitly Out of Scope for This Reference
- Amp/speaker/sub sourcing — assumed already installed
- The physical assembly/wiring steps themselves — those were covered in a separate assembly manual during planning (not attached here, but exists) and are a hardware task, not a software one
- Detailed OpenAuto Pro internal configuration steps — treated as third-party software to be configured, not built

## Reference Materials Consulted During Planning
- Hackaday — PiCAN3 + PixiJS custom gauge cluster build (closest architectural match: Pi 4 + PiCAN3 for CAN, Teensy 4.0 for analog sensors, custom PixiJS rendering in Chromium/X, 12.3" wide LCD)
- GitHub gist — Automotive dashboard/gauge cluster on Raspberry Pi 3 using Chromium and Node.js, including MCP2515 CAN controller device tree overlay configuration and can0 interface setup at 500kbps bitrate
