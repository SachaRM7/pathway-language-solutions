# Pathway — signature motion revision R3

Focused revision of the approved three-film R2 sequence. Review motion pass only; no final sound or social formats. Spanish advertising, French pedagogical excerpt. Existing copy and local brand assets retained.

## Reproduce

```sh
npm ci
npm run check
npm run verify
npm run frames
npm run animatics
npm run assemble
```

Remotion 4.0.519, React 19.2.3. Node plus Python / Pillow / FFmpeg / FFprobe required. The Work runtime used for production needs `node --require ../render-compat.cjs render.mjs ...` to handle its network-interface enumeration limitation; an ordinary local setup does not.

Source canvas: 1920 × 1080, 30 fps. Review MP4s: 1280 × 720. `Pathway-R3-45s` is the global timeline; `VIDEO-01`, `VIDEO-02`, `VIDEO-03` expose the same function at offsets 0, 15 and 30 s. `MASTER-LONG-FORM` ends at 44 s.

`assemble.py` creates the three actual 450-frame MP4s, directly concatenates them, and removes only the final 30 static frames for the master. It compares decoded frame hashes to prove the master and individual exports share the same pictures. All MP4s have a front-loaded index and no audio.

## Motion implementation

`src/index.tsx` contains one connected SVG path. Named endpoints identify actions and drive content masks. The same deterministic `motionState(t)` controls every composition. The stroke tail advances monotonically; retired geometry cannot reappear during a hold. Camera positions follow semantic destinations. A2 stays one text node as it enters the unit header. The response annotation produces a practice label which is carried into the benefits composition.

The last two cubic curves are the unmodified official Pathway logo path, transformed into the scene. Its approach tangent is aligned; the body is revealed around that actual endpoint. Final composition is static from 41 s.

`verify-motion.cjs` checks all source frames for tip visibility, tail backtracking, final curve identity and static hold. `assemble.py` checks frame counts, codec output, absence of audio and exact picture continuity across exports. Generated technical reports live in `review/` locally and relevant checks are included with the review deliverables.

Read `deliverables/Pathway-R3-revue-motion.md` for the thirteen-point creative review, limitations, timing and precise deviations. `Pathway-R3-assets-manifest.json` lists every source asset and hash. No files in the earlier versions are modified.
