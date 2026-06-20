import type { MaterialId, MaterialProfile } from "@/lib/types";

export const MATERIALS: Record<MaterialId, MaterialProfile> = {
  rope: {
    id: "rope",
    name: "紐",
    category: "flexible",
    accent: "#e7eef7",
    hint: "速く鋭く",
  },
  tofu: {
    id: "tofu",
    name: "豆腐",
    category: "fragile",
    accent: "#fbf7ee",
    hint: "やさしく",
  },
  wood: {
    id: "wood",
    name: "木",
    category: "hard",
    accent: "#ffcf86",
    hint: "強く振り抜く",
  },
  pudding: {
    id: "pudding",
    name: "プリン",
    category: "fragile",
    accent: "#ffd9a0",
    hint: "そっと",
  },
  mochi: {
    id: "mochi",
    name: "餅",
    category: "sticky",
    accent: "#f3ead8",
    hint: "一気に抜く",
  },
  jelly: {
    id: "jelly",
    name: "ゼリー",
    category: "wobbly",
    accent: "#ffb27a",
    hint: "まっすぐ一定速度",
  },
};

export const MATERIAL_IMAGE: Record<MaterialId, string> = {
  tofu: "/images/mat-tofu.png",
  rope: "/images/mat-rope.png",
  wood: "/images/mat-wood.png",
  pudding: "/images/mat-pudding.png",
  mochi: "/images/mat-mochi.png",
  jelly: "/images/mat-jelly.png",
};
