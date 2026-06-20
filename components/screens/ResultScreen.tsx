"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AppAssets } from "@/lib/engine/assets";
import type { PhotoCandidate } from "@/lib/types";
import { getRank, toKanjiNumber } from "@/lib/rank/get-rank";
import {
  drawCertificate,
  downloadCanvas,
} from "@/lib/certificate/draw-certificate";
import type { AudioController } from "@/lib/audio/audio-controller";
import WoodButton from "@/components/ui/WoodButton";

type Props = {
  assets: AppAssets | null;
  result: { cutCount: number; photos: PhotoCandidate[] };
  onRetry: () => void;
  audio: AudioController | null;
};

export default function ResultScreen({ assets, result, onRetry, audio }: Props) {
  const { cutCount, photos } = result;
  const rank = useMemo(() => getRank(cutCount), [cutCount]);
  const candidates = useMemo(() => photos.slice(0, 3), [photos]);
  const [selectedId, setSelectedId] = useState<string | null>(
    candidates[0]?.id ?? null
  );
  const [comment, setComment] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    audio?.stamp();
    audio?.stopBgm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: cutCount, rank }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("comment request failed");
        return response.json() as Promise<{ comment?: unknown }>;
      })
      .then((data) => {
        if (typeof data.comment === "string") setComment(data.comment);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setComment("師範、感動で言葉を失いました。これはこれで高評価です。");
        }
      });
    return () => controller.abort();
  }, [cutCount, rank]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const photo =
      selectedId === null
        ? null
        : candidates.find((c) => c.id === selectedId)?.dataUrl ?? null;
    drawCertificate(canvas, {
      cutCount,
      rank,
      photoDataUrl: photo,
      washi: assets?.washi ?? null,
      seal: assets?.seal ?? null,
      issuedAt: new Date(),
    });
  }, [selectedId, candidates, cutCount, rank, assets]);

  const plaque = assets?.plaqueUrl ?? null;

  return (
    <div className="absolute inset-0 overflow-y-auto bg-sumi">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url(/images/bg-garden.png)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-sumi/70 to-sumi" />

      <div className="relative z-10 mx-auto flex min-h-full max-w-5xl flex-col items-center gap-6 px-5 py-8">
        <div className="drift-in text-center">
          <p className="font-mincho text-sm tracking-[0.4em] text-kin">一分間之斬</p>
          <p className="mt-2 font-mincho text-sm tracking-[0.2em] text-washi/80">
            スコア {cutCount}
          </p>
          <p className="font-brush text-6xl text-washi drop-shadow-[0_3px_10px_rgba(0,0,0,0.9)]">
            {toKanjiNumber(cutCount)}断
          </p>
          <p className="mt-2 font-brush text-3xl text-kin">柔断 {rank}</p>
          <p
            className="mx-auto mt-3 min-h-6 max-w-2xl px-3 font-mincho text-sm leading-relaxed text-washi/85"
            aria-live="polite"
          >
            {comment ?? "師範が講評をしたためています…"}
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
          {/* 認定証プレビュー */}
          <div className="ink-panel rounded-lg p-3">
            <canvas
              ref={canvasRef}
              className="h-auto w-[min(320px,80vw)] rounded shadow-2xl"
            />
          </div>

          {/* 写真選択・操作 */}
          <div className="flex w-full max-w-sm flex-col gap-4">
            <div>
              <p className="mb-2 font-mincho text-sm text-washi/85">
                認定証に載せる写真を選ぶ
              </p>
              <div className="flex flex-wrap gap-2">
                {candidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`overflow-hidden rounded border-2 transition ${
                      selectedId === c.id
                        ? "border-kin"
                        : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={c.dataUrl}
                      alt="プレイ写真"
                      className="h-20 w-28 object-cover"
                    />
                  </button>
                ))}
                <button
                  onClick={() => setSelectedId(null)}
                  className={`flex h-20 w-28 items-center justify-center rounded border-2 font-mincho text-xs ${
                    selectedId === null
                      ? "border-kin bg-kin/10 text-kin"
                      : "border-washi/30 text-washi/70 hover:border-washi/60"
                  }`}
                >
                  写真なし
                </button>
              </div>
              {candidates.length === 0 && (
                <p className="mt-2 font-mincho text-xs text-washi/55">
                  今回は写真が撮れませんでした。「写真なし」で認定します。
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <WoodButton
                plaqueUrl={plaque}
                size="md"
                onClick={() =>
                  canvasRef.current &&
                  downloadCanvas(canvasRef.current, cutCount, rank)
                }
              >
                認定証を保存（PNG）
              </WoodButton>
              <WoodButton
                plaqueUrl={plaque}
                size="md"
                variant="ghost"
                onClick={onRetry}
              >
                もう一度 挑戦する
              </WoodButton>
            </div>

            <p className="font-mincho text-[11px] leading-relaxed text-washi/55">
              写真・映像は端末内のみで処理されています。保存ボタンを押した時だけ、
              認定証画像が端末に保存されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
