# CyberGrip Science Fair Guide

This guide is for a middle school project. Replace every bracketed item with your own observations and measurements. Do not present example or expected numbers as results.

## Project question

**Can a webcam track a hand well enough to control a 3D robot-hand simulation, and how do camera distance and room lighting affect the measurements?**

## Abstract template

I built CyberGrip, a program that uses a webcam to track a hand and control a 3D robot hand on screen. MediaPipe Hands estimates 21 points on the hand. My program uses vector math to estimate finger curl and sends those estimates to a digital twin made with Three.js.

I tested how **[distance or lighting]** affected **[processing delay, time to collect 100 results, or finger-curl variation]**. I ran **[number]** trials for each condition. My results were **[summarize your real results]**. One limitation is **[a limitation you observed]**. The project shows that a webcam can control a simulation under **[conditions supported by your data]**.

## How the project works

```text
Webcam image → MediaPipe hand landmarks → vector math → finger-curl estimates
             → safety check → 3D digital twin → experiment data (CSV)
```

MediaPipe supplies the hand landmarks. The project code calculates approximate finger bend from selected landmarks. A safety check blocks the middle-finger pose when the middle finger is extended and the other long fingers are curled. It also blocks sudden jerky wrist movement. The screen turns red and the robot holds its last safe pose; the hand meters continue to show the raw estimates. The pose rule recognizes that specific gesture, not every gesture that could offend someone. The browser demo does not train its own AI model, measure exact anatomical angles, or control a physical robot. The sample pickup is simulated. The Python and Arduino files are a separate, optional hardware path.

In the browser demo, a metallic shoulder-and-elbow arm is fixed to a compact base. The palm stays parallel to the floor while the arm reaches for a specimen wrapped as a red gift, swings to a small platform at the side, and releases it. After the specimen settles on the platform, the wrapping opens to reveal the orange sample and a congratulations alert appears. **Preview full pickup and drop** plays the sequence without a live camera gesture.

## Hypothesis

One example you can adapt:

> If I move my hand farther from the webcam or make the room darker, then it may take longer to collect 100 hand-tracking results and the finger-curl estimates may vary more, because the camera model may have a harder time finding the hand.

This is a prediction, not a result. Use your own words and explain why you made the prediction.

## Variables and fair testing

Change one condition at a time. Use the same laptop, webcam, background, hand pose, and app settings for every run.

### Test A: Distance

Measure three distances with a tape measure, such as 0.5 m, 1.0 m, and 1.5 m. Keep the room lighting and hand pose as similar as possible. Enter the distance in the recorder before each run.

### Test B: Lighting

Choose three different room-light levels. Keep the camera distance and hand pose constant. If you have a light meter, record its lux reading in the recorder. If you do not have one, describe the conditions (for example, “window light” or “room lights only”) and do not invent lux values.

### What to record

For each condition, run the 100-result recorder at least three times. Keep your hand visible until the run finishes. Save each CSV file and write down which trial it was. The file records processing delay, frame rate, estimated finger curl, entered distance and light level, and elapsed time while collecting the results.

The displayed processing delay measures the time from sending a camera frame to receiving the hand-tracking result. It is not the full delay from your real hand moving to pixels changing on screen. The elapsed-run value helps show how long it took to collect 100 results, but each CSV row is a detected-hand result; frames where the hand was not detected are not included as rows.

## Math idea

The tracker represents a landmark as a point with coordinates $(x,y,z)$. The webcam model estimates these coordinates; they are not a precise ruler measurement of the hand.

For the index finger, the code uses the knuckle (landmark 5), the middle joint (landmark 6), and the fingertip (landmark 8). It makes two vectors that meet at the middle joint:

$$\vec{u}=P_5-P_6, \qquad \vec{v}=P_8-P_6$$

The angle between the vectors is:

$$\theta=\cos^{-1}\left(\frac{\vec{u}\cdot\vec{v}}{\|\vec{u}\|\|\vec{v}\|}\right)$$

A straighter finger usually gives an angle closer to 180 degrees. The program maps an approximate straight-to-curled range to a number from 0 to 1, then scales it to a 0-to-90 curl command for the 3D hand. That 0-to-90 number is a control value, not a direct measurement of the real finger’s joint angle. The thumb also uses a fingertip-to-palm distance estimate.

## Analyze your results

Make a summary table with one row per trial. Choose average or median processing delay before you begin, then use the same measure for every run. Record the final elapsed-run time too. To compare curl stability, find the highest and lowest value for one finger and subtract them; a smaller range means that finger’s estimate changed less during that trial. Use a spreadsheet to make charts from your own files:

- Camera distance vs. average processing delay
- Room-light level vs. average processing delay
- Camera distance or light level vs. time to collect 100 results
- Optional: trial condition vs. variation in one finger’s curl estimate

Describe patterns you see, including results that do not match your hypothesis. The recorder does not create a chart or prove that one setup is better; you interpret the measurements.

As a second experiment, you could run ten pick-and-place attempts at each distance or lighting level and manually count how many samples land on the green platform. The app's CSV does not record task success, so write those counts in a separate table and define success before you begin (for example, the sample comes to rest inside the platform rim).

## Display board idea

| Left panel | Center panel | Right panel |
|---|---|---|
| Question, hypothesis, and why you chose the project | Webcam → landmarks → math → digital twin diagram, plus a photo of your demo | Materials, test method, your real data charts, conclusion, and limitations |

Include a short explanation of what you wrote or changed yourself. Be clear that MediaPipe provides the landmark model and that your code calculates the bend estimates and controls the simulation.

## Questions a judge may ask

**Did you make the AI model?**  
No. I used MediaPipe Hands for landmark detection. I worked on the angle math, finger mapping, simulation, and data recorder.

**Are the finger angles exact?**  
No. They are estimates from webcam landmarks. The 0-to-90 values shown in the app are curl control values.

**What does “processing delay” mean here?**  
It is the time between sending a frame to the tracking model and receiving its result. It does not include all camera, display, and rendering delays.

**Does the browser demo move a real robot?**  
No. It moves a digital twin. A separate Python pipeline can send angle commands to an Arduino setup if the hardware is built and connected.

**What can make tracking fail?**  
Poor lighting, a hand that is too far away, fast movement, or fingers hidden from the camera can make landmark estimates less reliable.

**What does the safety check do?**  
It blocks the detected middle-finger pose and sudden jerky wrist motion from reaching the simulated robot. The hand-data meters still show the camera estimates, so the safety gate does not alter the measurements.

## Limits and next steps

This project uses one webcam and estimated landmarks. It may behave differently on another computer or camera. The browser demo also loads Three.js and MediaPipe from online CDNs. Possible next steps are to add a camera-calibration step, record missed detections, compare two cameras, or measure true end-to-end display delay with a separate method. A physical servo hand would be a separate build and should be tested with an adult and a suitable external power supply.
