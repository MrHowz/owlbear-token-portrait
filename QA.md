# QA inventory

The production extension has no custom settings panel. Its four controls are
registered with Owlbear's native token context menu.

| Claim / control | Functional check | Visual state / evidence |
| --- | --- | --- |
| Selected image appears | Select A then B using mouse and touch | Right corner, original aspect ratio |
| Left / right | Right → left → right, re-enable after hide | Both corners, desktop and mobile |
| Hide | Hide → select different image → right to restore | No residual image |
| Size | Large → small → medium → large | Bounds and no distortion |
| No selection / non-image | Clear selection, select shape | Portrait absent |
| Multi-selection | Select A, add B, remove A | Stable current image, then B |
| Transparent / click-through | Transparent asset and click beneath | No frame; underlying input responds |
| Viewport tracking | Pan / zoom / resize | Same screen corner, same pixel size |
| Scene lifecycle | Close / reopen, delete selected image | No stale portrait |
| Settings persistence | Reload | Same side, size, enabled state |
| Native Move / Measure movement | Requires live Owlbear room | Do not claim without live test |

Exploratory: rapid switching during hide/resize; tiny landscape viewport;
missing or invalid image dimensions; hidden token as PLAYER versus GM.

Local harness checks the actual controller through an SDK test adapter. It does
not prove Owlbear's rendering, native tool events, fog/layer behavior, or toolbar
placement. Live host signoff must be recorded separately.

## Results — 2026-10-21

- `npm test`: 6/6 passed. Includes layout/aspect ratio across 5 sizes, invalid
  dimensions, corrupt settings, multi-selection, deleted/hidden images, GM
  visibility, idle write suppression and a scene switch during an in-flight read.
- `npm run build`: TypeScript and production Vite build passed.
- Persistent Playwright session with installed Chrome: all four context-menu
  adapter controls exercised, including full size cycle and hide/re-enable.
  Mouse and mobile touch selection passed. Deselect/non-image selection,
  multi-select, delete, scene close/reopen, persistence and pan/zoom passed.
- Exploratory interaction: 32.2 seconds, 23 repeated cycles of side/hide/size,
  token switch, multi-select, deselect and pan/zoom. No page errors.
- Separate visual review: right and left desktop; right and left 390×844
  mobile; 844×390 landscape; native window as launched (1459×991 outer,
  1444×898 viewport). No portrait clipping, distortion, added frame, or
  overlap with the simulated side/bottom reserved strips in settled states.
  Native window and mobile document scroll dimensions equal their viewport.
- A screenshot taken immediately after a viewport resize initially caught
  stale positioning. Rechecked after the polling update and captured the
  settled landscape screenshot. This is why viewport-follow latency is
  explicitly documented, rather than claiming perfectly fixed positioning.
- Clicking a button under the portrait passed in the adapter. Real Owlbear
  hit-testing remains unverified; production sets SDK `disableHit: true`.
- Native Owlbear integration: NOT VERIFIED. The public site's Play Free
  link leads to account signup; the isolated QA browser has no signed-in room.
  Move/Measure movement and real tool occlusion are not signed off.
- Screenshots: `qa/screenshots/desktop-right.png`, `desktop-left.png`,
  `mobile-right.png`, `mobile-left.png`, `landscape.png`, `native-window.png`.
