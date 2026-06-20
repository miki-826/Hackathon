import type { MaterialId } from "@/lib/types";

function pools(elapsedMs: number): MaterialId[] {
  const s = elapsedMs / 1000;
  if (s < 15) return ["rope", "tofu"];
  if (s < 35) return ["rope", "tofu", "wood", "pudding"];
  if (s < 50) return ["mochi", "jelly", "tofu", "rope"];
  return ["rope", "tofu", "wood", "pudding", "mochi", "jelly"];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 出現制御: バッグ方式・直前回避・初回は rope -> tofu 固定。
 */
export class MaterialBag {
  private bag: MaterialId[] = [];
  private last: MaterialId | null = null;
  private count = 0;

  next(elapsedMs: number): MaterialId {
    this.count += 1;
    if (this.count === 1) {
      this.last = "rope";
      return "rope";
    }
    if (this.count === 2) {
      this.last = "tofu";
      return "tofu";
    }

    if (this.bag.length === 0) {
      this.bag = shuffle(pools(elapsedMs));
    }
    let pick = this.bag.pop()!;
    if (pick === this.last && this.bag.length > 0) {
      const alt = this.bag.pop()!;
      this.bag.push(pick);
      pick = alt;
    }
    this.last = pick;
    return pick;
  }
}
