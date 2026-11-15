# Campus: Bencho motion adaptation

final result: passed

Validated on 15 November 2026. The implementation adapts the four selected free Bencho blocks to the existing Campus application with CSS, requestAnimationFrame and the Web Animations API. No React or animation library is added to the application.

## Reference and intended adaptation

Source: [cabralorenzo/bencho at c659924](https://github.com/cabralorenzo/bencho/tree/c65992417427bb09e661674ffa800bef29adef49/blocks). The MIT notice is retained in [campus/vendor/BENCHO-LICENSE.txt](campus/vendor/BENCHO-LICENSE.txt).

| Reference | Campus use | Preserved behavior |
| --- | --- | --- |
| Seek | Existing unit and vocabulary search | 48 px circle, 90 ms press, spring expansion to 240 px where space permits, progressive text reveal, magnetic hover |
| Rolling counter | Daily XP, total XP, lesson results | Digit strips, carry stagger of 45 ms, spring, velocity blur, new digit reveal |
| Checklist | Daily and weekly objectives, completed lesson tasks | Spring fill, drawn tick, delayed strike-through and label fade |
| Card swap | Review cards after a successful rating save | 34/-26/-70 px slots, 6° skew, 600 ms transition, cubic-bezier(.22, 1, .36, 1) |

Campus keeps its Spanish interface, French learning content, Plus Jakarta Sans, pastel cards, theme tokens and existing navigation. Review cards retain their answer flip and rating controls; three upcoming cards are shown. Check marks reflect saved progress. On narrow screens, search expands within the available toolbar width. These are intentional integration choices, rather than a full-page visual clone of Bencho.

## Visual comparison

The original React components and the native adaptations were rendered side by side in Chromium at 1000 × 1500, device scale factor 1. Both columns used the same neutral colors, Arial and reference component dimensions. Card photographs were hidden in both columns; no photographs or Pro components are included in Campus. The counter comparison normalizes digit height to the original 46 px.

- [Resting state, source and adaptation](docs/campus-motion/comparison-rest.png)
- [Expanded search, completed check and counter carry](docs/campus-motion/comparison-active.png)
- [Recorded motion samples](docs/campus-motion/measurements.txt)

Separate browser pages with synchronized Playwright clocks were used to compare positions during the animation, not just the end state:

| Motion | Samples | Result |
| --- | --- | --- |
| Search width | 9 samples, including overshoot and settling | Maximum difference: 0 px |
| Check fill scale | 7 samples, including overshoot | Maximum difference: 0 |
| Counter 99 → 100 | 6 samples across three digit strips | Maximum vertical position difference: 0 px |
| Card transforms | 6 samples across four cards | Maximum matrix coefficient difference: 0.018; translation differences below 0.02 px |

The observations establish parity for these sampled sequences and reference settings. They do not claim pixel identity between the entire Campus interface and Bencho, or across different browser rendering engines.

## Campus checks

Automated browser checks use the real Campus HTML, CSS and application module with synthetic students and intercepted backend responses. They run at 1440 × 1000 and 390 × 1000 in light mode, and 360 × 1000 in dark mode, all at device scale factor 1. Fonts are awaited before screenshots.

| Surface | Final assessment |
| --- | --- |
| Layout and responsive behavior | Search and result menu stay within the viewport; header controls fit; review stack has no horizontal overflow. |
| Typography | Existing Campus font is preserved; rolling digits use tabular numbers and scale with their existing XP context. |
| Color and shape | Campus light/dark and pastel tokens are retained; effect geometry matches the normalized references. |
| Assets and copy | Source lens and tick geometry are retained under MIT; Campus icons, labels and learning text are preserved. No new stock imagery. |
| Interaction | Accented search, empty results, escaped user text, arrow navigation, Enter activation and Escape handling are wired to existing search actions. Search keys do not reach review shortcuts. |
| Review integrity | Failed saves keep the current card; controls are disabled during save/animation; repeated keyboard input does not submit twice; grade 0 preserves requeue order. |
| Accessibility | Search opens from a native labeled button; focus moves into the input and returns on Escape; background cards are inert; XP has readable text; reduced motion resolves directly to the final state. |
| Lifecycle | View changes dispose listeners and animation frames; logout clears motion state. |

Integration issues corrected during verification: search focusout during opening, mobile toolbar wrapping, and search-result keyboard events reaching review shortcuts.

Final Campus captures:

- [Desktop search](docs/campus-motion/search-desktop.png)
- [Mobile search](docs/campus-motion/search-mobile.png)
- [Mobile review, dark theme](docs/campus-motion/review-mobile-dark.png)
- [Lesson result, reduced motion](docs/campus-motion/result-reduced.png)

## Validation and reproduction

Passed: JavaScript syntax checks, `git diff --check`, `npm run build`, `node scripts/verify-site.mjs`, and `scripts/verify-campus-motion.cjs` at all three viewport sizes. No page JavaScript errors were observed.

To reproduce the Campus checks, make the `playwright` Node package available in the test environment and install its Chromium browser, or supply an existing Chromium executable. Serve the repository in one terminal:

```sh
python -m http.server 4173
```

Run in another terminal:

```sh
node scripts/verify-campus-motion.cjs
# Optional: CHROMIUM_PATH=/usr/bin/chromium
# Optional: PATHWAY_PREVIEW_URL=http://127.0.0.1:4173
# Optional: MOTION_QA_DIR=/tmp/pathway-motion-qa
```

Test hooks are appended only by the browser fixture; production files contain no test hooks. These checks do not use a live account or validate production backend responses. Physical iOS/Safari testing remains outside this verification; input focus is deliberately synchronous with the opening gesture to support mobile keyboards.
