import type OBR from "@owlbear-rodeo/sdk";
import { PORTRAIT_KEY, portraitFrom, type Portrait } from "./model.ts";

// A panel binds to the original selection, never a replacement selected while
// a library picker or network request is in flight.
export async function createPortraitBinding(api: typeof OBR) {
  let invalid = false;
  const unsubscribe = api.scene.onReadyChange(() => { invalid = true; });
  try {
    const selection = await api.player.getSelection() ?? [];
    const selectionKey = [...selection].sort().join("\n");
    const items = selection.length ? await api.scene.items.getItems(selection) : [];
    const targets = items.filter(item => item.type === "IMAGE");
    const ids = targets.map(item => item.id);
    let current = portraitFrom(targets[0]?.metadata[PORTRAIT_KEY]);
    async function validate() {
      if (invalid || !await api.scene.isReady()) throw new Error("ฉากเปลี่ยนแล้ว กรุณาเปิด Portrait ใหม่");
      const current = await api.player.getSelection() ?? [];
      if ([...current].sort().join("\n") !== selectionKey) throw new Error("Token ที่เลือกเปลี่ยนแล้ว กรุณาเปิด Portrait ใหม่");
      if (!ids.length) throw new Error("กรุณาเลือก Token ก่อน");
      const existing = await api.scene.items.getItems(ids);
      if (invalid || ids.some(id => !existing.some(item => item.id === id && item.type === "IMAGE"))) throw new Error("Token ถูกลบหรือฉากเปลี่ยน กรุณาเปิด Portrait ใหม่");
    }
    async function save(value: Portrait | null) {
      if (value && !portraitFrom(value)) throw new Error("ลิงก์หรือขนาดรูปภาพไม่ถูกต้อง");
      await validate();
      await api.scene.items.updateItems(ids, drafts => {
        if (invalid) throw new Error("ฉากเปลี่ยนแล้ว");
        for (const item of drafts) {
          if (value) item.metadata[PORTRAIT_KEY] = value;
          else delete item.metadata[PORTRAIT_KEY];
        }
      });
      current = value ?? undefined;
    }
    return {
      ids, targets,
      get current() { return current; },
      save,
      async choose() {
        await validate();
        const [asset] = await api.assets.downloadImages(false);
        if (!asset) return false;
        const portrait = portraitFrom(asset.image);
        if (!portrait) throw new Error("รูปภาพไม่ถูกต้อง");
        await save(portrait);
        return true;
      },
      dispose() { invalid = true; unsubscribe(); },
    };
  } catch (error) { unsubscribe(); throw error; }
}
