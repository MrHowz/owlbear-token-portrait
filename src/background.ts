import OBR from "@owlbear-rodeo/sdk";
import { createController } from "./controller";
OBR.onReady(() => {
  const storage = {
    getItem: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
    setItem: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch {} },
  };
  const controller = createController(OBR, storage);
  void controller.start().catch(console.error);
  window.addEventListener("pagehide", () => { void controller.stop().catch(console.error); }, { once: true });
});
