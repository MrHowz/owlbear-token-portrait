import type OBR from "@owlbear-rodeo/sdk";
import type { Item } from "@owlbear-rodeo/sdk";
import { chooseImage, defaults, ID, layout, settingsFrom, PORTRAIT_KEY, portraitFrom, sharedTarget, type Presenter, type Settings } from "./model.ts";

import { createContextUI, PREF_COMMAND, PREF_REQUEST, PREF_STATE } from "./context-ui.ts";

export function createController(api: typeof OBR, storage: Pick<Storage, "getItem" | "setItem">) {
  let settings = { ...defaults };
  try { settings = settingsFrom(JSON.parse(storage.getItem(ID) ?? "null")); } catch {}
  let items: Item[] = [], selection: string[] = [];
  let previous: string | undefined;
  let ready = false, disposed = false, epoch = 0, role = "PLAYER";
  const displays = new Map<string, string>();
  let self: Presenter = { id: "", connectionId: "", role: "PLAYER", metadata: {}, selection: [] };
  let party: Presenter[] = [];
  let stateRevision = 0;
  let queue = Promise.resolve();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const unsubscribe: (() => void)[] = [];
  const menuIds = ["left", "right", "hide", "size", "choose", "link", "clear"];
  let contextUI: Awaited<ReturnType<typeof createContextUI>> | undefined;
  const popoverId = `${ID}/screen`;
  const report = (error: unknown) => {
    console.error("Token Portrait:", error);
    void api.notification.show("Portrait: ทำรายการไม่สำเร็จ ตรวจสิทธิ์แก้ไข Token และลิงก์ภาพ", "ERROR").catch(console.error);
  };
  const sharedId = `${ID}/shared-screen`;
  const closeDisplay = async (id: string) => {
    if (displays.has(id)) await api.popover.close(id);
    displays.delete(id);
  };
  const close = async () => { await closeDisplay(popoverId); await closeDisplay(sharedId); };
  async function display(id: string, target: Item | undefined, value: Settings, revision: number, generation: number, split = false) {
    const portrait = portraitFrom(target?.metadata?.[PORTRAIT_KEY]);
    if (!portrait) { await closeDisplay(id); return; }
    const [width, height] = await Promise.all([api.viewport.getWidth(), api.viewport.getHeight()]);
    if (revision !== epoch || generation !== stateRevision || disposed || !ready) return;
    const rect = layout(width, height, portrait.width, portrait.height, value, split);
    if (!rect) { await closeDisplay(id); return; }
    const next = JSON.stringify([portrait, rect.x, rect.y, rect.width, rect.height]);
    if (next === displays.get(id)) return;
    // Anchor the host transition to the bottom too, so Owlbear grows upward.
    // Screen coordinates only. NEVER read or compensate for the camera transform.
    await api.popover.open({
      id, url: `/portrait.html#${encodeURIComponent(JSON.stringify(portrait))}`,
      width: Math.ceil(rect.width), height: Math.ceil(rect.height),
      anchorReference: "POSITION", anchorPosition: { left: Math.floor(rect.x), top: Math.floor(rect.y) + Math.ceil(rect.height) },
      anchorOrigin: { horizontal: "LEFT", vertical: "BOTTOM" },
      transformOrigin: { horizontal: "LEFT", vertical: "BOTTOM" },
      hidePaper: true, disableClickAway: true, marginThreshold: 0,
    });
    displays.set(id, next);
    if (revision !== epoch || generation !== stateRevision || disposed || !ready) await closeDisplay(id);
  }
  async function draw() {
    if (disposed || !ready) { await close(); return; }
    const revision = epoch, generation = stateRevision;
    const target = chooseImage(items, selection, previous);
    previous = target?.id;
    // GMs keep one personal portrait; sharing still reaches PLAYER clients.
    const shared = role === "GM" ? undefined : sharedTarget(items, [self, ...party]);
    // Close a no-longer-visible shared portrait before any asynchronous open.
    if (!shared) await closeDisplay(sharedId);
    await display(popoverId, settings.enabled && (target?.visible || role === "GM") ? target : undefined, settings, revision, generation, !!shared);
    if (revision !== epoch || generation !== stateRevision || disposed || !ready) return;
    await display(sharedId, shared, { ...settings, side: settings.side === "left" ? "right" : "left" }, revision, generation, true);
  }
  function render() {
    queue = queue.then(draw).catch(report);
    return queue;
  }
  async function setReady(value: boolean): Promise<void> {
    const revision = ++epoch;
    ready = false; items = []; selection = []; previous = undefined;
    await render();
    if (!value || disposed || revision !== epoch) return;
    // Migration: remove the v1 camera-follow billboard, including after reload.
    await api.scene.local.deleteItems([`${ID}/portrait`]);
    const generation = stateRevision;
    const result = await Promise.all([api.scene.items.getItems(), api.player.getSelection(), api.player.getRole(), api.player.getMetadata(), api.player.getId(), api.player.getConnectionId(), api.party.getPlayers()]);
    if (revision !== epoch || disposed) return;
    if (generation !== stateRevision) return setReady(true);
    [items, selection, role] = [result[0], result[1] ?? [], result[2]];
    self = { id: result[4], connectionId: result[5], role, selection, metadata: result[3] };
    party = result[6];
    ready = true;
    await render();
  }
  async function change(patch: Partial<Settings>) {
    ++stateRevision;
    settings = settingsFrom({ ...settings, ...patch });
    try { storage.setItem(ID, JSON.stringify(settings)); } catch {}
    await render();
  }
  async function start() {
    // A previous background instance may have left a screen popover behind.
    await api.popover.close(popoverId);
    await api.popover.close(sharedId);
    // Remove the scattered v1.1 entries when reloading an existing extension.
    for (const key of menuIds) await api.contextMenu.remove(`${ID}/${key}`);
    contextUI = await createContextUI(api);
    const publishSettings = () => api.broadcast.sendMessage(PREF_STATE, settings, { destination: "LOCAL" });
    unsubscribe.push(
      api.broadcast.onMessage(PREF_REQUEST, () => { void publishSettings().catch(report); }),
      api.broadcast.onMessage(PREF_COMMAND, event => {
        if (!event.data || typeof event.data !== "object") return;
        void change(settingsFrom(event.data)).then(publishSettings).catch(report);
      }),
    );
    unsubscribe.push(
      api.player.onChange(player => { selection = player.selection ?? []; role = player.role; self = player; ++stateRevision; void render(); }),
      api.party.onChange(players => { party = players; ++stateRevision; void render(); }),
      api.scene.items.onChange(value => { items = value; ++stateRevision; void render(); }),
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
    await contextUI?.remove();
  }
  return { start, stop, render, getSettings: () => ({ ...settings }) };
}



