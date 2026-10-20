import OBR, { buildBillboard } from "@owlbear-rodeo/sdk";
import { createController } from "./controller";
import { ID } from "./model";

OBR.onReady(() => {
  const storage = {
    getItem: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
    setItem: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* unavailable */ } },
  };
  const controller = createController(OBR, (source, dpi) =>
    buildBillboard(source.image, { dpi, offset: { x: 0, y: 0 } })
      .id(`${ID}/portrait`)
      .name("Token Portrait")
      .layer("POPOVER")
      .locked(true)
      .disableHit(true)
      .disableAutoZIndex(true)
      .zIndex(1_000_000)
      .visible(true)
      .metadata({ [ID]: true })
      .build(), storage);
  void controller.start().catch(console.error);
  window.addEventListener("pagehide", () => { void controller.stop().catch(console.error); }, { once: true });
});
