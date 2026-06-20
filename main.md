---
schema_version: 3.0
project:
  name: 柔断
  english_name: JUDAN
  mode: new
  repository: unconfirmed
  updated_at: 2026-06-20
hackathon:
  theme: 柔
  timebox_hours: 3
  play_time_seconds: 60
  goal: カメラで手刀の動きを検出し、素材ごとに切り方を変えながら、1分間で切れた個数を競うWebゲームを完成させる
core_rules:
  object_display: one_at_a_time
  rhythm_game: false
  visible_score: cut_count_only
  final_result:
    - cut_count
    - rank
    - certificate_photo
  camera_processing: local_only
priority:
  must_have:
    - mediapipe_hand_tracking
    - sequential_material_challenge
    - material_specific_cut_judgement
    - hand_following_slash_effect
    - cut_count_only_hud
    - rank_certificate
    - local_photo_capture
    - certificate_download
    - mock_mode
  should_have:
    - photo_candidate_selection
    - sound_effects
    - additional_materials
    - pose_landmarker_extension
  cut:
    - rhythm_timing_judgement
    - microphone
    - login
    - online_ranking
    - complex_database
    - realtime_multiplayer
    - ai_required_features
    - server_photo_upload
technology:
  frontend:
    - Next.js App Router
    - TypeScript
    - Tailwind CSS
  vision:
    primary: MediaPipe Hand Landmarker
    optional:
      - MediaPipe Pose Landmarker
      - MediaPipe Face Landmarker
  rendering:
    - HTML Canvas 2D
    - CSS animation
  storage:
    primary: in-memory Blob
    optional: LocalStorage for last result metadata only
  deployment:
    - GitHub
    - Vercel
---

# 柔断 — 1分間・素材別手刀ゲーム 要件定義書

## 1. プロジェクト概要

| 項目 | 内容 |
|---|---|
| アプリ名 | 柔断 |
| 英語表記 | JUDAN |
| テーマ | 柔 |
| ジャンル | カメラ入力・体感アクションゲーム |
| プレイ時間 | 1プレイ60秒 |
| 操作 | Webカメラの前で手刀を振る |
| メインスコア | 正しく切れた素材の個数 |
| 最終結果 | 切断数、段位、プレイ中写真付き認定証 |
| 対応端末 | PCを最優先、タブレット対応、スマートフォンは簡易対応 |
| デプロイ | Vercel |
| サーバー必須性 | なし |
| APIキー必須性 | なし |
| 写真保存 | ユーザーが認定証をダウンロードした場合のみ端末へ保存 |
| カメラ映像 | 原則ブラウザ内でのみ処理し、サーバーへ送信しない |

## 2. 一文説明

> カメラに向かって手刀を振り、豆腐には優しく、紐には鋭く、素材に合わせた切り方で1分間に何個切れるか挑戦する体感ゲーム。

## 3. コンセプト

「柔」を単に柔らかい物体として表現するのではなく、**対象の性質に応じて自分の動きを柔軟に変えること**として体験化する。

- 豆腐は強く切ると崩れる。
- 紐は遅く切るとたわんで逃げる。
- 木材は弱く切ると傷しか付かない。
- プリンは勢いが強すぎると飛び散る。
- 餅は振り抜きが足りないと伸びて再接着する。

すべての素材を同じ動きで攻略できないことがゲームの核である。

## 4. 体験の中心

本ゲームはリズムゲームではない。

- 音楽の拍に合わせて切る必要はない。
- タイミング判定をスコアに使用しない。
- 画面中央に素材が一つずつ出現する。
- プレイヤーは素材を見て、適切な切り方を選ぶ。
- 成否が決まると次の素材へ切り替わる。
- 60秒間に正しく切れた個数だけを競う。

BGMは雰囲気づくりに使用してよいが、ゲーム入力とは連動させない。

## 5. テーマ解釈

### 5.1 物理的な「柔」

豆腐、紐、プリン、餅、ゼリーなど、硬さ・粘り・しなり方が異なる素材を扱う。

### 5.2 行動としての「柔」

プレイヤーは毎回同じ強さで切るのではなく、対象を見て動きを切り替える。

### 5.3 作品メッセージ

> 強ければよいわけではない。  
> 優しければよいわけでもない。  
> 相手の性質を理解し、扱い方を変えることが「柔」である。

## 6. 勝ち筋

本企画の強みは、説明を読まなくても失敗演出からルールを理解できる点にある。

1. 紐を高速で切って成功する。
2. 次の豆腐を同じ勢いで切る。
3. 豆腐が爆散する。
4. 「素材によって切り方を変えるゲーム」だと理解する。
5. 次から速度・軌道・振り抜きを意識する。

この「紐成功 → 豆腐爆散」を最初の30秒以内に必ず体験させる。

# 7. ゲームループ

```text
タイトル
  ↓
カメラ利用と写真撮影の説明
  ↓
カメラ許可
  ↓
手の位置確認
  ↓
簡易キャリブレーション
  ↓
3・2・1
  ↓
60秒ゲーム開始
  ↓
素材を1つ表示
  ↓
プレイヤーが手刀を振る
  ↓
手の軌道が素材の当たり判定を横切る
  ↓
素材別条件で成功・失敗を判定
  ↓
成功なら切断数を+1
  ↓
素材固有の演出を再生
  ↓
次の素材を1つ表示
  ↓
60秒経過まで繰り返す
  ↓
終了
  ↓
切断数から段位を算出
  ↓
プレイ中写真を選択
  ↓
写真付き段位認定証を生成
  ↓
PNGダウンロードまたは再挑戦
```

# 8. 画面遷移

状態は1ページ内で切り替える。

```ts
type GameScreen =
  | "title"
  | "camera-permission"
  | "camera-check"
  | "calibration"
  | "countdown"
  | "playing"
  | "ending"
  | "photo-select"
  | "result";
```

## 8.1 タイトル画面

必須要素：

- ロゴ「柔断」
- コピー「切り方を、変えろ。」
- スタート
- 遊び方
- カメラ映像をサーバーへ送信しない旨
- Mock Modeへの小さな導線

## 8.2 カメラ許可画面

表示文：

> 手の動きの検出と段位認定証の作成にカメラを使用します。  
> 映像と写真はブラウザ内で処理し、サーバーへ送信しません。

