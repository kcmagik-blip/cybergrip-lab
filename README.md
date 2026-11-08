# CyberGrip: Webcam Controlled Robot Hand

CyberGrip is a middle school science fair project about using a webcam to control a 3D robot hand. It uses MediaPipe Hands to find hand landmarks, estimates how curled each finger is, and animates a digital twin in the browser.

The 3D sample pickup is a computer simulation. The separate Python and Arduino files are an optional hardware path; the browser demo does not connect to an Arduino.

## What happens

1. The webcam image is processed by MediaPipe Hands, which returns 21 estimated hand landmarks.
2. The tracker uses vectors between selected landmarks to estimate finger bend.
3. A safety check blocks a raised-middle-finger pose and sudden jerky motion. The red status freezes the robot at its last safe pose.
4. Safe bend estimates move the fingers of the Three.js robot hand. The hand meters continue to show the raw estimates while commands are blocked.
5. A shoulder-and-elbow arm fixed to a compact base reaches down to the wrapped floor specimen. Close over it to grip, swing the arm to the side, then open over the green platform to release it. A successful placement unwraps the red gift to reveal the orange specimen and shows a congratulations alert.
6. The recorder can export 100 detected-hand results to a CSV file with processing delay, frame rate, finger-curl estimates, and the distance and room-light conditions you enter.

These are estimates from a webcam model. The project does not measure exact anatomical joint angles or demonstrate a real robot moving hazardous materials.

The pose check recognizes the middle finger extended while the index, ring, and pinky are curled. A separate motion check blocks sudden jerks. The pose check does not identify every gesture that could be offensive in every context.

## Project files

```text
launch_web.sh / launch_web.bat       Start the browser simulation
launch_python.sh / launch_python.bat Start the optional Python tracker
web_simulation/                      Browser demo and 3D digital twin
python_pipeline/                     OpenCV tracker and optional serial bridge
arduino/servo_controller.ino         Optional five-servo Arduino sketch
SCIENCE_FAIR_GUIDE.md                Experiment plan and presentation notes
```

## Run the browser demo

The browser demo loads Three.js and MediaPipe files from CDNs, so it needs an internet connection while those files load. Webcam access works from `localhost` or a secure website; opening the HTML file directly may not allow camera access.

On macOS or Linux, run `./launch_web.sh`. On Windows, double-click `launch_web.bat`. The scripts start a local web server at `http://localhost:8000` and open the page. You can also start a server from the `web_simulation` folder:

```bash
python3 -m http.server 8000
```

Allow camera access, keep your whole hand in view, move over the red gift on the floor, and close your hand to pick it up. Move toward the green platform on the right and open your hand to drop it. The gift unwraps and the congratulations alert appears only after the specimen settles on the platform. **Preview full pickup and drop** runs the same simulated sequence without a live hand. Use **Reset Specimen** to wrap it again and return it to the floor marker.

## Record an experiment

Measure the camera distance and room light, enter those values in the recorder, then click **Record 100**. Keep your hand visible until all 100 results are collected. Export the CSV and repeat each condition several times. The processing-delay value is the time from submitting a frame to receiving the tracking result; it does not include display or screen-rendering delay.

Do not use example values as your results. Run the experiment on your own computer and report the data you collect. The guide has a suggested method and explains the limits of the measurement.

## Optional Python and Arduino path

Install the packages listed in `python_pipeline/requirements.txt`, then run `python tracker.py` from inside `python_pipeline`. Press **q** to quit, **r** to record a CSV benchmark, and **s** to try connecting to an Arduino over USB serial.

The Arduino sketch expects five comma-separated servo angles in a packet such as `<45,90,90,85,70>`. Use an external, suitable 5 V supply for servos and connect the supply ground to Arduino ground. Check the wiring and servo limits before powering hardware.
