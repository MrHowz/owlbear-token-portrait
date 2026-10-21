# QA 1.3.0 inventory

- One Portrait context entry with `embed: /panel.html`, height 360, no onClick tool activation.
- No new Tool/Mode/Action registration; remove v1.2 toolbar items during migration.
- All controls in the context embed: side, size, visibility, native library picker, HTTPS URL, clear.
- Shared theme colors and plain form controls; native menu host supplies submenu navigation.
- Screen-fixed portrait and existing per-token mappings preserved.
- Preferences update the background through LOCAL broadcast, request/state handshake.
- Binding captures original selection; cancellation, scene change, target deletion and selection change cannot write to new targets.
- Visual checks at 320x360 and 280px width; controls/status fit with no horizontal overflow.
- Browser E2E adapter checks all settings, picker replacement/cancel, HTTPS success/error, clear and preference persistence.
- Actual Owlbear menu positioning/picker lifecycle remains a separate host integration check.

## Results 2026-10-22
- 11 unit tests passed; TypeScript/Vite and manifest validation passed (95/128 description characters).
- Browser adapter exercised the production panel: side changes, visibility full cycle, all three sizes (180/240/300), native picker adapter cancellation/replacement, HTTP rejection, valid HTTPS image save, broken image rejection and clear mapping.
- Preferences broadcast reached the background: portrait moved to x=84 on left, hide removed the frame, restore recreated it.
- 31.239-second exploratory pass, 26 repeated preference cycles, no browser errors.
- Visual review: theme dark at 320x360 and light at 280x360; no horizontal overflow, clipping or illegible controls. Bodies measured 320/280px client and scroll width, height 303px; status bottom 283.8px fits inside the 360px embed.
- Host placement and native picker inside actual signed-in Owlbear have not been verified. No new deployment was performed.
- Evidence: qa/evidence-1.3.0/context-panel.png and panel-fit.png. Temporary browser tabs/dev server closed after checks.
