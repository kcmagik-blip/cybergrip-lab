"""
CyberGrip: Serial Telemetry Bridge for Microcontrollers (Arduino / ESP32)
Streams calculated joint angles over USB Serial to control physical servo motors.
"""

import time
import sys

try:
    import serial
    import serial.tools.list_ports
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False


class ArduinoBridge:
    def __init__(self, port=None, baudrate=115200):
        self.port = port
        self.baudrate = baudrate
        self.ser = None
        self.connected = False
        self.last_send_time = 0
        self.send_interval = 0.03  # Send every 30ms (~33Hz to prevent serial buffer overflow)

    def auto_detect_port(self):
        """Scans available serial ports and looks for common Arduino / USB devices."""
        if not SERIAL_AVAILABLE:
            return None

        ports = list(serial.tools.list_ports.comports())
        for p in ports:
            # Common hardware identifiers for Arduino / USB-UART chips
            desc = p.description.lower()
            if any(k in desc for k in ['arduino', 'ch340', 'ftdi', 'cp210', 'usb-serial']):
                return p.device
        
        # If nothing specifically identified, return the first available serial port if present
        return ports[0].device if ports else None

    def connect(self):
        if not SERIAL_AVAILABLE:
            print("[SerialBridge] Warning: pyserial is not installed. Running in mock simulation mode.")
            return False

        if not self.port:
            self.port = self.auto_detect_port()

        if not self.port:
            print("[SerialBridge] No physical Arduino detected. Operating in virtual simulation mode.")
            return False

        try:
            print(f"[SerialBridge] Connecting to {self.port} at {self.baudrate} baud...")
            self.ser = serial.Serial(self.port, self.baudrate, timeout=0.1)
            time.sleep(2.0)  # Wait for Arduino reset cycle upon serial connection
            self.connected = True
            print(f"[SerialBridge] Successfully connected to Arduino on {self.port}!")
            return True
        except Exception as e:
            print(f"[SerialBridge] Connection error on {self.port}: {e}")
            self.connected = False
            return False

    def send_angles(self, thumb, index, middle, ring, pinky):
        """
        Sends formatted telemetry packet to microcontroller.
        Format: <T:angle,I:angle,M:angle,R:angle,P:angle>\\n
        Angles are integers from 0 (fully extended) to 90 or 180 (fully clenched).
        """
        now = time.time()
        if now - self.last_send_time < self.send_interval:
            return  # Rate limit

        self.last_send_time = now

        # Clamp angles to 0-180
        t = max(0, min(180, int(thumb)))
        i = max(0, min(180, int(index)))
        m = max(0, min(180, int(middle)))
        r = max(0, min(180, int(ring)))
        p = max(0, min(180, int(pinky)))

        packet = f"<{t},{i},{m},{r},{p}>\n"

        if self.connected and self.ser:
            try:
                self.ser.write(packet.encode('utf-8'))
            except Exception as err:
                print(f"[SerialBridge] Write failed: {err}")
                self.connected = False
        else:
            # Print mock telemetry to stdout periodically
            pass

    def close(self):
        if self.ser and self.ser.is_open:
            self.ser.close()
            self.connected = False
            print("[SerialBridge] Serial port closed.")
