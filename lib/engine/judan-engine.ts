import type {
  CutOutcome,
  HandSample,
  InputMode,
  MaterialId,
  PhotoCandidate,
} from "@/lib/types";
import { MATERIALS } from "@/lib/materials/profiles";
import { MaterialBag } from "@/lib/materials/material-bag";
import { judgeMaterial } from "@/lib/materials/judge-material";
import { extractFeatures } from "@/lib/motion/extract-features";
import { segmentCrossesRect } from "@/lib/motion/line-intersection";
import type { AppAssets } from "@/lib/engine/assets";
import type { AudioController } from "@/lib/audio/audio-controller";

const START = 0.22;
const STOP = 0.1;
const FOLLOW_MS = 140;
const COOLDOWN_MS = 340;
const DISPLAY_MS = 2200;
const SPAWN_IN_MS = 220;
const BUFFER_MS = 800;

const MAT_CX = 0.5;
const MAT_CY = 0.47;

type SlashState = "idle" | "tracking" | "crossed" | "judging" | "cooldown";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  grav: number;
};

type Current = {
  id: MaterialId;
  spawnAt: number;
  hitDone: boolean;
  phase: "in" | "live" | "success" | "fail" | "gone";
  phaseAt: number;
  outcome: CutOutcome | null;
  splitAngle: number;
};

export type EngineOptions = {
  canvas: HTMLCanvasElement;
  video: HTMLVideoElement | null;
  mode: InputMode;
  reference: number;
  durationMs: number;
  assets: AppAssets;
  audio: AudioController;
  onCut: (count: number) => void;
  onTick: (remainMs: number) => void;
  onFinish: (r: { cutCount: number; photos: PhotoCandidate[] }) => void;
};

export class JudanEngine {
  private o: EngineOptions;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private running = false;

  private buffer: HandSample[] = [];
  private slash: HandSample[] = [];
  private state: SlashState = "idle";
  private crossIndex = -1;
  private crossedAt = 0;
  private nextSpawnAt = 0;

  private bag = new MaterialBag();
  private current: Current | null = null;

  private cutCount = 0;
  private startAt = 0;
  private endsAt = 0;
  private status: "ready" | "playing" | "finished" = "ready";

  private particles: Particle[] = [];
  private shakeUntil = 0;
  private shakeMag = 0;
  private hitStopUntil = 0;
  private flash = 0;
  private cutBump = 0;

  private photos: PhotoCandidate[] = [];
  private pendingShot: { score: number; at: number } | null = null;
  private photoCanvas: HTMLCanvasElement | null = null;

  private cursor: { x: number; y: number; vis: number } = { x: 0.5, y: 0.6, vis: 0 };

  constructor(opts: EngineOptions) {
    this.o = opts;
    this.ctx = opts.canvas.getContext("2d", { alpha: false })!;
  }

