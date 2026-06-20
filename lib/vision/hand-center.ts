import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

/** 手首・人差し指付け根・小指付け根の加重平均で手刀中心を求める */
export function getHandCenter(lm: NormalizedLandmark[]) {
  const wrist = lm[0];
  const indexMcp = lm[5];
  const pinkyMcp = lm[17];
  return {
    x: wrist.x * 0.4 + indexMcp.x * 0.3 + pinkyMcp.x * 0.3,
    y: wrist.y * 0.4 + indexMcp.y * 0.3 + pinkyMcp.y * 0.3,
  };
}

/** 手首→中指先の距離を手の大きさとして使う（速度の正規化用） */
export function getHandScale(lm: NormalizedLandmark[]): number {
  const wrist = lm[0];
  const middleTip = lm[12];
  const d = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y);
  return Math.max(d, 0.05);
}
