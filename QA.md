# QA 1.6.2 inventory

- Content ResizeObserver measures root (not body/MUI portals), debounces and reports only changed heights locally.
- Background upserts existing context menu height without replacing URL or registering extra tools/items.
- DM and PLAYER fit to their actual content, status wrap grows then shrinks the embed.
- Opening Select/Tooltip does not expand the embed; duplicate/invalid height input ignored and subscriptions clean up.
- Narrow 240px and standard 320px panels retain bottom padding and no content clipping.

# QA 1.6.1 inventory

- Live deployed /panel confirmed blank with TypeError null.addEventListener in old panel-C-jx5WTw.js, while HTML contained the new root div.
- Cause: GitHub web upload retains old src/panel.ts; extensionless imports prefer .ts over new .tsx.
- Restore src/panel.ts compatibility entry explicitly re-exporting ./panel.tsx so uploads overwrite old implementation.
- Verify production bundle renders MUI panel and contains no legacy querySelector/addEventListener controller.
- Existing regression tests and manifest validation/build.

# QA 1.6.0 inventory

- Replace handwritten controls with real MUI Select/MenuItem, TextField, Slider, Switch, Button, IconButton and Tooltip inside the same context embed.
- Palette follows OBR Theme API in dark/light mode; transparent iframe background preserved. No sidebar Tool.
- Dropdown renders themed MUI options rather than a native OS select; keyboard navigation works and menu fits iframe.
- Preferences: side, arbitrary numeric sizes/clamping, slider commit, personal visibility and persistence.
- Artwork: native asset picker choose/cancel, HTTPS save validation, clear; binding keeps original selection.
- Sharing toggle DM-only and role-checked; controller privacy/DM-one-portrait behavior unchanged.
- Fit 240/280/320px widths, both themes; status/error messages readable and no clipping.
- Regression tests/build plus browser UI actions and screenshots.

# QA 1.5.2 inventory

- Host popover transform/anchor origins BOTTOM; bottom coordinate preserves final 8px gap.
- Image starts below frame at translateY(110%), rises past final position and settles; no negative starting offset.
- Image waits 500ms for host opening transition; 520ms rise with 4% overshoot/1.5% settle.
- Reduced motion remains instant. DM single portrait and PLAYER shared visibility behavior unchanged.
- SDK adapter converts bottom-anchored coordinates back to frame top for geometry parity.

# QA 1.5.1 inventory

- GM has at most one personal portrait, even with its own sharing enabled or another GM presenting.
- PLAYER retains personal + shared art, opposite corners and hidden-token protections.
- Role change PLAYER to GM closes the extra shared popover; disabling personal display leaves no GM preview.
- Production portrait renderer animates upward after image load, slight overshoot, 440ms; final transform identity.
- Pan/zoom does not restart animation; broken images remain hidden; reduced-motion skips animation.
- QA renderer imports production module/CSS with only artwork URLs mapped to local samples.

# QA 1.5.0 inventory

- DM-only share toggle in existing Portrait submenu; no sidebar tool.
- Host role checked before publishing, host party role checked before rendering; spoofed player flag ignored.
- Personal and shared portraits coexist on opposite corners; recipient side/size preferences apply to both.
- Hidden eye flag, hidden attached parent, missing token, no artwork, no selection, DM leaving/demotion, closed scene all suppress sharing.
- Join with current DM selection loads sharing immediately; no portrait URL broadcast.
- Changing token, visibility or role while viewport lookup is pending must not open stale shared art.
- Pan stability; menu fit at 240/320px and both themes; shared toggle reflects current DM state.
- Narrow screens split available width to prevent the two portraits overlapping.
- Native eye hide only: fog/third-party per-user vision rules are not inferred from visible flag.

## Prior 1.4.0 checks

- Desktop: 8px bottom gap, stable screen placement during pan/zoom.
- Preserve reserved side strips and central 480px bottom dock on desktop; narrow screens keep vertical dock clearance.
- Continuous integer sizes from 32 to 1600px: number input, Enter/blur commit, native slider and keyboard steps.
- Slider updates the number while dragging and commits SDK changes on release.
- Old 180/240/300 preferences remain valid; invalid/NaN/out-of-range values normalize safely.
- Large portraits preserve aspect ratio and fit the available corner; no forced crop.
- All controls remain in the existing styled token context submenu; height 300px.
- Browser flow: numeric arbitrary size, small/large limits, slider keyboard, persistence, side switch, hide/restore, pan stability.
- Visual: desktop small/default/large and menu at dark 240/320px and light 280px width.
- Actual Owlbear toolbar geometry is not exposed by the SDK; the central dock reservation is conservative, not dynamic detection of every extension panel.

## Results

- 14 unit/controller/binding tests passed; TypeScript and production Vite build passed.
- Browser SDK adapter: numeric 64/537/1600, clamping 0 to 32 and 5000 to 1600; slider drag, Home/End and single-pixel keyboard increments verified.
- Numeric size persisted after reload; pan/zoom left portrait bounds and popover-open count unchanged.
- Desktop layout reserves the bottom dock and uses an 8px bottom gap; popover coordinates round down to avoid fractional-height overshoot.
- Panel fit: no horizontal overflow at dark 240/320px and light 280px; content height 275px within 300px embed.
- Large requested sizes auto-fit to available corner while preserving image aspect ratio.
- Evidence: `qa/evidence-1.4.0/size-controls.png`, `small.png`, `large-bottom.png`.
- Browser results use the local SDK adapter, not the live signed-in Owlbear host. Host embedding/image-picker lifecycle still require checking after deployment.

