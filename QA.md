# QA 1.1.0 inventory

- Assigned portrait differs from token thumbnail; unassigned tokens show nothing.
- Screen position unchanged on camera pan/zoom; no popover reopen or camera API call.
- Both corners; 3 sizes; hide/re-enable; deselect; multi-select; deletion; scene reload.
- Native picker adapter: select, replace, cancel; scene switch while picker pending.
- Link editor: valid HTTPS image, invalid HTTP, broken image, save metadata without changing token image.
- Transparent portrait iframe and responsive fit; no border; desktop and small viewport.
- Exploratory: rapid selection/pan/hide and resize; invalid saved metadata.

Local test harness is an SDK adapter, not real Owlbear. Production popover host hit testing and native picker must be checked separately. Portrait iframe cannot promise click-through to the map.

## Results 2026-10-21

- 9 unit tests passed; production TypeScript/Vite build passed.
- Browser plugin used for mouse controls in SDK adapter at 1280x720.
- Pan/zoom: portrait bounds identical before/after (x 991.45, y 320, w 205, h 300), popover open count unchanged at 1. No camera transform calls allowed by adapter/tests.
- Selected Amber token displayed separate Blue artwork. Unassigned/cleared selection hides portrait.
- Left/right, hide/restore, 180/240/300 sizes, native-library adapter selection, clear mapping, multi-selection, deselection and scene close/reopen exercised.
- Actual URL editor: rejected HTTP, saved valid HTTPS image via metadata, rejected broken HTTPS image without replacing saved art. Actual production portrait renderer displayed the linked image.
- Separate screenshot review found no added border, distorted aspect ratio, portrait clipping or overlap with reserved simulated toolbar strips on desktop.
- Exploratory changes included repeated pan, corner switches, multi-selection, non-image and scene switches.
- Live Owlbear host integration remains unverified. This session's browser has no existing signed-in Owlbear tab. No live deployment performed.

- Compact 390x620 iframe viewport visually reviewed: portrait fully visible, no frame or distortion, reserved bottom/side areas clear. Numeric layout tests cover 390x844, 844x390, 320x568 and 240x240. Browser DOM scope does not expose nested contentDocument, so nested numeric inspection was unavailable.
- Browser QA tabs and local dev server closed after verification.
