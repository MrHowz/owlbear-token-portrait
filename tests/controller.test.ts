import { test } from "node:test";
import assert from "node:assert/strict";
import { createController } from "../src/controller.ts";
import { ID } from "../src/model.ts";

function setup() {
  const handlers: Record<string, Function> = {};
  const menus: Record<string, any> = {};
  let local: any;
  let writes = 0;
  let persisted = "";
  const subscribe = (key: string) => (fn: Function) => { handlers[key] = fn; return () => delete handlers[key]; };
  const image = { id: "a", type: "IMAGE", visible: true, image: { width: 200, height: 400, url: "https://example.com/a.png" } };
  const api: any = {
    contextMenu: { create: async (menu: any) => { menus[menu.id] = menu; }, remove: async (id: string) => delete menus[id] },
    notification: { show: async () => {} },
    player: { getSelection: async () => ["a"], getRole: async () => "PLAYER", onChange: subscribe("player") },
    viewport: { getWidth: async () => 1400, getHeight: async () => 900, inverseTransformPoint: async (p: any) => p },
    scene: {
      isReady: async () => true, onReadyChange: subscribe("ready"),
      items: { getItems: async () => [image], onChange: subscribe("items") },
      grid: { getDpi: async () => 150, onChange: subscribe("grid") },
      local: {
        deleteItems: async () => { local = undefined; },
        addItems: async (items: any[]) => { local = items[0]; writes++; },
        updateItems: async (_: unknown, fn: Function) => { fn([local]); writes++; },
      },
    },
  };
  const controller = createController(api, (source, dpi) => ({
    id: `${ID}/portrait`, image: source.image, grid: { dpi },
  } as any), { getItem: () => persisted || null, setItem: (_key, value) => { persisted = value; } });
  return { controller, api, handlers, menus, image, local: () => local, writes: () => writes };
}
const settle = () => new Promise(resolve => setTimeout(resolve, 10));

test("controller hides deleted / hidden images, honors GM, and avoids idle writes", async () => {
  const s = setup();
  try {
    await s.controller.start();
    assert.ok(s.local());
    await s.controller.render();
    assert.equal(s.writes(), 1);
    s.handlers.items([{ ...s.image, visible: false }]);
    await settle();
    assert.equal(s.local(), undefined);
    s.handlers.player({ selection: ["a"], role: "GM" });
    await settle();
    assert.ok(s.local());
    s.handlers.items([]);
    await settle();
    assert.equal(s.local(), undefined);
  } finally { await s.controller.stop(); }
  assert.equal(Object.keys(s.handlers).length, 0);
  assert.equal(Object.keys(s.menus).length, 0);
});

test("scene switch waits for in-flight render and removes stale item", async () => {
  const s = setup();
  try {
    await s.controller.start();
    let release!: (value: { x: number; y: number }) => void;
    s.api.viewport.inverseTransformPoint = () => new Promise(resolve => { release = resolve; });
    const pending = s.controller.render();
    await settle();
    s.handlers.ready(false);
    s.api.viewport.inverseTransformPoint = async (p: any) => p;
    s.handlers.ready(true);
    release({ x: 9999, y: 9999 });
    await pending;
    await settle();
    assert.ok(s.local());
    assert.ok(s.local().position.x < 1400);
    assert.equal(s.local().position.y, 500);
  } finally { await s.controller.stop(); }
});
