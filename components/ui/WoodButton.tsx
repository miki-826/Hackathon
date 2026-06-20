"use client";

import type { ButtonHTMLAttributes, CSSProperties } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  plaqueUrl: string | null;
  variant?: "primary" | "ghost";
  size?: "lg" | "md";
};

export default function WoodButton({
  plaqueUrl,
  variant = "primary",
  size = "lg",
  className = "",
  children,
  style,
  ...rest
}: Props) {
  const sizeCls =
    size === "lg"
      ? "px-8 py-4 text-xl min-w-[15rem]"
      : "px-5 py-3 text-base min-w-[10rem]";

  // 木札画像が無い場合のフォールバック外装
  const fallback: CSSProperties = plaqueUrl
    ? {}
    : {
        background:
          "linear-gradient(180deg,#6b4a2b,#4a3017)",
        borderRadius: 10,
        border: "2px solid #2c1c0d",
        boxShadow: "0 6px 14px rgba(0,0,0,0.5)",
      };

  // --plaque はルート（GameApp）で一度だけ注入する。ここでは継承して使う。
  return (
    <button
      {...rest}
      data-variant={variant}
      data-noplaque={plaqueUrl ? undefined : "1"}
      className={`wood-btn font-mincho font-bold tracking-wide ${sizeCls} ${className}`}
      style={{ ...fallback, ...style } as CSSProperties}
    >
      {children}
    </button>
  );
}
