interface StoreObj {
id: string,
lat?: string,
long?:string,
name: string,
note: string,
address?: string,
phone?: string,
}
export const MockupLocation: StoreObj[] = [
  {
    id: "1",
    lat: "13.826678422033615",
    long: "100.57500300673289",
    name: "บริษัท ที.ซี.ฟาร์มา-เคม จำกัด (มีข้อมูลตำแหน่ง)",
    note: "(สำหรับทดสอบระบบการตรวจสอบตำแหน่งที่บันทึกไว้แล้ว หรือเพื่อทำการแก้ไข)",
    address: "488 ซอยเฉลิมสุข ถนนพหลโยธิน แขวงจันทรเกษม เขตจตุจักร กรุงเทพมหานคร 10900",
    phone: "02-939-0431",
  },
  {
    id: "2",
    name: "ร้านขายยาทดสอบ (ไม่มีตำแหน่ง)",
    note: "(สำหรับทดสอบระบบการเพิ่ม/บันทึก ตำแหน่ง ใหม่)",
    address: "123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพมหานคร 10100",
    phone: "02-999-9999",
  },
];
