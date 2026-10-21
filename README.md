# Token Portrait 1.1.0

## เปลี่ยนจาก 1.0.0

- เปลี่ยนจาก Billboard ในฉากที่คอยชดเชยกล้อง เป็น Popover โปร่งใสที่ยึดพิกัดหน้าจอ
- ไม่อ่านตำแหน่งกล้อง ไม่ชดเชยการ pan/zoom และไม่เปิดภาพซ้ำระหว่างเลื่อนแผนที่
- แสดงเฉพาะรูป Portrait ที่ผูกไว้กับ Token ไม่ใช้รูป Token เป็นภาพสำรอง
- เลือกรูปจากคลัง Owlbear ด้วย image picker มาตรฐาน หรือใส่ลิงก์ HTTPS
- รูปผูกกับ metadata ของ Token ในฉาก จึงยังอยู่หลังโหลดห้องใหม่ และผู้เล่นที่เลือก Token เดียวกันใช้รูปที่กำหนดไว้ได้
- การเลือก Token และตำแหน่ง/ขนาดภาพยังเป็นของผู้ใช้แต่ละคน

## อัปเดต GitHub และ Cloudflare Pages

1. แตก `token-portrait-source-1.1.0.zip`
2. อัปโหลดไฟล์และโฟลเดอร์ภายในไปทับที่ root ของ repository เดิม แล้ว Commit
3. ตรวจว่ามี `portrait.html`, `link.html`, `background.html` และ `package.json` ที่หน้าแรก
4. Cloudflare Pages ใช้ Build command `npm run build`, Output `dist`, Root เว้นว่าง
5. รอ deployment สำเร็จ เปิด manifest URL เดิม ต้องเห็น version `1.1.0`
6. โหลดห้อง Owlbear ใหม่ หากข้อมูล Extension ยังเก่า ให้ถอดแล้วเพิ่มด้วย manifest URL เดิม

URL เดิม: https://owlbear-token-portrait.pages.dev/manifest.json

โฟลเดอร์นี้ยังไม่ได้ push/deploy ขึ้นบัญชี GitHub หรือ Cloudflare ของคุณ
ไฟล์ deploy ZIP เป็นอีกทางเลือกสำหรับโฮสต์ไฟล์ที่ build แล้ว ส่วน Git integration ให้ใช้ source ZIP

## วิธีใช้

เลือก Token แล้วเปิดเมนูของ Token:

- **Portrait · เลือกรูปจากคลัง Owlbear** เปิดตัวเลือกภาพมาตรฐานของ Owlbear แล้วเลือกรูปที่ต้องการ
- **Portrait · ใส่ลิงก์รูปภาพ** เปิดช่องลิงก์เล็กๆ ใน context menu ใส่ลิงก์ HTTPS ของรูปโดยตรงแล้วกดบันทึก
- **Portrait · ล้างรูปที่ผูกไว้** ลบเฉพาะการผูก Portrait ไม่ลบรูป Token หรือไฟล์ในคลัง
- **Portrait · มุมล่างซ้าย / มุมล่างขวา** เลือกตำแหน่งและเปิดภาพกลับมาหากเคยซ่อน
- **Portrait · ซ่อนภาพ** ปิดการแสดงผลเฉพาะผู้ใช้คนนี้
- **Portrait · เปลี่ยนขนาด** วนขนาด 180 / 240 / 300 px ปรับเล็กลงเมื่อหน้าจอไม่พอ

ถ้าเลือกหลาย Token แล้วผูกรูป ภาพเดียวกันจะผูกกับ Token รูปภาพทั้งหมดที่เลือก
ต้องมีสิทธิ์ UPDATE ของ Token เพื่อกำหนด/ล้างรูป ภาพต้นฉบับและตำแหน่ง Token ไม่ถูกแก้
เมื่อเลือกหลาย Token จะแสดงภาพปัจจุบันต่อถ้า Token นั้นยังถูกเลือก
Token ที่ยังไม่มีรูป Portrait จะไม่แสดงภาพ

ใช้ PNG/WebP โปร่งใสเมื่อต้องการตัวละครไร้พื้นหลัง ระบบไม่ลบพื้นหลัง/กรอบที่อยู่ในไฟล์ภาพเอง
URL ต้องเปิดเป็นรูปได้โดยไม่เข้าสู่ระบบ ไม่ใช่ลิงก์หน้าดูไฟล์หรือหน้าเว็บ
รูปที่เลือกในคลังใช้ URL ของ Owlbear โดยตรง ไม่มีการดาวน์โหลดมาโฮสต์ใหม่

## ข้อจำกัดและผลทดสอบ

- Popover ยึดตำแหน่งหน้าจอ แต่ iframe อาจรับการคลิกในพื้นที่สี่เหลี่ยมของภาพ จึงไม่รับประกัน click-through เหมือนรุ่น Billboard
- เว้นแถบเครื่องมือด้านข้างและด้านล่างตามขนาดหน้าจอ ไม่อ้างว่าเลี่ยงได้ทุกแผงที่ขยายหรือ Extension อื่น
- การ resize หน้าต่างตรวจทุก 350 ms; pan/zoom ไม่ทำให้ตำแหน่งภาพเปลี่ยน
- รับ selection ของ Owlbear จึงยังขึ้นกับเครื่องมือ Move/Measure ว่าส่ง selection หรือไม่
- การผูกภาพเป็น metadata ของฉาก; URL ภาพไม่ควรเป็นลิงก์ลับที่ไม่ต้องการให้ผู้ร่วมฉากเข้าถึง
- ไม่มีการเพิ่ม animation หรือขยับปาก
- ทดสอบ unit tests 9 รายการ, build TypeScript และ browser QA ผ่าน SDK adapter
- ทดสอบ URL editor และ renderer จริงด้วยลิงก์ HTTPS สำเร็จ และตรวจ HTTP/ลิงก์เสีย
- ยังไม่ได้ทดสอบ Popover/picker ภายในห้อง Owlbear ที่ลงชื่อเข้าใช้จริง

## พัฒนา

Node.js 22.18+:

```sh
npm ci
npm test
npm run build
npm run dev -- --port 5190
```

เปิด `/qa/index.html` สำหรับ SDK test harness, `/qa/compact.html` สำหรับกรอบหน้าจอเล็ก
หน้าทดสอบไม่รวมใน dist ที่ deploy

API: https://docs.owlbear.rodeo/extensions/apis/popover/
Image picker: https://docs.owlbear.rodeo/extensions/apis/assets/