  start() {
    const now = performance.now();
    this.status = "playing";
    this.startAt = now;
    this.endsAt = now + this.o.durationMs;
    this.spawn(now);
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private pausedAt = 0;

  pause() {
    if (!this.running || this.status !== "playing") return;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.pausedAt = performance.now();
  }

  resume() {
    if (this.running || this.status !== "playing" || !this.pausedAt) return;
    const dt = performance.now() - this.pausedAt;
    this.endsAt += dt;
    this.nextSpawnAt += dt;
    this.crossedAt += dt;
    if (this.current) {
      this.current.spawnAt += dt;
      this.current.phaseAt += dt;
    }
    this.pausedAt = 0;
    this.running = true;
    this.loop();
  }

  /** ?debug=1 用: 現素材に対し強制的に判定を起こす */
  debugForce(outcome: "success" | "too-strong") {
    const now = performance.now();
    if (!this.current || this.current.phase !== "live") return;
    this.current.hitDone = true;
    this.current.outcome = outcome;
    this.current.phaseAt = now;
    if (outcome === "success") {
      this.cutCount += 1;
      this.o.onCut(this.cutCount);
      this.o.audio.success();
      this.current.phase = "success";
      this.current.splitAngle = 0;
      this.cutBump = 1;
      this.flash = 0.5;
      this.spawnSuccessFx();
    } else {
      this.o.audio.fail();
      this.current.phase = "fail";
      this.shake(now, 14, 260);
      this.spawnShatterFx();
    }
    this.state = "cooldown";
    this.nextSpawnAt = now + COOLDOWN_MS;
  }

  /** 入力源（カメラ/Mock）から正規化座標で手の位置を投入 */
  pushHand(s: { x: number; y: number; handScale: number; confidence: number }) {
    const now = performance.now();
    const sample: HandSample = {
      t: now,
      x: clamp01(s.x),
      y: clamp01(s.y),
      handScale: s.handScale,
      confidence: s.confidence,
    };
    this.cursor.x = sample.x;
    this.cursor.y = sample.y;
    this.cursor.vis = Math.min(1, s.confidence + 0.2);

    this.buffer.push(sample);
    while (this.buffer.length > 2 && now - this.buffer[0].t > BUFFER_MS) {
      this.buffer.shift();
    }
    this.evalSlash(sample, now);
  }

  private instSpeed(): number {
    const n = this.buffer.length;
    if (n < 2) return 0;
    const a = this.buffer[n - 2];
    const b = this.buffer[n - 1];
    const dt = Math.max((b.t - a.t) / 1000, 1 / 240);
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    return d / dt / this.o.reference;
  }

  private hitbox() {
    const cw = this.o.canvas.width;
    const ch = this.o.canvas.height;
    const sizePx = 0.3 * Math.min(cw, ch);
    const hx = (sizePx * 0.46) / cw;
    const hy = (sizePx * 0.46) / ch;
    return { x: MAT_CX - hx, y: MAT_CY - hy, w: hx * 2, h: hy * 2 };
  }

  private inputOpen(now: number): boolean {
    return (
      this.status === "playing" &&
      !!this.current &&
      !this.current.hitDone &&
      this.current.phase === "live" &&
      now < this.endsAt &&
      (this.state === "idle" || this.state === "tracking")
    );
  }

  private evalSlash(sample: HandSample, now: number) {
    const v = this.instSpeed();

    if (this.state === "idle") {
      if (v > START) {
        this.state = "tracking";
        const prev = this.buffer[this.buffer.length - 2] ?? sample;
        this.slash = [prev, sample];
        this.crossIndex = -1;
      }
      return;
    }

    if (this.state === "tracking") {
      this.slash.push(sample);
      if (this.inputOpen(now) && this.slash.length >= 2) {
        const prev = this.slash[this.slash.length - 2];
        if (segmentCrossesRect(prev, sample, this.hitbox())) {
          this.state = "crossed";
          this.crossIndex = this.slash.length - 1;
          this.crossedAt = now;
          if (this.current) this.current.hitDone = true;
          this.o.audio.slash();
          this.spawnSlashFx(sample);
        }
      }
      if (v < STOP) {
        this.state = "idle";
        this.slash = [];
      }
      if (this.slash.length > 40) this.slash.shift();
      return;
    }

    if (this.state === "crossed") {
      this.slash.push(sample);
      if (now - this.crossedAt >= FOLLOW_MS) {
        this.resolve(now);
      }
    }
  }

  private resolve(now: number) {
    if (!this.current) {
      this.state = "idle";
      return;
    }
    const f = extractFeatures(this.slash, this.o.reference, this.crossIndex);
    const outcome = judgeMaterial(this.current.id, f);
    this.current.outcome = outcome;
    this.current.phaseAt = now;

    if (outcome === "success") {
      this.cutCount += 1;
      this.o.onCut(this.cutCount);
      this.o.audio.success();
      this.current.phase = "success";
      this.current.splitAngle = Math.atan2(
        this.slash.at(-1)!.y - this.slash[0].y,
        this.slash.at(-1)!.x - this.slash[0].x
      );
      this.cutBump = 1;
      this.hitStopUntil = now + 110;
      this.flash = 0.5;
      this.spawnSuccessFx();
      this.maybeShoot(f, now);
    } else {
      this.o.audio.fail();
      this.current.phase = "fail";
      if (outcome === "too-strong") {
        this.shake(now, 14, 260);
        this.spawnShatterFx();
      }
    }
    this.state = "cooldown";
    this.nextSpawnAt = now + COOLDOWN_MS;
  }

  private spawn(now: number) {
    const elapsed = now - this.startAt;
    const id = this.bag.next(elapsed);
    this.current = {
      id,
      spawnAt: now,
      hitDone: false,
      phase: "in",
      phaseAt: now,
      outcome: null,
      splitAngle: 0,
    };
    this.state = "idle";
    this.slash = [];
  }

  private update(now: number) {
    if (this.status !== "playing") return;

    this.o.onTick(Math.max(0, this.endsAt - now));

    if (now >= this.endsAt) {
      this.finish();
      return;
    }

    // 交差後は入力が途切れても時間経過で判定する
    if (this.state === "crossed" && now - this.crossedAt >= FOLLOW_MS) {
      this.resolve(now);
    }

    const c = this.current;
    if (c) {
      if (c.phase === "in" && now - c.phaseAt > SPAWN_IN_MS) {
        c.phase = "live";
        c.phaseAt = now;
      }
      if (
        c.phase === "live" &&
        !c.hitDone &&
        now - c.spawnAt > DISPLAY_MS &&
        this.state !== "crossed"
      ) {
        c.outcome = "miss";
        c.phase = "fail";
        c.phaseAt = now;
        this.state = "cooldown";
        this.nextSpawnAt = now + COOLDOWN_MS;
      }
    }

    if (this.state === "cooldown" && now >= this.nextSpawnAt) {
      this.spawn(now);
    }

    if (this.cutBump > 0) this.cutBump = Math.max(0, this.cutBump - 0.06);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - 0.04);
    this.cursor.vis = Math.max(0, this.cursor.vis - 0.02);

    this.updateParticles();

    if (this.pendingShot && now >= this.pendingShot.at) {
      this.takePhoto(this.pendingShot.score, now);
      this.pendingShot = null;
    }
  }

