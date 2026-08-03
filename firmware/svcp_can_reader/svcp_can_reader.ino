// SVCP Phase 1 — Teensy CAN reader
// Polls the S10's OBDII CAN bus for RPM and vehicle speed using standard
// SAE Mode 01 PIDs, and streams the results to the Pi over USB serial.
//
// Hardware: Teensy 4.0/4.1, native CAN1 controller, SN65HVD230 transceiver.
// See README.md in this folder for wiring and the serial protocol spec.

#include <FlexCAN_T4.h>

FlexCAN_T4<CAN1, RX_SIZE_256, TX_SIZE_16> can1;

// Standard OBD-II diagnostic CAN IDs: 0x7DF is the "functional" request
// address every ECU on the bus listens to; 0x7E8 is where ECU #1 (the one
// that owns the engine PIDs) sends its replies. These are fixed by the
// SAE J1979 spec, not vehicle-specific.
const uint32_t OBD_REQUEST_ID = 0x7DF;
const uint32_t OBD_RESPONSE_ID = 0x7E8;

// Mode 01 PIDs we care about (also fixed by spec).
const uint8_t PID_RPM = 0x0C;
const uint8_t PID_SPEED = 0x0D;

const uint32_t RESPONSE_TIMEOUT_MS = 150;
const uint32_t OUTPUT_INTERVAL_MS = 50; // 20Hz status line to the Pi

enum PollState { SEND_RPM_REQUEST, AWAIT_RPM, SEND_SPEED_REQUEST, AWAIT_SPEED };
PollState pollState = SEND_RPM_REQUEST;
uint32_t requestSentTime = 0;
// Separate per-PID flags, not one shared flag — a late/stale reply for the
// PID we're NOT currently waiting on must not be mistaken for the one we are.
bool rpmResponseFlag = false;
bool speedResponseFlag = false;

int currentRPM = 0;
int currentMPH = 0;
bool rpmValid = false;
bool mphValid = false;

uint32_t sequenceNumber = 0;
uint32_t lastOutputTime = 0;

void sendPidRequest(uint8_t pid) {
  CAN_message_t msg = {}; // zero every field first — flags.extended must be false (standard 11-bit ID)
  msg.id = OBD_REQUEST_ID;
  msg.len = 8;
  msg.buf[0] = 0x02; // 2 data bytes follow (mode + PID)
  msg.buf[1] = 0x01; // Mode 01: request current live data
  msg.buf[2] = pid;
  msg.buf[3] = 0x00;
  msg.buf[4] = 0x00;
  msg.buf[5] = 0x00;
  msg.buf[6] = 0x00;
  msg.buf[7] = 0x00;
  can1.write(msg);
}

void handleResponse(const CAN_message_t &msg) {
  if (msg.id != OBD_RESPONSE_ID || msg.len < 3) return;
  if (msg.buf[1] != 0x41) return; // 0x41 = positive response to a Mode 01 request

  uint8_t pid = msg.buf[2];
  if (pid == PID_RPM && msg.len >= 5) {
    // RPM = ((A * 256) + B) / 4, per SAE J1979
    currentRPM = ((msg.buf[3] * 256) + msg.buf[4]) / 4;
    rpmValid = true;
    rpmResponseFlag = true;
  } else if (pid == PID_SPEED && msg.len >= 4) {
    // Speed PID returns km/h directly in byte A
    currentMPH = (int)(msg.buf[3] * 0.621371f + 0.5f);
    mphValid = true;
    speedResponseFlag = true;
  }
}

void pollCAN() {
  CAN_message_t msg = {};
  while (can1.read(msg)) {
    handleResponse(msg);
  }

  uint32_t now = millis();

  switch (pollState) {
    case SEND_RPM_REQUEST:
      sendPidRequest(PID_RPM);
      requestSentTime = now;
      rpmResponseFlag = false;
      pollState = AWAIT_RPM;
      break;

    case AWAIT_RPM:
      if (rpmResponseFlag) {
        pollState = SEND_SPEED_REQUEST;
      } else if (now - requestSentTime > RESPONSE_TIMEOUT_MS) {
        rpmValid = false; // no reply in time — report as stale, don't hang
        pollState = SEND_SPEED_REQUEST;
      }
      break;

    case SEND_SPEED_REQUEST:
      sendPidRequest(PID_SPEED);
      requestSentTime = now;
      speedResponseFlag = false;
      pollState = AWAIT_SPEED;
      break;

    case AWAIT_SPEED:
      if (speedResponseFlag) {
        pollState = SEND_RPM_REQUEST;
      } else if (now - requestSentTime > RESPONSE_TIMEOUT_MS) {
        mphValid = false;
        pollState = SEND_RPM_REQUEST;
      }
      break;
  }
}

void printStatusLine() {
  char body[64];
  snprintf(body, sizeof(body), "SVCP,%d,%d,%d,%d,%lu",
           currentRPM, currentMPH, rpmValid ? 1 : 0, mphValid ? 1 : 0,
           (unsigned long)sequenceNumber);

  uint8_t checksum = 0;
  for (size_t i = 0; body[i] != '\0'; i++) {
    checksum ^= (uint8_t)body[i];
  }

  Serial.print('$');
  Serial.print(body);
  Serial.print('*');
  if (checksum < 0x10) Serial.print('0');
  Serial.println(checksum, HEX);

  sequenceNumber++;
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);

  can1.begin();
  can1.setBaudRate(500000);
  can1.enableFIFO();
}

void loop() {
  pollCAN();

  uint32_t now = millis();
  if (now - lastOutputTime >= OUTPUT_INTERVAL_MS) {
    lastOutputTime = now;
    printStatusLine();
    digitalToggle(LED_BUILTIN); // blinks at 10Hz while alive, even with no serial monitor open
  }
}
