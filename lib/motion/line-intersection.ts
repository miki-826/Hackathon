export type Pt = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

function segIntersect(p1: Pt, p2: Pt, p3: Pt, p4: Pt): boolean {
  const d = (a: Pt, b: Pt, c: Pt) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const d1 = d(p3, p4, p1);
  const d2 = d(p3, p4, p2);
  const d3 = d(p1, p2, p3);
  const d4 = d(p1, p2, p4);
  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true;
  }
  return false;
}

function pointInRect(p: Pt, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

/** 前フレーム位置→現在位置の線分が矩形を横切ったか（高速移動でも飛び越えを拾う） */
export function segmentCrossesRect(prev: Pt, cur: Pt, r: Rect): boolean {
  if (pointInRect(prev, r) || pointInRect(cur, r)) return true;
  const tl = { x: r.x, y: r.y };
  const tr = { x: r.x + r.w, y: r.y };
  const bl = { x: r.x, y: r.y + r.h };
  const br = { x: r.x + r.w, y: r.y + r.h };
  return (
    segIntersect(prev, cur, tl, tr) ||
    segIntersect(prev, cur, tr, br) ||
    segIntersect(prev, cur, br, bl) ||
    segIntersect(prev, cur, bl, tl)
  );
}