必須操作：

- カメラを許可して開始
- 写真なしで開始
- カメラが使用できない場合はMock Mode

## 8.3 カメラ確認画面

- 左右反転したカメラ映像
- 手の検出状態
- 検出中の手に簡易輪郭
- 「手を画面内に入れてください」
- 明るさ不足、距離不足の警告
- 手が安定して検出されたら次へ

## 8.4 キャリブレーション画面

3回だけ動いてもらう。

1. ゆっくり手刀
2. 普通の手刀
3. 全力の手刀

保存する値：

```ts
type CalibrationProfile = {
  slowPeakSpeed: number;
  normalPeakSpeed: number;
  maxPeakSpeed: number;
  averageHandScale: number;
  dominantHand: "Left" | "Right";
};
```

キャリブレーション値から、プレイヤーごとの速度を0〜1.5程度へ正規化する。

## 8.5 プレイ画面

画面に表示する数値は**切断数のみ**とする。

表示例：

```text
12
```

表示しないもの：

- 残り時間
- コンボ
- 速度
- 成功率
- 内部スコア
- 段位予測
- タイミング評価

終了時間は内部で管理し、残り時間を数値表示しない。終盤は背景や風音などの演出で終了が近いことを伝えてもよい。

## 8.6 結果画面

表示する主要情報：

```text
二十三断

柔断 五段
```

その他：

- プレイ中の写真
- 認定印
- 認定証を保存
- もう一度挑戦

詳細な速度・加速度・成功率は表示しない。

# 9. 60秒間の進行設計

素材は必ず1つずつ表示する。

## 9.1 1素材のライフサイクル

```text
出現演出 200〜300ms
  ↓
入力受付 最大1.8〜2.4秒
  ↓
手刀が通過したら即時判定
  ↓
成功・失敗演出 250〜500ms
  ↓
次の素材
```

### ルール

- 一度判定された素材は再判定しない。
- 1回の素材につき原則1回だけ手刀を受け付ける。
- 時間内に手刀が来なければ自動失敗として次へ進む。
- 判定後の短い演出中は入力を受け付けない。
- 1分間で約22〜30個が出現することを目標にする。
- プレイヤーが素早く処理できるほど次の素材が早く出現する。

## 9.2 難易度進行

### 0〜15秒

- 紐
- 豆腐

ルールを理解させる区間。

### 15〜35秒

- 紐
- 豆腐
- 木材
- プリン

硬質型と停止型を追加する。

### 35〜50秒

- 餅
- ゼリー
- スポンジ

振り抜きや速度安定性を追加する。

### 50〜60秒

すべての素材からランダム。ただし同じ素材を3回連続で出さない。

## 9.3 出現制御

完全ランダムではなく、バッグ方式を使う。

```ts
const materialBag = [
  "rope",
  "tofu",
  "wood",
  "pudding",
  "mochi",
  "jelly",
];
```

- バッグ内をシャッフルして順番に使用する。
- バッグを使い切ったら再シャッフルする。
- 直前と同じ素材は避ける。
- 初回は必ず `rope → tofu` にする。
- 各素材の出現数が極端に偏らないようにする。

# 10. 素材設計

## 10.1 素材分類

| 分類 | 特徴 | 必要な動き |
|---|---|---|
| 崩壊型 | 強すぎると壊れる | 低速、低加速度、安定 |
| しなり型 | 遅いと逃げる | 高速、高加速度、鋭い一撃 |
| 硬質型 | 弱いと切れない | 高速、大きい振り抜き |
| 停止型 | 深く切りすぎると失敗 | 中低速、正確な停止 |
| 粘着型 | 途中で止めると再接着 | 中高速、長い振り抜き |
| 揺動型 | 揺れで軌道がずれる | 中速、直線、安定 |

## 10.2 豆腐

### 性質

- 柔らかい
- 崩れやすい
- 強い衝撃に弱い
- 横方向のブレに弱い

### 成功条件

- ピーク速度：低〜中低速
- 加速度：低い
- 直線度：高い
- 速度変動：小さい
- 対象を最後まで通過

### 演出

| 状態 | 演出 |
|---|---|
| 成功 | 静かに二つへ分かれ、断面が光る |
| 強すぎる | 豆腐が爆散し、白い欠片と水滴が飛ぶ |
| ブレ | 断面が崩れ、片側が倒れる |
| 弱すぎる | 豆腐が横へ押されて潰れる |
| 空振り | 豆腐が小さく揺れる |

### 成功時の内部判定例

```ts
peakSpeed: 0.22 - 0.48
averageSpeed: 0.18 - 0.40
peakAcceleration: 0.00 - 0.45
straightness: 0.82以上
speedVariation: 0.30以下
followThrough: 0.40以上
```

## 10.3 紐

### 性質

- 柔らかいがたわむ
- 遅い動きでは手刀に押されて逃げる
- 短く鋭い切断が必要

### 成功条件

- ピーク速度：高い
- 加速度：高い
- 紐に対して交差する角度
- 十分な振り抜き
- 軌道が対象中心を通る

### 演出

| 状態 | 演出 |
|---|---|
| 成功 | 一瞬で切れ、両端が左右に跳ねる |
| 遅い | 紐が手刀方向へ曲がって逃げる |
| 弱い | 表面だけほつれる |
| 角度不良 | 紐が大きく揺れる |
| 空振り | 紐が静かにぶら下がったまま |

### 成功時の内部判定例

```ts
peakSpeed: 0.72以上
peakAcceleration: 0.55以上
straightness: 0.72以上
followThrough: 0.70以上
intersectionAngle: 55度以上
```

## 10.4 木材

### 性質

- 硬い
- 勢いと振り抜きが必要
- 弱い手刀では傷だけが付く

### 成功条件

- ピーク速度：高い
- 加速度：高い
- 振り抜き：大きい
- 軌道：中心に近い
- 直線度：高い

### 演出

| 状態 | 演出 |
|---|---|
| 成功 | 木目に沿って割れ、木くずが飛ぶ |
| 弱い | 浅い傷だけ付く |
| 振り抜き不足 | 手刀が食い込んだ表現 |
| 中心ずれ | 木材が回転して倒れる |
| 空振り | 葉が一枚落ちる |

## 10.5 プリン

### 性質

