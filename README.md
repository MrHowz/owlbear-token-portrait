# Token Portrait 1.0.0

Extension สำหรับ Owlbear Rodeo: แสดงภาพของ Token ที่ตัวเองเลือกไว้
บริเวณมุมล่างซ้ายหรือขวาในลักษณะภาพตัวละครคล้าย VTuber
ไม่มีหน้าต่างตั้งค่าแยก ไม่มีพื้นหลังหรือกรอบที่ Extension เพิ่มให้

## ติดตั้ง

1. แตกไฟล์ `token-portrait-deploy-1.0.0.zip`
2. อัปโหลดเนื้อหาใน ZIP ไปยัง **root ของเว็บไซต์ HTTPS สำหรับไฟล์ static**
   ต้องเปิด `/manifest.json`, `/background.html`, `/icon.svg` และ `/assets/...` ได้
   ห้ามตั้ง `X-Frame-Options: DENY/SAMEORIGIN` เพราะ Owlbear โหลด Extension ใน iframe
3. เพิ่ม Extension ใน Owlbear ด้วย URL `https://YOUR-HOST/manifest.json`
   แล้วเปิดใช้งานในห้องของคุณ
4. เปิดฉากแล้วเลือก Token ที่เป็นรูปภาพ ภาพจะปรากฏมุมขวาล่าง

ZIP ไม่สามารถติดตั้งลง Owlbear โดยตรงได้ ต้องมี URL ของ manifest ที่โฮสต์แล้ว
รุ่นนี้ใช้ path จาก root จึงไม่ควรติดตั้งใต้ subdirectory ของเว็บไซต์

## วิธีใช้

เลือก Token แล้วใช้รายการใน **context menu มาตรฐานของ Owlbear**:

- `Portrait · มุมล่างซ้าย` — แสดงภาพด้านซ้าย และเปิดภาพกลับมาหากเคยซ่อน
- `Portrait · มุมล่างขวา` — แสดงภาพด้านขวา และเปิดภาพกลับมาหากเคยซ่อน
- `Portrait · ซ่อนภาพ` — ปิดภาพ จนกว่าจะเลือกคำสั่งซ้ายหรือขวาอีกครั้ง
- `Portrait · เปลี่ยนขนาด เล็ก / กลาง / ใหญ่` — วนขนาด 180 / 240 / 300 px

ขนาดเป็นเพดานความสูง ภาพจะเล็กลงตามสัดส่วนเพื่อให้พอดีกับหน้าจอ
ตัวเลือกบันทึกในเบราว์เซอร์นี้ และมีผลเฉพาะหน้าจอของผู้ใช้คนนี้
การเลือกใหม่ไม่เปลี่ยนภาพของผู้เล่นอื่น

ยกเลิกเลือกแล้วภาพหาย หากเลือกหลาย Token จะคงภาพปัจจุบันไว้ถ้ายังอยู่ในการเลือก
ถ้าไม่อยู่แล้ว จะใช้รูปภาพรายการสุดท้ายในการเลือก
ใช้ภาพต้นฉบับของ Token โดยไม่ตัด ไม่หมุนตาม Token และไม่เพิ่มกรอบ
หากต้องการภาพตัวละครแบบไม่มีพื้นหลัง ควรใช้ไฟล์ต้นฉบับ PNG/WebP โปร่งใส
กรอบหรือพื้นหลังที่เป็นส่วนหนึ่งของไฟล์ต้นฉบับจะยังแสดงอยู่
รุ่นนี้ไม่ได้เพิ่มการขยับปากหรือ animation แบบ VTuber

## ข้อจำกัดที่ต้องรู้

- รับสถานะเลือกผ่าน `OBR.player.onChange` โดยไม่เปลี่ยนเครื่องมือ Move/Measure
  หากเครื่องมือส่ง selection ภาพจะตามการเลือกนั้น แต่ SDK ไม่เปิด global
  pointer-down/drag event ของเครื่องมืออื่น จึง **ไม่รับประกันการจับ Token
  ด้วยเครื่องมือทุกชนิดเมื่อเครื่องมือนั้นไม่ส่ง selection**
- ภาพเป็น local Billboard ที่ตั้ง `disableHit: true` เพื่อไม่รับการคลิก
  และอยู่ใน layer `POPOVER` ไม่แก้ไขภาพหรือข้อมูล Token ของฉากร่วม
- SDK 3.1 ไม่มี viewport change event จึงติดตาม viewport แบบเรียงลำดับทุก 80 ms
  ขณะลากกล้องเร็วอาจเห็นภาพตามมุมช้าชั่วครู่ ไม่ใช่ DOM overlay ที่ล็อกตำแหน่งทันที
- เว้นด้านข้าง 64–84 px และด้านล่าง 76–100 px แต่ SDK ไม่เปิดตำแหน่ง
  ของแผง UI ทั้งหมด จึงไม่รับประกันว่าไม่ทับแผงที่เปิดขยายหรือ UI จาก Extension อื่น
- ทดสอบด้วย Playwright กับ SDK adapter ในเครื่องแล้ว แต่ **ยังไม่ได้ทดสอบ
  ในห้อง Owlbear จริง** เพราะ browser ทดสอบไม่มี session ที่ลงชื่อเข้าใช้
  จึงยังไม่ยืนยัน native Move, Measure movement, การ render Billboard จริง,
  layer/fog และตำแหน่งเทียบกับ toolbar จริงบนทุกอุปกรณ์
- `pagehide` พยายามล้างภาพ local และเมนู เมื่อถอด Extension แล้วมีภาพค้าง
  ให้โหลดห้องใหม่ การ unload frame ไม่รับประกันว่า async cleanup จะจบ

## พัฒนาและทดสอบ

ใช้ Node.js 22.18+:

```sh
npm ci
npm test
npm run build
npm run dev -- --port 5190
```

เปิด `http://127.0.0.1:5190/qa/index.html` เพื่อใช้ test harness
หน้าทดสอบนี้เป็น UI จำลองเท่านั้น ไม่ถูก build หรือติดตั้งไปกับ Extension
ผลทดสอบและภาพหลักฐานอยู่ใน `QA.md` และ `qa/screenshots`
ไฟล์สำหรับโฮสต์ถูกสร้างใน `dist`

## API อ้างอิง

- [Player selection](https://docs.owlbear.rodeo/extensions/apis/player/)
- [Local Billboard](https://docs.owlbear.rodeo/extensions/reference/items/billboard/)
- [Item / disableHit](https://docs.owlbear.rodeo/extensions/reference/items/item/)
- [Viewport](https://docs.owlbear.rodeo/extensions/apis/viewport/)
- [Extension architecture](https://docs.owlbear.rodeo/extensions/getting-started/)
