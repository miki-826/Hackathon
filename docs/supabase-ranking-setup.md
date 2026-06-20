# Supabase ランキング設定

1. Supabaseでプロジェクトを作成する。
2. SQL Editorで `supabase/migrations/202606200001_create_judan_leaderboard.sql` を実行する。
3. Project URLとSecretキー（`sb_secret_...`）を取得し、ローカルでは`.env.local`、VercelではEnvironment Variablesへ設定する。

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_YOUR_SECRET_KEY
```

`SUPABASE_SECRET_KEY`はサーバー専用の秘密情報です。`NEXT_PUBLIC_`を付けたり、ブラウザコードへ埋め込んだりしないでください。従来の`service_role` JWTを使う既存プロジェクトでは、代わりに`SUPABASE_SERVICE_ROLE_KEY`も利用できます。

ランキングへ保存する列は次の5つだけです。

- `id`
- `display_name`
- `score`
- `rank`
- `created_at`

写真、カメラ映像、認定証画像、OpenAIのコメントは保存・送信しません。Supabaseが未設定または一時的に利用できない場合も、ゲームと認定証は通常どおり利用できます。

ランキングの閲覧は全員に公開されます。RLSでは`anon`と`authenticated`に`SELECT`だけを許可し、登録（`INSERT`）は秘密鍵を持つサーバーAPIだけが実行します。
