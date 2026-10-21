# Token Portrait 1.2.0

## เปลี่ยนจาก 1.0.0

- เปลี่ยนจาก Billboard ในฉากที่คอยชดเชยกล้อง เป็น Popover โปร่งใสที่ยึดพิกัดหน้าจอ
- ไม่อ่านตำแหน่งกล้อง ไม่ชดเชยการ pan/zoom และไม่เปิดภาพซ้ำระหว่างเลื่อนแผนที่
- แสดงเฉพาะรูป Portrait ที่ผูกไว้กับ Token ไม่ใช้รูป Token เป็นภาพสำรอง
- เลือกรูปจากคลัง Owlbear ด้วย image picker มาตรฐาน หรือใส่ลิงก์ HTTPS
- รูปผูกกับ metadata ของ Token ในฉาก จึงยังอยู่หลังโหลดห้องใหม่ และผู้เล่นที่เลือก Token เดียวกันใช้รูปที่กำหนดไว้ได้
- การเลือก Token และตำแหน่ง/ขนาดภาพยังเป็นของผู้ใช้แต่ละคน

## อัปเดต GitHub และ Cloudflare Pages

1. แตก `token-portrait-source-1.2.0.zip`
2. อัปโหลดไฟล์และโฟลเดอร์ภายในไปทับที่ root ของ repository เดิม แล้ว Commit
3. ตรวจว่ามี `portrait.html`, `link.html`, `background.html` และ `package.json` ที่หน้าแรก
4. Cloudflare Pages ใช้ Build command `npm run build`, Output `dist`, Root เว้นว่าง
5. รอ deployment สำเร็จ เปิด manifest URL เดิม ต้องเห็น version `1.2.0`
6. โหลดห้อง Owlbear ใหม่ หากข้อมูล Extension ยังเก่า ให้ถอดแล้วเพิ่มด้วย manifest URL เดิม

URL เดิม: https://owlbear-token-portrait.pages.dev/manifest.json

โฟลเดอร์นี้ยังไม่ได้ push/deploy ขึ้นบัญชี GitHub หรือ Cloudflare ของคุณ
ไฟล์ deploy ZIP เป็นอีกทางเลือกสำหรับโฮสต์ไฟล์ที่ build แล้ว ส่วน Git integration ให้ใช้ source ZIP

## ## วิธีใช้

1. เลือก Token แล้วกด **Portrait** ปุ่มเดียวบน context menu ของ Token
2. Owlbear จะเปิดเครื่องมือ **Portrait** ในแถบเครื่องมือมาตรฐาน
3. คำสั่งทั้งหมดอยู่ในกลุ่มเดียวกัน:

- **ตำแหน่ง** กดสลับซ้าย/ขวา tooltip แจ้งตำแหน่งปัจจุบัน
- **แสดง/ซ่อน** กดสลับสถานะ tooltip แจ้งสถานะปัจจุบัน
- **ขนาด** วน 180 / 240 / 300 px พร้อมขนาดปัจจุบันใน tooltip
- **เลือกรูปจากคลัง Owlbear** ใช้ image picker มาตรฐาน
- **ใส่ลิงก์รูปภาพ** เปิดช่องลิงก์เดิมที่มีอยู่ ป้อน HTTPS แล้วบันทึก
- **ล้างรูปที่ผูกไว้** ลบเฉพาะการผูก Portrait

เปิดจากไอคอน Portrait ใน toolbar ได้เช่นกัน คำสั่งทั้งหกแสดงเฉพาะเมื่อใช้เครื่องมือ Portrait
ถ้าไม่ได้เลือก Token รูปภาพ ปุ่มเลือกภาพ/ลิงก์/ล้างรูปจะถูกปิดไว้
เครื่องมือใช้ select mode ของ Owlbear และตั้งให้ใช้พฤติกรรมลากแบบ Move มาตรฐาน
รุ่นนี้ไม่มีหน้าตั้งค่าใหม่ ปุ่ม/tooltip/tool menu ถูกวาดโดย Owlbear SDK Tool API
ส่วนช่อง URL เดิมเป็น HTML ของ Extension ที่ใช้สีตามธีม Owlbear เพราะ SDK ไม่มีช่องป้อน URL สำเร็จรูป

ต้องมีสิทธิ์แก้ไข Token เพื่อผูก/ล้างรูป เลือกหลาย Token แล้วกำหนดภาพจะผูกภาพเดียวกันกับทั้งหมด
ภาพเดิมใน Token และการผูก Portrait จากรุ่นก่อนยังใช้ต่อได้ การแสดงผล/ตำแหน่ง/ขนาดเป็นของแต่ละผู้ใช้
ใช้ PNG/WebP โปร่งใสเมื่อต้องการตัวละครไร้พื้นหลัง และใช้ลิงก์รูปโดยตรงแบบ HTTPS

ข้อจำกัดและผลทดสอบ

- Popover ยึดตำแหน่งหน้าจอ แต่ iframe อาจรับการคลิกในพื้นที่สี่เหลี่ยมของภาพ จึงไม่รับประกัน click-through เหมือนรุ่น Billboard
- เว้นแถบเครื่องมือด้านข้างและด้านล่างตามขนาดหน้าจอ ไม่อ้างว่าเลี่ยงได้ทุกแผงที่ขยายหรือ Extension อื่น
- การ resize หน้าต่างตรวจทุก 350 ms; pan/zoom ไม่ทำให้ตำแหน่งภาพเปลี่ยน
- รับ selection ของ Owlbear จึงยังขึ้นกับเครื่องมือ Move/Measure ว่าส่ง selection หรือไม่
- การผูกภาพเป็น metadata ของฉาก; URL ภาพไม่ควรเป็นลิงก์ลับที่ไม่ต้องการให้ผู้ร่วมฉากเข้าถึง
- ไม่มีการเพิ่ม animation หรือขยับปาก
- ทดสอบ unit tests 10 รายการ, build TypeScript และ browser QA ผ่าน SDK adapter
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


