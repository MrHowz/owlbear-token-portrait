import type OBR from "@owlbear-rodeo/sdk";
import type { Billboard, Image, Item } from "@owlbear-rodeo/sdk";
import { chooseImage, defaults, ID, layout, settingsFrom, type Settings } from "./model.ts";

type Api = typeof OBR;
type MakeBillboard = (image: Image, dpi: number) => Billboard;

export function createController(api: Api, makeBillboard: MakeBillboard, storage: Pick<Storage, "getItem" | "setItem">) {
  let settings = { ...defaults };
  try { settings = settingsFrom(JSON.parse(storage.getItem(ID) ?? "null")); } catch { /* private browsing */ }
  let items: Item[] = [];
  let selection: string[] = [];
  let previous: string | undefined;
  let ready = false;
  let epoch = 0;
  let busy = false;
  let pendingRender = Promise.resolve();
  let installed = false;
  let signature = "";
  let dpi = 150;
  let role = "PLAYER";
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  let reported = false;
  const unsubscribers: (() => void)[] = [];

  function report(error: unknown) {
    console.error("Token Portrait:", error);
    if (!reported) {
      reported = true;
      void api.notification.show("Token Portrait: ไม่สามารถแสดงภาพได้ ลองเปิดฉากใหม่", "ERROR").catch(console.error);
    }
  }

  async function render() {
    if (busy || !ready || disposed) return;
    busy = true;
    let complete!: () => void;
    pendingRender = new Promise<void>(resolve => { complete = resolve; });
    const currentEpoch = epoch;
    try {
      const target = chooseImage(items, selection, previous);
      previous = target?.id;
      if (!target || !settings.enabled || (!target.visible && role !== "GM")) {
        if (installed) await api.scene.local.deleteItems([`${ID}/portrait`]);
        installed = false;
        signature = "";
        return;
      }
      const [width, height] = await Promise.all([api.viewport.getWidth(), api.viewport.getHeight()]);
      const rect = layout(width, height, target.image.width, target.image.height, settings);
      if (!rect) {
        if (installed) await api.scene.local.deleteItems([`${ID}/portrait`]);
        installed = false;
        signature = "";
        return;
      }
      const position = await api.viewport.inverseTransformPoint({ x: rect.x, y: rect.y });
      if (currentEpoch !== epoch || !ready || disposed) return;
      const next = makeBillboard(target, dpi);
      next.position = position;
      next.scale = { x: rect.ratio, y: rect.ratio };
      const nextSignature = JSON.stringify([target.id, target.image, position, rect.ratio, dpi]);
      if (nextSignature === signature) return;
      if (installed) {
        await api.scene.local.updateItems([next.id], drafts => {
          for (const draft of drafts) Object.assign(draft, next);
        });
      } else {
        await api.scene.local.addItems([next]);
        installed = true;
      }
      signature = nextSignature;
      reported = false;
    } catch (error) {
      if (ready && currentEpoch === epoch) report(error);
    } finally {
      busy = false;
      complete();
    }
  }

  async function setReady(value: boolean) {
    const currentEpoch = ++epoch;
    ready = false;
    previous = undefined;
    selection = [];
    items = [];
    signature = "";
    installed = false;
    if (!value || disposed) return;
    try {
      await pendingRender;
      if (currentEpoch !== epoch || disposed) return;
      installed = false;
      // Remove a stale local portrait left by a background-frame reload.
      await api.scene.local.deleteItems([`${ID}/portrait`]);
      const result = await Promise.all([
        api.scene.items.getItems(), api.player.getSelection(), api.scene.grid.getDpi(), api.player.getRole(),
      ]);
      if (currentEpoch !== epoch || disposed) return;
      [items, selection, dpi, role] = [result[0], result[1] ?? [], result[2], result[3]];
      ready = true;
      await render();
    } catch (error) { if (currentEpoch === epoch) report(error); }
  }

  async function change(patch: Partial<Settings>) {
    settings = settingsFrom({ ...settings, ...patch });
    try { storage.setItem(ID, JSON.stringify(settings)); } catch { /* session-only settings */ }
    await render();
  }

  async function start() {
    const menu = async (key: string, label: string, action: () => Promise<void>) => {
      await api.contextMenu.create({
        id: `${ID}/${key}`,
        icons: [{ icon: `/icons/${key}.svg`, label, filter: { some: [{ key: "type", value: "IMAGE" }] } }],
        onClick: () => { void action().catch(report); },
      });
    };
    await menu("left", "Portrait · มุมล่างซ้าย", () => change({ side: "left", enabled: true }));
    await menu("right", "Portrait · มุมล่างขวา", () => change({ side: "right", enabled: true }));
    await menu("hide", "Portrait · ซ่อนภาพ", () => change({ enabled: false }));
    await menu("size", "Portrait · เปลี่ยนขนาด เล็ก / กลาง / ใหญ่", async () => {
      const sizes = [180, 240, 300];
      const size = sizes[(sizes.indexOf(settings.size) + 1) % sizes.length];
      await change({ size });
      await api.notification.show(`Portrait: ${size}px`, "INFO");
    });
    unsubscribers.push(
      api.player.onChange(player => {
        selection = player.selection ?? [];
        role = player.role;
        void render();
      }),
      api.scene.items.onChange(value => { items = value; void render(); }),
      api.scene.grid.onChange(grid => { dpi = grid.dpi; signature = ""; void render(); }),
      api.scene.onReadyChange(value => { void setReady(value); }),
    );
    const initEpoch = epoch;
    const initialReady = await api.scene.isReady();
    if (initEpoch === epoch) await setReady(initialReady);
    // SDK 3.1 has no viewport change subscription. Serialize polling so slow
    // hosts never accumulate overlapping SDK calls. No writes when unchanged.
    const tick = async () => {
      await render();
      if (!disposed) timer = setTimeout(tick, 80);
    };
    timer = setTimeout(tick, 80);
  }

  async function stop() {
    disposed = true;
    ++epoch;
    clearTimeout(timer);
    unsubscribers.forEach(unsubscribe => unsubscribe());
    await pendingRender;
    if (ready) await api.scene.local.deleteItems([`${ID}/portrait`]);
    for (const key of ["left", "right", "hide", "size"]) await api.contextMenu.remove(`${ID}/${key}`);
  }
  return { start, stop, render, getSettings: () => ({ ...settings }) };
}
