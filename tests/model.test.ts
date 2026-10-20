import { test } from "node:test";
import assert from "node:assert/strict";
import { chooseImage, layout, settingsFrom, defaults } from "../src/model.ts";

test("portrait fits all corners without covering reserved side and bottom strips", () => {
  for (const [w, h] of [[1440,900],[390,844],[844,390],[320,568],[240,240]]) {
    for (const side of ["left", "right"] as const) {
      for (const [iw, ih] of [[512,1024],[1024,512],[100,100],[1,9000]]) {
        const rect = layout(w,h,iw,ih,{...defaults,side});
        assert.ok(rect);
        assert.ok(rect.x >= 64 && rect.y >= 0);
        assert.ok(rect.x + rect.width <= w - 64 + 0.001);
        assert.ok(rect.y + rect.height <= h - 76 + 0.001);
        assert.ok(Math.abs(rect.width / rect.height - iw / ih) < 0.0001);
      }
    }
  }
});
test("invalid image sizes and impossibly small viewports suppress portrait", () => {
  assert.equal(layout(100,100,300,600,defaults), undefined);
  assert.equal(layout(1200,900,0,600,defaults), undefined);
});
test("settings recover from corrupt data", () => {
  assert.deepEqual(settingsFrom({side:"elsewhere",size:-2}), defaults);
  assert.deepEqual(settingsFrom({side:"left",size:180,enabled:false}), {side:"left",size:180,enabled:false});
});
test("selection is stable, ignores non-images and clears on deselection/deletion", () => {
  const items = [{id:"a",type:"IMAGE"}, {id:"b",type:"IMAGE"}, {id:"c",type:"SHAPE"}] as any;
  assert.equal(chooseImage(items,["a"])?.id, "a");
  assert.equal(chooseImage(items,["a","b"],"a")?.id, "a");
  assert.equal(chooseImage(items,["b","c"],"a")?.id, "b");
  assert.equal(chooseImage(items,["c"]), undefined);
  assert.equal(chooseImage(items,[]), undefined);
  assert.equal(chooseImage(items,["deleted"]), undefined);
});
