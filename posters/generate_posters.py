#!/usr/bin/env python3
"""Generate three print-sized CyberGrip science-fair posters and editable HTML sources."""

from pathlib import Path
import html


OUT = Path(__file__).resolve().parent
REPO_URL = "https://github.com/kcmagik-blip/cybergrip-lab"


ROBOT_ART = r'''
<svg class="robot-art" viewBox="0 0 680 690" role="img" aria-label="Illustration of a silver robot hand on an articulated arm">
  <defs>
    <linearGradient id="metal" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#d9e8f2"/><stop offset=".5" stop-color="#66849a"/><stop offset="1" stop-color="#e6f2fa"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="#36d7f3" stop-opacity=".35"/><stop offset="1" stop-color="#36d7f3" stop-opacity="0"/></radialGradient>
  </defs>
  <circle cx="355" cy="332" r="310" fill="url(#glow)"/>
  <g fill="none" stroke="#41d7f2" stroke-width="5" opacity=".7"><path d="M74 230a280 280 0 0 1 502-95"/><path d="M90 190a235 235 0 0 1 415-80"/></g>
  <ellipse cx="344" cy="625" rx="185" ry="30" fill="#10253b"/>
  <path d="M222 595h244l35 35H185z" fill="#243a51" stroke="#7c98aa" stroke-width="5"/>
  <ellipse cx="344" cy="596" rx="122" ry="24" fill="url(#metal)" stroke="#d7eaf5" stroke-width="5"/>
  <path d="M345 568 252 365" stroke="#1b2c40" stroke-width="92" stroke-linecap="round"/>
  <path d="M345 568 252 365" stroke="url(#metal)" stroke-width="70" stroke-linecap="round"/>
  <path d="m252 365 175-132" stroke="#1b2c40" stroke-width="88" stroke-linecap="round"/>
  <path d="m252 365 175-132" stroke="url(#metal)" stroke-width="66" stroke-linecap="round"/>
  <circle cx="252" cy="365" r="57" fill="#15263b" stroke="#56ddf3" stroke-width="6"/>
  <circle cx="252" cy="365" r="33" fill="url(#metal)"/>
  <circle cx="345" cy="568" r="55" fill="#15263b" stroke="#56ddf3" stroke-width="6"/>
  <circle cx="345" cy="568" r="31" fill="url(#metal)"/>
  <path d="m427 233 22-43" stroke="#202f44" stroke-width="43" stroke-linecap="round"/>
  <path d="m427 233 22-43" stroke="url(#metal)" stroke-width="30" stroke-linecap="round"/>
  <rect x="342" y="90" width="170" height="118" rx="38" fill="url(#metal)" stroke="#d4e9f5" stroke-width="6"/>
  <rect x="382" y="62" width="92" height="54" rx="24" fill="#263b50" stroke="#6de6f5" stroke-width="5"/>
  <g stroke="#d8e8f2" stroke-width="26" stroke-linecap="round">
    <path d="M363 203v89q0 39 33 39"/><path d="M401 207v103q0 40 33 40"/>
    <path d="M440 207v103q0 40 33 40"/><path d="M478 204v91q0 37 31 40"/>
  </g>
  <path d="M343 166h-42q-35 0-42 31l-11 49q-7 28 20 38l33 11" fill="none" stroke="#d8e8f2" stroke-width="26" stroke-linecap="round"/>
  <g fill="#42def5"><circle cx="360" cy="224" r="6"/><circle cx="401" cy="224" r="6"/><circle cx="441" cy="224" r="6"/><circle cx="480" cy="224" r="6"/></g>
  <path d="M420 127h18" stroke="#13273c" stroke-width="8" stroke-linecap="round"/>
</svg>'''


