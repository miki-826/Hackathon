import type { MaterialId } from "@/lib/types";
import { MATERIAL_IMAGE } from "@/lib/materials/profiles";

export type AppAssets = {
  materials: Record<MaterialId, HTMLCanvasElement | null>;
  stump: HTMLCanvasElement | null;
  seal: HTMLCanvasElement | null;
  bgGarden: HTMLImageElement | null;
  bgPlay: HTMLImageElement | null;
  washi: HTMLImageElement | null;
  /** UI用に黒を抜いた透過PNGのdataURL（CSS背景で使用） */
  plaqueUrl: string | null;
  norenUrl: string | null;
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** gpt-image-2 は透過非対応のため黒背景で生成 → ここで近黒をアルファ抜きする */
function keyBlack(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  try {
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const p = data.data;
    const low = 16;
    const high = 64;
    for (let i = 0; i < p.length; i += 4) {
      const L = Math.max(p[i], p[i + 1], p[i + 2]);
      let a = (L - low) / (high - low);
      a = a < 0 ? 0 : a > 1 ? 1 : a;
      p[i + 3] = Math.round(p[i + 3] * a);
    }
    ctx.putImageData(data, 0, 0);
  } catch {
    /* tainted などは素通し */
  }
  return c;
}

async function loadKeyed(src: string): Promise<HTMLCanvasElement | null> {
  const img = await loadImage(src);
  if (!img) return null;
  return keyBlack(img);
}

async function loadKeyedUrl(
  src: string,
  maxW: number
): Promise<string | null> {
  const c = await loadKeyed(src);
  if (!c) return null;
  try {
    const scale = Math.min(1, maxW / c.width);
    const out = document.createElement("canvas");
    out.width = Math.round(c.width * scale);
    out.height = Math.round(c.height * scale);
    out.getContext("2d")!.drawImage(c, 0, 0, out.width, out.height);
    return out.toDataURL("image/png");
  } catch {
    return null;
  }
}

export async function loadAssets(): Promise<AppAssets> {
  const ids: MaterialId[] = ["tofu", "rope", "wood", "pudding", "mochi", "jelly"];
  const matEntries = await Promise.all(
    ids.map(async (id) => [id, await loadKeyed(MATERIAL_IMAGE[id])] as const)
  );
  const materials = Object.fromEntries(matEntries) as Record<
    MaterialId,
    HTMLCanvasElement | null
  >;

  const [stump, seal, bgGarden, bgPlay, washi, plaqueUrl, norenUrl] =
    await Promise.all([
      loadKeyed("/images/stump.png"),
      loadKeyed("/images/seal-frame.png"),
      loadImage("/images/bg-garden.png"),
      loadImage("/images/bg-play.png"),
      loadImage("/images/washi-cert.png"),
      loadKeyedUrl("/images/plaque-wood.png", 640),
      loadKeyedUrl("/images/noren.png", 760),
    ]);

  return {
    materials,
    stump,
    seal,
    bgGarden,
    bgPlay,
    washi,
    plaqueUrl,
    norenUrl,
  };
}
