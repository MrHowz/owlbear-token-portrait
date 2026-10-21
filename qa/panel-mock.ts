import { startPanel } from "../src/panel";
const bus=new BroadcastChannel("portrait-qa");
const callbacks:Record<string,Set<Function>>={};
const subscribe=(key:string)=>(fn:Function)=>{(callbacks[key]??=new Set()).add(fn);return()=>callbacks[key].delete(fn);};
bus.onmessage=e=>callbacks[e.data.channel]?.forEach(fn=>fn(e.data.channel==="qa/scene"?e.data.data:{data:e.data.data}));
const getItems=()=>JSON.parse(localStorage.getItem("qa-items")??"[]");
const api:any={
 onReady:(fn:Function)=>void fn(),
 theme:{getTheme:async()=>({mode:location.search.includes("light")?"LIGHT":"DARK",text:{primary:location.search.includes("light")?"#252530":"#eee",secondary:location.search.includes("light")?"#555566":"#c5c5ce",disabled:"#767681"},background:{paper:location.search.includes("light")?"#f5f5fa":"#323342"},primary:{main:"#bb9af7"}}),onChange:()=>()=>{}},
 broadcast:{onMessage:(channel:string,fn:Function)=>subscribe(channel)(fn),sendMessage:async(channel:string,data:any)=>bus.postMessage({channel,data})},
 player:{getSelection:async()=>JSON.parse(localStorage.getItem("qa-selection")??"[]")},
 scene:{isReady:async()=>true,onReadyChange:subscribe("qa/scene"),items:{getItems:async(ids:string[])=>getItems().filter((i:any)=>ids.includes(i.id)),updateItems:async(ids:string[],fn:Function)=>{const items=getItems();fn(items.filter((i:any)=>ids.includes(i.id)));localStorage.setItem("qa-items",JSON.stringify(items));}}},
 assets:{downloadImages:()=>new Promise(resolve=>{const dialog=document.createElement("dialog");dialog.innerHTML='<p>Simulated Owlbear picker</p><button id="amber">Amber artwork</button> <button id="blue">Blue artwork</button> <button id="cancel">Cancel</button>';document.body.append(dialog);dialog.showModal();for(const name of ["amber","blue","cancel"]){dialog.querySelector(`#${name}`)!.addEventListener("click",()=>{dialog.close();dialog.remove();resolve(name==="cancel"?[]:[{image:{url:`https://qa.invalid/${name}.svg`,width:name==="amber"?240:300,height:440}}]);});}})},
};startPanel(api);