- 非常に崩れやすい
- 強い動きで皿から飛び出す
- 適切な位置で止める必要がある

### 成功条件

- 低〜中低速
- 横ブレが少ない
- 指定位置付近で減速
- 振り抜きすぎない
- 軌道が垂直に近い

### 演出

| 状態 | 演出 |
|---|---|
| 成功 | ぷるんと揺れて美しく分かれる |
| 強すぎる | カラメルと本体が画面へ飛ぶ |
| 深すぎる | 皿まで割れる |
| 横ブレ | 上部だけ崩れる |
| 弱すぎる | プリンがへこみ、元に戻る |

## 10.6 餅

### 性質

- 粘る
- 遅い動きでは伸びる
- 振り抜きが不足すると再接着する

### 成功条件

- 中〜高速
- 十分な振り抜き
- 直線度
- 切断後も左右が離れる

### 演出

| 状態 | 演出 |
|---|---|
| 成功 | 少し伸びてから切れ、左右が跳ねる |
| 遅い | 手刀に絡みついて長く伸びる |
| 振り抜き不足 | 一度割れてから再接着する |
| 強すぎる | 餅が画面外へ飛ぶ |

## 10.7 ゼリー

### 性質

- 揺れる
- 急な衝撃で弾かれる
- 軌道の安定が必要

### 成功条件

- 中速
- 速度変化が小さい
- 直線度が高い
- 中央付近を通る

### 演出

| 状態 | 演出 |
|---|---|
| 成功 | 断面が波打ちながら二つへ分かれる |
| 強すぎる | 台から弾き飛ばされる |
| ブレ | 斜めに裂ける |
| 弱すぎる | 手刀の形にへこんで戻る |

## 10.8 スポンジ

### 性質

- 押すと潰れる
- 手を離すと戻る
- 一定速度と低い押し込みが必要

### 成功条件

- 中低速
- 速度の安定
- 横ブレが少ない
- 加速度が高すぎない

### 演出

| 状態 | 演出 |
|---|---|
| 成功 | 少しへこんだ後に滑らかに分かれる |
| 強すぎる | ぺちゃんこになる |
| 弱すぎる | へこんで元に戻る |
| ブレ | 波状の断面になる |

# 11. データモデル

```ts
type MaterialId =
  | "tofu"
  | "rope"
  | "wood"
  | "pudding"
  | "mochi"
  | "jelly"
  | "sponge";

type MaterialProfile = {
  id: MaterialId;
  name: string;
  category:
    | "fragile"
    | "flexible"
    | "hard"
    | "stop"
    | "sticky"
    | "wobbly";

  displayDurationMs: number;
  hitBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  thresholds: {
    peakSpeed?: Range;
    averageSpeed?: Range;
    peakAcceleration?: Range;
    straightnessMin?: number;
    speedVariationMax?: number;
    followThroughMin?: number;
    stopErrorMax?: number;
    intersectionAngleMin?: number;
  };

  weights: {
    peakSpeed: number;
    averageSpeed: number;
    acceleration: number;
    straightness: number;
    stability: number;
    followThrough: number;
    stopAccuracy: number;
  };

  effects: {
    success: EffectId;
    tooStrong: EffectId;
    tooWeak: EffectId;
    unstable: EffectId;
    miss: EffectId;
  };
};

type Range = {
  min: number;
  max: number;
};
```

# 12. カメラ入力

## 12.1 カメラ取得

```ts
navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "user",
    frameRate: { ideal: 30 },
  },
  audio: false,
});
```

要件：

- HTTPSまたはlocalhostで動作させる。
- ユーザー操作後にカメラ許可を求める。
- 自撮り映像は左右反転して表示する。
- 判定座標と描画座標も同じルールで反転する。
- ゲーム終了またはページ離脱時にMediaStreamTrackを停止する。

# 13. MediaPipe Hand Landmarker

## 13.1 主用途

- 手の21ランドマーク取得
- 左右の手の識別
- 手の中心位置の推定
- 手刀方向の推定
- フレーム間移動量の計算
- 斬撃軌道の描画
- 素材との交差判定

## 13.2 初期設定例

```ts
const handLandmarker = await HandLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: "/models/hand_landmarker.task",
    delegate: "GPU",
  },
  runningMode: "VIDEO",
  numHands: 1,
  minHandDetectionConfidence: 0.6,
  minHandPresenceConfidence: 0.6,
  minTrackingConfidence: 0.6,
});
```

MVPでは1人・片手を前提に `numHands: 1` とする。

## 13.3 基準点

手首だけではなく、以下の平均から手刀中心を求める。

- 手首：landmark 0
- 人差し指付け根：landmark 5
- 小指付け根：landmark 17

```ts
function getHandCenter(landmarks: NormalizedLandmark[]) {
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const pinkyMcp = landmarks[17];

  return {
    x: wrist.x * 0.4 + indexMcp.x * 0.3 + pinkyMcp.x * 0.3,
    y: wrist.y * 0.4 + indexMcp.y * 0.3 + pinkyMcp.y * 0.3,
    z: wrist.z * 0.4 + indexMcp.z * 0.3 + pinkyMcp.z * 0.3,
  };
}
```

## 13.4 手刀の向き

小指付け根と人差し指付け根を使って手の横軸を作る。

```ts
const palmAxis = {
  x: pinkyMcp.x - indexMcp.x,
  y: pinkyMcp.y - indexMcp.y,
};
```

前フレームから現フレームへの移動ベクトルと組み合わせて、

- 縦切り
- 横切り
- 斜め切り
- 手刀の面が大きく崩れていないか

を判定する。

# 14. 動作サンプル

```ts
type MotionSample = {
  timestamp: number;
  x: number;
  y: number;
  z: number;
  handScale: number;
  wristAngle: number;
  detectionConfidence: number;
};
```

直近800ms程度をリングバッファに保持する。

```ts
type MotionBuffer = MotionSample[];
```

保持数の目安：

- 検出30fps：最大24〜30サンプル
- 描画60fps：最新位置を補間して使用
- 800msより古いデータは削除

# 15. 算出する特徴量

```ts
type MotionFeatures = {
  peakSpeed: number;
  averageSpeed: number;
  peakAcceleration: number;
  speedVariation: number;
  straightness: number;
  lateralDeviation: number;
  followThrough: number;
  stopError: number;
  slashAngle: number;
  intersectionAngle: number;
  detectionConfidence: number;
  hit: boolean;
};
```

