// ไม่แตะ DB — ใช้ได้ทั้ง client (ChatThread) และ server

/** ชนิดไฟล์แนบในแชทที่เป็น "การ์ดใบเสร็จ" — แอปรุ่นเก่าที่ไม่รู้จักจะเห็นเป็นไฟล์แนบชื่อ "ใบเสร็จ INV-…" แทน */
export const RECEIPT_ATTACHMENT_TYPE = "application/vnd.petcare.receipt";

export type ReceiptCard = {
  id: string;
  receipt_no: string;
  total: number;
  clinic_name: string;
  item_count: number;
  paid_at: string;
};
