interface StoreObj {
id: string,
lat?: string,
long?:string,
name: string,
address?: string,
phone?: string,
}
export const MockupLocation: StoreObj[] = [
  {
    id: "1",
    lat: "13.826678422033615",
    long: "100.57500300673289",
    name: "บริษัท ที.ซี.ฟาร์มา-เคม จำกัด ",
    address: "488 ซอยเฉลิมสุข ถนนพหลโยธิน แขวงจันทรเกษม เขตจตุจักร กรุงเทพมหานคร 10900",
    phone: "02-939-0431",
  },
  {
    id: "2",
    name: "ร้านขายยาเภสัชกรไทย",
    lat: "13.826678422033615",
    long: "100.57500300673289",
  },
];
