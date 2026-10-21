import { test } from "node:test";
import assert from "node:assert/strict";
import { createController } from "../src/controller.ts";
import { ID, PORTRAIT_KEY, portraitFrom } from "../src/model.ts";
import { createPortraitBinding } from "../src/binding.ts";
import { PREF_COMMAND, PREF_REQUEST, PREF_STATE } from "../src/context-ui.ts";
function setup() {
  const handlers: Record<string, Function> = {}, menus: Record<string, any> = {}, actions: Record<string, any> = {}, modes: Record<string, any> = {}, tools: Record<string, any> = {}; let toolMetadata: any = {}, activeTool = "move";
  let shown: any, opens = 0, deleted = 0, selection = ["a"], persisted = "";
  const portrait = { url: "https://example.com/portrait.png", width: 200, height: 400 };
  let items: any[] = [{ id: "a", type: "IMAGE", visible: true, metadata: { [PORTRAIT_KEY]: portrait }, image: { url: "https://example.com/TOKEN.png", width: 100, height: 100 } }];
  const subscribe = (key: string) => (fn: Function) => { handlers[key] = fn; return () => delete handlers[key]; };
  const api: any = {
    contextMenu: { create: async (menu: any) => { menus[menu.id] = menu; }, remove: async (id: string) => delete menus[id] },
    tool: {
      create: async (tool: any) => { tools[tool.id] = tool; toolMetadata = tool.defaultMetadata; },
      createMode: async (mode: any) => { modes[mode.id] = mode; },
      createAction: async (action: any) => { actions[action.id] = action; },
      activateTool: async (id: string) => { activeTool = id; },
      setMetadata: async (_: string, metadata: any) => { toolMetadata = {...toolMetadata,...metadata}; },
      removeAction: async (id: string) => { delete actions[id]; },
      removeMode: async (id: string) => { delete modes[id]; },
      remove: async (id: string) => { delete tools[id]; },
    },
    broadcast: { onMessage: (channel: string, fn: Function) => subscribe(`broadcast:${channel}`)(fn), sendMessage: async (channel: string, data: unknown) => { handlers[`sent:${channel}`]?.(data); } },
    notification: { show: async () => {} },
    assets: { downloadImages: async () => [{ image: { url: "https://example.com/library.png", width: 400, height: 700 } }] },
    popover: { open: async (value: any) => { shown = value; opens++; }, close: async () => { shown = undefined; } },
    player: { getSelection: async () => selection, getRole: async () => "PLAYER", select: async (ids: string[]) => { selection=ids; handlers.player?.({selection,role:"PLAYER"}); }, onChange: subscribe("player") },
    viewport: { getWidth: async () => 1400, getHeight: async () => 900, inverseTransformPoint: () => { throw Error("MUST NOT READ CAMERA"); }, getScale: () => { throw Error("MUST NOT READ CAMERA"); } },
    scene: {
      isReady: async () => true, onReadyChange: subscribe("ready"),
      items: { getItems: async (ids?: string[]) => ids ? items.filter(item => ids.includes(item.id)) : items, onChange: subscribe("items"), updateItems: async (ids: string[], fn: Function) => { fn(items.filter(i => ids.includes(i.id))); handlers.items?.(items); } },
      local: { deleteItems: async () => { deleted++; } },
    },
  };
  const controller = createController(api, { getItem: () => persisted || null, setItem: (_,value) => { persisted=value; } });
  return { controller, api, handlers, menus, actions, modes, tools, metadata: () => toolMetadata, activeTool: () => activeTool, items, portrait, shown: () => shown, opens: () => opens, deleted: () => deleted };
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
    const binding = await createPortraitBinding(s.api); await binding.choose(); await s.controller.render();
    assert.equal(s.items[0].metadata[PORTRAIT_KEY].url,"https://example.com/library.png");
    assert.equal(JSON.stringify(s.items[0].image),before);
    await binding.save(null); await s.controller.render(); binding.dispose();
    assert.equal(s.shown(),undefined);
  } finally { await s.controller.stop(); }
});
test("cancelled picker and scene change while picker is open never write a mapping", async () => {
  const s = setup();
  await s.controller.start();
  const binding = await createPortraitBinding(s.api);
  try {
    s.api.assets.downloadImages = async () => [];
    assert.equal(await binding.choose(), false);
    assert.deepEqual(s.items[0].metadata[PORTRAIT_KEY],s.portrait);
    let release!: Function;
    s.api.assets.downloadImages = () => new Promise(resolve => { release=resolve; });
    const pending = binding.choose();
    await settle();
    s.handlers.ready(false);
    release([{image:{url:"https://example.com/wrong.png",width:2,height:2}}]);
    await assert.rejects(pending,/ฉากเปลี่ยน/);
    assert.deepEqual(s.items[0].metadata[PORTRAIT_KEY],s.portrait);
  } finally { binding.dispose(); await s.controller.stop(); }
});
test("reject unsafe links and malformed dimensions", () => {
  for (const url of ["http://example.com/a.png","javascript:alert(1)","data:image/svg+xml,x","https://user:password@example.com/a.png"]) assert.equal(portraitFrom({url,width:200,height:300}),undefined);
  assert.equal(portraitFrom({url:"https://example.com/a.png",width:NaN,height:300}),undefined);
});



