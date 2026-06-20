"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import type {
  GameScreen,
  InputMode,
  PhotoCandidate,
} from "@/lib/types";
import { loadAssets, type AppAssets } from "@/lib/engine/assets";
import { JudanEngine } from "@/lib/engine/judan-engine";
import { AudioController } from "@/lib/audio/audio-controller";
import { createHandLandmarker } from "@/lib/vision/create-hand-landmarker";
import { getHandCenter, getHandScale } from "@/lib/vision/hand-center";
import TitleScreen from "@/components/screens/TitleScreen";
import CameraGateScreen from "@/components/screens/CameraGateScreen";
import CameraCheckScreen from "@/components/screens/CameraCheckScreen";
import CalibrationScreen from "@/components/screens/CalibrationScreen";
import CountdownScreen from "@/components/screens/CountdownScreen";
import PlayOverlay from "@/components/game/PlayOverlay";
import ResultScreen from "@/components/screens/ResultScreen";

const MOCK_REFERENCE = 2.6;

type HandState = {
  present: boolean;
  cx: number;
  cy: number;
  scale: number;
  conf: number;
};

export default function GameApp() {
  const [screen, setScreen] = useState<GameScreen>("title");
  const [assets, setAssets] = useState<AppAssets | null>(null);
  const [mode, setMode] = useState<InputMode>("mock");
  const [muted, setMuted] = useState(false);
  const [cutCount, setCutCount] = useState(0);
  const [remainMs, setRemainMs] = useState(40000);
  const [handDetected, setHandDetected] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    cutCount: number;
    photos: PhotoCandidate[];
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<JudanEngine | null>(null);
  const audioRef = useRef<AudioController | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handRef = useRef<HandState>({ present: false, cx: 0.5, cy: 0.6, scale: 0.2, conf: 0 });
  const phaseRef = useRef<GameScreen>("title");
  const camLoopRef = useRef<number>(0);
  const lastVideoTime = useRef<number>(-1);
  const calibPeak = useRef<number>(0);
  const referenceRef = useRef<number>(MOCK_REFERENCE);
  const stableCount = useRef<number>(0);
  const flags = useRef<{ demo: boolean; debug: boolean }>({ demo: false, debug: false });

  phaseRef.current = screen;

  useEffect(() => {
    audioRef.current = new AudioController();
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      flags.current.demo = q.get("demo") === "1";
      flags.current.debug = q.get("debug") === "1";
    }
    loadAssets().then(setAssets);
    return () => {
      stopEverything();
      audioRef.current?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // タブ非表示で一時停止
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        audioRef.current?.pauseBgm();
        engineRef.current?.pause();
      } else {
        audioRef.current?.resumeBgm();
        engineRef.current?.resume();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const sizeCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.max(2, Math.floor(rect.width * dpr));
    c.height = Math.max(2, Math.floor(rect.height * dpr));
  }, []);

  useEffect(() => {
    const onResize = () => sizeCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [sizeCanvas]);

  // キャンバスは表示された後にサイズ確定する（非表示時は0pxのため）
  useEffect(() => {
    if (
      screen === "camera-check" ||
      screen === "calibration" ||
      screen === "playing"
    ) {
      const id = requestAnimationFrame(() => sizeCanvas());
      return () => cancelAnimationFrame(id);
    }
  }, [screen, sizeCanvas]);

  // ---- カメラ -------------------------------------------------------------

  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();
      try {
        landmarkerRef.current = await createHandLandmarker();
      } catch {
        landmarkerRef.current = null;
        setCamError("手の検出を開始できませんでした。Mock Modeで続けます。");
        return false;
      }
      startCamLoop();
      return true;
    } catch {
      setCamError("カメラを使用できません。Mock Modeで続けます。");
      return false;
    }
  }, []);

  const startCamLoop = useCallback(() => {
    cancelAnimationFrame(camLoopRef.current);
    const loop = () => {
      const v = videoRef.current;
      const lm = landmarkerRef.current;
      if (v && lm && v.readyState >= 2 && v.currentTime !== lastVideoTime.current) {
        lastVideoTime.current = v.currentTime;
        try {
          const res = lm.detectForVideo(v, performance.now());
          const hands = res.landmarks;
          if (hands && hands.length > 0) {
            const c = getHandCenter(hands[0]);
            const scale = getHandScale(hands[0]);
            const cx = 1 - c.x; // 表示は左右反転
            const cy = c.y;
            const prev = handRef.current;
            handRef.current = { present: true, cx, cy, scale, conf: 0.9 };
            stableCount.current = Math.min(stableCount.current + 1, 20);

            const phase = phaseRef.current;
            if (phase === "calibration" && prev.present) {
              const d = Math.hypot(cx - prev.cx, cy - prev.cy);
              const sp = d / (1 / 30);
              if (sp > calibPeak.current) calibPeak.current = sp;
            }
            if (phase === "playing" && engineRef.current) {
              engineRef.current.pushHand({ x: cx, y: cy, handScale: scale, confidence: 0.9 });
            }
          } else {
            handRef.current = { ...handRef.current, present: false, conf: 0 };
            stableCount.current = Math.max(stableCount.current - 1, 0);
          }
        } catch {
          /* 推論失敗フレームは無視 */
        }
      }

      // プレビュー描画（プレイ中はエンジンが描く）
      const phase = phaseRef.current;
      if (phase === "camera-check" || phase === "calibration") {
        drawPreview();
        const det = stableCount.current >= 6;
        setHandDetected((d) => (d === det ? d : det));
      }
      camLoopRef.current = requestAnimationFrame(loop);
    };
    camLoopRef.current = requestAnimationFrame(loop);
  }, []);

  const drawPreview = useCallback(() => {
    const c = canvasRef.current;
    const v = videoRef.current;
    if (!c || !v) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const cw = c.width;
    const ch = c.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0c0f17";
    ctx.fillRect(0, 0, cw, ch);
    if (v.readyState >= 2) {
      ctx.save();
      ctx.translate(cw, 0);
      ctx.scale(-1, 1);
      const sw = v.videoWidth || cw;
      const sh = v.videoHeight || ch;
      const scale = Math.max(cw / sw, ch / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      ctx.drawImage(v, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      ctx.restore();
    }
    ctx.fillStyle = "rgba(12,15,23,0.35)";
    ctx.fillRect(0, 0, cw, ch);
    const h = handRef.current;
    if (h.present) {
      ctx.strokeStyle = "rgba(200,162,74,0.95)";
      ctx.shadowColor = "rgba(200,162,74,0.8)";
      ctx.shadowBlur = 18;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(h.cx * cw, h.cy * ch, Math.min(cw, ch) * 0.07, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(camLoopRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try {
      landmarkerRef.current?.close();
    } catch {
      /* noop */
    }
    landmarkerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stopEverything = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    stopCamera();
  }, [stopCamera]);

  // ---- ゲーム開始 ---------------------------------------------------------

  const beginGame = useCallback(() => {
    const canvas = canvasRef.current;
    const assetsNow = assets;
    if (!canvas || !assetsNow) return;
    sizeCanvas();
    audioRef.current?.startBgm();
    const duration = flags.current.demo ? 30000 : 40000;
    setCutCount(0);
    setRemainMs(duration);
    const engine = new JudanEngine({
      canvas,
      video: mode === "camera" ? videoRef.current : null,
      mode,
      reference: referenceRef.current,
      durationMs: duration,
      assets: assetsNow,
      audio: audioRef.current!,
      onCut: (n) => setCutCount(n),
      onTick: (r) => setRemainMs(r),
      onFinish: (res) => {
        setResult(res);
        setScreen("result");
        stopCamera();
      },
    });
    engineRef.current = engine;
    if (typeof window !== "undefined") {
      (window as unknown as { __engine?: JudanEngine }).__engine = engine;
    }
    engine.start();
    setScreen("playing");
  }, [assets, mode, sizeCanvas, stopCamera]);

  // ---- 画面遷移ハンドラ ---------------------------------------------------

  const onStartTitle = useCallback(() => {
    audioRef.current?.init();
    setCamError(null);
    setScreen("camera-permission");
  }, []);

  const onChooseCamera = useCallback(async () => {
    audioRef.current?.init();
    setMode("camera");
    setScreen("camera-check");
    sizeCanvas();
    const ok = await startCamera();
    if (!ok) {
      setMode("mock");
      referenceRef.current = MOCK_REFERENCE;
      setScreen("countdown");
    }
  }, [sizeCanvas, startCamera]);

  const onChooseMock = useCallback(() => {
    audioRef.current?.init();
    setMode("mock");
    referenceRef.current = MOCK_REFERENCE;
    setCamError(null);
    setScreen("countdown");
  }, []);

  const onCheckNext = useCallback(() => {
    calibPeak.current = 0;
    setScreen("calibration");
  }, []);

  const onCalibrationDone = useCallback(() => {
    const peak = calibPeak.current;
    referenceRef.current = Math.min(6, Math.max(1.4, peak * 0.8 || MOCK_REFERENCE));
    setScreen("countdown");
  }, []);

  const onCountdownDone = useCallback(() => {
    beginGame();
  }, [beginGame]);

  const onRetry = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    setResult(null);
    setScreen("title");
  }, []);

  const onToggleMute = useCallback(() => {
    const m = audioRef.current?.toggleMute() ?? false;
    setMuted(m);
  }, []);

  // ---- Mock入力（ポインタ） -----------------------------------------------

  const pushPointer = useCallback((clientX: number, clientY: number) => {
    const c = canvasRef.current;
    const engine = engineRef.current;
    if (!c || !engine || mode !== "mock") return;
    const rect = c.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    engine.pushHand({ x, y, handScale: 0.16, confidence: 1 });
  }, [mode]);

  // ---- デバッグキー -------------------------------------------------------

  useEffect(() => {
    if (!flags.current.debug) return;
    const onKey = (e: KeyboardEvent) => {
      if (screen !== "playing") return;
      const eng = engineRef.current as unknown as {
        debugForce?: (o: string) => void;
      };
      if (e.key === "s" || e.key === "S") eng.debugForce?.("success");
      if (e.key === "f" || e.key === "F") eng.debugForce?.("too-strong");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen]);

  // ---- 描画 ---------------------------------------------------------------

  const showCanvas =
    screen === "camera-check" || screen === "calibration" || screen === "playing";

  return (
    <main
      className="fixed inset-0 overflow-hidden bg-sumi text-washi select-none"
      style={
        {
          "--plaque": assets?.plaqueUrl ? `url(${assets.plaqueUrl})` : "none",
        } as React.CSSProperties
      }
    >
      <video ref={videoRef} playsInline muted className="hidden" />
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full ${showCanvas ? "block" : "hidden"}`}
        onPointerDown={(e) => pushPointer(e.clientX, e.clientY)}
        onPointerMove={(e) => pushPointer(e.clientX, e.clientY)}
        style={{ touchAction: "none" }}
      />

      {screen === "title" && (
        <TitleScreen
          assets={assets}
          onStart={onStartTitle}
          onMock={onChooseMock}
          muted={muted}
          onToggleMute={onToggleMute}
          loading={!assets}
        />
      )}

      {screen === "camera-permission" && (
        <CameraGateScreen
          assets={assets}
          camError={camError}
          onAllow={onChooseCamera}
          onMock={onChooseMock}
          onBack={() => setScreen("title")}
        />
      )}

      {screen === "camera-check" && (
        <CameraCheckScreen
          handDetected={handDetected}
          camError={camError}
          onNext={onCheckNext}
          onMock={() => {
            stopCamera();
            onChooseMock();
          }}
        />
      )}

      {screen === "calibration" && (
        <CalibrationScreen
          handDetected={handDetected}
          onDone={onCalibrationDone}
        />
      )}

      {screen === "countdown" && (
        <CountdownScreen onDone={onCountdownDone} />
      )}

      {screen === "playing" && (
        <PlayOverlay
          assets={assets}
          cutCount={cutCount}
          remainMs={remainMs}
          mode={mode}
          muted={muted}
          onToggleMute={onToggleMute}
        />
      )}

      {screen === "result" && result && (
        <ResultScreen
          assets={assets}
          result={result}
          onRetry={onRetry}
          audio={audioRef.current}
        />
      )}
    </main>
  );
}
