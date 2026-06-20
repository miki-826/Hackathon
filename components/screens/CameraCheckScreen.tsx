"use client";

type Props = {
  handDetected: boolean;
  camError: string | null;
  onNext: () => void;
  onMock: () => void;
};

export default function CameraCheckScreen({
  handDetected,
  camError,
  onNext,
  onMock,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* 中央ガイド枠 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`h-[58vmin] w-[58vmin] rounded-2xl border-2 transition-colors ${
            handDetected ? "border-kin/90" : "border-washi/40"
          }`}
          style={{ boxShadow: "0 0 0 100vmax rgba(8,10,18,0.55)" }}
        />
      </div>

      <div className="absolute left-0 right-0 top-6 text-center">
        <p className="font-brush text-2xl text-washi drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          手を画面の中へ
        </p>
        <p className="mt-1 font-mincho text-sm text-washi/75">
          手刀（手の側面）が見えるように構えてください
        </p>
      </div>

      <div className="pointer-events-auto absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3">
        <div
          className={`rounded-full px-5 py-1.5 font-mincho text-sm ${
            handDetected
              ? "bg-kin/20 text-kin"
              : "bg-sumi/70 text-washi/70"
          }`}
        >
          {handDetected ? "● 手を検出しました" : "○ 手を探しています…"}
        </div>
        <button
          onClick={onNext}
          disabled={!handDetected}
          className={`rounded-lg px-8 py-3 font-mincho text-lg font-bold transition ${
            handDetected
              ? "bg-kin text-sumi hover:brightness-110"
              : "cursor-not-allowed bg-washi/15 text-washi/40"
          }`}
        >
          次へ
        </button>
        {camError && (
          <button
            onClick={onMock}
            className="font-mincho text-xs text-washi/60 underline"
          >
            カメラ無し（Mock）で進む
          </button>
        )}
      </div>
    </div>
  );
}
