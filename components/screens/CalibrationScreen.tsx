"use client";

type Props = {
  handDetected: boolean;
  swings: number;
  target: number;
  onDone: () => void;
};

const LABELS = ["ゆっくり", "ふつう", "全力"];

export default function CalibrationScreen({
  handDetected,
  swings,
  target,
  onDone,
}: Props) {
  const done = swings >= target;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute left-0 right-0 top-8 text-center">
        <p className="font-brush text-2xl text-kin drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          素振りで間合いを測る
        </p>
        <p className="mt-1 font-mincho text-sm text-washi/80">
          <span className="text-washi">ゆっくり → ふつう → 全力</span>{" "}
          で手刀を{target}回振ってください
        </p>
      </div>

      <div className="absolute left-0 right-0 top-1/2 -translate-y-[60%] text-center">
        <p className="font-brush text-4xl text-washi drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)]">
          {done
            ? "支度、整いました"
            : handDetected
              ? `${LABELS[Math.min(swings, LABELS.length - 1)]}に振って`
              : "手を画面内に入れて"}
        </p>
        <p className="mt-2 font-mincho text-sm text-washi/70">
          下のバーが勢い。振り抜くと一振りとして数えます。
        </p>
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          {Array.from({ length: target }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span
                className={`h-4 w-12 rounded-full transition-colors ${
                  i < swings ? "bg-kin" : "bg-washi/25"
                }`}
              />
              <span
                className={`font-mincho text-[11px] ${
                  i < swings ? "text-kin" : "text-washi/45"
                }`}
              >
                {LABELS[i] ?? ""}
              </span>
            </div>
          ))}
        </div>

        <p className="font-mincho text-xs text-washi/70">
          {done ? "計測完了 — この強さに最適化します" : `検出 ${swings} / ${target} 回`}
        </p>

        <button
          onClick={onDone}
          className={`pointer-events-auto rounded-lg px-10 py-3 font-mincho text-lg font-bold transition ${
            done
              ? "bg-kin text-sumi hover:brightness-110"
              : "bg-washi/20 text-washi hover:bg-washi/30"
          }`}
        >
          {done ? "修行開始" : "この強さで始める"}
        </button>
      </div>
    </div>
  );
}
