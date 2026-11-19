# Pathway — Creative Gate 2A

This is a review prototype, not the polished final V2 advertisement.

- Concept A, “Le fil juste”.
- Spanish advertising copy; French pedagogical excerpt.
- 1920×1080 design coordinates, 30 fps, 600 frames.
- Review MP4s: 1280×720, 20 seconds, H.264, no audio.
- Timing A: final composition held over 16–20 s.
- Timing B: final composition held over 17–20 s; +0.4 s for entering A2 and +0.6 s for human guidance.
- The opening alternative C is used in both timing variants. Opening alternatives A and B are styleframes, not additional timing variants.

## Review material

See `deliverables/Pathway-Phase2A-review.md` for the seven explicit evaluation answers, remaining limitations, sources and differences from the Phase 1 proposal. The ten individual PNGs include three opening alternatives and seven representative frames of the working direction. All PNGs are 1920×1080.

`deliverables/Pathway-Phase2A-review.zip` is a portable review pack. It contains images, both animatics, review notes and the asset manifest, not the final advertisement.

## Reproduce

Requirements: Node.js, npm and a Remotion-supported Chrome/Headless Shell. This prototype uses the exact Remotion version already used for V1. Font files are local; no reference-video plates or remote imagery are used.

```sh
npm ci
npm run check
npm run frames
npm run animatics
```

`npm run studio` opens the composition for frame-by-frame review. The source is deliberately a single continuous composition. It does not switch between separate scene components.

The current Work runtime needs the existing workspace `render-compat.cjs` preload because its network-interface enumeration fails. That environment-specific compatibility shim is not required on an ordinary local installation and is not a creative dependency.

## Continuity model

The SVG path `continuous-guidance` persists throughout the film. Six cubic Bézier segments share a stable topology. At the exchange, the existing underline stays visible while the continuation is revealed along its arc length; this avoids interpolating the line through the letters. At the end, those six cubics are exact De Casteljau subdivisions of the two original logo cubics, with the original asset's scale and color. The remaining logo paths preserve the original SVG data.

No full-frame fade, blur, flash, cut or camera whip is used. Text reveals are local masks; the teaching phrases appear by whole-word blocks rather than simulated typing. The A2 marker persists between the pathway and the pedagogical surface. The main surface and camera share the same spatial coordinate system.

## Preservation / scope

V1 and the Phase 1 document remain unchanged. This directory is additive on the existing draft PR branch. Creative Gate 1 was approved with revisions. Creative Gate 2A has not been approved. No final music, final sound design, 9:16/1:1 adaptation, deployment or PR merge is included.