test("one embedded context submenu registers no sidebar tools and preserves active tool", async () => {
  const s=setup();
  let created=0; s.api.tool.create=async()=>{created++;};
  s.tools[`${ID}/tool`]={};s.modes[`${ID}/select`]={};s.actions[`${ID}/side`]={};
  try {
    await s.controller.start();
    assert.deepEqual(Object.keys(s.menus),[`${ID}/open`]);
    assert.deepEqual(s.menus[`${ID}/open`].embed,{url:"/panel.html",height:280});
    assert.equal(s.menus[`${ID}/open`].onClick,undefined);
    assert.equal(s.activeTool(),"move");
    assert.equal(created,0);
    assert.equal(Object.keys(s.tools).length,0);
    assert.equal(Object.keys(s.actions).length,0);
    assert.equal(Object.keys(s.modes).length,0);
    let state:any;
    s.handlers[`sent:${PREF_STATE}`]=(value:any)=>{state=value;};
    s.handlers[`broadcast:${PREF_REQUEST}`]({data:{}});await settle();
    assert.deepEqual(state,s.controller.getSettings());
    for(const side of ["left","right"]){
      s.handlers[`broadcast:${PREF_COMMAND}`]({data:{...state,side}});await settle();
      assert.equal(s.controller.getSettings().side,side);
    }
    s.handlers[`broadcast:${PREF_COMMAND}`]({data:{...state,enabled:false}});await settle();assert.equal(s.shown(),undefined);
    s.handlers[`broadcast:${PREF_COMMAND}`]({data:{...state,enabled:true,size:180}});await settle();assert.ok(s.shown());assert.equal(s.controller.getSettings().size,180);
  } finally {await s.controller.stop();}
  assert.equal(Object.keys(s.menus).length,0);
});
test("binding prevents writing to a changed or empty selection",async()=>{
  const s=setup();const binding=await createPortraitBinding(s.api);
  try {
    s.api.player.getSelection=async()=>["different-token"];
    await assert.rejects(binding.save({url:"https://example.com/new.png",width:20,height:40}),/เปลี่ยน/);
    assert.deepEqual(s.items[0].metadata[PORTRAIT_KEY],s.portrait);
  } finally {binding.dispose();}
  s.api.player.getSelection=async()=>[];
  const empty=await createPortraitBinding(s.api);
  try {assert.equal(empty.ids.length,0);await assert.rejects(empty.save(null),/เลือก Token/);}finally{empty.dispose();}
});

