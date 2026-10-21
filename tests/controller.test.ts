import { test } from "node:test";
import assert from "node:assert/strict";
import { createController } from "../src/controller.ts";
import { ID, PORTRAIT_KEY, portraitFrom } from "../src/model.ts";
function setup() {
  const handlers: Record<string, Function> = {}, menus: Record<string, any> = {};
  let shown: any, opens = 0, deleted = 0, selection = ["a"], persisted = "";
  const portrait = { url: "https://example.com/portrait.png", width: 200, height: 400 };
  let items: any[] = [{ id: "a", type: "IMAGE", visible: true, metadata: { [PORTRAIT_KEY]: portrait }, image: { url: "https://example.com/TOKEN.png", width: 100, height: 100 } }];
  const subscribe = (key: string) => (fn: Function) => { handlers[key] = fn; return () => delete handlers[key]; };
  const api: any = {
    contextMenu: { create: async (menu: any) => { menus[menu.id] = menu; }, remove: async (id: string) => delete menus[id] },
    notification: { show: async () => {} },
    assets: { downloadImages: async () => [{ image: { url: "https://example.com/library.png", width: 400, height: 700 } }] },
    popover: { open: async (value: any) => { shown = value; opens++; }, close: async () => { shown = undefined; } },
    player: { getSelection: async () => selection, getRole: async () => "PLAYER", onChange: subscribe("player") },
    viewport: { getWidth: async () => 1400, getHeight: async () => 900, inverseTransformPoint: () => { throw Error("MUST NOT READ CAMERA"); }, getScale: () => { throw Error("MUST NOT READ CAMERA"); } },
    scene: {
      isReady: async () => true, onReadyChange: subscribe("ready"),
      items: { getItems: async () => items, onChange: subscribe("items"), updateItems: async (ids: string[], fn: Function) => { fn(items.filter(i => ids.includes(i.id))); handlers.items?.(items); } },
      local: { deleteItems: async () => { deleted++; } },
    },
  };
  const controller = createController(api, { getItem: () => persisted || null, setItem: (_,value) => { persisted=value; } });
  return { controller, api, handlers, menus, items, portrait, shown: () => shown, opens: () => opens, deleted: () => deleted };
}
const settle = () => new Promise(resolve => setTimeout(resolve, 20));
test("screen portrait uses linked art; camera motion never changes/reopens it", async () => {
  const s = setup();
  try {
    await s.controller.start();
    assert.equal(s.deleted(), 1);
    assert.equal(s.shown().hidePaper, true);
    assert.equal(s.shown().anchorReference, "POSITION");
    assert.deepEqual(JSON.parse(decodeURIComponent(s.shown().url.split("#")[1])), s.portrait);
    const first = s.shown();
    for (let i=0;i<20;i++) await s.controller.render();
    assert.equal(s.opens(), 1);
    assert.equal(s.shown(), first);
    s.api.viewport.getWidth = async () => 900;
    await s.controller.render();
    assert.equal(s.opens(), 2);
    assert.notEqual(s.shown().anchorPosition.left, first.anchorPosition.left);
  } finally { await s.controller.stop(); }
});
test("unassigned, hidden, deleted and deselected tokens hide without token-art fallback", async () => {
  const s = setup();
  try {
    await s.controller.start();
    s.handlers.items([{...s.items[0], metadata:{}}]); await s.controller.render(); assert.equal(s.shown(),undefined);
    s.handlers.items([{...s.items[0],visible:false}]); await s.controller.render(); assert.equal(s.shown(),undefined);
    s.handlers.player({selection:["a"],role:"GM"}); await s.controller.render(); assert.ok(s.shown());
    s.handlers.player({selection:[],role:"GM"}); await s.controller.render(); assert.equal(s.shown(),undefined);
    s.handlers.items([]); s.handlers.player({selection:["a"],role:"GM"}); await s.controller.render(); assert.equal(s.shown(),undefined);
  } finally { await s.controller.stop(); }
});
test("native library selection saves only portrait metadata, clear removes it", async () => {
  const s = setup();
  try {
    await s.controller.start();
    const before = JSON.stringify(s.items[0].image);
    s.menus[`${ID}/choose`].onClick({items:s.items}); await settle(); await s.controller.render();
    assert.equal(s.items[0].metadata[PORTRAIT_KEY].url,"https://example.com/library.png");
    assert.equal(JSON.stringify(s.items[0].image),before);
    s.menus[`${ID}/clear`].onClick({items:s.items}); await settle(); await s.controller.render();
    assert.equal(s.shown(),undefined);
  } finally { await s.controller.stop(); }
});
test("cancelled picker and scene change while picker is open never write a mapping", async () => {
  const s = setup();
  try {
    await s.controller.start();
    s.api.assets.downloadImages = async () => [];
    s.menus[`${ID}/choose`].onClick({items:s.items}); await settle();
    assert.deepEqual(s.items[0].metadata[PORTRAIT_KEY],s.portrait);
    let release!: Function;
    s.api.assets.downloadImages = () => new Promise(resolve => {release=resolve;});
    s.menus[`${ID}/choose`].onClick({items:s.items});
    s.handlers.ready(false);
    release([{image:{url:"https://example.com/wrong.png",width:2,height:2}}]);
    await settle();
    assert.deepEqual(s.items[0].metadata[PORTRAIT_KEY],s.portrait);
    assert.equal(s.shown(),undefined);
  } finally { await s.controller.stop(); }
});
test("reject unsafe links and malformed dimensions", () => {
  for (const url of ["http://example.com/a.png","javascript:alert(1)","data:image/svg+xml,x","https://user:password@example.com/a.png"]) assert.equal(portraitFrom({url,width:200,height:300}),undefined);
  assert.equal(portraitFrom({url:"https://example.com/a.png",width:NaN,height:300}),undefined);
});
