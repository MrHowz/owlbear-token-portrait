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
