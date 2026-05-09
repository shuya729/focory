# apps/api

Focory のバックエンド API です。Cloudflare Workers + Hono で実装し、PostgreSQL（Hyperdrive 経由）/ Upstash Redis / Better Auth / Vertex AI を組み合わせて、AI による集中監視メッセージ生成と Expo Push 通知の送信を担います。

## アーキテクチャパターン

### 1. レイヤー分離（Route / Service / Repository / Schema）

`src/routes/<domain>` は以下の責務分離を前提にしています。

- `route.ts`: ルーティング定義、認証・バリデーションの合成、HTTP入出力
- `service.ts`: ユースケース実装（ビジネスロジック）
- `repository.ts`: DBアクセス（Drizzle）
- `schemas.ts`: リクエスト/レスポンスの Zod スキーマ

処理フロー:

```text
Request
  -> route.ts (validator / middleware / describeRoute)
  -> service.ts (use case)
  -> repository.ts (DB access)
  -> Response (typed by schemas.ts)
```

### 2. リクエストスコープ DI（withClients）

`src/middleware/with-clients.ts` で外部クライアントを初期化し、Hono Context へ注入します。

- `dc`: PostgreSQL (Drizzle)
- `ac`: Better Auth
- `rc`: Upstash Redis

これによりハンドラー側は「環境変数の読み取り」ではなく「依存の利用」に集中できます。

### 3. 認証・ユーザー解決ミドルウェアの合成

- `requireAuth` / `optionalAuth`: 認証状態の解決
- `requireUser` / `optionalUser`: `authId` からアプリ内ユーザーIDの解決

ルートごとに必要なミドルウェアを宣言的に合成し、責務を局所化します。

### 4. スキーマ駆動の API 定義

- 入力検証: `validator(...)` + Zod
- 仕様生成: `describeRoute(...)` + `hono-openapi`
- 型安全: `z.infer` ベースの型利用

OpenAPI の更新は `pnpm -F api gen-openapi` を実行します。

### 5. 共通エラーハンドリング

`src/routes/route.ts` の `app.onError(...)` でエラー形式を統一しています。

- `HTTPException`: `{ "error": "<message>" }` + 指定ステータス
- その他例外: `500 Internal server error`

## 利用ライブラリ

- Runtime: Cloudflare Workers (`wrangler`)
- Web Framework: `hono`
- API Doc / Validation Bridge: `hono-openapi`, `@hono/standard-validator`
- Validation: `zod`
- DB: `drizzle-orm`, `postgres`（Workers では Hyperdrive 経由）
- Auth: `better-auth`, `@better-auth/expo`, `@better-auth/drizzle-adapter`
- Cache / Rate limit: `@upstash/redis`
- AI: Google Vertex AI（Gemini）
- Push: Expo Push Notifications
- Test: `vitest`, `@cloudflare/vitest-pool-workers`

## ディレクトリ構成（要点）

```text
apps/api
├── src
│   ├── routes                  # ルーティング
│   │   ├── <route>
│   │   │   ├── route.ts        # ルーティング
│   │   │   ├── service.ts      # サービス
│   │   │   ├── repository.ts   # リポジトリ
│   │   │   ├── schemas.ts      # スキーマ
│   │   │   ├── types.ts        # 型定義
│   │   │   ├── utils.ts        # ユーティリティ
│   │   │   ├── constants.ts    # 定数
│   │   └── ...                 # その他のルーティング
│   ├── middleware              # 認証・依存注入ミドルウェア
│   ├── lib                     # DB/Auth/Redis/S3 クライアント
│   ├── schemas                 # 共有スキーマ
│   ├── types                   # 共有型
│   ├── utils                   # 共有ユーティリティ
│   └── constants               # 共有定数
├── scripts/
│   └── gen-openapi.ts          # OpenAPI 生成
├── test/                       # route/service/repository/middleware テスト
├── drizzle/                    # migration ファイル
├── wrangler.jsonc              # Workers 設定
└── vitest.config.ts
```

## 開発環境セットアップ

### 前提

- Node.js / pnpm
- Cloudflare アカウント（`wrangler login` 済み）
- PostgreSQL（ローカルまたはリモート）
- Upstash Redis
- Google Cloud（Vertex AI）API キー

### 1. 依存関係インストール

```bash
pnpm install
```

### 2. Hyperdrive バインディング設定

`apps/api/wrangler.jsonc` の `hyperdrive` を環境に合わせて更新します。

```json
{
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "<your-hyperdrive-id>",
      "localConnectionString": "postgres://user:password@localhost:5432/db"
    }
  ]
}
```

