export function getRank(cutCount: number): string {
  if (cutCount >= 30) return "柔断十段";
  if (cutCount >= 29) return "九段";
  if (cutCount >= 26) return "七段";
  if (cutCount >= 23) return "五段";
  if (cutCount >= 20) return "三段";
  if (cutCount >= 16) return "初段";
  if (cutCount >= 12) return "一級";
  if (cutCount >= 8) return "三級";
  if (cutCount >= 4) return "五級";
  return "見習い";
}

const KANJI = [
  "〇",
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
  "七",
  "八",
  "九",
  "十",
];

/** 23 -> 二十三 */
export function toKanjiNumber(n: number): string {
  if (n <= 0) return "〇";
  if (n < 10) return KANJI[n];
  if (n === 10) return "十";
  if (n < 20) return "十" + KANJI[n - 10];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return KANJI[tens] + "十" + (ones ? KANJI[ones] : "");
  }
  return String(n);
}
