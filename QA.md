# QA 1.2.0 inventory

- One native Portrait tool, one default select mode, six native toolbar actions.
- One token context entry opens the tool group, preserving selected image IDs.
- All actions filtered to Portrait tool; no action icons leak into other tools.
- Side and visibility complete cycles; three sizes and tooltips reflect current metadata.
- Choose/Link/Clear disabled with no selected image; native picker cancel and scene-switch guards.
- URL entry reuses link.html; no new settings document, menu panel or styling in production.
- Previous linked portrait, fixed screen position and per-token metadata retained.
- Cleanup removes context entry, actions, mode, tool and editor popover.
- Browser adapter checks group open/close, control states and link/picker access.

The local SDK adapter cannot prove actual host toolbar placement or native Move-like drag; these require a signed-in Owlbear host. Production relies on documented native Tool/Mode/Action APIs.

## Results 2026-10-22
- TypeScript/Vite build and manifest check passed; 10 unit tests passed.
- Browser SDK adapter verified the one-entry context launcher, grouped actions, disabled image commands with no selection, side and visibility full cycles, all 3 sizes, cancelled native picker adapter and existing URL input access.
- All six action icon filters scope to Portrait. Unit test verifies cleanup removes context entry, tool actions, mode and tool.
- No new production settings HTML/CSS added. Existing link.html is reused.
- Actual Owlbear host toolbar placement and native drag still require host verification; adapter screenshots are not a host rendering signoff.