CARDBOARD_ART = r'''
<svg class="build-art" viewBox="0 0 880 340" role="img" aria-label="Cardboard hand with hinged fingers, strings and five servos">
  <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#23a8c4"/></marker></defs>
  <rect x="18" y="18" width="844" height="304" rx="28" fill="#fff8ec" stroke="#e9d6b9" stroke-width="3"/>
  <path d="M210 256v-80q0-20 17-20t17 20v-90q0-19 18-19t18 19v80V66q0-20 18-20t18 20v100V83q0-20 18-20t18 20v102V116q0-19 18-19t18 19v129q0 63-69 63h-65q-49 0-49-52z" fill="#eacb98" stroke="#986e3d" stroke-width="7" stroke-linejoin="round"/>
  <g fill="#fff2d9" stroke="#b88952" stroke-width="3"><rect x="250" y="99" width="26" height="42" rx="6"/><rect x="301" y="97" width="26" height="42" rx="6"/><rect x="352" y="114" width="26" height="42" rx="6"/><rect x="403" y="146" width="26" height="40" rx="6"/><rect x="221" y="199" width="29" height="28" rx="7"/></g>
  <g fill="none" stroke="#23a8c4" stroke-width="4" stroke-dasharray="7 6"><path d="M263 54V33H563"/><path d="M314 50V43H563"/><path d="M365 67V53H563"/><path d="M416 98V63H563"/><path d="M234 154 234 75h329"/></g>
  <g transform="translate(560 54)">
    <rect x="0" y="0" width="245" height="212" rx="22" fill="#dcebf0" stroke="#2e667b" stroke-width="5"/>
    <text x="122" y="-10" text-anchor="middle" font-size="22" font-weight="800" fill="#32596b">5 MICRO SERVOS</text>
    <g fill="#304b60" stroke="#71d6e7" stroke-width="3">
      <rect x="22" y="32" width="74" height="48" rx="12"/><rect x="150" y="32" width="74" height="48" rx="12"/>
      <rect x="22" y="104" width="74" height="48" rx="12"/><rect x="150" y="104" width="74" height="48" rx="12"/>
      <rect x="86" y="166" width="74" height="38" rx="12"/>
    </g>
    <g fill="#f3b64d"><circle cx="59" cy="56" r="9"/><circle cx="187" cy="56" r="9"/><circle cx="59" cy="128" r="9"/><circle cx="187" cy="128" r="9"/><circle cx="123" cy="185" r="8"/></g>
  </g>
  <path d="M487 293h55" stroke="#23a8c4" stroke-width="4" marker-end="url(#arrow)"/>
  <text x="500" y="319" text-anchor="middle" font-size="20" font-weight="700" fill="#32596b">pull string → curl</text>
</svg>'''


COMMON_CSS = r'''
@page { size: 24in 36in; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif; }
body { background: #dce2e8; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.poster { width: 24in; height: 36in; position: relative; overflow: hidden; padding: .68in; page-break-after: always; display:flex; flex-direction:column; justify-content:space-between; }
.poster:last-child { page-break-after: auto; }
.brand { display:flex; align-items:center; gap:20px; font-size:27px; font-weight:900; letter-spacing:.09em; }
.mark { width:58px; height:58px; display:grid; place-items:center; border-radius:17px; font-size:25px; letter-spacing:-.04em; font-weight:950; }
.brand-tag { margin-left:auto; padding:12px 18px; border-radius:999px; font-size:18px; letter-spacing:.11em; font-weight:850; }
.eyebrow { text-transform:uppercase; letter-spacing:.17em; font-weight:900; font-size:20px; }
h1,h2,h3,p { margin-top:0; }
h1 { letter-spacing:-.055em; line-height:.96; }
h2 { letter-spacing:-.035em; line-height:1.03; }
p { line-height:1.3; }
.pill { display:inline-block; border-radius:999px; padding:11px 17px; font-size:18px; letter-spacing:.12em; text-transform:uppercase; font-weight:900; }
.footer { position:static; left:auto; right:auto; bottom:auto; display:flex; align-items:center; justify-content:space-between; font-size:20px; flex:0 0 auto; }
.robot-art { width:100%; height:100%; }
.build-art { width:100%; height:auto; display:block; }
.code { font-family:Menlo,Consolas,monospace; letter-spacing:-.02em; }
@media screen { body { padding:26px; } .poster { margin:0 auto 26px; box-shadow:0 18px 55px rgba(0,0,0,.25); transform-origin:top center; } }
@media print { body { background:white; } .poster { margin:0; box-shadow:none; } }
'''


