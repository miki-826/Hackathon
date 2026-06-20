# 柔断 JUDAN

> 切り方を、変えろ。

カメラに向かって手刀を振り、**豆腐にはやさしく、紐には鋭く**。素材に合わせた切り方で、1分間に何個斬れるかを競う体感アクションゲーム。剣士が自分の庭の切り株を台に、柔らかいものを斬る修行をイメージしたUIです。

- カメラ映像・写真は**すべてブラウザ内で処理**し、サーバーへ送信しません。
- 手の検出は **MediaPipe Hand Landmarker**（ブラウザ内）。AIサーバーAPIには非依存。
- **環境変数なしで動作**します。カメラが使えない場合も **Mock Mode（ドラッグ操作）** で最後まで遊べます。

## 技術スタック

- Next.js (App Router) + TypeScript + Tailwind CSS
- MediaPipe Tasks Vision（Hand Landmarker, CDN配信のwasm/モデル）
- HTML Canvas 2D（素材・斬撃・パーティクル・認定証の描画）
- Web Audio API（効果音の合成）+ HTMLAudio（BGM）

## 開発

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 本番ビルド（環境変数なしで成功）
```

## 遊び方

1. タイトルで「修行を始める」（カメラ）または「カメラ無しで挑戦」（Mock）。
2. 切り株の上に素材が1つずつ現れる。
3. **紐は速く鋭く / 豆腐はやさしく**。素材で切り方を変える。
4. 1分間で正しく斬れた数が段位になり、プレイ写真つき認定証をPNG保存できる。

### URLパラメータ

- `?demo=1` … プレイ時間を30秒に短縮（発表用）
- `?debug=1` … プレイ中に `S`=成功 / `F`=爆散 の強制判定

## UIアセット生成

世界観アセットは gpt-image-2（品質medium）で生成しています（`gen-assets.mjs`）。
gpt-image-2 は透過背景に非対応のため、スプライトは純黒背景で生成し、実装側で近黒をアルファ抜き（`lib/engine/assets.ts` の `keyBlack`）してCanvas/CSSへ結線しています。

```bash
OPENAI_API_KEY=sk-... node gen-assets.mjs   # 既存画像はスキップ
```

## プライバシー

- カメラフレームをAPIへ送りません。写真はメモリ内のBlob/dataURLのみ。
- 認定証の「保存」を押したときだけ、PNGが端末に保存されます。
- ページ離脱・ゲーム終了時にカメラ（MediaStream）を停止します。
