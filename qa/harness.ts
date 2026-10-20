import { createController } from "../src/controller";
import { ID } from "../src/model";

const callbacks: Record<string, Function> = {};
const subscribe = (key: string) => (callback: Function) => { callbacks[key] = callback; return () => delete callbacks[key]; };
let selection: string[] = [];
let ready = true;
let zoom = 1;
let offset = 0;
let underClicks = 0;
let items = [
  { id: "a", type: "IMAGE", visible: true, image: { url: "/qa/amber.svg", width: 240, height: 440, mime: "image/svg+xml" } },
  { id: "b", type: "IMAGE", visible: true, image: { url: "/qa/blue.svg", width: 300, height: 440, mime: "image/svg+xml" } },
  { id: "shape", type: "SHAPE", visible: true },
];
let local: any;
const draw = () => {
  document.querySelector("#portrait")?.remove();
  if (!local) return;
  const img = document.createElement("img");
  img.id = "portrait";
  img.src = local.image.url;
  img.alt = "Selected token portrait";
  Object.assign(img.style, {
    left: `${local.position.x * zoom + offset}px`, top: `${local.position.y * zoom + offset}px`,
    width: `${local.image.width * local.scale.x}px`, height: `${local.image.height * local.scale.y}px`,
  });
  document.body.append(img);
};
const api: any = {
  contextMenu: {
    create: async (menu: any) => {
      const button = document.createElement("button");
      button.textContent = menu.id.split("/").at(-1)!;
      button.onclick = menu.onClick;
      document.querySelector("#menus")!.append(button);
    },
    remove: async () => {},
  },
  notification: { show: async (text: string) => { document.querySelector("#status")!.textContent = text; } },
  player: { getSelection: async () => selection, getRole: async () => "PLAYER", onChange: subscribe("player") },
  viewport: {
    getWidth: async () => innerWidth, getHeight: async () => innerHeight,
    inverseTransformPoint: async (point: any) => ({ x: (point.x - offset) / zoom, y: (point.y - offset) / zoom }),
  },
  scene: {
    isReady: async () => ready, onReadyChange: subscribe("ready"),
    grid: { getDpi: async () => 150, onChange: subscribe("grid") },
    items: { getItems: async () => items, onChange: subscribe("items") },
    local: {
      deleteItems: async () => { local = undefined; draw(); },
      addItems: async (value: any[]) => { local = value[0]; draw(); },
      updateItems: async (_ids: string[], update: Function) => { update([local]); draw(); },
    },
  },
};
const controller = createController(api, (source, dpi) => ({
  id: `${ID}/portrait`, type: "BILLBOARD", image: source.image, grid: { dpi, offset: { x: 0, y: 0 } },
  disableHit: true, locked: true, layer: "POPOVER", style: {},
} as any), localStorage);
await controller.start();
const select = (ids: string[]) => {
  selection = ids;
  for (const id of ["a", "b"]) document.getElementById(id)!.setAttribute("aria-pressed", String(ids.includes(id)));
  callbacks.player?.({ selection, role: "PLAYER" });
};
document.querySelector("#a")!.addEventListener("click", () => select(["a"]));
document.querySelector("#b")!.addEventListener("click", () => select(["b"]));
document.querySelector("#clear")!.addEventListener("click", () => select([]));
document.querySelector("#multi")!.addEventListener("click", () => select(["a", "b"]));
document.querySelector("#shape")!.addEventListener("click", () => select(["shape"]));
document.querySelector("#delete")!.addEventListener("click", () => {
  items = items.filter(item => !selection.includes(item.id));
  callbacks.items?.(items);
});
document.querySelector("#scene")!.addEventListener("click", () => {
  ready = !ready;
  local = undefined;
  draw();
  callbacks.ready?.(ready);
});
document.querySelector("#pan")!.addEventListener("click", () => {
  zoom = zoom === 1 ? 2 : 1; offset = offset ? 0 : 100; draw();
});
document.querySelector("#under")!.addEventListener("click", () => {
  document.querySelector("#status")!.textContent = `Underlying clicks: ${++underClicks}`;
});