PITCH_CSS = r'''
.pitch { color:#f5f8fb; background: radial-gradient(circle at 78% 22%, #183650 0, #0b1c32 32%, #071426 70%); }
.pitch:before { content:""; position:absolute; inset:0; opacity:.14; background-image:linear-gradient(rgba(112,202,227,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(112,202,227,.2) 1px,transparent 1px); background-size:70px 70px; mask-image:linear-gradient(to bottom,black,transparent 75%); }
.pitch > * { position:relative; z-index:1; }
.pitch .mark { background:#39d5f0; color:#071426; }
.pitch .brand-tag { color:#bbd0df; background:#132d45; }
.pitch .hero { display:grid; grid-template-columns:1.08fr .92fr; gap:30px; min-height:860px; align-items:center; margin-top:38px; }
.pitch .eyebrow { color:#7ce6f3; }
.pitch h1 { font-size:126px; margin:27px 0 26px; }
.pitch h1 span { color:#ffce6a; }
.pitch .lede { max-width:870px; font-size:43px; color:#d5e4ee; line-height:1.24; }
.pitch .robot-wrap { height:820px; }
.pitch .question { margin-top:15px; color:#a8bfd0; font-size:30px; }
.pitch .section-title { font-size:48px; margin-bottom:30px; }
.pitch .flow { margin-top:30px; min-height:480px; }
.pitch .flow-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:22px; }
.pitch .flow-card { min-height:270px; padding:34px 33px; border:1px solid #27445c; border-radius:25px; background:rgba(16,39,60,.86); }
.pitch .flow-card .num { color:#56dff2; font-size:18px; font-weight:900; letter-spacing:.15em; }
.pitch .flow-card h3 { font-size:35px; margin:18px 0 11px; }
.pitch .flow-card p { font-size:28px; color:#b8cbd9; margin:0; }
.pitch .demo { display:grid; grid-template-columns:1.15fr .85fr; gap:28px; align-items:center; margin-top:22px; padding:40px 44px; min-height:300px; border-radius:30px; background:linear-gradient(115deg,#163a55,#0f2b42); border:1px solid #34637d; }
.pitch .demo h2 { font-size:48px; margin:0 0 15px; }
.pitch .demo p { font-size:29px; color:#d1e1eb; margin:0; }
.pitch .mission { display:flex; justify-content:center; align-items:center; gap:20px; font-size:29px; font-weight:850; color:#ffdc89; }
.pitch .mission .arrow { color:#53d8ef; font-size:42px; }
.pitch .gift { width:88px;height:82px;background:#d52345;border-radius:9px;position:relative;box-shadow:inset 0 -8px 0 rgba(70,0,12,.15); }
.pitch .gift:before { content:"";position:absolute;left:37px;top:0;width:14px;height:100%;background:#f8ca54; }
.pitch .gift:after { content:"";position:absolute;left:0;top:27px;width:100%;height:12px;background:#f8ca54; }
.pitch .gift span { position:absolute;top:-23px;left:31px;width:27px;height:20px;border:6px solid #f8ca54;border-radius:50% 50% 5px 50%;transform:rotate(-24deg); }
.pitch .usecases { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:22px; }
.pitch .usecase { min-height:230px; padding:27px 30px; border-radius:22px; background:#10263d; border:1px solid #27445c; }
.pitch .usecase b { display:block; color:#ffcf69; font-size:27px; margin-bottom:11px; }
.pitch .usecase p { color:#c3d4df; font-size:25px; margin:0; line-height:1.25; }
.pitch .truth { margin-top:18px; padding:20px 23px; border-radius:16px; background:#132a40; font-size:24px; line-height:1.3; color:#b9cbd7; }
.pitch .footer { color:#8fa8ba; border-top:1px solid #294057; padding-top:17px; }
'''


