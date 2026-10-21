import type OBR from "@owlbear-rodeo/sdk";
import type { Theme } from "@owlbear-rodeo/sdk";
import { PORTRAIT_KEY, portraitFrom } from "./model";
export function startLinkEditor(api: typeof OBR) {
const input = document.querySelector<HTMLInputElement>("#url")!;
const save = document.querySelector<HTMLButtonElement>("#save")!;
const status = document.querySelector<HTMLElement>("#status")!;
let ids: string[] = [], invalidated = false;
function theme(value: Theme) {
  for (const [key, val] of Object.entries({ text: value.text.primary, paper: value.background.paper, primary: value.primary.main, contrast: value.primary.contrastText })) document.body.style.setProperty(`--${key}`, val);
}
api.onReady(async () => {
  try {
    api.scene.onReadyChange(() => { invalidated = true; save.disabled = true; status.textContent = "ฉากเปลี่ยนแล้ว กรุณาเปิดเมนูใหม่"; });
    api.theme.onChange(theme);
    theme(await api.theme.getTheme());
    const selected = await api.player.getSelection() ?? [];
    const items = await api.scene.items.getItems(selected);
    ids = items.filter(item => item.type === "IMAGE").map(item => item.id);
    input.value = portraitFrom(items.find(item => item.id === ids[0])?.metadata[PORTRAIT_KEY])?.url ?? "";
    save.disabled = !ids.length || invalidated;
    status.textContent = ids.length ? `ผูกภาพกับ ${ids.length} Token · ใช้ลิงก์รูปโดยตรง` : "กรุณาเลือก Token ก่อน";
  } catch { status.textContent = "อ่าน Token ไม่สำเร็จ ลองเปิดเมนูใหม่"; }
});
document.querySelector("form")!.addEventListener("submit", async event => {
  event.preventDefault();
  if (!ids.length || invalidated) return;
  save.disabled = true;
  try {
    const url = new URL(input.value.trim());
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("กรุณาใช้ลิงก์รูป HTTPS ที่ไม่มีข้อมูลเข้าสู่ระบบ");
    status.textContent = "กำลังตรวจรูปภาพ…";
    const image = new Image(); image.referrerPolicy = "no-referrer";
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { image.src = ""; reject(new Error("โหลดภาพนานเกินไป กรุณาตรวจลิงก์")); }, 12000);
      image.onload = () => { clearTimeout(timer); resolve(); };
      image.onerror = () => { clearTimeout(timer); reject(new Error("โหลดรูปไม่ได้ ใช้ลิงก์รูปโดยตรงที่เปิดดูได้")); };
      image.src = url.href;
    });
    const portrait = portraitFrom({ url: url.href, width: image.naturalWidth, height: image.naturalHeight });
    if (!portrait) throw new Error("ขนาดรูปภาพไม่ถูกต้อง");
    if (invalidated) return;
    await api.scene.items.updateItems(ids, drafts => { for (const item of drafts) item.metadata[PORTRAIT_KEY] = portrait; });
    status.textContent = "บันทึกแล้ว · ถ้าภาพถูกซ่อน ให้กดแสดงภาพในเครื่องมือ Portrait";
  } catch (error) { status.textContent = error instanceof Error ? error.message : "บันทึกไม่สำเร็จ ตรวจสิทธิ์แก้ไข Token"; }
  finally { save.disabled = invalidated || !ids.length; }
});

}

