export type GameScreen =
  | "title"
  | "camera-permission"
  | "camera-check"
  | "calibration"
  | "countdown"
  | "playing"
  | "result";

export type MaterialId =
  | "tofu"
  | "rope"
  | "wood"
  | "pudding"
  | "mochi"
  | "jelly";

export type MaterialCategory =
  | "fragile"
  | "flexible"
  | "hard"
  | "sticky"
  | "wobbly";

export type CutOutcome =
  | "success"
  | "too-strong"
  | "too-weak"
  | "unstable"
  | "miss";

export type InputMode = "camera" | "mock";

/** 0..1 の正規化ステージ座標 + 時刻 */
export type HandSample = {
  t: number;
  x: number;
  y: number;
  handScale: number;
  confidence: number;
};

export type MotionFeatures = {
  peakSpeed: number;
  averageSpeed: number;
  straightness: number;
  speedVariation: number;
  followThrough: number;
};

export type CalibrationProfile = {
  reference: number;
};

export type MaterialProfile = {
  id: MaterialId;
  name: string;
  category: MaterialCategory;
  /** 斬撃の色（成功時の閃光） */
  accent: string;
  hint: string;
};

export type PhotoCandidate = {
  id: string;
  dataUrl: string;
  cutCount: number;
  materialId: MaterialId;
  score: number;
};