TECH_CSS = r'''
.tech { color:#13263b; background:#f4f8fb; }
.tech .mark { color:white; background:#146da5; }
.tech .brand-tag { color:#246081; background:#d9edf4; }
.tech .hero { display:flex; justify-content:space-between; align-items:end; margin:35px 0 22px; min-height:300px; }
.tech .hero h1 { font-size:100px; margin:13px 0 0; }
.tech .hero p { width:720px; margin:0 0 6px; font-size:34px; color:#557084; }
.tech .eyebrow { color:#127ca1; }
.tech .pipeline { border-radius:28px; padding:34px; min-height:420px; background:#10243a; color:white; }
.tech .pipeline-title { display:flex; align-items:center; gap:16px; font-size:33px; font-weight:900; margin:0 0 26px 5px; }
.tech .pipeline-title:before { content:""; width:12px; height:12px; border-radius:50%; background:#4ce0db; box-shadow:0 0 16px #4ce0db; }
.tech .steps { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; }
.tech .step { min-height:290px; padding:25px 22px; background:#173650; border:1px solid #2b5771; border-radius:20px; position:relative; }
.tech .step:not(:last-child):after { content:"›"; position:absolute; right:-17px; top:62px; z-index:2; color:#54d9df; font-size:44px; font-weight:900; }
.tech .step .num { color:#65e5df; font-size:16px; letter-spacing:.13em; font-weight:900; }
.tech .step h3 { font-size:32px; margin:16px 0 10px; color:#fff; }
.tech .step p { color:#c2d5e0; font-size:26px; margin:0; line-height:1.25; }
.tech .columns { display:grid; grid-template-columns:1fr 1fr; gap:25px; margin-top:18px; }
.tech .card { padding:34px 38px; border-radius:25px; background:white; border:1px solid #d8e3ea; box-shadow:0 8px 22px rgba(24,62,87,.07); }
.tech .columns > .card { min-height:630px; }
.tech .card h2 { font-size:41px; margin:0 0 22px; }
.tech .card p { font-size:28px; color:#486176; margin:0 0 18px; line-height:1.3; }
.tech .card p:last-child { margin-bottom:0; }
.tech .formula { display:flex; align-items:center; justify-content:center; margin:27px 0; min-height:145px; border-radius:18px; color:#0d4c71; background:#e9f8fb; font-family:Georgia,serif; font-size:46px; }
.tech .landmarks { display:flex; align-items:center; justify-content:center; gap:13px; margin:16px 0; }
.tech .landmarks .dot { width:20px;height:20px;border-radius:50%;background:#17a5c4;box-shadow:0 0 0 7px #d6f5f6; }
.tech .landmarks .line { width:100px;height:7px;background:#41657a;border-radius:999px;transform:rotate(-10deg); }
.tech .mapping { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:16px; }
.tech .metric { padding:18px 20px; border-radius:17px; background:#eff5f8; }
.tech .metric b { display:block; font-size:32px; color:#0d658a; margin-bottom:8px; }
.tech .metric span { font-size:24px; color:#5a7181; }
.tech .data-strip { display:grid; grid-template-columns:.92fr 1.08fr; gap:24px; margin-top:18px; }
.tech .data-strip > .card { min-height:330px; }
.tech .safety { background:#fff4e4; border-color:#f0d6a5; }
.tech .safety h2 { color:#854c11; }
.tech .safety strong { color:#a05d0a; }
.tech .data { color:white; background:#126c8d; border:0; }
.tech .data h2 { color:white; }
.tech .data p { color:#e0f5f7; }
.tech .truth { margin-top:14px; padding:22px 26px; border-left:8px solid #e3a742; border-radius:8px 18px 18px 8px; background:#fff7e7; font-size:25px; line-height:1.3; color:#67461e; }
.tech .footer { color:#557084; border-top:1px solid #cbd8e0; padding-top:17px; }
'''


