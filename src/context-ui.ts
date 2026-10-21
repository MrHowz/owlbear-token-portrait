import type OBR from "@owlbear-rodeo/sdk";
import { ID } from "./model.ts";
export const PREF_COMMAND = `${ID}/preferences/set`;
export const PREF_REQUEST = `${ID}/preferences/get`;
export const PREF_STATE = `${ID}/preferences/state`;
export const PANEL_HEIGHT = `${ID}/panel/height`;
export async function createContextUI(api: typeof OBR) {
  // Remove the v1.2 native toolbar registration without creating any new tool.
  for (const action of ["side", "visibility", "size", "choose", "link", "clear"]) await api.tool.removeAction(`${ID}/${action}`);
  await api.tool.removeMode(`${ID}/select`);
  await api.tool.remove(`${ID}/tool`);
  const menu = (height: number) => ({
    id: `${ID}/open`,
    icons: [{ icon: "/icon.svg", label: "Portrait", filter: { some: [{ key: "type", value: "IMAGE" }] } }],
    embed: { url: "/panel.html", height },
  });
  let active = true, height = 300, requested = height;
  let queue = Promise.resolve();
  await api.contextMenu.create(menu(height));
  const unsubscribe = api.broadcast.onMessage(PANEL_HEIGHT, event => {
    if (!active || typeof event.data !== "number" || !Number.isFinite(event.data)) return;
    requested = Math.min(600, Math.max(160, Math.ceil(event.data)));
    queue = queue.then(async () => {
      if (!active || requested === height) return;
      const next = requested;
      await api.contextMenu.create(menu(next));
      height = next;
    }).catch(console.error);
  });
  return { remove: async () => { active = false; unsubscribe(); await queue; await api.contextMenu.remove(`${ID}/open`); } };
}

