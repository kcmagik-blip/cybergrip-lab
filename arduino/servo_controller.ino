/*
 * CyberGrip: Arduino Robotic Hand Servo Controller
 * ==================================================
 * Science Fair Project: Markerless Optical Teleoperation
 * 
 * Receives angle telemetry packets over Serial from the Python bridge or another serial sender:
 * Packet format: <Thumb,Index,Middle,Ring,Pinky>\n
 * Example: <45,90,90,85,70>\n
 * 
 * Hardware Setup:
 * - Arduino Uno / Nano / ESP32
 * - 5x SG90 or MG90S Micro Servos
 * - External 5V 2A-3A power supply (do NOT power 5 servos directly from Arduino 5V pin!)
 * - Common ground between Arduino GND and 5V External Battery/Power Supply GND.
 * 
 * Pinout:
 * - Thumb Servo  -> Pin 3
 * - Index Servo  -> Pin 5
 * - Middle Servo -> Pin 6
 * - Ring Servo   -> Pin 9
 * - Pinky Servo  -> Pin 10
 */

#include <Servo.h>

// Servo pin definitions (must be PWM pins on Uno)
const int PIN_THUMB  = 3;
const int PIN_INDEX  = 5;
const int PIN_MIDDLE = 6;
const int PIN_RING   = 9;
const int PIN_PINKY  = 10;

Servo servoThumb;
Servo servoIndex;
Servo servoMiddle;
Servo servoRing;
Servo servoPinky;

// Target and smoothed servo positions (0 - 180 degrees)
float targetAngles[5]  = {0, 0, 0, 0, 0};
float currentAngles[5] = {0, 0, 0, 0, 0};

// Smoothing filter factor (0.0 = frozen, 1.0 = instant jerky movement)
// 0.25 provides smooth, realistic, fluid robotic movement
const float SMOOTHING_FACTOR = 0.25;

// Serial parsing variables
const int MAX_BUF = 64;
char serialBuffer[MAX_BUF];
int bufIndex = 0;
bool receivingPacket = false;

void setup() {
  Serial.begin(115200);
  while (!Serial) {
    ; // Wait for serial connection
  }

  // Attach servos
  servoThumb.attach(PIN_THUMB);
  servoIndex.attach(PIN_INDEX);
  servoMiddle.attach(PIN_MIDDLE);
  servoRing.attach(PIN_RING);
  servoPinky.attach(PIN_PINKY);

  // Set initial open hand posture
  updateAllServos(0, 0, 0, 0, 0);

  Serial.println(F("[CyberGrip Arduino] Ready. Listening for <T,I,M,R,P> packets at 115200 baud."));
}

void loop() {
  readSerialPacket();
  smoothServoMovement();
  delay(15); // Loop runs at approx 60Hz
}

// Reads serial stream looking for packet framing: < ... >
void readSerialPacket() {
  while (Serial.available() > 0) {
    char c = Serial.read();

    if (c == '<') {
      bufIndex = 0;
      receivingPacket = true;
    } else if (c == '>') {
      if (receivingPacket) {
        serialBuffer[bufIndex] = '\0'; // Null-terminate string
        parseAndApplyAngles(serialBuffer);
        receivingPacket = false;
      }
    } else if (receivingPacket) {
      if (bufIndex < MAX_BUF - 1) {
        serialBuffer[bufIndex++] = c;
      }
    }
  }
}

// Parses comma-separated angles: "45,90,90,85,70"
void parseAndApplyAngles(char* data) {
  int t = 0, i = 0, m = 0, r = 0, p = 0;
  int parsed = sscanf(data, "%d,%d,%d,%d,%d", &t, &i, &m, &r, &p);

  if (parsed == 5) {
    targetAngles[0] = constrain(t, 0, 180);
    targetAngles[1] = constrain(i, 0, 180);
    targetAngles[2] = constrain(m, 0, 180);
    targetAngles[3] = constrain(r, 0, 180);
    targetAngles[4] = constrain(p, 0, 180);
  }
}

// Exponential moving average filter for jitter-free servo motion
void smoothServoMovement() {
  for (int k = 0; k < 5; k++) {
    currentAngles[k] += (targetAngles[k] - currentAngles[k]) * SMOOTHING_FACTOR;
  }

  servoThumb.write((int)currentAngles[0]);
  servoIndex.write((int)currentAngles[1]);
  servoMiddle.write((int)currentAngles[2]);
  servoRing.write((int)currentAngles[3]);
  servoPinky.write((int)currentAngles[4]);
}

void updateAllServos(int t, int i, int m, int r, int p) {
  servoThumb.write(t);
  servoIndex.write(i);
  servoMiddle.write(m);
  servoRing.write(r);
  servoPinky.write(p);
}