BUILD_CSS = r'''
.build { color:#332719; background:#fffaf1; }
.build .mark { color:white; background:#bc492b; }
.build .brand-tag { color:#85502c; background:#f3e4ca; }
.build .hero { margin:22px 0 12px; display:flex; justify-content:space-between; align-items:end; min-height:220px; }
.build .eyebrow { color:#b34a2d; }
.build .hero h1 { max-width:1400px; font-size:100px; margin:12px 0 16px; }
.build .hero p { color:#705b43; font-size:34px; margin:0; }
.build .build-art { margin:12px 0 17px; }
.build .columns { display:grid; grid-template-columns:.92fr 1.08fr; gap:23px; }
.build .card { padding:32px 34px; border:1px solid #ead9bf; border-radius:24px; background:white; }
.build .card h2 { margin:0 0 20px; font-size:39px; }
.build .materials { background:#f9eedc; }
.build .materials ul { list-style:none; padding:0; margin:0; display:grid; grid-template-columns:1fr 1fr; gap:10px 15px; }
.build .materials li { font-size:27px; line-height:1.22; padding-left:29px; position:relative; color:#60492e; }
.build .materials li:before { content:"✓"; position:absolute; left:0; color:#2b8469; font-weight:900; }
.build .steps { display:grid; grid-template-columns:1fr; gap:18px; }
.build .build-step { display:grid; grid-template-columns:68px 1fr; gap:18px; align-items:start; }
.build .build-step .num { width:60px;height:60px;display:grid;place-items:center;border-radius:18px;background:#b94c2d;color:white;font-size:30px;font-weight:900; }
.build .build-step h3 { font-size:30px; margin:2px 0 5px; }
.build .build-step p { color:#725d45; font-size:25px; margin:0; line-height:1.28; }
.build .wiring { margin-top:18px; display:grid; grid-template-columns:1.1fr .9fr; gap:23px; align-items:stretch; }
.build .wiring-card { background:#13273d;color:#f5f8fb;border:0; }
.build .wiring-card h2 { color:#fff; }
.build table { width:100%; border-collapse:collapse; font-size:28px; }
.build th { color:#78e2ee; text-align:left; padding:12px 9px; border-bottom:1px solid #456078; font-size:22px; text-transform:uppercase; letter-spacing:.08em; }
.build td { padding:12px 9px; border-bottom:1px solid #2a4057; }
.build .power { margin-top:18px; padding:21px; border-radius:15px; background:#253d54; color:#d5e6ed; font-size:25px; line-height:1.3; }
.build .setup { background:#fff; }
.build .codeblock { margin:13px 0; padding:16px 19px; border-radius:12px; background:#14283d; color:#8fecdb; font:23px/1.4 Menlo,Consolas,monospace; }
.build .setup p { font-size:26px; color:#6b5741; line-height:1.3; }
.build .warning { display:grid; grid-template-columns:1.18fr .82fr; align-items:center; gap:24px; min-height:240px; margin-top:18px; padding:24px 28px; border-radius:20px; background:#fff0df; border:2px solid #e7b772; }
.build .warning h2 { font-size:31px; margin:0 0 9px; color:#8d481a; }
.build .warning p { font-size:24px; line-height:1.28; color:#765027; margin:0; }
.build .repo-box { padding:20px 24px; border-radius:16px; background:#fffaf1; border:1px solid #e7c997; }
.build .repo-box strong { display:block; font-size:27px; color:#a7432a; margin-bottom:8px; }
.build .repo-box p { margin:0 0 8px; color:#634a2d; font-size:21px; }
.build .repo-url { color:#145f7c; font-size:24px; line-height:1.22; font-weight:800; word-break:break-word; }
.build .footer { color:#8b7558; border-top:1px solid #ead9bf; padding-top:14px; }
'''


