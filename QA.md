# QA 1.4.0 inventory

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