  private finish() {
    if (this.status === "finished") return;
    this.status = "finished";
    this.running = false;
    this.o.audio.finish();
    cancelAnimationFrame(this.raf);
    this.o.onFinish({ cutCount: this.cutCount, photos: this.photos });
  }

  private loop = () => {
    if (!this.running) return;
    const now = performance.now();
    // 1フレームで例外が出てもゲームを止めない（フリーズ防止）
    try {
      this.update(now);
      this.render(now);
    } catch (e) {
      console.error("[judan] frame error (recovered):", e);
      // 描画状態が壊れていても次素材へ進めるよう state を復帰させる
      if (this.state === "crossed" || this.state === "judging") {
        this.state = "cooldown";
        this.nextSpawnAt = now + COOLDOWN_MS;
      }
    }
    if (this.running) this.raf = requestAnimationFrame(this.loop);
  };

  // ---- 描画 ----------------------------------------------------------------

  private render(now: number) {
    const ctx = this.ctx;
    const cw = this.o.canvas.width;
    const ch = this.o.canvas.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0c0f17";
    ctx.fillRect(0, 0, cw, ch);

    // 背景: カメラ or 庭
    if (this.o.video && this.o.video.readyState >= 2) {
      ctx.save();
      ctx.translate(cw, 0);
      ctx.scale(-1, 1); // 左右反転
      drawCover(ctx, this.o.video, cw, ch);
      ctx.restore();
      ctx.fillStyle = "rgba(12,15,23,0.32)";
      ctx.fillRect(0, 0, cw, ch);
    } else if (this.o.assets.bgPlay) {
      drawCover(ctx, this.o.assets.bgPlay, cw, ch);
    }

    // 周辺減光
    const vg = ctx.createRadialGradient(
      cw / 2,
      ch * 0.5,
      Math.min(cw, ch) * 0.25,
      cw / 2,
      ch * 0.55,
      Math.max(cw, ch) * 0.7
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(8,10,18,0.75)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, cw, ch);

    let shx = 0;
    let shy = 0;
    if (now < this.shakeUntil) {
      shx = (Math.random() - 0.5) * this.shakeMag;
      shy = (Math.random() - 0.5) * this.shakeMag;
    }
    ctx.save();
    ctx.translate(shx, shy);

    // 切り株
    if (this.o.assets.stump) {
      const w = cw * 0.46;
      const img = this.o.assets.stump;
      const h = w * (img.height / img.width);
      ctx.drawImage(img, cw * 0.5 - w / 2, ch * 0.78 - h / 2, w, h);
    }

    this.drawMaterial(now, cw, ch);
    this.drawParticles(ctx);
    this.drawSlash(ctx, cw, ch, now);
    this.drawCursor(ctx, cw, ch);

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,248,224,${this.flash * 0.35})`;
      ctx.fillRect(-shx, -shy, cw, ch);
    }
    ctx.restore();
  }

  private drawMaterial(now: number, cw: number, ch: number) {
    const c = this.current;
    if (!c || c.phase === "gone") return;
    const ctx = this.ctx;
    const sprite = this.o.assets.materials[c.id];
    const sizePx = 0.3 * Math.min(cw, ch);
    const cx = MAT_CX * cw;
    const cy = MAT_CY * ch;

    if (!sprite) {
      // フォールバック: 円
      ctx.fillStyle = MATERIALS[c.id].accent;
      ctx.beginPath();
      ctx.arc(cx, cy, sizePx * 0.4, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const w = sizePx;
    const h = sizePx * (sprite.height / sprite.width);

    if (c.phase === "in") {
      const k = Math.min(1, (now - c.phaseAt) / SPAWN_IN_MS);
      const s = 0.6 + 0.4 * easeOut(k);
      this.blit(sprite, cx, cy, w * s, h * s, 1);
      return;
    }
    if (c.phase === "live") {
      const wob = 1 + Math.sin(now / 180) * 0.02;
      this.blit(sprite, cx, cy, w, h * wob, 1);
      return;
    }
    if (c.phase === "success") {
      const k = Math.min(1, (now - c.phaseAt) / 420);
      const off = easeOut(k) * w * 0.5;
      const a = 1 - k;
      const ang = c.splitAngle + Math.PI / 2;
      const dx = Math.cos(ang) * off;
      const dy = Math.sin(ang) * off;
      this.blitHalf(sprite, cx - dx, cy - dy, w, h, "first", a, c.splitAngle);
      this.blitHalf(sprite, cx + dx, cy + dy, w, h, "second", a, c.splitAngle);
      if (k >= 1) c.phase = "gone";
      return;
    }
    if (c.phase === "fail") {
      const k = Math.min(1, (now - c.phaseAt) / 420);
      if (c.outcome === "too-strong") {
        const s = 1 + k * 0.2;
        this.blit(sprite, cx, cy, w * s, h * (1 - k * 0.4), 1 - k);
      } else {
        const shake = Math.sin(now / 30) * (1 - k) * w * 0.06;
        this.blit(sprite, cx + shake, cy, w, h, 1 - k * 0.6);
      }
      if (k >= 1) c.phase = "gone";
      return;
    }
  }

  private blit(
    img: CanvasImageSource,
    cx: number,
    cy: number,
    w: number,
    h: number,
    alpha: number
  ) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  }

  private blitHalf(
    img: HTMLCanvasElement,
    cx: number,
    cy: number,
    w: number,
    h: number,
    side: "first" | "second",
    alpha: number,
    angle: number
  ) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    if (side === "first") ctx.rect(-w, -h, w * 2, h);
    else ctx.rect(-w, 0, w * 2, h);
    ctx.clip();
    ctx.rotate(-angle);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  private drawSlash(
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    now: number
  ) {
    const pts = this.buffer.filter((s) => now - s.t < 170);
    if (pts.length < 2) return;
    const accent = this.current ? MATERIALS[this.current.id].accent : "#ffffff";
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 16;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const age = (now - b.t) / 170;
      ctx.globalAlpha = (1 - age) * 0.85;
      ctx.lineWidth = (1 - age) * 16 + 2;
      ctx.beginPath();
      ctx.moveTo(a.x * cw, a.y * ch);
      ctx.lineTo(b.x * cw, b.y * ch);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawCursor(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    if (this.cursor.vis <= 0.02) return;
    const x = this.cursor.x * cw;
    const y = this.cursor.y * ch;
    ctx.save();
    ctx.globalAlpha = this.cursor.vis;
    // 手刀オーラ（簡易な刃）
    ctx.strokeStyle = "rgba(232,238,247,0.9)";
    ctx.shadowColor = "rgba(200,162,74,0.9)";
    ctx.shadowBlur = 14;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ---- パーティクル --------------------------------------------------------

  private spawnSlashFx(s: HandSample) {
    const cw = this.o.canvas.width;
    const ch = this.o.canvas.height;
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: s.x * cw,
        y: s.y * ch,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        maxLife: 1,
        size: 2 + Math.random() * 3,
        color: "rgba(255,255,255,0.9)",
        grav: 0.05,
      });
    }
  }

  private spawnSuccessFx() {
    const cw = this.o.canvas.width;
    const ch = this.o.canvas.height;
    const x = MAT_CX * cw;
    const y = MAT_CY * ch;
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 2,
        life: 1,
        maxLife: 1,
        size: 2 + Math.random() * 4,
        color: Math.random() > 0.5 ? "#c8a24a" : "#fbf7ee",
        grav: 0.12,
      });
    }
  }

  private spawnShatterFx() {
    const cw = this.o.canvas.width;
    const ch = this.o.canvas.height;
    const x = MAT_CX * cw;
    const y = MAT_CY * ch;
    const col = this.current ? MATERIALS[this.current.id].accent : "#ffffff";
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 4 + Math.random() * 9;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 3,
        life: 1,
        maxLife: 1,
        size: 3 + Math.random() * 6,
        color: col,
        grav: 0.22,
      });
    }
  }

  private updateParticles() {
    const ch = this.o.canvas.height;
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.grav;
      p.life -= 0.022;
      if (p.y > ch + 40) p.life = 0;
    }
    this.particles = this.particles.filter((p) => p.life > 0).slice(-100);
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private shake(now: number, mag: number, ms: number) {
    this.shakeUntil = now + ms;
    this.shakeMag = mag;
  }

  // ---- 写真 ----------------------------------------------------------------

  private maybeShoot(f: { peakSpeed: number; followThrough: number }, now: number) {
    const milestones = [1, 5, 10, 15, 20];
    const isMile = milestones.includes(this.cutCount);
    const isLastChance = now > this.endsAt - 6000;
    if (!isMile && !isLastChance && this.photos.length >= 3) return;
    const score = 40 + f.peakSpeed * 30 + Math.min(f.followThrough, 1) * 20 + this.cutCount;
    this.pendingShot = { score, at: now + 120 };
  }

  private takePhoto(score: number, now: number) {
    try {
      const url = this.capturePhotoFrame(now);
      if (!url) return;
      const cand: PhotoCandidate = {
        id: `p${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        dataUrl: url,
        cutCount: this.cutCount,
        materialId: this.current?.id ?? "tofu",
        score,
      };
      this.photos.push(cand);
      this.photos.sort((a, b) => b.score - a.score);
      this.photos = this.photos.slice(0, 5);
    } catch {
      /* 失敗しても続行 */
    }
  }

  /**
   * 認定証用のクリーンな1枚を合成する。
   * カメラ映像（顔が映る）＋斬撃＋粒子＋小ロゴのみ。
   * 切り株・素材・暗幕・HUDなどの画面UIは入れない。
   */
  private capturePhotoFrame(now: number): string | null {
    const cw = this.o.canvas.width;
    const ch = this.o.canvas.height;
    if (cw < 2 || ch < 2) return null;
    if (!this.photoCanvas) this.photoCanvas = document.createElement("canvas");
    const pc = this.photoCanvas;
    pc.width = cw;
    pc.height = ch;
    const ctx = pc.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#0c0f17";
    ctx.fillRect(0, 0, cw, ch);

    if (this.o.video && this.o.video.readyState >= 2) {
      ctx.save();
      ctx.translate(cw, 0);
      ctx.scale(-1, 1); // 左右反転（自撮り）
      drawCover(ctx, this.o.video, cw, ch);
      ctx.restore();
    } else if (this.o.assets.bgPlay) {
      drawCover(ctx, this.o.assets.bgPlay, cw, ch);
    }

    this.drawSlash(ctx, cw, ch, now);
    this.drawParticles(ctx);

    ctx.save();
    ctx.font = `700 ${Math.round(ch * 0.045)}px "Yuji Syuku", "Shippori Mincho", serif`;
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(247,236,203,0.92)";
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = 8;
    ctx.fillText("柔断", cw - ch * 0.03, ch - ch * 0.035);
    ctx.restore();

    return pc.toDataURL("image/jpeg", 0.82);
  }
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function easeOut(k: number) {
  return 1 - Math.pow(1 - k, 3);
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource & { videoWidth?: number; videoHeight?: number; width?: number; height?: number; naturalWidth?: number; naturalHeight?: number },
  cw: number,
  ch: number
) {
  const sw =
    (src as HTMLVideoElement).videoWidth ||
    (src as HTMLImageElement).naturalWidth ||
    (src as HTMLCanvasElement).width ||
    cw;
  const sh =
    (src as HTMLVideoElement).videoHeight ||
    (src as HTMLImageElement).naturalHeight ||
    (src as HTMLCanvasElement).height ||
    ch;
  const scale = Math.max(cw / sw, ch / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(src, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
}
