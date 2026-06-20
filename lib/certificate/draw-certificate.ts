import { toKanjiNumber } from "@/lib/rank/get-rank";

export type CertificateInput = {
  cutCount: number;
  rank: string;
  photoDataUrl: string | null;
  washi: HTMLImageElement | null;
  seal: HTMLCanvasElement | null;
  issuedAt: Date;
};

const W = 1200;
const H = 1600;

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function coverRect(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  sw: number,
  sh: number,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const scale = Math.max(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

export async function drawCertificate(
  canvas: HTMLCanvasElement,
  input: CertificateInput
): Promise<void> {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch {
    /* noop */
  }

  // 背景（和紙）
  if (input.washi) {
    coverRect(ctx, input.washi, input.washi.naturalWidth, input.washi.naturalHeight, 0, 0, W, H);
  } else {
    ctx.fillStyle = "#efe2c4";
    ctx.fillRect(0, 0, W, H);
  }

  // 枠
  ctx.strokeStyle = "#b89a4e";
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, W - 120, H - 120);

  ctx.textAlign = "center";
  ctx.fillStyle = "#1c1208";

  // タイトル
  ctx.font = '700 78px "Yuji Syuku", "Shippori Mincho", serif';
  ctx.fillText("柔断 段位認定証", W / 2, 175);
  ctx.font = '400 30px "Shippori Mincho", serif';
  ctx.fillStyle = "#5a4a30";
  ctx.fillText("J U D A N   C E R T I F I C A T E", W / 2, 225);

  // 写真
  const px = 150;
  const py = 290;
  const pw = W - px * 2;
  const ph = 690;
  if (input.photoDataUrl) {
    const photo = await loadImg(input.photoDataUrl);
    if (photo) {
      coverRect(ctx, photo, photo.naturalWidth, photo.naturalHeight, px, py, pw, ph);
    }
  } else {
    ctx.fillStyle = "rgba(28,18,8,0.08)";
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = "#7a6038";
    ctx.font = '400 34px "Shippori Mincho", serif';
    ctx.fillText("― 無心 ―", W / 2, py + ph / 2);
  }
  ctx.strokeStyle = "#2c2014";
  ctx.lineWidth = 5;
  ctx.strokeRect(px, py, pw, ph);

  // 切断数
  ctx.fillStyle = "#1c1208";
  ctx.font = '400 40px "Shippori Mincho", serif';
  ctx.fillText("一分間之斬", W / 2, py + ph + 95);
  ctx.font = '700 130px "Yuji Syuku", "Shippori Mincho", serif';
  ctx.fillText(`${toKanjiNumber(input.cutCount)}断`, W / 2, py + ph + 230);

  // 段位
  ctx.fillStyle = "#8a1f12";
  ctx.font = '700 86px "Yuji Syuku", "Shippori Mincho", serif';
  ctx.fillText(`柔断 ${input.rank}`, W / 2, py + ph + 340);

  // 日付・発行
  const d = input.issuedAt;
  ctx.fillStyle = "#3a2c18";
  ctx.font = '400 32px "Shippori Mincho", serif';
  ctx.fillText(
    `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`,
    W / 2,
    H - 150
  );
  ctx.fillText("柔断道場 認定", W / 2, H - 105);

  // 認定印
  const seal = input.seal;
  const ss = 190;
  const sx = W - 130 - ss;
  const sy = H - 130 - ss;
  if (seal) {
    ctx.drawImage(seal, sx, sy, ss, ss);
  } else {
    ctx.strokeStyle = "#b5462f";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(sx + ss / 2, sy + ss / 2, ss / 2 - 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#b5462f";
  ctx.font = '700 58px "Yuji Syuku", "Shippori Mincho", serif';
  ctx.textBaseline = "middle";
  ctx.fillText("柔断", sx + ss / 2, sy + ss / 2);
  ctx.textBaseline = "alphabetic";
}

export function downloadCanvas(
  canvas: HTMLCanvasElement,
  cutCount: number,
  rank: string
) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `judan-${cutCount}-${rank}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
