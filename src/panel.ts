import type OBR from "@owlbear-rodeo/sdk";
import type { Theme } from "@owlbear-rodeo/sdk";
import { ID, defaults, portraitFrom, settingsFrom, type Settings } from "./model";
import { createPortraitBinding } from "./binding";
import { PREF_COMMAND, PREF_REQUEST, PREF_STATE } from "./context-ui";
export function startPanel(api: typeof OBR) {
  const side = document.querySelector<HTMLSelectElement>("#side")!;
  const size = document.querySelector<HTMLSelectElement>("#size")!;
  const enabled = document.querySelector<HTMLInputElement>("#enabled")!;
  const input = document.querySelector<HTMLInputElement>("#url")!;
  const preferences = document.querySelector<HTMLFieldSetElement>("#preferences")!;
  const artwork = document.querySelector<HTMLFieldSetElement>("#artwork")!;
  const status = document.querySelector<HTMLElement>("#status")!;
  let settings = { ...defaults };
  let binding: Awaited<ReturnType<typeof createPortraitBinding>> | undefined;
  let busy = false, disposed = false;
  const cleanups: (() => void)[] = [];
  function reflect(value: unknown) {
    settings = settingsFrom(value); side.value = settings.side; size.value = String(settings.size); enabled.checked = settings.enabled;
  }
  function theme(value: Theme) {
    document.documentElement.style.colorScheme = value.mode === "LIGHT" ? "light" : "dark";
    for (const [key, val] of Object.entries({text:value.text.primary,paper:value.background.paper,muted:value.text.secondary,primary:value.primary.main,line:value.text.disabled})) document.body.style.setProperty(`--${key}`,val);
  }
  async function updateSettings(value: Settings) {
    await api.broadcast.sendMessage(PREF_COMMAND, value, {destination:"LOCAL"});
    try { localStorage.setItem(ID, JSON.stringify(value)); } catch {}
    reflect(value);
  }
  async function changeSettings() {
    const previous = settings;
    try { await updateSettings(settingsFrom({side:side.value,size:Number(size.value),enabled:enabled.checked})); }
    catch { reflect(previous); status.textContent="บันทึกการตั้งค่าไม่สำเร็จ"; }
  }
  side.addEventListener("change", changeSettings); size.addEventListener("change", changeSettings); enabled.addEventListener("change", changeSettings);
  async function run(action: () => Promise<void>) {
    if (busy || !binding || disposed) return;
    busy = true; artwork.disabled = true;
    try { await action(); }
    catch(error) { status.textContent=error instanceof Error?error.message:"ทำรายการไม่สำเร็จ ตรวจสิทธิ์แก้ไข Token"; }
    finally { busy=false; artwork.disabled=disposed||!binding.ids.length; }
  }
  document.querySelector("#choose")!.addEventListener("click",()=>void run(async()=>{
    if(await binding!.choose()) { input.value=binding!.current?.url??""; await updateSettings({...settings,enabled:true}); status.textContent="ผูกรูปจากคลังแล้ว"; }
    else status.textContent="ยกเลิกการเลือกรูป";
  }));
  document.querySelector("#clear")!.addEventListener("click",()=>void run(async()=>{
    await binding!.save(null); input.value=""; status.textContent="ล้างรูปที่ผูกไว้แล้ว";
  }));
  document.querySelector("#url-form")!.addEventListener("submit",event=>{
    event.preventDefault(); void run(async()=>{
      const url=new URL(input.value.trim());
      if(url.protocol!=="https:"||url.username||url.password) throw new Error("กรุณาใช้ลิงก์รูป HTTPS ที่ไม่มีข้อมูลเข้าสู่ระบบ");
      status.textContent="กำลังตรวจรูปภาพ…";
      const image=new Image();image.referrerPolicy="no-referrer";
      await new Promise<void>((resolve,reject)=>{
        const timer=setTimeout(()=>{image.src="";reject(new Error("โหลดภาพนานเกินไป กรุณาตรวจลิงก์"));},12000);
        image.onload=()=>{clearTimeout(timer);resolve();}; image.onerror=()=>{clearTimeout(timer);reject(new Error("โหลดรูปไม่ได้ ใช้ลิงก์รูปโดยตรง"));}; image.src=url.href;
      });
      const portrait=portraitFrom({url:url.href,width:image.naturalWidth,height:image.naturalHeight});
      if(!portrait)throw new Error("ขนาดรูปภาพไม่ถูกต้อง");
      await binding!.save(portrait);await updateSettings({...settings,enabled:true});status.textContent="บันทึกรูปแล้ว";
    });
  });
  api.onReady(async()=>{
    try {
      cleanups.push(api.broadcast.onMessage(PREF_STATE,event=>reflect(event.data)));
      cleanups.push(api.theme.onChange(theme));theme(await api.theme.getTheme());
      try {reflect(JSON.parse(localStorage.getItem(ID)??"null"));}catch{reflect(defaults);}
      preferences.disabled=false;
      await api.broadcast.sendMessage(PREF_REQUEST,{}, {destination:"LOCAL"});
      binding=await createPortraitBinding(api);
      if(disposed){binding.dispose();return;}
      input.value=binding.current?.url??"";artwork.disabled=!binding.ids.length;
      status.textContent=binding.ids.length?`ใช้กับ ${binding.ids.length} Token ที่เลือก`:"กรุณาเลือก Token แล้วเปิด Portrait ใหม่";
    } catch {status.textContent="อ่านข้อมูลไม่สำเร็จ กรุณาเปิด Portrait ใหม่";}
  });
  window.addEventListener("pagehide",()=>{disposed=true;binding?.dispose();cleanups.forEach(fn=>fn());},{once:true});
}