PITCH = r'''<article class="poster pitch">
  <header class="brand"><span class="mark">CG</span><span>CYBERGRIP</span><span class="brand-tag">SCIENCE FAIR PROJECT</span></header>
  <section class="hero">
    <div>
      <div class="eyebrow">Hand tracking + robotics</div>
      <h1>WHAT IF YOUR<br><span>HAND COULD<br>MOVE A ROBOT?</span></h1>
      <p class="lede">A webcam turns finger movement into robot commands. No joystick needed.</p>
      <p class="question">Imagine moving a hot or hard-to-reach object while the robot does the reaching.</p>
    </div>
    <div class="robot-wrap">__ROBOT_ART__</div>
  </section>
  <section class="flow">
    <h2 class="section-title">From webcam to motion in four steps</h2>
    <div class="flow-grid">
      <div class="flow-card"><div class="num">01 / SEE</div><h3>Webcam</h3><p>The camera watches one hand move.</p></div>
      <div class="flow-card"><div class="num">02 / FIND</div><h3>21 landmarks</h3><p>A model estimates key points on the hand.</p></div>
      <div class="flow-card"><div class="num">03 / MAP</div><h3>Finger curl</h3><p>Code turns the points into five curl controls.</p></div>
      <div class="flow-card"><div class="num">04 / MOVE</div><h3>Robot twin</h3><p>A 3D hand follows the safe control values.</p></div>
    </div>
  </section>
  <section class="demo">
    <div><h2>See the idea come alive</h2><p>CyberGrip’s digital hand picks up a red package, carries it across, and drops it on a platform. A successful delivery reveals the specimen.</p></div>
    <div class="mission"><span class="gift"><span></span></span><span class="arrow">→</span><span>GRAB&nbsp; / &nbsp;CARRY&nbsp; / &nbsp;DROP</span></div>
  </section>
  <section class="usecases"><div class="usecase"><b>Remote robots</b><p>People can control machines from a safer place when a task is hot, risky, or hard to reach.</p></div><div class="usecase"><b>Hands-free controls</b><p>Gesture controls could give people another way to interact with computers and devices.</p></div><div class="usecase"><b>Try it in simulation</b><p>A digital model lets builders test an idea before adding motors and hardware.</p></div></section>
  <div class="truth"><strong>CyberGrip is a learning demo.</strong> These are possible applications, not results this project proves. The browser pickup is simulated; the optional cardboard build moves five fingers and is not medical or rescue equipment.</div>
  <footer class="footer"><span>CYBERGRIP · A hand-controlled robotics project</span><span>01 / THE PITCH</span></footer>
</article>'''


