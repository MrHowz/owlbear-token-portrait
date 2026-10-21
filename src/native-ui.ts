import type OBR from "@owlbear-rodeo/sdk";
import type { Settings } from "./model.ts";
import { ID } from "./model.ts";
export const TOOL_ID = `${ID}/tool`;
export const MODE_ID = `${ID}/select`;
export const ACTIONS = ["side", "visibility", "size", "choose", "link", "clear"] as const;
export type Action = typeof ACTIONS[number];

// All controls below are rendered by Owlbear's native tool menu.
export async function createNativeUI(api: typeof OBR, settings: Settings,
  onAction: (action: Action, elementId: string) => Promise<void>, report: (error: unknown) => void) {
  let signature = "";
  await api.tool.create({
    id: TOOL_ID, icons: [{ icon: "/icon.svg", label: "Portrait" }],
    defaultMode: MODE_ID, defaultMetadata: { ...settings, hasToken: false },
  });
  await api.tool.createMode({
    id: MODE_ID, icons: [{ icon: "/icon.svg", label: "เลือก Token", filter: { activeTools: [TOOL_ID] } }],
    // Let Owlbear perform its standard selection and Move-like drag behavior.
    preventDrag: {},
  });
  const filter = { activeTools: [TOOL_ID] };
  const stateFilter = (key: string, value: unknown) => ({ ...filter, metadata: [{ key, value }] });
  const icons = {
    side: ["left", "right"].map(side => ({ icon: `/icons/${side}.svg`, label: `ตำแหน่ง: ${side === "left" ? "ซ้าย" : "ขวา"} · กดเพื่อสลับ`, filter: stateFilter("side", side) })),
    visibility: [true, false].map(enabled => ({ icon: enabled ? "/icons/show.svg" : "/icons/hide.svg", label: enabled ? "แสดงภาพอยู่ · กดเพื่อซ่อน" : "ซ่อนภาพอยู่ · กดเพื่อแสดง", filter: stateFilter("enabled", enabled) })),
    size: [180, 240, 300].map(size => ({ icon: "/icons/size.svg", label: `ขนาด ${size}px · กดเพื่อเปลี่ยน`, filter: stateFilter("size", size) })),
    choose: [{ icon: "/icons/choose.svg", label: "เลือกรูปจากคลัง Owlbear", filter }],
    link: [{ icon: "/icons/link.svg", label: "ใส่ลิงก์รูปภาพ", filter }],
    clear: [{ icon: "/icons/clear.svg", label: "ล้างรูปที่ผูกไว้", filter }],
  };
  for (const action of ACTIONS) {
    await api.tool.createAction({
      id: `${ID}/${action}`, icons: icons[action],
      ...(["choose", "link", "clear"].includes(action) ? { disabled: { metadata: [{ key: "hasToken", value: false }] } } : {}),
      onClick: (_context, elementId) => { void onAction(action, elementId).catch(report); },
    });
  }
  // Exactly one Portrait entry on the token context menu.
  await api.contextMenu.create({
    id: `${ID}/open`, icons: [{ icon: "/icon.svg", label: "Portrait", filter: { some: [{ key: "type", value: "IMAGE" }] } }],
    onClick: context => {
      void (async () => {
        await api.player.select(context.items.filter(item => item.type === "IMAGE").map(item => item.id), true);
        await api.tool.activateTool(TOOL_ID);
      })().catch(report);
    },
  });
  return {
    async sync(value: Settings, hasToken: boolean) {
      const metadata = { ...value, hasToken };
      const next = JSON.stringify(metadata);
      if (next === signature) return;
      await api.tool.setMetadata(TOOL_ID, metadata);
      signature = next;
    },
    async remove() {
      await api.contextMenu.remove(`${ID}/open`);
      for (const action of ACTIONS) await api.tool.removeAction(`${ID}/${action}`);
      await api.tool.removeMode(MODE_ID);
      await api.tool.remove(TOOL_ID);
    },
  };
}
