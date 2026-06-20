"use client";

import { useState } from "react";
import type { AppAssets } from "@/lib/engine/assets";
import WoodButton from "@/components/ui/WoodButton";
import MuteButton from "@/components/ui/MuteButton";

type Props = {
  assets: AppAssets | null;
  onStart: () => void;
  onMock: () => void;
  muted: boolean;
  onToggleMute: () => void;
  loading: boolean;
};

export default function TitleScreen({
  assets,
  onStart,
  onMock,
  muted,
  onToggleMute,
  loading,
}: Props) {
  const [help, setHelp] = useState(false);
  const plaque = assets?.plaqueUrl ?? null;

  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/bg-garden.png)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-sumi/40 via-sumi/20 to-sumi/85" />
      {assets?.norenUrl && (
        <img
          src={assets.norenUrl}
          alt=""
          className="pointer-events-none absolute left-1/2 top-0 w-[min(900px,96vw)] -translate-x-1/2 opacity-90"
        />
      )}

      <MuteButton muted={muted} onClick={onToggleMute} />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="drift-in flex flex-col items-center">
          <h1 className="font-brush text-7xl leading-none text-washi drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] sm:text-8xl">
            柔断
          </h1>
          <p className="mt-2 font-mincho text-sm tracking-[0.5em] text-kin">
            J U D A N
          </p>
          <p className="mt-6 font-brush text-2xl text-washi/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] sm:text-3xl">
            切り方を、変えろ。
          </p>
          <p className="mt-3 max-w-md font-mincho text-xs leading-relaxed text-washi/70">
            豆腐にはやさしく、紐には鋭く。素材に合わせた手刀で、
            <br className="hidden sm:block" />
            一分間に何個斬れるか挑む修行。
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <WoodButton plaqueUrl={plaque} size="lg" onClick={onStart} disabled={loading}>
            {loading ? "支度中…" : "修行を始める"}
          </WoodButton>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <WoodButton plaqueUrl={plaque} size="md" variant="ghost" onClick={onMock}>
              カメラ無しで挑戦
            </WoodButton>
            <WoodButton
              plaqueUrl={plaque}
              size="md"
              variant="ghost"
              onClick={() => setHelp(true)}
            >
              遊び方
            </WoodButton>
          </div>
        </div>

        <p className="absolute bottom-4 left-0 right-0 px-6 font-mincho text-[11px] text-washi/55">
          カメラ映像・写真はこのブラウザ内で処理し、サーバーへ送信しません。
        </p>
      </div>

      {help && <HelpOverlay onClose={() => setHelp(false)} />}
    </div>
  );
}

function HelpOverlay({ onClose }: { onClose: () => void }) {
  const [slide, setSlide] = useState(0);

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-sumi/80 px-6"
      onClick={onClose}
    >
      <div
        className={`ink-panel relative rounded-lg p-4 sm:p-7 ${
          slide === 0 ? "w-full max-w-6xl" : "max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {slide === 0 ? (
          <img
            src="/images/how-to-play.png"
            alt="柔断のゲーム概要、遊び方、技術ポイントをまとめた説明"
            className="mx-auto max-h-[72vh] w-full object-contain"
          />
        ) : (
          <>
            <h2 className="font-brush text-2xl text-kin">遊び方</h2>
            <ul className="mt-4 space-y-2 font-mincho text-sm leading-relaxed text-washi/90">
              <li>① カメラの前で手刀（手の側面）を振る。Mockはドラッグで斬る。</li>
              <li>② 切り株の上に素材が一つずつ現れる。</li>
              <li>
                ③ <span className="text-kin">紐は速く鋭く</span>、
                <span className="text-kin">豆腐はやさしく</span>。素材で切り方を変える。
              </li>
              <li>④ 一分間で正しく斬れた数が、あなたの段位になる。</li>
            </ul>
            <p className="mt-4 font-mincho text-xs text-washi/60">
              速さ・残り時間は表示されません。表示されるのは「斬った数」だけ。
            </p>
            <p className="mt-3 font-mincho text-xs leading-relaxed text-kin/90">
              ⚠ Zoom等の他アプリでカメラ使用中はカメラを起動できません。先に終了してください。
            </p>
          </>
        )}

        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="前の説明へ"
            className="rounded border border-kin/50 px-3 py-1 font-mincho text-washi disabled:opacity-30"
            disabled={slide === 0}
            onClick={() => setSlide((current) => Math.max(0, current - 1))}
          >
            ‹
          </button>
          <span className="font-mincho text-xs text-washi/60">{slide + 1} / 2</span>
          <button
            type="button"
            aria-label="次の説明へ"
            className="rounded border border-kin/50 px-3 py-1 font-mincho text-washi disabled:opacity-30"
            disabled={slide === 1}
            onClick={() => setSlide((current) => Math.min(1, current + 1))}
          >
            ›
          </button>
        </div>
        <div className="mt-4 text-center">
          <button
            className="rounded border border-kin/60 px-6 py-2 font-mincho text-washi hover:bg-kin/15"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
