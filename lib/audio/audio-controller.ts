/**
 * BGM は /audio/bgm.mp3 をループ再生、効果音は WebAudio で合成する。
 * 音が無くても遊べる前提（全て try/catch で握りつぶす）。
 * 再生はユーザー操作後にのみ開始する。
 */
export class AudioController {
  private ctx: AudioContext | null = null;
  private bgm: HTMLAudioElement | null = null;
  private muted = false;
  private started = false;

  init() {
    if (typeof window === "undefined") return;
    try {
      this.ctx =
        this.ctx ??
        new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      /* noop */
    }
    if (!this.bgm) {
      try {
        this.bgm = new Audio("/audio/bgm.mp3");
        this.bgm.loop = true;
        this.bgm.volume = 0.4;
      } catch {
        this.bgm = null;
      }
    }
  }

  get isMuted() {
    return this.muted;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.bgm) this.bgm.muted = m;
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  startBgm() {
    this.init();
    this.started = true;
    if (this.bgm && !this.muted) {
      this.bgm.play().catch(() => {});
    }
  }

  pauseBgm() {
    this.bgm?.pause();
  }

  resumeBgm() {
    if (this.started && this.bgm && !this.muted) this.bgm.play().catch(() => {});
  }

  stopBgm() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    }
  }

  private blip(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain = 0.2,
    slideTo?: number
  ) {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
    } catch {
      /* noop */
    }
  }

  slash() {
    this.blip(820, 0.12, "sawtooth", 0.12, 240);
  }

  success() {
    this.blip(660, 0.1, "triangle", 0.22);
    setTimeout(() => this.blip(990, 0.16, "triangle", 0.2), 70);
  }

  fail() {
    this.blip(160, 0.22, "square", 0.16, 80);
  }

  finish() {
    this.blip(523, 0.18, "triangle", 0.2);
    setTimeout(() => this.blip(392, 0.18, "triangle", 0.2), 150);
    setTimeout(() => this.blip(659, 0.4, "triangle", 0.22), 300);
  }

  stamp() {
    this.blip(110, 0.18, "square", 0.3, 60);
  }

  dispose() {
    this.stopBgm();
    try {
      this.ctx?.close();
    } catch {
      /* noop */
    }
    this.ctx = null;
  }
}