## 15.1 速度

```text
速度 = 前フレームからの移動距離 ÷ 経過時間
```

画面サイズやカメラ距離の影響を減らすため、手の大きさで正規化する。

```text
正規化速度 =
画面上の移動速度 ÷ 手首から中指先までの距離
```

さらに本人のキャリブレーション最大速度で割る。

```text
個人正規化速度 =
正規化速度 ÷ キャリブレーション時最大速度
```

## 15.2 加速度

```text
加速度 = 現在速度と前回速度の差 ÷ 経過時間
```

## 15.3 直線度

```text
直線度 =
始点から終点までの直線距離 ÷ 実際の移動距離合計
```

- 1.0に近い：真っすぐ
- 低い：軌道が曲がっている

## 15.4 速度変動

速度列の変動係数を使う。

```text
速度変動 = 速度の標準偏差 ÷ 平均速度
```

- 小さい：一定速度
- 大きい：途中で急加速・急減速

## 15.5 振り抜き

素材の当たり判定を通過した後、進行方向へどれだけ移動したかを算出する。

```text
振り抜き =
ヒット後の進行方向移動量 ÷ 手の大きさ
```

## 15.6 停止誤差

プリンなどで、指定停止線と動作終了地点の距離を測る。

```text
停止誤差 =
停止地点と目標停止地点の距離 ÷ 手の大きさ
```

# 16. 一振りの切り出し

## 16.1 状態

```ts
type SlashState =
  | "idle"
  | "tracking"
  | "crossed"
  | "judging"
  | "cooldown";
```

## 16.2 状態遷移

```text
idle
  ↓ 速度が開始閾値を超える
tracking
  ↓ 軌道線分が素材HitBoxへ交差
crossed
  ↓ ヒット後の数フレームを収集
judging
  ↓ 素材別判定と演出
cooldown
  ↓ 次素材の準備完了
idle
```

## 16.3 ヒステリシス

開始と終了で異なる閾値を使う。

```ts
const MOTION_START_SPEED = 0.18;
const MOTION_STOP_SPEED = 0.08;
```

境界付近で開始・停止を繰り返す誤判定を防ぐ。

# 17. 素材との交差判定

前フレーム位置と現在位置を結ぶ線分が素材のHitBoxと交差したか判定する。

```ts
type ScreenPoint = {
  x: number;
  y: number;
};

function didSlashCrossObject(
  previous: ScreenPoint,
  current: ScreenPoint,
  hitBox: DOMRect,
): boolean;
```

条件：

- 単純に現在座標がHitBox内にあるだけでなく、線分交差を使う。
- 高速移動でフレーム間に素材を飛び越えてもヒットできる。
- 画面上の素材位置とカメラ座標を同じCanvas座標へ変換する。
- 手が素材付近で止まっているだけではヒットにしない。
- 一振りにつき一度だけヒットさせる。

# 18. 素材別判定

## 18.1 判定結果

```ts
type CutOutcome =
  | "success"
  | "too-strong"
  | "too-weak"
  | "unstable"
  | "bad-angle"
  | "miss";
```

## 18.2 判定の優先順

1. 手が検出されているか
2. 素材と交差したか
3. 速度が極端に上限を超えたか
4. 速度が下限未満か
5. 素材固有の軌道条件を満たしたか
6. 成功

プレイヤーに複雑な点数は表示しない。成功時のみ切断数を1増やす。

```ts
if (outcome === "success") {
  cutCount += 1;
}
```

## 18.3 内部スコア

内部デバッグ用に0〜100の適合度を持ってもよいが、通常画面には表示しない。

```ts
type InternalCutScore = {
  total: number;
  speedFit: number;
  accelerationFit: number;
  straightnessFit: number;
  stabilityFit: number;
  followThroughFit: number;
};
```

用途：

- 閾値調整
- 写真候補の優先順位
- 開発用デバッグパネル
- 成功・失敗の境界確認

# 19. 斬撃エフェクト

## 19.1 位置

手の現在位置をCanvas座標へ変換して、斬撃の開始位置と終了位置を決める。

```ts
const start = motionSamples[0];
const end = motionSamples.at(-1)!;
```

## 19.2 角度

```ts
const slashAngle = Math.atan2(
  end.y - start.y,
  end.x - start.x,
);
```

## 19.3 長さ

```text
斬撃長 =
手の移動距離 × 係数
```

上限と下限を設定し、極端に長くならないようにする。

## 19.4 太さ・発光

- 速度が高い：太い、鋭い、強い発光
- 速度が低い：細い、淡い、長めの残像
- ブレが大きい：軌跡を波打たせる
- 直線度が高い：一本の鋭い線
- 強すぎる：衝撃波を追加
- 弱すぎる：途中で軌跡を消す

## 19.5 素材別の見た目

| 素材 | 斬撃表現 |
|---|---|
| 豆腐 | 白く細い、水面のような残光 |
| 紐 | 短く鋭い銀色の閃光 |
| 木材 | 太い斬撃、火花、木くず |
| プリン | 柔らかい光、カラメル色の粒子 |
| 餅 | 少し伸びる粘性残像 |
| ゼリー | 半透明で波打つ斬撃 |
| スポンジ | 柔らかく沈む軌跡 |

## 19.6 手に追従する武器

MVPでは3Dモデルを使わず、2Dの刀または手刀オーラを表示する。

- 根元：手の中心
- 向き：手首角度または移動方向
- 長さ：固定
- 速度に応じて残像を追加
- 手が未検出の場合は非表示
- 検出信頼度が低い場合は半透明

# 20. 写真撮影

## 20.1 方針

- ゲーム中に動画を保存しない。
- 成功時の静止画だけを数枚作る。
- 写真はブラウザのメモリー内に保持する。
- サーバーやAPIへ送信しない。
- 認定証をダウンロードしなければ端末へ永続保存しない。

## 20.2 撮影タイミング

候補：

- 最初の成功
- 5個目
- 10個目
- 15個目
- 20個目
- 最高内部スコア更新時
- 最大速度更新時
- 最後の成功

最大5枚だけ保持する。

## 20.3 撮影画像

