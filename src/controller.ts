import type OBR from "@owlbear-rodeo/sdk";
import type { Item } from "@owlbear-rodeo/sdk";
import { chooseImage, defaults, ID, layout, settingsFrom, PORTRAIT_KEY, portraitFrom, type Settings } from "./model.ts";

import { createNativeUI } from "./native-ui.ts";

export function createController(api: typeof OBR, storage: Pick<Storage, "getItem" | "setItem">) {
  let settings = { ...defaults };
  try { settings = settingsFrom(JSON.parse(storage.getItem(ID) ?? "null")); } catch {}
  let items: Item[] = [], selection: string[] = [];
  let previous: string | undefined;
  let ready = false, disposed = false, epoch = 0, role = "PLAYER";
  let signature = "", open = false;
  let queue = Promise.resolve();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const unsubscribe: (() => void)[] = [];
  const menuIds = ["left", "right", "hide", "size", "choose", "link", "clear"];
  let nativeUI: Awaited<ReturnType<typeof createNativeUI>> | undefined;
  const popoverId = `${ID}/screen`;
  const report = (error: unknown) => {
    console.error("Token Portrait:", error);
    void api.notification.show("Portrait: ทำรายการไม่สำเร็จ ตรวจสิทธิ์แก้ไข Token และลิงก์ภาพ", "ERROR").catch(console.error);
  };
  const close = async () => {
    if (open) await api.popover.close(popoverId);
    open = false; signature = "";
  };
  async function draw() {
    await nativeUI?.sync(settings, ready && items.some(item => item.type === "IMAGE" && selection.includes(item.id)));
    if (disposed || !ready) { await close(); return; }
    const revision = epoch;
    const target = chooseImage(items, selection, previous);
    previous = target?.id;
    const portrait = portraitFrom(target?.metadata?.[PORTRAIT_KEY]);
    if (!target || !portrait || !settings.enabled || (!target.visible && role !== "GM")) { await close(); return; }
    const [width, height] = await Promise.all([api.viewport.getWidth(), api.viewport.getHeight()]);
    if (revision !== epoch || disposed || !ready) return;
    const rect = layout(width, height, portrait.width, portrait.height, settings);
    if (!rect) { await close(); return; }
    const next = JSON.stringify([portrait, rect.x, rect.y, rect.width, rect.height]);
    if (next === signature) return;
    // Screen coordinates only. NEVER read or compensate for the camera transform.
    await api.popover.open({
      id: popoverId, url: `/portrait.html#${encodeURIComponent(JSON.stringify(portrait))}`,
      width: Math.ceil(rect.width), height: Math.ceil(rect.height),
      anchorReference: "POSITION", anchorPosition: { left: rect.x, top: rect.y },
      anchorOrigin: { horizontal: "LEFT", vertical: "TOP" },
      transformOrigin: { horizontal: "LEFT", vertical: "TOP" },
      hidePaper: true, disableClickAway: true, marginThreshold: 0,
    });
    open = true; signature = next;
  }
  function render() {
    queue = queue.then(draw).catch(report);
    return queue;
  }
  async function setReady(value: boolean) {
    const revision = ++epoch;
    ready = false; items = []; selection = []; previous = undefined;
    await render();
    if (!value || disposed || revision !== epoch) return;
    // Migration: remove the v1 camera-follow billboard, including after reload.
    await api.scene.local.deleteItems([`${ID}/portrait`]);
    const result = await Promise.all([api.scene.items.getItems(), api.player.getSelection(), api.player.getRole()]);
    if (revision !== epoch || disposed) return;
    [items, selection, role] = [result[0], result[1] ?? [], result[2]];
    ready = true;
    await render();
  }
  async function change(patch: Partial<Settings>) {
    settings = settingsFrom({ ...settings, ...patch });
    try { storage.setItem(ID, JSON.stringify(settings)); } catch {}
    await render();
  }
  async function start() {
    // A previous background instance may have left a screen popover behind.
    await api.popover.close(popoverId);
    // Remove the scattered v1.1 entries when reloading an existing extension.
    for (const key of menuIds) await api.contextMenu.remove(`${ID}/${key}`);
    nativeUI = await createNativeUI(api, settings, async (action, elementId) => {
      if (action === "side") { await change({ side: settings.side === "left" ? "right" : "left" }); return; }
      if (action === "visibility") { await change({ enabled: !settings.enabled }); return; }
      if (action === "size") {
        const sizes = [180, 240, 300];
        const size = sizes[(sizes.indexOf(settings.size) + 1) % sizes.length];
        await change({ size });
        return;
      }
      if (!ready || disposed) return;
      const revision = epoch;
      const selected = await api.player.getSelection() ?? [];
      if (!selected.length) { await api.notification.show("เลือก Token ก่อนใช้คำสั่งนี้", "INFO"); return; }
      const selectedItems = await api.scene.items.getItems(selected);
      if (revision !== epoch || !ready || disposed) return;
      const ids = selectedItems.filter(item => item.type === "IMAGE").map(item => item.id);
      if (!ids.length) { await api.notification.show("เลือก Token ก่อนใช้คำสั่งนี้", "INFO"); return; }
      if (action === "link") {
        // Reuse the existing URL input; do not introduce a new settings panel.
        await api.popover.open({ id: `${ID}/editor`, url: "/link.html", width: 340, height: 190, anchorElementId: elementId });
        return;
      }
      if (action === "clear") {
        await api.scene.items.updateItems(ids, drafts => { for (const item of drafts) delete item.metadata[PORTRAIT_KEY]; });
        return;
      }
      const [asset] = await api.assets.downloadImages(false);
      if (!asset || revision !== epoch || !ready || disposed) return;
      const portrait = portraitFrom(asset.image);
      if (!portrait) throw new Error("Invalid portrait image");
      await api.scene.items.updateItems(ids, drafts => { for (const item of drafts) item.metadata[PORTRAIT_KEY] = portrait; });
      await change({ enabled: true });
    }, report);
    unsubscribe.push(
      api.player.onChange(player => { selection = player.selection ?? []; role = player.role; void render(); }),
      api.scene.items.onChange(value => { items = value; void render(); }),
      api.scene.onReadyChange(value => { void setReady(value).catch(report); }),
    );
    const revision = epoch;
    const initial = await api.scene.isReady();
    if (revision === epoch) await setReady(initial);
    // Only monitor window size. Panning and zooming cause zero popover writes.
    const tick = async () => { await render(); if (!disposed) timer = setTimeout(tick, 350); };
    timer = setTimeout(tick, 350);
  }
  async function stop() {
    disposed = true; ++epoch; clearTimeout(timer);
    unsubscribe.forEach(fn => fn());
    await render();
    await api.popover.close(`${ID}/editor`);
    await nativeUI?.remove();
  }
  return { start, stop, render, getSettings: () => ({ ...settings }) };
}