### 3. 環境変数ファイル作成

`drizzle-kit` 用の `apps/api/.env`:

```dotenv
DATABASE_URL=postgresql://user:password@127.0.0.1:5432/db
```

Wrangler ローカル実行用の `apps/api/.dev.vars`:

```dotenv
CORS_ORIGIN=http://localhost:3000
REDIS_URL=https://<upstash-endpoint>
REDIS_TOKEN=your-redis-token
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://127.0.0.1:8787
TRUSTED_ORIGIN=exp://
GCP_API_KEY=your-gcp-api-key
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=global
LLM_MODEL_ID=gemini-2.5-flash-lite
EXPO_PUSH_SEND_URL=https://exp.host/--/api/v2/push/send
EXPO_PUSH_RECEIPTS_URL=https://exp.host/--/api/v2/push/getReceipts
```

補足: Wrangler のローカル環境変数は `.dev.vars` と `.env` を同時には読み込みません。このプロジェクトでは Worker 用は `.dev.vars`、`drizzle-kit` 用は `.env` を使い分けます。
機密情報を含むファイルは Git にコミットしないでください。

`CORS_ORIGIN` には Web アプリの origin だけを設定します。ローカル開発では `http://localhost:3000`、本番では Web アプリの本番 origin を指定してください。

GitHub Actions からデプロイする場合は、Production environment の Secrets に同じ名前で登録してください。`deploy-api.yml` が `cloudflare/wrangler-action` 経由で Worker secrets として反映します。

手元から直接デプロイする場合は、Wrangler でシークレットとして投入します。

```bash
pnpm -F api exec wrangler secret put CORS_ORIGIN
pnpm -F api exec wrangler secret put REDIS_URL
pnpm -F api exec wrangler secret put REDIS_TOKEN
pnpm -F api exec wrangler secret put BETTER_AUTH_SECRET
pnpm -F api exec wrangler secret put BETTER_AUTH_URL
pnpm -F api exec wrangler secret put TRUSTED_ORIGIN
pnpm -F api exec wrangler secret put GCP_API_KEY
pnpm -F api exec wrangler secret put GCP_PROJECT_ID
pnpm -F api exec wrangler secret put GCP_LOCATION
pnpm -F api exec wrangler secret put LLM_MODEL_ID
pnpm -F api exec wrangler secret put EXPO_PUSH_SEND_URL
pnpm -F api exec wrangler secret put EXPO_PUSH_RECEIPTS_URL
```

### 4. マイグレーション適用

```bash
pnpm -F api db:migrate
```

### 5. 開発サーバー起動

```bash
pnpm -F api dev
```

## スクリプト一覧

`apps/api/package.json`:

- `pnpm -F api dev`: Workers ローカル実行
- `pnpm -F api test`: テスト実行
- `pnpm -F api test:coverage`: カバレッジ付きテスト
- `pnpm -F api deploy`: デプロイ
- `pnpm -F api cf-typegen`: `worker-configuration.d.ts` 生成
- `pnpm -F api gen-openapi`: OpenAPI 生成（`openapi.json` を更新）
- `pnpm -F api db:generate`: migration 生成
- `pnpm -F api db:migrate`: migration 適用
- `pnpm -F api db:studio`: Drizzle Studio 起動

リポジトリルート（品質管理）:

- `pnpm check`: Ultracite/Biome による静的チェック
- `pnpm fix`: Ultracite/Biome による自動修正・整形

## テスト方針

- テスト対象: `route` / `service` / `repository` / `middleware`
- 実行: `pnpm -F api test`
- カバレッジ: `pnpm -F api test:coverage`
- 閾値（`vitest.config.ts`）:
  - statements: 80
  - branches: 80
  - functions: 80
  - lines: 80

## OpenAPI 運用

OpenAPI はコードから生成します。

```bash
pnpm -F api gen-openapi
```

生成先:

- `openapi.json`（リポジトリルート）

仕様変更時は、ルートの `describeRoute` と Zod スキーマを更新した上で再生成してください。

## 新規ドメイン追加の基本手順

1. `src/routes/<new-domain>/schemas.ts` で入出力スキーマを定義  
2. `repository.ts` でデータアクセスを実装  
3. `service.ts` でユースケースを実装  
4. `route.ts` でミドルウェア・バリデーション・レスポンスを接続  
5. `src/routes/route.ts` に `app.route(...)` を追加  
6. `test/routes/<new-domain>/*.test.ts` を追加  
7. `pnpm -F api gen-openapi` で仕様更新