単純なカメラ画像ではなく、ゲームCanvasを含めた合成写真を作る。

合成順：

1. 左右反転したカメラ映像
2. 手に追従する刀またはオーラ
3. 斬撃エフェクト
4. 切れた素材
5. 小さなゲームロゴ

これにより、認定証だけを見ても「何をしている写真か」が伝わる。

## 20.4 写真候補

```ts
type PhotoCandidate = {
  id: string;
  blob: Blob;
  objectUrl: string;
  capturedAt: number;
  cutCount: number;
  materialId: MaterialId;
  internalCutScore: number;
  movementAmount: number;
  faceVisible?: boolean;
  candidateScore: number;
};
```

## 20.5 候補選定

MVPでは「楽しそう」という感情を自動断定しない。

候補スコア：

```text
候補スコア =
切断適合度 40%
手の動きの大きさ 25%
画面中央への収まり 20%
顔が映っているか 15%
```

結果画面前に上位3枚を表示し、プレイヤー自身が1枚選ぶ。

選択肢：

- この写真で認定
- 別の写真
- 写真なしで認定
- 今撮り直す

## 20.6 Face Landmarker

余裕がある場合のみ使う。

用途：

- 顔が画面内に入っているか
- 顔が極端に見切れていないか
- 目を閉じた瞬間などを候補から外す

使用しない用途：

- 性格推定
- 年齢推定
- 本人確認
- 医療・健康判断
- 感情の断定

# 21. 段位認定

## 21.1 表示

プレイ中は段位を表示しない。終了後に初めて表示する。

## 21.2 段位テーブル

1分間に最大30個程度を想定する。

| 切断数 | 段位 |
|---:|---|
| 0〜3 | 見習い |
| 4〜7 | 五級 |
| 8〜11 | 三級 |
| 12〜15 | 一級 |
| 16〜19 | 初段 |
| 20〜22 | 三段 |
| 23〜25 | 五段 |
| 26〜28 | 七段 |
| 29 | 九段 |
| 30以上 | 柔断十段 |

プレイテストで出現可能数と成功率を確認し、最終調整する。

## 21.3 関数

```ts
function getRank(cutCount: number): string {
  if (cutCount >= 30) return "柔断十段";
  if (cutCount >= 29) return "九段";
  if (cutCount >= 26) return "七段";
  if (cutCount >= 23) return "五段";
  if (cutCount >= 20) return "三段";
  if (cutCount >= 16) return "初段";
  if (cutCount >= 12) return "一級";
  if (cutCount >= 8) return "三級";
  if (cutCount >= 4) return "五級";
  return "見習い";
}
```

# 22. 認定証

## 22.1 必須要素

- 「柔断 段位認定証」
- 選択したプレイ中写真
- 切断数
- 段位
- 認定印
- 発行日
- ゲームロゴ

## 22.2 表示例

```text
柔断 段位認定証

二十三断

認定段位
柔断 五段

2026年6月20日
柔断道場 認定
```

## 22.3 画像サイズ

推奨：

- 縦型：1200 × 1600
- PNG
- 写真領域：960 × 720前後
- SNSやスマートフォン保存でも読める文字サイズ

## 22.4 生成方法

Canvas 2Dで合成する。

```ts
type CertificateData = {
  cutCount: number;
  rank: string;
  photo: HTMLImageElement | null;
  issuedAt: Date;
};
```

描画順：

1. 和紙背景
2. 枠
3. タイトル
4. 写真
5. 切断数
6. 段位
7. 日付
8. 認定印
9. ロゴ

## 22.5 ダウンロード

```ts
certificateCanvas.toBlob((blob) => {
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `judan-${cutCount}-${rank}.png`;
  anchor.click();

  URL.revokeObjectURL(url);
}, "image/png");
```

# 23. プレイ画面UI

## 23.1 レイアウト

### デスクトップ

```text
┌────────────────────────────────────────────┐
│                     12                     │
│                                            │
│            カメラ＋ゲームフィールド           │
│                                            │
│                 [素材]                     │
│               [切り株]                     │
│                                            │
│          小さな手検出インジケーター            │
└────────────────────────────────────────────┘
```

切断数以外の数値は置かない。

### モバイル

- 画面上部に切断数
- 中央に縦長のカメラ／ゲームフィールド
- 素材は下半分へ配置
- 手が画面外へ出ないようガイド枠を表示
- PC版よりHitBoxを大きくする

## 23.2 カメラ表示

背景全面に映像を表示する案を推奨する。

その上に、

- 道場フレーム
- 切り株
- 素材
- 斬撃
- 粒子
- 切断数

を重ねる。

ユーザー自身がゲーム世界の中に入ったように見せる。

## 23.3 数字表示

- 画面上部中央
- 大きな明朝体または筆文字風
- ラベルを付けず数字だけでもよい
- 成功時に数字を1回だけ跳ねさせる
- 数字の更新が最重要フィードバック

# 24. 演出

## 24.1 成功共通演出

- 斬撃線
- 素材が二つへ分離
- 数字が+1されて跳ねる
- 短い成功音
- 100〜150msのヒットストップ
- 次素材へ即移行

## 24.2 失敗共通演出

- 切断数は増えない
- 素材固有の失敗アニメーション
- 失敗理由の文章は基本的に出さない
- 色、動き、効果音だけで理由を伝える
- 500ms以内に次素材へ移行

## 24.3 豆腐の爆散

1. 豆腐が縦方向へ少し潰れる
2. 本体を非表示
3. 白い破片を放射状に飛ばす
4. 水滴パーティクル
5. カメラを軽くシェイク
6. 次の素材へ

## 24.4 紐が逃げる

1. 手刀方向へ紐を大きく曲げる
2. 切断せず横へ押し出される
3. 反動で数回揺れる
4. 端が少しほつれる
5. 次の素材へ

# 25. 音

リズムゲームにはしない。

## 25.1 使用可能な音

- タイトルBGM
- プレイ中BGM
- 斬撃音
- 素材別成功音
- 素材別失敗音
- 終了音
- 認定印の音

## 25.2 制約

- BGMの拍と素材出現を同期させない。
- 音がなくても遊べる。
- 効果音は短く、連続入力を邪魔しない。
- ユーザー操作後にのみ音声再生を開始する。
- タブ非表示時は一時停止する。

