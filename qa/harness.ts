import { createController } from "../src/controller";
import { PORTRAIT_KEY } from "../src/model";
const callbacks: Record<string, Function> = {};
const subscribe = (key: string) => (fn: Function) => { callbacks[key] = fn; return () => delete callbacks[key]; };
let selection: string[] = [], ready = true, pan = false, opens = 0;
const artA = { url: "https://qa.invalid/amber.svg", width:240,height:440 };
const artB = { url: "https://qa.invalid/blue.svg", width:300,height:440 };
let items: any[] = [
  {id:"a",type:"IMAGE",visible:true,metadata:{[PORTRAIT_KEY]:artB},image:artA},
  {id:"b",type:"IMAGE",visible:true,metadata:{},image:artB},
  {id:"shape",type:"SHAPE",visible:true,metadata:{}},
];
const status = (text: string) => {document.querySelector("#status")!.textContent=text;};
const api: any = {
  contextMenu:{
    create:async(menu:any)=>{
      const button=document.createElement("button"); button.textContent=menu.id.split("/").at(-1);
      button.onclick=()=>{
        if(menu.embed){
          localStorage.setItem("qa-target",selection[0]??"");
          const frame=document.createElement("iframe");frame.src="/qa/link.html";frame.id="editor";
          Object.assign(frame.style,{position:"absolute",top:"190px",left:"12px",width:"340px",height:"210px",zIndex:"5",border:"1px solid #777"});
          document.querySelector("#editor")?.remove();document.body.append(frame);
        }else menu.onClick({items:items.filter(i=>selection.includes(i.id))});
      };
      document.querySelector("#menus")!.append(button);
    },remove:async()=>{},
  },
  assets:{downloadImages:()=>new Promise(resolve=>{
    const dialog=document.createElement("dialog");dialog.innerHTML='<p>Simulated Owlbear image picker</p><button id="art-a">Amber art</button> <button id="art-b">Blue art</button> <button id="cancel">Cancel</button>';
    document.body.append(dialog);dialog.showModal();
    for(const [id,value] of [["art-a",artA],["art-b",artB],["cancel",null]] as const)dialog.querySelector(`#${id}`)!.addEventListener("click",()=>{dialog.close();dialog.remove();resolve(value?[{image:value}]:[]);});
  })},
  notification:{show:async(text:string)=>status(text)},
  player:{getSelection:async()=>selection,getRole:async()=>"PLAYER",onChange:subscribe("player")},
  viewport:{getWidth:async()=>innerWidth,getHeight:async()=>innerHeight,inverseTransformPoint:()=>{throw Error("Camera access forbidden");}},
  popover:{
    close:async()=>{document.querySelector("#portrait-frame")?.remove();},
    open:async(value:any)=>{
      opens++;status(`Popover opens: ${opens}`);
      document.querySelector("#portrait-frame")?.remove();
      const frame=document.createElement("iframe");frame.id="portrait-frame";frame.title="Linked portrait";
      // Use the production renderer. Only fixture URLs are substituted in QA.
      const p=JSON.parse(decodeURIComponent(value.url.split("#")[1]));
      if(p.url.startsWith("https://qa.invalid/")){
        frame.src=`/qa/portrait.html#${encodeURIComponent(JSON.stringify(p))}`;
      }else frame.src=value.url;
      Object.assign(frame.style,{position:"fixed",left:`${value.anchorPosition.left}px`,top:`${value.anchorPosition.top}px`,width:`${value.width}px`,height:`${value.height}px`,border:"0",background:"transparent",zIndex:"3"});
      document.body.append(frame);
    },
  },
  scene:{
    isReady:async()=>ready,onReadyChange:subscribe("ready"),local:{deleteItems:async()=>{}},
    items:{getItems:async()=>items,onChange:subscribe("items"),updateItems:async(ids:string[],fn:Function)=>{fn(items.filter(i=>ids.includes(i.id)));callbacks.items?.(items);}},
  },
};
const controller=createController(api,localStorage); await controller.start();
const select=(ids:string[])=>{selection=ids;for(const id of ["a","b"])document.getElementById(id)!.setAttribute("aria-pressed",String(ids.includes(id)));callbacks.player?.({selection,role:"PLAYER"});};
for(const id of ["a","b"])document.getElementById(id)!.addEventListener("click",()=>select([id]));
document.querySelector("#clear")!.addEventListener("click",()=>select([]));
document.querySelector("#multi")!.addEventListener("click",()=>select(["a","b"]));
document.querySelector("#shape")!.addEventListener("click",()=>select(["shape"]));
document.querySelector("#delete")!.addEventListener("click",()=>{items=items.filter(i=>!selection.includes(i.id));callbacks.items?.(items);});
document.querySelector("#scene")!.addEventListener("click",()=>{ready=!ready;callbacks.ready?.(ready);});
document.querySelector("#pan")!.addEventListener("click",()=>{
  pan=!pan;const board=document.querySelector<HTMLElement>("#board")!;
  board.style.backgroundPosition=pan?"123px 78px":"0 0";
  for(const el of document.querySelectorAll<HTMLElement>(".token"))el.style.transform=pan?"translate(100px,50px) scale(1.2)":"none";
});
document.querySelector("#under")!.addEventListener("click",()=>status("Underlying click"));
window.addEventListener("storage",event=>{
  if(event.key==="qa-link-result"&&event.newValue){const data=JSON.parse(event.newValue);const target=items.find(i=>i.id===data.id);if(target){target.metadata[PORTRAIT_KEY]=data.portrait;callbacks.items?.(items);}}
});
