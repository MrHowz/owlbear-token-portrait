import { test } from "node:test";
import assert from "node:assert/strict";
import { chooseImage, layout, settingsFrom, defaults, MIN_SIZE, MAX_SIZE } from "../src/model.ts";

test("portrait stays inside each viewport and preserves aspect ratio at small and large sizes", () => {
  for (const [w,h] of [[1440,900],[1920,1080],[390,844],[844,390],[320,568],[240,240]]) {
    for (const side of ["left","right"] as const) {
      for (const size of [MIN_SIZE,300,777,MAX_SIZE]) {
        for (const [iw,ih] of [[512,1024],[1024,512],[100,100],[1,9000]]) {
          const rect=layout(w,h,iw,ih,{...defaults,side,size});
          assert.ok(rect);
          assert.ok(rect.x>=64 && rect.y>=80-0.001);
          assert.ok(rect.x+rect.width<=w-64+0.001);
          assert.ok(rect.y+rect.height<=h-8+0.001);
          assert.ok(Math.abs(rect.width/rect.height-iw/ih)<0.0001);
        }
      }
    }
  }
});
test("desktop portraits sit 8px above the bottom and keep the central dock clear",()=>{
  for(const side of ["left","right"] as const){
    for(const size of [32,180,300,600,1600]){
      const rect=layout(1440,900,388,419,{...defaults,side,size})!;
      assert.ok(Math.abs(rect.y+rect.height-892)<0.0001);
      if(side==="left")assert.ok(rect.x+rect.width<=480);
      else assert.ok(rect.x>=960);
    }
  }
});
test("arbitrary sizes are honored when they fit, with a wider usable height",()=>{
  for(const size of [32,64,127,537,777]){
    const rect=layout(1920,1080,200,600,{...defaults,size})!;
    assert.ok(Math.abs(rect.height-size)<0.0001);
    assert.ok(Math.abs(rect.y+rect.height-1072)<0.0001);
  }
  const giant=layout(1920,1080,200,600,{...defaults,size:1600})!;
  assert.ok(giant.height>900 && giant.height<1080);
});
test("narrow viewports keep the portrait above the bottom toolbar",()=>{
  const portrait=layout(390,844,200,400,{...defaults,size:1600})!;
  assert.ok(Math.abs(portrait.y+portrait.height-744)<0.0001);
});
test("invalid image sizes and impossibly small viewports suppress portrait",()=>{
  assert.equal(layout(100,100,300,600,defaults),undefined);
  assert.equal(layout(1200,900,0,600,defaults),undefined);
});
test("size values normalize, clamp safely and retain old preferences",()=>{
  assert.deepEqual(settingsFrom({side:"elsewhere",size:NaN}),defaults);
  assert.equal(settingsFrom({size:-2}).size,MIN_SIZE);
  assert.equal(settingsFrom({size:9000}).size,MAX_SIZE);
  assert.equal(settingsFrom({size:537.4}).size,537);
  assert.equal(settingsFrom({size:"537"}).size,defaults.size);
  for(const size of [32,64,127,180,240,300,537,1200,1600])assert.equal(settingsFrom({size}).size,size);
  assert.deepEqual(settingsFrom({side:"left",size:180,enabled:false}),{side:"left",size:180,enabled:false});
});
test("selection is stable, ignores non-images and clears on deselection/deletion",()=>{
  const items=[{id:"a",type:"IMAGE"},{id:"b",type:"IMAGE"},{id:"c",type:"SHAPE"}] as any;
  assert.equal(chooseImage(items,["a"])?.id,"a");
  assert.equal(chooseImage(items,["a","b"],"a")?.id,"a");
  assert.equal(chooseImage(items,["b","c"],"a")?.id,"b");
  assert.equal(chooseImage(items,["c"]),undefined);
  assert.equal(chooseImage(items,[]),undefined);
  assert.equal(chooseImage(items,["deleted"]),undefined);
});

test("two portraits reserve opposite halves on narrow screens without overlap", () => {
  const left = layout(390,844,600,600,{side:"left",enabled:true,size:1600},true)!;
  const right = layout(390,844,600,600,{side:"right",enabled:true,size:1600},true)!;
  assert.ok(left.x + left.width + 16 <= right.x);
  assert.equal(left.height,right.height);
});