# 26. Pose Landmarker拡張

MVPではHand Landmarkerを優先する。

Pose Landmarkerを追加すると、以下を判定できる。

- 肩から振ったか
- 肘を含めて大きく振り抜いたか
- 手先だけの小さな動きか
- 体が画面外へ出ていないか

木材などの硬質素材だけにPose情報を使う。

```ts
type PoseFeatures = {
  shoulderMovement: number;
  elbowExtension: number;
  armSwingDistance: number;
};
```

Hand Landmarkerだけで成立した後に追加する。

# 27. パフォーマンス

## 27.1 目標

| 処理 | 目標 |
|---|---:|
| カメラ | 720p / 30fps |
| Hand Landmarker | 20〜30fps |
| Canvas描画 | 60fps目標 |
| 入力から演出 | 100ms以内を目標 |
| 写真候補 | 最大5枚 |
| 同時パーティクル | 100個以内 |
| ゲーム初期ロード | 5秒以内を目標 |

## 27.2 メインスレッド対策

- 同じvideo.currentTimeを複数回推論しない。
- 推論中に次の推論を開始しない。
- Canvas描画と推論頻度を分ける。
- 写真のBlob化は連続で実行しない。
- 古いMotionSampleを即座に破棄する。
- Face Landmarkerは常時動かさず、写真選定時だけ使う。

## 27.3 Web Worker

余裕がある場合：

```text
Main Thread
├─ React UI
├─ Camera Preview
├─ Canvas Rendering
└─ Audio

Worker
├─ Hand Landmark Detection
├─ Motion Feature Calculation
└─ Material Judgement
```

ただし3時間MVPでは、まずメインスレッドで動作させ、重い場合に検出fpsを落とす。

# 28. Mock Mode

## 28.1 目的

- カメラ拒否でも結果画面まで確認できる。
- 開発中に判定と演出を高速確認できる。
- Vercel本番でカメラ不具合が起きてもデモを継続できる。

## 28.2 操作

- マウスドラッグ
- タッチスワイプ
- スペースキー

### マウス・タッチ

スワイプの速度、距離、角度を手刀特徴量へ変換する。

### スペースキー

開発用の簡易成功入力。通常ユーザーには目立たせない。

## 28.3 デバッグキー

| キー | 動作 |
|---|---|
| 1 | 豆腐を出す |
| 2 | 紐を出す |
| 3 | 木材を出す |
| 4 | プリンを出す |
| S | 成功演出 |
| F | 失敗演出 |
| P | 写真撮影 |
| R | 結果画面へ移動 |

本番ビルドでは `?debug=1` の場合のみ有効にする。

# 29. エラー処理

| 状況 | 表示 | 復旧 |
|---|---|---|
| カメラ拒否 | カメラを使用できません | Mock Modeへ |
| カメラ非対応 | この端末ではカメラ入力を利用できません | Mock Modeへ |
| 手が未検出 | 手を画面中央へ入れてください | 継続 |
| 暗すぎる | 明るい場所でお試しください | 継続またはMock |
| モデル読込失敗 | 手の検出を開始できませんでした | Mock Modeへ |
| 写真生成失敗 | 写真なしの認定証を作成します | 結果継続 |
| Canvas Blob失敗 | 画像保存に失敗しました | 再試行 |
| 音声読込失敗 | 表示なし | 無音で継続 |

# 30. プライバシー

## 30.1 ユーザー向け表示

> カメラ映像は手の動作判定と認定証の作成に使用します。  
> 映像・写真はサーバーへ送信されず、このブラウザ内で処理されます。  
> 保存ボタンを押した場合のみ、認定証画像が端末へ保存されます。

## 30.2 実装要件

- カメラフレームをAPIへ送らない。
- 写真をSupabaseなどへ保存しない。
- Blobはメモリー内だけに保持する。
- 不要になったObject URLを破棄する。
- ゲーム終了後に写真候補を削除できる。
- ページ離脱時にカメラを停止する。
- 顔認証、本人確認、年齢推定を行わない。
- 身体能力の医学的・客観的評価を名乗らない。

# 31. コンポーネント設計

| コンポーネント | 役割 |
|---|---|
| `TitleScreen` | タイトル、開始、遊び方 |
| `PrivacyNotice` | カメラ・写真利用説明 |
| `CameraGate` | カメラ許可とMock切替 |
| `CameraCheck` | 映像、手検出確認 |
| `CalibrationFlow` | 3段階キャリブレーション |
| `GameSession` | 60秒の状態管理 |
| `GameCanvas` | カメラ、素材、斬撃の統合描画 |
| `HandTracker` | MediaPipe初期化と推論 |
| `MotionAnalyzer` | 速度、加速度、軌道算出 |
| `SlashDetector` | 一振り抽出と交差判定 |
| `MaterialSpawner` | 素材を1つずつ出現 |
| `MaterialJudge` | 素材別成功判定 |
| `MaterialRenderer` | 素材と失敗・成功演出 |
| `CutCounter` | 切断数だけを表示 |
| `PhotoCaptureManager` | 候補写真の撮影・保持 |
| `PhotoSelector` | 上位3枚から選択 |
| `RankResolver` | 切断数から段位決定 |
| `CertificateCanvas` | 認定証画像の生成 |
| `ResultScreen` | 切断数、段位、保存、再挑戦 |
| `AudioController` | BGM・効果音 |
| `MockInputController` | マウス・タッチ入力 |

# 32. 推奨ディレクトリ

```text
app/
├─ page.tsx
├─ layout.tsx
└─ globals.css

components/
├─ screens/
│  ├─ title-screen.tsx
│  ├─ camera-screen.tsx
│  ├─ calibration-screen.tsx
│  ├─ game-screen.tsx
│  ├─ photo-select-screen.tsx
│  └─ result-screen.tsx
├─ game/
│  ├─ game-canvas.tsx
│  ├─ cut-counter.tsx
│  ├─ material-renderer.tsx
│  └─ hand-overlay.tsx
└─ certificate/
   ├─ certificate-preview.tsx
   └─ certificate-actions.tsx

lib/
├─ camera/
│  ├─ start-camera.ts
│  └─ capture-frame.ts
├─ vision/
│  ├─ create-hand-landmarker.ts
│  ├─ hand-center.ts
│  └─ coordinate-mapper.ts
├─ motion/
│  ├─ motion-buffer.ts
│  ├─ extract-features.ts
│  ├─ slash-state-machine.ts
│  └─ line-intersection.ts
├─ materials/
│  ├─ profiles.ts
│  ├─ judge-material.ts
│  └─ material-bag.ts
├─ photo/
│  ├─ photo-candidates.ts
│  └─ select-best-photos.ts
├─ certificate/
│  ├─ draw-certificate.ts
│  └─ download-certificate.ts
└─ rank/
   └─ get-rank.ts

public/
├─ models/
│  └─ hand_landmarker.task
├─ audio/
├─ images/
└─ effects/
```

