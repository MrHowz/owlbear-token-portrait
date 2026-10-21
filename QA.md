# QA 1.3.1 inventory

- Compare reference Edit Stats visual conventions: transparent body, Roboto, 8/10px corner radii, faint filled groups, 34px ghost rows, 32px outlined inputs, 8px side padding.
- Embedded height reduced from 360 to 280px; no extra solid panel background.
- All existing context-menu controls retain behavior and accessible names.
- Show/hide checkbox remains keyboard accessible through the full eye-icon row.
- Save icon has accessible name and tooltip; native selects retain keyboard navigation.
- Dark theme at 320px and 240px, light at 280px: screenshot and numeric bounds.
- Picker, URL save/error, visibility, side and size controls exercised through the production panel in SDK adapter.
- Production assets bundle Roboto locally; no Google Fonts request required. OFL license included.
- Existing 11 unit checks and build/manifest validation.
- Actual host iframe placement remains Owlbear-controlled; local adapter verifies panel styling.

## Results 2026-10-22
- Compared primary reference source from https://github.com/SeamusFinlayson/Bubbles-for-Owlbear-Rodeo (StatsMenuApp.tsx, editStatsStyle.css, NameInput.tsx, tailwind.config.js). Recreated its general visual conventions, without depending on that extension.
- Browser pass verified transparent canvas; an initial dark color-scheme canvas mismatch was found and fixed by using normal document color-scheme with explicit themed controls.
- Dark 320px and 240px, light 280px: document width equals scroll width; content height 254px and status bottom 250px fit within 280px. Screenshots reviewed without clipping, overflow or low-contrast text.
- Mouse row click and keyboard Space both toggled visibility correctly. Side selection full cycle and native library adapter cancel passed. Save icon submitted the form and displayed HTTP validation feedback.
- All existing accessible names retained; save icon includes accessible name and tooltip. Reduced-motion preference respected.
- 11 existing unit checks passed; final build/manifest validation passed.
- No new live deployment or host UI modification performed. Evidence: qa/evidence-1.3.1/themes.png and portrait-panel.png.
- Temporary QA tabs and dev server closed after checks.
