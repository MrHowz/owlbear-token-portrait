import { startLinkEditor } from "../src/link";
import { PORTRAIT_KEY } from "../src/model";
const id=localStorage.getItem("qa-target")??"";
const items=id?[{id,type:"IMAGE",metadata:{}}]:[];
const api:any={
  onReady:(fn:Function)=>void fn(),
  scene:{onReadyChange:()=>()=>{},items:{getItems:async()=>items,updateItems:async(_:any,fn:Function)=>{fn(items);localStorage.setItem("qa-link-result",JSON.stringify({id,portrait:(items[0].metadata as any)[PORTRAIT_KEY]}));}}},
  player:{getSelection:async()=>[id]},
  theme:{getTheme:async()=>({text:{primary:"#eee"},background:{paper:"#24242e"},primary:{main:"#b9a1ff",contrastText:"#17131e"}}),onChange:()=>()=>{}},
};startLinkEditor(api);