# 33. 状態管理

```ts
type GameState = {
  screen: GameScreen;
  status: "idle" | "running" | "finished";
  startedAt: number | null;
  endsAt: number | null;
  cutCount: number;
  currentMaterial: MaterialId | null;
  currentOutcome: CutOutcome | null;
  calibration: CalibrationProfile | null;
  photoCandidates: PhotoCandidate[];
  selectedPhotoId: string | null;
  rank: string | null;
};
```

React Contextまたは`useReducer`で管理する。3時間MVPでは外部状態管理ライブラリを必須にしない。

# 34. 時間管理

`setInterval()`だけに依存せず、`performance.now()`と終了時刻の差で管理する。

```ts
const GAME_DURATION_MS = 60_000;
const endsAt = performance.now() + GAME_DURATION_MS;
```

描画フレームごとに、

```ts
const isFinished = performance.now() >= endsAt;
```

を判定する。

タブが一時停止した場合は、発表用ではゲームを終了させるか、visibilitychangeで一時停止するかを選ぶ。推奨は一時停止。

# 35. LocalStorage

MVPでは必須ではない。

保存する場合も画像を保存しない。

```ts
type LocalResult = {
  id: string;
  cutCount: number;
  rank: string;
  playedAt: string;
};
```

直近5件のメタデータのみ保存可能。ただし通常画面にランキングは表示しない。

# 36. API・DB方針

## 36.1 不要なもの

- OpenAI API
- Gemini API
- Supabase
- 認証
- オンラインランキング
- サーバー側画像処理

本ゲームはブラウザ内処理だけで中核体験が成立する。

## 36.2 将来拡張

必要になった場合のみ、

- オンライン段位ランキング
- 日替わり素材
- 認定証共有URL
- AI師範コメント

を追加する。ただしカメラ写真は明示同意なしにアップロードしない。

# 37. デザイン

## 37.1 世界観

- 和風の手刀道場
- 木の切り株
- 藍色の布
- 和紙
- 墨
- 金色の認定印
- 食材や素材は少しコミカル
- 暴力的・流血的な表現は使わない

## 37.2 配色

| 用途 | 色の方向性 |
|---|---|
| 背景 | 濃い藍、墨色 |
| 切り株 | 焦げ茶、木目 |
| 主要文字 | 和紙色、白 |
| 成功 | 金、白 |
| 失敗 | 朱色、薄い灰 |
| 認定証 | 生成り、金、朱印 |

## 37.3 AI生成UI感を避ける

- 均等なカードUIを並べない。
- グラデーションだけの背景にしない。
- 汎用ダッシュボード風にしない。
- ゲーム中に説明カードを表示しない。
- 切り株、のれん、朱印など世界観の物体をUIとして使う。
- 数字はHUDではなく掛け軸や道場札のように配置する。

# 38. アクセシビリティ

- カメラなしでもMock Modeで遊べる。
- 音なしでも判定が分かる。
- 高コントラストを確保する。
- 認定証ボタンはキーボード操作可能にする。
- 激しい画面揺れを軽減する設定を検討する。
- `prefers-reduced-motion`では粒子数と揺れを減らす。
- 色だけで成功・失敗を示さず、動きも変える。

# 39. Demo Mode

URL：

```text
?demo=1
```

挙動：

- 20秒または30秒へ短縮可能
- 初回素材は必ず紐、次に豆腐
- カメラ許可に失敗したら即Mock Mode導線
- 写真は最大3枚
- 終了後は即座に結果表示
- BGM・画像が欠けても進行
- 段位閾値はDemo Mode用に調整

通常モードは必ず60秒とする。

# 40. デバッグパネル

`?debug=1` のときだけ表示する。

表示項目：

- 手検出信頼度
- 正規化速度
- 加速度
- 直線度
- 速度変動
- 振り抜き
- 手刀角度
- 現在素材
- 現在Outcome
- HitBox
- 手の軌跡
- FPS
- 推論時間

通常プレイでは完全に非表示にする。

# 41. 実装優先順位

## Phase 1：ゲーム完走

1. Next.js初期化
2. 画面状態遷移
3. 60秒タイマー
4. 素材を1つずつ表示
5. Mockスワイプ入力
6. 成功で切断数+1
7. 終了後に段位表示
8. 再挑戦

ここで必ず1プレイ完結させる。

## Phase 2：MediaPipe

1. カメラ取得
2. Hand Landmarker
3. 手の中心点
4. 軌跡描画
5. 線分交差判定
6. 一振り状態機械
7. キャリブレーション

## Phase 3：素材差

1. 紐
2. 豆腐
3. 木材
4. プリン
5. 餅
6. ゼリー

最初は紐と豆腐だけで成立させる。

## Phase 4：演出

1. 手追従の刀
2. 斬撃線
3. 紐切断
4. 豆腐爆散
5. 木材の木くず
6. プリン飛散
7. 数字更新

## Phase 5：写真と認定証

1. 成功時写真
2. 最大5枚保持
3. 3枚選択画面
4. 段位認定証Canvas
5. PNGダウンロード

## Phase 6：品質

1. 音
2. モバイル調整
3. Mock Mode強化
4. Vercel確認
5. エラー処理
6. パフォーマンス調整

# 42. 3時間ハッカソン用カット判断

## 絶対に残す

- 60秒
- 一つずつ素材が出る
- 手の速度判定
- 紐と豆腐
- 切断数だけ表示
- 最後に段位
- 写真付き認定証
- ダウンロード
- Mock Mode

## 時間がなければ削る

- 木材以降の素材
- Face Landmarker
- Pose Landmarker
- Web Worker
- LocalStorage
- BGM
- 高度な粒子
- 自動写真評価

