"use client";

import { useEffect, useRef, useState } from "react";
import type { AppAssets } from "@/lib/engine/assets";
import type { InputMode } from "@/lib/types";
import MuteButton from "@/components/ui/MuteButton";

type Props = {
  assets: AppAssets | null;
  cutCount: number;
  remainMs: number;
  mode: InputMode;
  muted: boolean;
  onToggleMute: () => void;
};

export default function PlayOverlay({
  assets,
  cutCount,
  remainMs,
  mode,
  muted,
  onToggleMute,
}: Props) {
  const [bump, setBump] = useState(0);
  const prev = useRef(cutCount);
  const [showHint, setShowHint] = useState(mode === "mock");

  useEffect(() => {
    if (cutCount !== prev.current) {
      prev.current = cutCount;
      setBump((b) => b + 1);
    }
  }, [cutCount]);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const finale = remainMs < 8000;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {assets?.norenUrl && (
        <img
          src={assets.norenUrl}
          alt=""
          className="absolute left-1/2 top-0 w-[min(760px,90vw)] -translate-x-1/2 opacity-85"
        />
      )}

      {/* 切断数の札 */}
      <div className="absolute left-1/2 top-3 -translate-x-1/2 text-center">
        <span
          key={bump}
          className="cut-pop block font-brush text-7xl leading-none text-washi drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)] sm:text-8xl"
          style={{ color: bump ? "#f3e6bf" : undefined }}
        >
          {cutCount}
        </span>
        <span className="mt-1 block font-mincho text-xs tracking-[0.4em] text-kin/90">
          斬
        </span>
      </div>

      <div className="pointer-events-auto">
        <MuteButton muted={muted} onClick={onToggleMute} />
      </div>

      {showHint && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-sumi/70 px-5 py-2 font-mincho text-sm text-washi/85 drift-in">
          {mode === "mock"
            ? "ドラッグで斬る — 紐は速く・豆腐はやさしく"
            : "手刀を振って斬る — 紐は速く・豆腐はやさしく"}
        </div>
      )}

      {/* 終盤演出（残り時間の数値は出さない） */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: finale ? 1 : 0,
          boxShadow: "inset 0 0 180px 40px rgba(181,70,47,0.45)",
        }}
      />
    </div>
  );
}
