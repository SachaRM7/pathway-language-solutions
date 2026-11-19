# Pathway R4 — motion flow only

A continuous master timeline replacing R3's event-based stop/start traversal. Existing brand assets, copy, composition and narrative are retained. No sound or final polish.

## Single driver

`src/index.tsx` integrates a positive velocity field over the full 39-second journey. Four broad Gaussian speed regions modulate travel; none are semantic-event easing blocks. A single terminal envelope decelerates between 34.5 and 39 s. Position comes from the integral, normalized to the connected path's arc length. The numerical integration uses C1 Hermite reconstruction with matched endpoint velocities. `lineVelocity(t)` is the derivative of this actual distance function, not a separate illustrative curve.

Content reveals react to distance thresholds, with anticipation. The camera is one C1 Hermite rail parameterized by the same arc distance. Its waypoint tangents are shared; shot boundaries do not restart camera easing. The ink window travels continuously and contracts only for the final logo.

Two abrupt reversals in R3's route are made tangent-continuous; the A2 circle becomes a three-quarter open gesture with a tangent exit. These are geometric necessities for nonzero velocity, not new visual scenes. The official terminal logo cubics are unchanged.

## Reproduce

```sh
npm ci
npm run check
node diagnose.cjs
python plot-diagnostics.py
node render.mjs video
node render.mjs seams
python verify-export.py
```

Node / Remotion 4.0.519, Python with matplotlib / numpy, FFmpeg / FFprobe. In the hosted Work runtime, prepend `--require ../render-compat.cjs` to the Node render command to handle its network-interface enumeration issue.

Composition `MASTER-R4-FLOW`: 1920 × 1080, 30 fps, 1260 frames. Review render: 1280 × 720, 42 s, muted. `WINDOW-01`, `WINDOW-02`, `WINDOW-03` are master windows 0–15, 15–28 and 28–42 s. Each evaluates the absolute master frame number; none owns an independent progress or easing state.

Diagnostics are sampled at 240 Hz. CSV includes physical arc distance, its derivative, normalized progress, projected screen-tip speed and camera coordinates. R3 comparison is computed from the exact preserved source bundled as `references/R3-index.tsx`. R4 renders themselves have no dependency on R3.

`render.mjs seams` renders six frames twice: as master frames and as window frames, on both sides of the two boundaries. `verify-export.py` compares the PNG bytes, verifies the MP4 and records tangent continuity, velocity and the exact official logo curve. No independent module export is needed to establish that their rendering state is identical.

R3, R2 and V1 remain unchanged. Review only; do not merge the draft PR or begin final polish.