## 1.5.0 results

- 20 tests passed, including GM/PLAYER role enforcement, opposite-side sharing independent of personal enabled state, late join, GM disconnect/demotion, hidden/missing/deleted/unlinked tokens, hidden parents and scene closure.
- Delayed viewport test: hiding a token during pending render does not open stale shared artwork.
- TypeScript and Vite production build passed; manifest 1.5.0 validated.
- Browser adapter: DM toggle enabled sharing; PLAYER submenu had no DM toggle. Personal and remote DM art rendered together.
- Receiver switched personal side to left: personal x=84, shared x=1032 at 1280x720. Shared art disappeared on native-eye hide; personal art remained. Revealing restored shared art.
- Pan/zoom left shared bounds unchanged; no browser console errors.
- Dark 320/240px and light 280px panels: content height 313px within 340px embed, no horizontal overflow; screenshots reviewed.
- Evidence: `qa/evidence-1.5.0/dm-menu.png`, `player-opposite.png`, `dm-menu-fit.png`.
- Local SDK adapter only; actual multi-client Owlbear host, network timing and native embedding remain to verify after deployment. All participants must load the updated extension.

## 1.5.1 results

- 20 tests passed, including GM single personal display with sharing enabled, other GM presenting, hidden tokens, PLAYER-to-GM role transition and personal display disabled. PLAYER sharing protections and opposite-side behavior still pass.
- Browser adapter: DM sharing enabled with personal=true/shared=false; pan left popover opens at 1. PLAYER regression showed personal=true/shared=true.
- Production animation module/CSS imported by QA renderer. Reduced-motion default verified: class enter with animation none; explicit QA motion preview used the same production keyframes/timing and reported portrait-rise, 0.44s, final identity transform and opacity 1.
- Screenshot: `qa/evidence-1.5.1/dm-single.png`. No browser console errors observed.
- QA motion-preview override is limited to the QA page, not included in the production build. Actual Owlbear embedding/network behavior remains to verify after deployment.

## 1.5.2 results

- All 20 tests pass and production build succeeds. Controller test explicitly asserts both host origins BOTTOM and bottom anchor y=892 in a 900px viewport.
- Browser production-keyframes measurement (normal motion QA override): first sampled Y=483.619px below final position, overshoot=-17.5946px, final Y=0; 95 samples; risesFromBelow=true.
- SDK adapter bottom-anchor geometry at 1280x720: portrait top=412, bottom=712 (8px gap).
- Evidence: `qa/evidence-1.5.2/upward-measurement.png`, `bottom-portrait.png`.
- Native host transition was not reproduced in a signed-in live Owlbear room. Bottom origin and delayed inner animation address the top-origin host behavior; deployment needs live verification.

## 1.6.0 browser results

- Actual MUI dropdown list/options verified in production panel via local SDK adapter; mouse and ArrowUp/Enter selected the opposite side.
- Numeric 537 updated portrait; 5000 clamped to 1600. Slider Home/ArrowRight committed 32/33. Size 300 persisted after reload.
- Personal display off closed portrait; GM share switch updated state and no second GM portrait appeared.
- Native assets picker adapter chose Amber, clear removed artwork, cancel preserved unassigned state, Blue restored artwork. Unsafe HTTP link rejected with status message.
- PLAYER view had no DM control and still received shared portrait.
- Panel content height 299px within 340px embed at dark 320/240px and light 280px; no horizontal overflow. Dropdown appearance and theme contrast reviewed visually.
- Evidence: `qa/evidence-1.6.0/mui-dropdown.png`, `mui-themes.png`.
- Fixed initial palette fallback before Theme API resolves; final browser run has no component render errors.
- SDK/host embedding and live multi-user behavior remain to verify after deployment. Existing SDK uuid audit advisory is unchanged; new UI packages introduced no additional audit advisories.

## 1.6.1 results

- Local production preview of rebuilt /panel.html renders MUI Select, size input, slider, visibility switch, library/link/clear controls. No console errors. Controls correctly disabled outside an Owlbear SDK host.
- 20 regression tests passed, manifest 1.6.1 valid and TypeScript/Vite build successful.
- Source archive includes both src/panel.ts compatibility shim and src/panel.tsx implementation for overwrite-only GitHub upload.
- Evidence: qa/evidence-1.6.1/production-panel.png. Deployed site was inspected read-only and has not been updated by this task.

## 1.6.2 results

- 21 tests passed including content-height message validation, duplicate suppression, shrink/grow and cleanup.
- Browser SDK adapter: DM height 299px at 320/240px width; opening MUI dropdown retained 299px height.
- At 240px, two-line share status grew frame to 313px matching 312.85px content; short status shrank frame to 299px.
- PLAYER without DM switch measured 265px. No browser errors. Evidence: qa/evidence-1.6.2/compact.png.
- Live host menu upsert behavior still needs verification after deployment; same menu ID and embed URL retained, no remove/recreate cycle.
