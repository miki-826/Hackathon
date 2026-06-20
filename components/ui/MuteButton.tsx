"use client";

export default function MuteButton({
  muted,
  onClick,
}: {
  muted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={muted ? "音を出す" : "音を消す"}
      className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-kin/40 bg-sumi/60 text-lg text-washi backdrop-blur hover:bg-sumi/80"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