TECH = r'''<article class="poster tech">
  <header class="brand"><span class="mark">CG</span><span>CYBERGRIP</span><span class="brand-tag">HOW IT WORKS</span></header>
  <section class="hero"><div><div class="eyebrow">Inside the system</div><h1>FROM PIXELS<br>TO MOTION.</h1></div><p>One webcam image becomes five finger controls. Here is the path the data takes.</p></section>
  <section class="pipeline">
    <div class="pipeline-title">THE LIVE HAND-TRACKING PIPELINE</div>
    <div class="steps">
      <div class="step"><div class="num">01 · INPUT</div><h3>Webcam</h3><p>Captures a mirrored video frame. Python requests 640 × 480.</p></div>
      <div class="step"><div class="num">02 · VISION</div><h3>MediaPipe</h3><p>Finds 21 estimated landmarks on one visible hand.</p></div>
      <div class="step"><div class="num">03 · MATH</div><h3>Finger curl</h3><p>Vector angles are mapped to 0–90 curl commands.</p></div>
      <div class="step"><div class="num">04 · GATE</div><h3>Safe check</h3><p>Browser twin blocks a flagged pose or sudden wrist jerk.</p></div>
      <div class="step"><div class="num">05 · OUTPUT</div><h3>Two paths</h3><p>Three.js twin on screen, or Python serial → Arduino servos.</p></div>
    </div>
  </section>
  <section class="columns">
    <div class="card">
      <h2>How does code estimate a bend?</h2>
      <p>For a finger, the program uses three landmark points. Two vectors meet at the middle joint.</p>
      <div class="landmarks"><span class="dot"></span><span class="line"></span><span class="dot"></span><span class="line"></span><span class="dot"></span></div>
      <div class="formula">θ = cos⁻¹ ( u · v / |u| |v| )</div>
      <p>A straighter finger is near 180°. The code maps a chosen straight-to-curled range to a control value. It is an estimate from the camera, not a real joint-angle measurement.</p>
    </div>
    <div class="card">
      <h2>What the numbers mean</h2>
      <div class="mapping">
        <div class="metric"><b>21 points</b><span>MediaPipe hand landmarks</span></div>
        <div class="metric"><b>5 channels</b><span>Thumb, index, middle, ring, pinky</span></div>
        <div class="metric"><b>0 → 90</b><span>Open-to-curled command values from Python</span></div>
        <div class="metric"><b>25% smoothing</b><span>Arduino eases toward each new target</span></div>
      </div>
      <p style="margin-top:16px">The serial bridge sends packets like <span class="code">&lt;45,90,90,85,70&gt;</span> at 115,200 baud.</p>
    </div>
  </section>
  <section class="data-strip">
    <div class="card safety"><h2>Safety layer</h2><p><strong>In the browser demo:</strong> a raised-middle-finger pose or sudden wrist jerk turns the check red and holds the robot at its last safe pose. The hand meters still show the unfiltered estimates.</p></div>
    <div class="card data"><h2>Science fair measurements</h2><p>The recorder collects 100 detected-hand results with processing delay, frame rate, finger-curl estimates, camera distance, and room-light input. Change one condition at a time and compare your own trials.</p></div>
  </section>
  <div class="truth"><strong>Important distinction:</strong> The browser safety gate and the Python/Arduino motor path are separate. The Python motor path does not currently include that same gesture/jerk block. The web pickup is simulated; only the optional maker build moves physical servos.</div>
  <footer class="footer"><span>MediaPipe estimates landmarks · CyberGrip code maps and displays them</span><span>02 / THE TECHNOLOGY</span></footer>
</article>'''


