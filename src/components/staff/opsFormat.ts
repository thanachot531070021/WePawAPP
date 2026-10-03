/** "นาทีจากเที่ยงคืน" → HH:MM (= opsFmt ของบอร์ดคลินิกบนเว็บ) */
export const opsTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.round(m % 60)).padStart(2, "0")}`;