## 最後まで削らない体験

> 紐には速く、豆腐には優しく。  
> 成功した個数が増え、最後に自分の写真入り段位認定証が出る。

# 43. テストケース

## 43.1 カメラ

- 許可したら映像が表示される。
- 拒否したらMock Modeへ進める。
- 手を画面外へ出すと未検出になる。
- 画面反転と斬撃方向が一致する。
- ゲーム終了後にカメラが停止する。

## 43.2 紐

- 高速で交差すると切断数+1。
- 遅いと紐が逃げ、加算されない。
- 素材を通過しない場合は空振り。
- 同じ一振りで二重加算されない。

## 43.3 豆腐

- 低速かつ直線的なら切断数+1。
- 高速では爆散し、加算されない。
- 横ブレが大きいと崩れ、加算されない。
- 弱すぎると押し潰される。

## 43.4 60秒

- 60秒経過で入力受付を終了する。
- 終了後に追加加算されない。
- 一つずつ素材が表示される。
- 同時に複数素材を表示しない。
- 終了後に段位が確定する。

## 43.5 写真

- 成功時に候補が生成される。
- 最大枚数を超えない。
- 候補を選択できる。
- 写真なしも選べる。
- 認定証へ正しく合成される。
- ダウンロード後にURLを破棄する。

# 44. 受け入れ条件

- 環境変数なしで`npm run build`が成功する。
- URLを開いて45秒以内にプレイへ到達できる。
- カメラ利用時、手の軌跡に斬撃が追従する。
- 手刀の位置・角度に応じて斬撃位置・角度が変わる。
- 紐を遅く切ると失敗し、高速で切ると成功する。
- 豆腐を高速で切ると崩れ、低速で丁寧に切ると成功する。
- 素材は一つずつ表示される。
- 通常モードは60秒で終了する。
- プレイ中に表示するスコア数値は切断数だけである。
- 成功時だけ切断数が1増える。
- 終了後に切断数に応じた段位が表示される。
- プレイ中写真を認定証に使用できる。
- 認定証をPNGとして保存できる。
- 映像・写真をサーバーへ送信しない。
- カメラが使えなくてもMock Modeで最後まで進める。

# 45. リスクと対策

| リスク | 確率 | 影響 | 対策 |
|---|---|---|---|
| 手の速度が端末距離で変わる | 高 | 高 | 手の大きさとキャリブレーションで正規化 |
| 高速手刀をフレーム間で見失う | 中 | 高 | 線分交差、720p/30fps、HitBox拡大 |
| 左右反転がずれる | 中 | 高 | 映像・座標・Canvasを同じ規則で反転 |
| MediaPipeでFPS低下 | 中 | 高 | 推論頻度を20fpsへ、写真処理を分離 |
| 素材差が伝わらない | 中 | 高 | 紐→豆腐を固定し、失敗演出を明確化 |
| 判定が厳しすぎる | 高 | 中 | キャリブレーションと広い適正範囲 |
| 写真に顔が入らない | 中 | 中 | 候補3枚＋撮り直し |
| 写真保存でメモリー増加 | 中 | 中 | 最大5枚、JPEG、Object URL破棄 |
| 3時間で素材数が足りない | 高 | 低 | 紐と豆腐だけで完成させる |
| Vercelでカメラ不具合 | 低 | 高 | HTTPS、Mock Mode、事前実機確認 |

# 46. 発表デモ

## 46.1 説明

> このゲームは、カメラで手の速度や軌道を測り、素材に合った切り方ができたかを判定します。  
> 豆腐は強く切ると崩れますが、紐は速く鋭く切らないと逃げます。  
> 1分間で正しく切れた個数が段位になり、プレイ中の写真付き認定証として保存できます。

## 46.2 デモ順

1. 紐を遅く切って失敗
2. 紐を高速で切って成功
3. 豆腐を同じ高速で切って爆散
4. 豆腐をゆっくり切って成功
5. 数字が増える
6. 結果で段位認定証を表示
7. PNGを保存

この順番だけでテーマ、技術、笑い、成果物を説明できる。

# 47. 技術的な差別化

- カメラを単なる撮影ではなくゲーム入力に使用する。
- 手の位置だけでなく速度、加速度、直線度、振り抜きを使う。
- 手の動きに合わせて斬撃位置・角度・長さを変える。
- 同じ手刀でも素材プロファイルによって結果が変わる。
- カメラ映像とゲーム演出を合成してプレイ写真を作る。
- すべての主要処理をブラウザ内で完結できる。
- AI APIに依存せず、デモが安定する。

# 48. 将来拡張

- 二刀流モード
- 両手で餅を伸ばして切る
- 連続する複合素材
- 岩の中に豆腐が入った速度切替ボス
- 日替わり素材
- オンライン段位
- 認定証共有URL
- 斬撃リプレイ
- WebXRによるAR切断
- 3D柔体表現
- 学習済み動作分類モデル

# 49. 参照する公式技術資料

- MediaPipe Hand Landmarker for Web  
  https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js
- MediaPipe Pose Landmarker for Web  
  https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js
- MediaDevices.getUserMedia  
  https://developer.mozilla.org/docs/Web/API/MediaDevices/getUserMedia
- Window.requestAnimationFrame  
  https://developer.mozilla.org/docs/Web/API/Window/requestAnimationFrame
- HTMLCanvasElement.toBlob  
  https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement/toBlob
- URL.createObjectURL  
  https://developer.mozilla.org/docs/Web/API/URL/createObjectURL_static

# 50. 最終決定事項

- リズムゲームにはしない。
- 通常プレイは60秒。
- 素材は一つずつ表示する。
- プレイヤーは自分の判断で手刀を振る。
- 素材ごとに速度・加速度・軌道・振り抜き条件を変える。
- 最初の素材順は紐→豆腐。
- プレイ中の数値表示は切断数だけ。
- 終了後に切断数から段位を認定する。
- プレイ中の写真を数枚だけローカル撮影する。
- 選んだ写真を段位認定証へ合成する。
- 認定証はPNGでダウンロードできる。
- カメラ映像と写真はサーバーへ送信しない。
- MediaPipeが失敗してもMock Modeで最後まで遊べる。
- MVPでは紐と豆腐の完成度を最優先する。