BUILD = r'''<article class="poster build">
  <header class="brand"><span class="mark">CG</span><span>CYBERGRIP MAKER BUILD</span><span class="brand-tag">CARDBOARD + CODE</span></header>
  <section class="hero"><div><div class="eyebrow">Make the fingers move</div><h1>BUILD A CARDBOARD<br>ROBOT HAND.</h1><p>Five small servos pull strings to copy your tracked finger curl.</p></div></section>
  __CARDBOARD_ART__
  <section class="columns">
    <div>
      <div class="card materials"><h2>Gather these parts</h2><ul>
        <li>Arduino Uno or Nano</li><li>5 micro servos</li><li>Cardboard for palm + fingers</li>
        <li>5V, 2–3A external supply</li><li>USB data cable</li><li>Thread or thin string</li>
        <li>Rubber bands or elastic</li><li>Tape, glue, scissors</li>
        <li>Computer + webcam</li><li>Jumper wires</li>
      </ul></div>
      <div class="card" style="margin-top:18px"><h2>Build in 4 steps</h2><div class="steps">
        <div class="build-step"><span class="num">1</span><div><h3>Cut the hand</h3><p>Trace a palm and five cardboard fingers. Add tape hinges at each finger joint so they can bend.</p></div></div>
        <div class="build-step"><span class="num">2</span><div><h3>Thread the fingers</h3><p>Tape a string near each fingertip and route it behind the finger to a servo horn. Use elastic to reopen it.</p></div></div>
        <div class="build-step"><span class="num">3</span><div><h3>Mount the servos</h3><p>Secure five servos to a cardboard wrist/base. Start with loose strings; tighten only a little at a time.</p></div></div>
        <div class="build-step"><span class="num">4</span><div><h3>Test gently</h3><p>Keep the hand clear, then move one finger slowly. Adjust the string before trying the full hand.</p></div></div>
      </div></div>
    </div>
    <div class="card wiring-card">
      <h2>Wire five servos</h2>
      <table><thead><tr><th>Finger</th><th>Signal wire</th></tr></thead><tbody>
        <tr><td>Thumb</td><td>D3</td></tr><tr><td>Index</td><td>D5</td></tr><tr><td>Middle</td><td>D6</td></tr><tr><td>Ring</td><td>D9</td></tr><tr><td>Pinky</td><td>D10</td></tr>
      </tbody></table>
      <div class="power"><b>Power matters:</b> all servo red wires → external +5V. All brown/black wires → supply GND. Connect Arduino GND to that same GND. Keep the Arduino on USB for data. <b>Do not power five servos from the Arduino 5V pin.</b></div>
      <div class="codeblock">Servo signal colors are often:<br>yellow/orange = signal · red = +5V<br>brown/black = GND<br><small>Check your servo label/wire guide.</small></div>
    </div>
  </section>
  <section class="wiring">
    <div class="card setup"><h2>Load the project code</h2>
      <p><b>1.</b> In Arduino IDE, open <span class="code">arduino/servo_controller.ino</span>, choose Uno/Nano + port, then upload.</p>
      <p><b>2.</b> In <span class="code">python_pipeline</span>, install packages:</p><div class="codeblock">python3 -m pip install -r requirements.txt</div>
      <p><b>3.</b> Start the webcam tracker:</p><div class="codeblock">python3 tracker.py</div>
      <p><b>4.</b> Press <span class="code">s</span> in the video window to connect to the Arduino. Press <span class="code">q</span> to quit.</p>
    </div>
    <div class="card setup"><h2>What the maker build does</h2><p>Python estimates five finger-curl values from the webcam. The serial bridge sends them to the Arduino. The Arduino smooths the values and moves five servos.</p><p><b>This build copies finger motion only.</b> It does not include the browser twin’s arm or gift pickup, and the physical Python path does not have the browser demo’s gesture safety filter.</p></div>
  </section>
  <section class="warning">
    <div><h2>Build safely with an adult</h2><p>Unplug servo power before changing wires or strings. Keep fingers clear of pinches. Use the external 5V supply, check servo travel, and stop if anything gets hot or strains. Adult help for cutting and wiring.</p></div>
    <div class="repo-box"><strong>Get the code</strong><p>Type this address to open the project files:</p><a class="repo-url" href="https://github.com/kcmagik-blip/cybergrip-lab">github.com/kcmagik-blip/cybergrip-lab</a></div>
  </section>
  <footer class="footer"><span>Cardboard is a prototype: test one servo at a time before adding all five.</span><span>03 / THE MAKER BUILD</span></footer>
</article>'''


def write_poster(filename, title, body, extra_css=""):
    doc = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{html.escape(title)}</title><style>{COMMON_CSS}{extra_css}</style></head><body>{body.replace('__ROBOT_ART__', ROBOT_ART).replace('__CARDBOARD_ART__', CARDBOARD_ART)}</body></html>'''
    (OUT / filename).write_text(doc, encoding="utf-8")


def main():
    write_poster("01-project-pitch.html", "CyberGrip | The Pitch", PITCH, PITCH_CSS)
    write_poster("02-how-it-works.html", "CyberGrip | How It Works", TECH, TECH_CSS)
    write_poster("03-cardboard-maker-build.html", "CyberGrip | Cardboard Maker Build", BUILD, BUILD_CSS)
    write_poster(
        "00-printable-poster-set.html",
        "CyberGrip | Three Science Fair Posters",
        PITCH + TECH + BUILD,
        PITCH_CSS + TECH_CSS + BUILD_CSS,
    )
    print(f"Created three 24×36 inch poster sources in {OUT}")
    print(f"GitHub project link: {REPO_URL}")


if __name__ == "__main__":
    main()
