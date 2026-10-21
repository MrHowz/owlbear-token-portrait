import type OBR from "@owlbear-rodeo/sdk";
import { ID } from "./model.ts";
export const PREF_COMMAND = `${ID}/preferences/set`;
export const PREF_REQUEST = `${ID}/preferences/get`;
export const PREF_STATE = `${ID}/preferences/state`;
export async function createContextUI(api: typeof OBR) {
  // Remove the v1.2 native toolbar registration without creating any new tool.
  for (const action of ["side", "visibility", "size", "choose", "link", "clear"]) await api.tool.removeAction(`${ID}/${action}`);
  await api.tool.removeMode(`${ID}/select`);
  await api.tool.remove(`${ID}/tool`);
  await api.contextMenu.create({
    id: `${ID}/open`,
    icons: [{ icon: "/icon.svg", label: "Portrait", filter: { some: [{ key: "type", value: "IMAGE" }] } }],
    embed: { url: "/panel.html", height: 360 },
  });
  return { remove: () => api.contextMenu.remove(`${ID}/open`) };
}
