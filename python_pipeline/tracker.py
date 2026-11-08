"""
CyberGrip: AI Optical Hand Tracking & Teleoperation Pipeline
============================================================
Science Fair Project: Markerless Optical Teleoperation Interface
Tracks human hand kinematics via webcam, computes 3D vector joint angles,
renders real-time telemetry HUD, and streams data to physical or virtual robots.
"""

import cv2
import mediapipe as mp
import numpy as np
import time
import csv
import sys
import os

from serial_bridge import ArduinoBridge


class CyberGripTracker:
    def __init__(self, camera_index=0, enable_serial=False):
        self.camera_index = camera_index
        self.enable_serial = enable_serial

        # MediaPipe Hands Setup
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.65,
            min_tracking_confidence=0.65
        )
        self.mp_draw = mp.solutions.drawing_utils

        # Serial / Hardware Bridge
        self.bridge = ArduinoBridge()
        if self.enable_serial:
            self.bridge.connect()

        # Telemetry & Performance
        self.fps = 0
        self.latency_ms = 0
        self.frame_count = 0
        self.fps_timer = time.time()

        # Benchmark Data Collection for Science Fair
        self.is_recording_benchmark = False
        self.benchmark_samples = []
        self.target_benchmark_samples = 100

    def calculate_vector_angle(self, p1, p2, p3):
        """
        Calculates the 3D angle (in degrees) formed at vertex p2 by points p1, p2, p3.
        Formula:
            u = p1 - p2
            v = p3 - p2
            cos(theta) = (u . v) / (||u|| * ||v||)
            theta = arccos(cos(theta)) * (180 / pi)
        """
        u = np.array([p1.x - p2.x, p1.y - p2.y, p1.z - p2.z])
        v = np.array([p3.x - p2.x, p3.y - p2.y, p3.z - p2.z])

        dot = np.dot(u, v)
        norm_u = np.linalg.norm(u)
        norm_v = np.linalg.norm(v)

        if norm_u * norm_v == 0:
            return 180.0

        cos_theta = dot / (norm_u * norm_v)
        cos_theta = np.clip(cos_theta, -1.0, 1.0)
        angle = np.degrees(np.arccos(cos_theta))
        return float(angle)

    def normalize_flexion(self, angle, extended_angle, flexed_angle):
        """
        Maps a joint angle in degrees to a 0.0 - 1.0 flexion ratio.
        0.0 = fully open / straight finger
        1.0 = fully curled / clenched finger
        """
        ratio = (extended_angle - angle) / (extended_angle - flexed_angle)
        return float(np.clip(ratio, 0.0, 1.0))

    def run(self):
        cap = cv2.VideoCapture(self.camera_index)
        if not cap.isOpened():
            print(f"[Error] Could not open camera {self.camera_index}.")
            return

        # Request 640x480 for high frame-rate & low latency
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

        print("=" * 60)
        print("  CYBER-GRIP AI TELEOPERATION PIPELINE STARTED")
        print("  - Press 'q' to Quit")
        print("  - Press 'r' to Record 100 Benchmark Frames to CSV")
        print("  - Press 's' to Toggle Arduino Serial Stream")
        print("=" * 60)

        while True:
            start_time = time.time()
            ret, frame = cap.read()
            if not ret:
                print("[Warning] Blank frame received. Exiting loop.")
                break

            # Mirror frame horizontally for natural intuitive interaction
            frame = cv2.flip(frame, 1)
            h, w, _ = frame.shape

            # Convert BGR to RGB for MediaPipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb_frame.flags.writeable = False
            results = self.hands.process(rgb_frame)
            rgb_frame.flags.writeable = True

            # Calculate processing latency
            self.latency_ms = (time.time() - start_time) * 1000

            # FPS calculation
            self.frame_count += 1
            if time.time() - self.fps_timer >= 0.5:
                self.fps = int(self.frame_count / (time.time() - self.fps_timer))
                self.frame_count = 0
                self.fps_timer = time.time()

            thumb_angle, index_angle, mid_angle, ring_angle, pinky_angle = 0, 0, 0, 0, 0
            grip_percent = 0

            if results.multi_hand_landmarks:
                hand_landmarks = results.multi_hand_landmarks[0]

                # Draw landmark connections with cyan / green high-tech color
                self.draw_custom_skeleton(frame, hand_landmarks)

                lm = hand_landmarks.landmark

                # --- 1. Compute Joint Angles (degrees) ---
                # Thumb: Landmark 2 (MCP), 3 (IP), 4 (TIP) + proximity to pinky base (17)
                t_deg = self.calculate_vector_angle(lm[2], lm[3], lm[4])
                thumb_dist = np.hypot(lm[4].x - lm[17].x, lm[4].y - lm[17].y)
                thumb_prox_flex = float(np.clip((0.26 - thumb_dist) / (0.26 - 0.10), 0.0, 1.0))
                thumb_angle_flex = self.normalize_flexion(t_deg, 168, 120)
                thumb_flex = max(thumb_prox_flex, thumb_angle_flex)

                # Index: Landmark 5 (MCP), 6 (PIP), 8 (TIP)
                i_deg = self.calculate_vector_angle(lm[5], lm[6], lm[8])
                index_flex = self.normalize_flexion(i_deg, 168, 68)

                # Middle: Landmark 9 (MCP), 10 (PIP), 12 (TIP)
                m_deg = self.calculate_vector_angle(lm[9], lm[10], lm[12])
                mid_flex = self.normalize_flexion(m_deg, 170, 68)

                # Ring: Landmark 13 (MCP), 14 (PIP), 16 (TIP)
                r_deg = self.calculate_vector_angle(lm[13], lm[14], lm[16])
                ring_flex = self.normalize_flexion(r_deg, 168, 68)

                # Pinky: Landmark 17 (MCP), 18 (PIP), 20 (TIP)
                p_deg = self.calculate_vector_angle(lm[17], lm[18], lm[20])
                pinky_flex = self.normalize_flexion(p_deg, 165, 68)

                # Map flexions to 0 - 90 degrees for servos
                thumb_angle = int(thumb_flex * 90)
                index_angle = int(index_flex * 90)
                mid_angle = int(mid_flex * 90)
                ring_angle = int(ring_flex * 90)
                pinky_angle = int(pinky_flex * 90)

                grip_percent = int(((index_flex + mid_flex + ring_flex + pinky_flex) / 4) * 100)

                # Stream to Arduino if connected
                if self.bridge.connected:
                    self.bridge.send_angles(thumb_angle, index_angle, mid_angle, ring_angle, pinky_angle)

                # Benchmark logging
                if self.is_recording_benchmark:
                    self.benchmark_samples.append([
                        len(self.benchmark_samples) + 1,
                        int(time.time() * 1000),
                        self.fps,
                        round(self.latency_ms, 2),
                        grip_percent,
                        thumb_angle,
                        index_angle,
                        mid_angle,
                        ring_angle,
                        pinky_angle
                    ])

                    if len(self.benchmark_samples) >= self.target_benchmark_samples:
                        self.save_benchmark_csv()
                        self.is_recording_benchmark = False

            # Draw HUD Overlay
            self.draw_hud(frame, grip_percent, thumb_angle, index_angle, mid_angle, ring_angle, pinky_angle)

            # Display window
            cv2.imshow("CyberGrip: AI Teleoperation Interface", frame)

            # Keyboard commands
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') or key == 27:  # 'q' or ESC
                break
            elif key == ord('r'):
                if not self.is_recording_benchmark:
                    print("[Benchmark] Recording 100 sample frames for Science Fair...")
                    self.benchmark_samples = []
                    self.is_recording_benchmark = True
            elif key == ord('s'):
                if self.bridge.connected:
                    self.bridge.close()
                else:
                    self.bridge.connect()

        cap.release()
        cv2.destroyAllWindows()
        self.bridge.close()

    def draw_custom_skeleton(self, frame, hand_landmarks):
        """Draws glowing cyan and neon green skeleton connections."""
        h, w, _ = frame.shape
        connections = self.mp_hands.HAND_CONNECTIONS

        for connection in connections:
            start_idx = connection[0]
            end_idx = connection[1]
            p1 = hand_landmarks.landmark[start_idx]
            p2 = hand_landmarks.landmark[end_idx]

            x1, y1 = int(p1.x * w), int(p1.y * h)
            x2, y2 = int(p2.x * w), int(p2.y * h)

            cv2.line(frame, (x1, y1), (x2, y2), (255, 240, 0), 2)  # Cyan line (BGR: 255, 240, 0)

        # Draw fingertips in neon green
        tip_indices = [4, 8, 12, 16, 20]
        for idx in tip_indices:
            p = hand_landmarks.landmark[idx]
            cx, cy = int(p.x * w), int(p.y * h)
            cv2.circle(frame, (cx, cy), 6, (0, 255, 136), -1)

    def draw_hud(self, frame, grip, t, i, m, r, p):
        """Renders futuristic telemetry overlay and progress bars."""
        h, w, _ = frame.shape

        # Top Header Bar
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, 50), (15, 10, 5), -1)
        cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)

        # Title & Stats
        cv2.putText(frame, "CYBER-GRIP TELEMETRY", (14, 32), cv2.FONT_HERSHEY_DUPLEX, 0.7, (0, 240, 255), 2)
        cv2.putText(frame, f"FPS: {self.fps}", (w - 220, 32), cv2.FONT_HERSHEY_DUPLEX, 0.55, (255, 255, 255), 1)
        cv2.putText(frame, f"LATENCY: {int(self.latency_ms)}ms", (w - 120, 32), cv2.FONT_HERSHEY_DUPLEX, 0.55, (0, 255, 136), 1)

        # Bottom-Left Telemetry Card
        card_h = 135
        card_w = 260
        sub_overlay = frame.copy()
        cv2.rectangle(sub_overlay, (12, h - card_h - 12), (12 + card_w, h - 12), (20, 15, 10), -1)
        cv2.rectangle(sub_overlay, (12, h - card_h - 12), (12 + card_w, h - 12), (0, 240, 255), 1)
        cv2.addWeighted(sub_overlay, 0.75, frame, 0.25, 0, frame)

        # Grip Bar
        cv2.putText(frame, f"GRIP: {grip}%", (22, h - card_h + 12), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        bar_len = int((card_w - 40) * (grip / 100))
        cv2.rectangle(frame, (22, h - card_h + 20), (card_w - 6, h - card_h + 30), (60, 60, 60), -1)
        cv2.rectangle(frame, (22, h - card_h + 20), (22 + bar_len, h - card_h + 30), (0, 255, 136), -1)

        # Finger joint readouts
        labels = [f"T:{t}°", f"I:{i}°", f"M:{m}°", f"R:{r}°", f"P:{p}°"]
        for idx, lbl in enumerate(labels):
            x_pos = 22 + idx * 46
            cv2.putText(frame, lbl, (x_pos, h - card_h + 56), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 240, 255), 1)

        # Status text
        status_txt = "SERIAL: CONNECTED" if self.bridge.connected else "SERIAL: STANDBY ('s')"
        status_col = (0, 255, 136) if self.bridge.connected else (100, 100, 255)
        cv2.putText(frame, status_txt, (22, h - card_h + 84), cv2.FONT_HERSHEY_SIMPLEX, 0.45, status_col, 1)

        # Benchmark indicator
        if self.is_recording_benchmark:
            bench_txt = f"RECORDING TEST: {len(self.benchmark_samples)}/100"
            cv2.putText(frame, bench_txt, (22, h - card_h + 108), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 165, 255), 1)
        else:
            cv2.putText(frame, "BENCHMARK: Press 'r' to log", (22, h - card_h + 108), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 180, 180), 1)

    def save_benchmark_csv(self):
        filename = f"benchmark_data_{int(time.time())}.csv"
        filepath = os.path.join(os.path.dirname(__file__), filename)
        with open(filepath, mode="w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "Sample", "Timestamp_ms", "FPS", "Latency_ms", "Grip_Percent",
                "Thumb_Deg", "Index_Deg", "Middle_Deg", "Ring_Deg", "Pinky_Deg"
            ])
            writer.writerows(self.benchmark_samples)
        print(f"[Benchmark] Complete! Saved 100 trials to {filepath}")


if __name__ == "__main__":
    tracker = CyberGripTracker(enable_serial=False)
    tracker.run()
