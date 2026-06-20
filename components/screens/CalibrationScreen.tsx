"use client";

import { useEffect, useState } from "react";

type Props = {
  handDetected: boolean;
  onDone: () => void;
};

const STEPS = ["ゆっくり一振り", "ふつうに一振り", "全力で一振り"];

export default function CalibrationScreen({ handDetected, onDone }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length));
    }, 1100);
    return () => clearInterval(id);
  }, []);

  const ready = step >= STEPS.length;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute left-0 right-0 top-8 text-center">
        <p className="font-brush text-2xl text-kin drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          素振りで間合いを測る
        </p>
        <p className="mt-1 font-mincho text-sm text-washi/80">
          画面に向かって手刀を振ってください
        </p>
      </div>

      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 text-center">
        <p className="font-brush text-4xl text-washi drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)]">
          {ready ? "支度、整いました" : STEPS[step]}
        </p>
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4">
        <div className="flex gap-3">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-3 w-10 rounded-full transition-colors ${
                i < step ? "bg-kin" : "bg-washi/25"
              }`}
            />
          ))}
        </div>
        {!handDetected && (
          <p className="font-mincho text-xs text-washi/60">手を画面内に入れてください</p>
        )}
        <button
          onClick={onDone}
          disabled={!ready}
          className={`pointer-events-auto rounded-lg px-10 py-3 font-mincho text-lg font-bold transition ${
            ready
              ? "bg-kin text-sumi hover:brightness-110"
              : "cursor-not-allowed bg-washi/15 text-washi/40"
          }`}
        >
          修行開始
        </button>
      </div>
    </div>
  );
}
