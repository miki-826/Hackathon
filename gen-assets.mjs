#!/usr/bin/env node
// gen-assets.mjs — 柔断 の世界観 asset をまとめて gpt-image-2(medium) で生成する。
// 既存ファイルはスキップ。1枚失敗しても続行。
// gpt-image-2 は透過背景非対応のため、スプライトは「純黒背景」で生成し、
// 実装側で screen/lighten 合成して黒を抜く。

import { writeFile, mkdir, access } from "node:fs/promises";
import { dirname } from "node:path";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("ERROR: OPENAI_API_KEY 未設定");
  process.exit(1);
}

const OUT = "public/images";
const BLACK =
  " The entire background must be a solid pure black #000000, completely flat with no gradient, no vignette and no cast shadow on the background, the object fully separated from the black.";

const assets = [
  {
    file: "bg-garden.png",
    size: "1536x1024",
    prompt:
      "A serene traditional Japanese garden at dusk, dojo aesthetic, deep indigo and sumi ink color palette, warm glow from a stone lantern, bamboo grove and moss, a wooden engawa veranda, gentle evening mist, a single weathered wooden tree stump in the lower center as a cutting platform, soft backlight through shoji screens, painterly ukiyo-e influenced game background, cinematic depth, calm empty space in the center and lower-middle reserved for overlaying a character, no text, no people, high quality game UI background art",
  },
  {
    file: "bg-play.png",
    size: "1536x1024",
    prompt:
      "Darkened Japanese garden dojo at night, deep indigo fading to near-black heavy vignette around all edges, faint warm lantern light, drifting mist, subtle bamboo silhouettes at the sides, a weathered wooden tree stump cutting platform at the bottom center, strong dark vignette framing the edges so a bright webcam video can show through the open center, moody atmospheric game background, no text, no people, painterly, high quality",
  },
  {
    file: "washi-cert.png",
    size: "1024x1536",
    prompt:
      "A vertical traditional Japanese washi paper certificate background, cream unbleached natural paper texture with subtle visible fibers, an elegant gold and sumi ink double-line decorative border frame around the edges, a faint circular crest watermark, warm aged paper tone, completely empty interior reserved for text and a photo, refined formal aesthetic, no text, high quality, portrait orientation",
  },
  {
    file: "stump.png",
    size: "1024x1024",
    prompt:
      "A single weathered round wooden tree stump cutting block, three-quarter top view, visible concentric tree rings and rough bark, warm dark brown wood with faint blade marks on the top surface, centered, clean game sprite, painterly Japanese aesthetic, no text." +
      BLACK,
  },
  {
    file: "plaque-wood.png",
    size: "1536x1024",
    prompt:
      "A horizontal Japanese wooden signboard plaque kanban, warm mid-brown stained wood with a subtle burned branded border and small brass corner fittings, completely blank empty center surface with no text and no characters, slightly worn warm wood grain that is clearly brighter than black, centered, generous empty inner area for overlaying a UI button label, clean game UI button skin asset." +
      BLACK,
  },
  {
    file: "noren.png",
    size: "1536x1024",
    prompt:
      "A traditional indigo dyed Japanese noren curtain hanging from the very top edge, split short fabric panels, glowing deep ai-zome indigo blue clearly brighter than black, with a faint subtle circular crest pattern, soft fabric texture, occupying only the top third and the rest is pure black, centered horizontally, painterly, no text, clean game UI top decoration." +
      BLACK,
  },
  {
    file: "seal-frame.png",
    size: "1024x1024",
    prompt:
      "A traditional round vermillion red ink hanko seal stamp impression, bright vermillion red ink clearly brighter than black, ornate circular double border ring with a thin gold accent rim, empty blank center with absolutely no characters and no text, slightly irregular hand stamped ink texture, centered, clean game asset." +
      BLACK,
  },
  {
    file: "mat-tofu.png",
    size: "1024x1024",
    prompt:
      "A single cute block of fresh white silken tofu, soft glossy slightly wobbly cube with a gentle highlight, comical kawaii game item, centered, painterly clean game sprite, no text." +
      BLACK,
  },
  {
    file: "mat-rope.png",
    size: "1024x1024",
    prompt:
      "A single short thick braided Japanese cord rope segment hanging vertically with slightly frayed ends, light warm beige and bright indigo twisted strands clearly brighter than black, comical kawaii game item, centered, painterly clean game sprite, no text." +
      BLACK,
  },
  {
    file: "mat-wood.png",
    size: "1024x1024",
    prompt:
      "A single short green bamboo log segment standing upright with visible nodes, fresh bright green bamboo, comical kawaii game item, centered, painterly clean game sprite, no text." +
      BLACK,
  },
  {
    file: "mat-pudding.png",
    size: "1024x1024",
    prompt:
      "A single cute custard pudding purin with glossy caramel sauce dripping over a jiggly yellow dome shape on a small plate, comical kawaii game item, centered, painterly clean game sprite, no text." +
      BLACK,
  },
  {
    file: "mat-mochi.png",
    size: "1024x1024",
    prompt:
      "A single soft plump round white mochi rice cake, squishy with a light dusting of starch powder, comical kawaii game item, centered, painterly clean game sprite, no text." +
      BLACK,
  },
  {
    file: "mat-jelly.png",
    size: "1024x1024",
    prompt:
      "A single wobbly translucent amber orange fruit jelly cube on a small plate, glossy and jiggly clearly brighter than black, comical kawaii game item, centered, painterly clean game sprite, no text." +
      BLACK,
  },
];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function gen(a) {
  const out = `${OUT}/${a.file}`;
  if (await exists(out)) {
    console.log(`SKIP  ${a.file} (既存)`);
    return;
  }
  const body = {
    model: "gpt-image-2",
    prompt: a.prompt,
    size: a.size,
    quality: "medium",
    n: 1,
  };

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error(`ERR   ${a.file} ${res.status} (try ${attempt}): ${t.slice(0, 200)}`);
        if (attempt === 2) return;
        await new Promise((r) => setTimeout(r, 4000));
        continue;
      }
      const data = await res.json();
      const b64 = data?.data?.[0]?.b64_json;
      if (!b64) {
        console.error(`ERR   ${a.file} 画像データなし`);
        return;
      }
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, Buffer.from(b64, "base64"));
      console.log(`OK    ${a.file}`);
      return;
    } catch (e) {
      console.error(`ERR   ${a.file} ${e.message} (try ${attempt})`);
      if (attempt === 2) return;
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
}

for (const a of assets) {
  await gen(a);
}
console.log("=== gen-assets done ===");
