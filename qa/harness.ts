import { createController } from "../src/controller";
import { PORTRAIT_KEY, SHARE_KEY } from "../src/model";
const callbacks: Record<string, Set<Function>> = {};
const subscribe=(key:string)=>(fn:Function)=>{(callbacks[key]??=new Set()).add(fn);return()=>callbacks[key].delete(fn);};
const emit=(key:string,value:any)=>callbacks[key]?.forEach(fn=>fn(value));
let role = location.search.includes("gm") ? "GM" : "PLAYER";
let playerMetadata: any = {};
let remote: any[] = [];
localStorage.setItem("qa-role",role); localStorage.setItem("qa-player-metadata","{}");
const playerState = () => ({ id:"self",connectionId:"self",role,selection,metadata:playerMetadata });
let selection:string[]=[],ready=true,pan=false,opens=0;
const artA={url:"https://qa.invalid/amber.svg",width:240,height:440};
const artB={url:"https://qa.invalid/blue.svg",width:300,height:440};
let items:any[]=[{id:"a",name:"Amber token",type:"IMAGE",visible:true,metadata:{[PORTRAIT_KEY]:artB},image:artA},{id:"b",name:"Blue token",type:"IMAGE",visible:true,metadata:{[PORTRAIT_KEY]:artA},image:artB},{id:"shape",type:"SHAPE",visible:true,metadata:{}}];
const bus=new BroadcastChannel("portrait-qa");
bus.onmessage=event=>{
 if(event.data.channel==="qa/player-metadata"){playerMetadata=event.data.data;emit("player",playerState());}
 else emit(`broadcast:${event.data.channel}`,{data:event.data.data});
};
const persist=()=>{localStorage.setItem("qa-items",JSON.stringify(items));localStorage.setItem("qa-selection",JSON.stringify(selection));};persist();
const api:any={
 tool:{remove:async()=>{},removeMode:async()=>{},removeAction:async()=>{},create:async()=>{throw Error("No sidebar tool allowed");}},
 contextMenu:{create:async(menu:any)=>{const button=document.createElement("button");button.textContent=menu.icons[0].label;button.id="context-portrait";button.onclick=()=>{document.querySelector("#editor")?.remove();const frame=document.createElement("iframe");frame.id="editor";frame.title="Portrait submenu";frame.src="/qa/panel.html";Object.assign(frame.style,{position:"absolute",top:"170px",left:"12px",width:"320px",height:`${menu.embed.height}px`,zIndex:"5",border:"0",borderRadius:"0",background:"#3d4051"});document.body.append(frame);};document.querySelector("#menus")!.append(button);},remove:async()=>{}},
 broadcast:{onMessage:(channel:string,fn:Function)=>subscribe(`broadcast:${channel}`)(fn),sendMessage:async(channel:string,data:any)=>bus.postMessage({channel,data})},
 notification:{show:async(text:string)=>{document.querySelector("#status")!.textContent=text;}},
 player:{getSelection:async()=>selection,getRole:async()=>role,getId:async()=>"self",getConnectionId:async()=>"self",getMetadata:async()=>playerMetadata,onChange:subscribe("player")},
 party:{getPlayers:async()=>remote,onChange:subscribe("party")},
 viewport:{getWidth:async()=>innerWidth,getHeight:async()=>innerHeight,inverseTransformPoint:()=>{throw Error("Camera access forbidden");}},
 popover:{close:async(id:string)=>document.querySelector(id.endsWith("/editor")?"#editor":(id.endsWith("/shared-screen")?"#shared-frame":"#portrait-frame"))?.remove(),open:async(value:any)=>{opens++;document.querySelector("#status")!.textContent=`Popover opens: ${opens}`;const frameId=value.id.endsWith("/shared-screen")?"shared-frame":"portrait-frame";document.getElementById(frameId)?.remove();const frame=document.createElement("iframe");frame.id=frameId;frame.title=frameId==="shared-frame"?"DM shared portrait":"Linked portrait";const p=JSON.parse(decodeURIComponent(value.url.split("#")[1]));frame.src=p.url.startsWith("https://qa.invalid/")?`/qa/portrait.html#${encodeURIComponent(JSON.stringify(p))}`:value.url;Object.assign(frame.style,{position:"fixed",left:`${value.anchorPosition.left}px`,top:`${value.anchorPosition.top}px`,width:`${value.width}px`,height:`${value.height}px`,border:"0",background:"transparent",zIndex:"3"});document.body.append(frame);}},
 scene:{isReady:async()=>ready,onReadyChange:subscribe("ready"),local:{deleteItems:async()=>{}},items:{getItems:async(ids?:string[])=>ids?items.filter(i=>ids.includes(i.id)):items,onChange:subscribe("items"),updateItems:async(ids:string[],fn:Function)=>{fn(items.filter(i=>ids.includes(i.id)));persist();emit("items",items);}}},
};
const controller=createController(api,localStorage);await controller.start();
const select=(ids:string[])=>{selection=ids;persist();for(const id of ["a","b"])document.getElementById(id)!.setAttribute("aria-pressed",String(ids.includes(id)));emit("player",playerState());};
for(const id of ["a","b"])document.getElementById(id)!.addEventListener("click",()=>select([id]));
document.querySelector("#clear")!.addEventListener("click",()=>select([]));document.querySelector("#multi")!.addEventListener("click",()=>select(["a","b"]));document.querySelector("#shape")!.addEventListener("click",()=>select(["shape"]));
document.querySelector("#delete")!.addEventListener("click",()=>{items=items.filter(i=>!selection.includes(i.id));persist();emit("items",items);});
document.querySelector("#scene")!.addEventListener("click",()=>{ready=!ready;emit("ready",ready);bus.postMessage({channel:"qa/scene",data:ready});});
document.querySelector("#pan")!.addEventListener("click",()=>{pan=!pan;document.querySelector<HTMLElement>("#board")!.style.backgroundPosition=pan?"123px 78px":"0 0";for(const el of document.querySelectorAll<HTMLElement>(".token"))el.style.transform=pan?"translate(100px,50px) scale(1.2)":"none";});
window.addEventListener("storage",event=>{if(event.key==="qa-items"&&event.newValue){items=JSON.parse(event.newValue);emit("items",items);}});


document.querySelector("#remote")!.addEventListener("click",()=>{remote=remote.length?[]:[{id:"remote",connectionId:"remote",role:"GM",selection:["b"],metadata:{[SHARE_KEY]:true}}];emit("party",remote);});
document.querySelector("#hide-shared")!.addEventListener("click",()=>{const target=items.find(i=>i.id==="b");if(target){target.visible=!target.visible;persist();emit("items",items);}});
