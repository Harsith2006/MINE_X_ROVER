"""
Rover simulator — drives the dashboard without hardware.

  python simulate_rover.py [--server http://localhost:5000] [--rover RVR-01]

Loop (matches your spec):
  - Gas JSON  POST /api/rover/RVR-01/gas        {"gas_type":"CH4",...}  every ~2s
  - Temp      POST /api/rover/RVR-01/temperature                         every ~5s
  - Video     POST /api/rover/RVR-01/video/frame (multipart JPEG ~1/sec)
  - Model prediction is NOT posted — the backend feeds gas into the
    gas-safety-demo RandomForest itself and the dashboard shows it.

Gas scenario loops Safe -> Warning -> Danger so the prediction column moves.
Video frames are synthetic tunnel scenes (Pillow) with a timestamp overlay.
"""
import argparse
import io
import math
import time

import requests
from PIL import Image, ImageDraw

GAS_SCENARIO = [
    # (ch4, co, h2s, risk) — loops forever
    (4.2, 2.0, 1.0, "SAFE"),
    (800, 20, 5, "SAFE"),
    (1500, 35, 8, "WARNING"),     # CH4 warning
    (2500, 120, 12, "WARNING"),   # CH4+CO warning
    (6000, 150, 30, "DANGER"),    # CH4 danger
    (300, 300, 80, "DANGER"),     # CO+H2S danger
    (1200, 60, 15, "WARNING"),
    (5.0, 3.0, 1.5, "SAFE"),
]


def make_frame(w=640, h=400, label="RVR-01"):
    img = Image.new("RGB", (w, h), (11, 10, 8))
    d = ImageDraw.Draw(img)
    cx, cy = w // 2, h // 2 + 10
    for i, rx in enumerate([300, 240, 185, 135, 95, 60, 35]):
        shade = 20 + i * 12
        d.ellipse([cx - rx, cy - int(rx * 0.62), cx + rx, cy + int(rx * 0.62)],
                  outline=(shade + 30, shade + 20, shade))
    d.ellipse([cx - 22, cy - 15, cx + 22, cy + 15], fill=(5, 4, 3))
    ts = time.strftime("%H:%M:%S")
    d.text((12, 10), f"● LIVE  {label}  {ts}", fill=(255, 60, 60))
    d.text((12, h - 24), "CAM-01 · synthetic frame (replace with rover JPEG)",
           fill=(160, 170, 190))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=70)
    return buf.getvalue()


def post_gas(server, rover, gas_type, value, risk):
    r = requests.post(f"{server}/api/rover/{rover}/gas", json={
        "gas_type": gas_type, "value": value, "unit": "ppm", "risk_level": risk,
    }, timeout=5)
    r.raise_for_status()
    return r.json()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--server", default="http://localhost:5000")
    ap.add_argument("--rover", default="RVR-01")
    args = ap.parse_args()

    print(f"[sim] rover={args.rover} server={args.server}  (Ctrl+C to stop)")
    step = 0
    last_temp = 0.0
    while True:
        ch4, co, h2s, risk = GAS_SCENARIO[step % len(GAS_SCENARIO)]
        wobble = math.sin(time.time() / 3.0) * 0.05 + 1.0
        try:
            post_gas(args.server, args.rover, "CH4", round(ch4 * wobble, 1), risk)
            post_gas(args.server, args.rover, "CO", round(co * wobble, 1),
                     "WARNING" if co >= 50 else "SAFE")
            post_gas(args.server, args.rover, "H2S", round(h2s * wobble, 1),
                     "WARNING" if h2s >= 10 else "SAFE")
            pred = requests.get(
                f"{args.server}/api/rover/{args.rover}/prediction/latest", timeout=5).json()
            print(f"[sim] CH4={ch4} CO={co} H2S={h2s} -> "
                  f"model={pred.get('prediction')} risk={pred.get('riskLevel')} "
                  f"conf={pred.get('confidence')}%")

            if time.time() - last_temp > 5:
                temp = round(28.6 + math.sin(time.time() / 20.0) * 1.5, 1)
                requests.post(f"{args.server}/api/rover/{args.rover}/temperature",
                              json={"temperature": temp, "unit": "C"}, timeout=5)
                last_temp = time.time()

            # ~1/sec video frame (2 frames per 2s gas cycle)
            for _ in range(2):
                frame = make_frame(label=args.rover)
                requests.post(f"{args.server}/api/rover/{args.rover}/video/frame",
                              files={"frame": ("frame.jpg", frame, "image/jpeg")},
                              timeout=5)
                time.sleep(1)
        except Exception as e:
            print(f"[sim] backend not reachable ({e}); retrying in 2s…")
            time.sleep(2)
        step += 1


if __name__ == "__main__":
    main()
