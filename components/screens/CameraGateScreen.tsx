"use client";

import type { AppAssets } from "@/lib/engine/assets";
import WoodButton from "@/components/ui/WoodButton";

type Props = {
  assets: AppAssets | null;
  camError: string | null;
  onAllow: () => void;
  onMock: () => void;
  onBack: () => void;
};

export default function CameraGateScreen({
  assets,
  camError,
  onAllow,
  onMock,
  onBack,
}: Props) {
  const plaque = assets?.plaqueUrl ?? null;
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/bg-garden.png)" }}
      />
      <div className="absolute inset-0 bg-sumi/75" />

      <div className="relative z-10 flex h-full items-center justify-center px-6">
        <div className="ink-panel drift-in w-full max-w-lg rounded-lg p-8 text-center">
          <h2 className="font-brush text-3xl text-washi">カメラの許可</h2>
          <p className="mt-5 font-mincho text-sm leading-relaxed text-washi/85">
            手の動きの検出と、段位認定証の作成にカメラを使用します。
            <br />
            映像と写真は<span className="text-kin">ブラウザ内だけ</span>
            で処理し、サーバーへ送信しません。
          </p>

          {camError && (
            <p className="mt-4 rounded border border-shu/60 bg-shu/15 px-4 py-2 font-mincho text-sm text-washi">
              {camError}
            </p>
          )}

          <div className="mt-8 flex flex-col items-center gap-3">
            <WoodButton plaqueUrl={plaque} size="lg" onClick={onAllow}>
              カメラを許可して始める
            </WoodButton>
            <WoodButton plaqueUrl={plaque} size="md" variant="ghost" onClick={onMock}>
              カメラ無しで挑戦（Mock）
            </WoodButton>
          </div>

          <button
            onClick={onBack}
            className="mt-6 font-mincho text-xs text-washi/55 underline-offset-2 hover:underline"
          >
            ← 戻る
          </button>
        </div>
      </div>
    </div>
  );
}
