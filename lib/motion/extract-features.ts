import type { HandSample, MotionFeatures } from "@/lib/types";

/**
 * 一振り分のサンプル列から特徴量を算出する。
 * 速度は reference（個人の全力速度）で正規化して 0..1.5 程度に収める。
 * crossIndex 以降の移動を「振り抜き」として扱う。
 */
export function extractFeatures(
  samples: HandSample[],
  reference: number,
  crossIndex: number
): MotionFeatures {
  if (samples.length < 2) {
    return {
      peakSpeed: 0,
      averageSpeed: 0,
      straightness: 0,
      speedVariation: 1,
      followThrough: 0,
    };
  }

  const speeds: number[] = [];
  let pathLen = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    const dt = Math.max((b.t - a.t) / 1000, 1 / 240);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    pathLen += dist;
    const raw = dist / dt; // units/sec
    speeds.push(raw / reference);
  }

  const peakSpeed = Math.min(1.5, Math.max(...speeds));
  const averageSpeed =
    speeds.reduce((s, v) => s + v, 0) / Math.max(speeds.length, 1);

  const start = samples[0];
  const end = samples[samples.length - 1];
  const straightDist = Math.hypot(end.x - start.x, end.y - start.y);
  const straightness = pathLen > 1e-4 ? Math.min(1, straightDist / pathLen) : 0;

  const mean = averageSpeed || 1e-4;
  const variance =
    speeds.reduce((s, v) => s + (v - mean) * (v - mean), 0) / speeds.length;
  const speedVariation = Math.sqrt(variance) / mean;

  // 振り抜き: 交差後の移動量 / 手の大きさ
  let after = 0;
  const ci = Math.min(Math.max(crossIndex, 0), samples.length - 1);
  for (let i = ci + 1; i < samples.length; i++) {
    after += Math.hypot(
      samples[i].x - samples[i - 1].x,
      samples[i].y - samples[i - 1].y
    );
  }
  const scale = samples[ci].handScale || 0.15;
  const followThrough = after / scale;

  return { peakSpeed, averageSpeed, straightness, speedVariation, followThrough };
}
