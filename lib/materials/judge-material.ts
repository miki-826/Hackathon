import type { CutOutcome, MaterialId, MotionFeatures } from "@/lib/types";
import { MATERIALS } from "@/lib/materials/profiles";

/**
 * 素材ごとに切り方が違う、というコア体験を成立させる判定。
 * - 紐/木/餅: 速く鋭く振り抜く → 遅いと失敗
 * - 豆腐/プリン: やさしくまっすぐ → 強すぎ/ブレで失敗
 * - ゼリー: 中速・一定速度・直線 → 速すぎ/遅すぎ/不安定で失敗
 * 値は MVP 向けに寛容寄り（厳しすぎる判定は最大のリスク）。
 */
export function judgeMaterial(
  id: MaterialId,
  f: MotionFeatures
): CutOutcome {
  const cat = MATERIALS[id].category;

  switch (cat) {
    case "flexible": // 紐
      if (f.peakSpeed < 0.5) return "too-weak";
      return "success";

    case "hard": // 木
      if (f.peakSpeed < 0.55) return "too-weak";
      if (f.followThrough < 0.18) return "too-weak";
      return "success";

    case "sticky": // 餅
      if (f.peakSpeed < 0.42) return "too-weak";
      if (f.followThrough < 0.15) return "too-weak";
      return "success";

    case "fragile": // 豆腐・プリン
      if (f.peakSpeed > 0.82) return "too-strong";
      if (f.straightness < 0.42) return "unstable";
      return "success";

    case "wobbly": // ゼリー
      if (f.peakSpeed > 0.88) return "too-strong";
      if (f.peakSpeed < 0.22) return "too-weak";
      if (f.speedVariation > 0.75) return "unstable";
      return "success";

    default:
      return "success";
  }
}
