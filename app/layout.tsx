import type { Metadata, Viewport } from "next";
import { Yuji_Syuku, Shippori_Mincho } from "next/font/google";
import "./globals.css";

const brush = Yuji_Syuku({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-brush",
  display: "swap",
});

const mincho = Shippori_Mincho({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mincho",
  display: "swap",
});

export const metadata: Metadata = {
  title: "柔断 JUDAN — 一分間・素材別手刀ゲーム",
  description:
    "カメラに向かって手刀を振り、豆腐にはやさしく、紐には鋭く。素材に合わせた切り方で1分間に何個切れるか挑戦する体感ゲーム。",
};

export const viewport: Viewport = {
  themeColor: "#0c0f17",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${brush.variable} ${mincho.variable}`}>
      <body>{children}</body>
    </html>
  );
}
