# apps/web

Focory の Web ランディングサイトです。Next.js 16 (App Router) + React 19 + Tailwind CSS v4 で構築し、Cloudflare Workers に OpenNext でデプロイしています。

公開先: <https://focory.app>（[App Store](https://apps.apple.com/jp/app/focory-aiが声がけする集中タイマー/id6767747914) / [Google Play](https://play.google.com/store/apps/details?id=com.focory.app) への導線を提供）

## アーキテクチャ概要

### 1. ルーティング（Next.js App Router）

```text
src/app/
├── layout.tsx          # 全ページ共通レイアウト
├── page.tsx            # ランディングページ
├── _components/        # ランディングページ専用 UI
├── contact/            # お問い合わせ
├── term/               # 利用規約
└── privacy/            # プライバシーポリシー
```

### 2. レイヤー分離

```text
src/
├── app/                # ページルート（App Router）
├── components/         # アプリ全体共通の UI
│   ├── ui/             # shadcn/ui ベースの primitive
│   ├── layout/         # ヘッダー / フッター等
│   └── elements/       # ストアバッジ等の固有要素
├── hooks/              # 共通カスタムフック
├── constants/          # サイト情報・コピー文言
├── services/           # ドメインサービス
├── types/              # 共通型
├── utils/              # 純粋ユーティリティ
└── lib/                # API クライアント等の外部依存接続点
```

依存方向は「`app` → 共通層 → `lib`」で固定。設計の詳細は [`AGENTS.md`](./AGENTS.md) を参照してください。

### 3. 主要ライブラリ

- **UI**: Tailwind CSS v4 / shadcn/ui / Radix UI / Base UI / `lucide-react`
- **状態 / データ取得**: TanStack Query + openapi-react-query
- **テーマ**: `next-themes`
- **コンテンツ**: `react-markdown`（利用規約・プライバシーポリシー）
- **デプロイ**: `@opennextjs/cloudflare`（Cloudflare Workers）

### 4. コピー / リンクの集約

サイト名・タグライン・ストアリンクなど、ランディングで使うテキストやリンクは [`src/constants/site.ts`](./src/constants/site.ts) と [`src/constants/landing.ts`](./src/constants/landing.ts) に集約しています。文言の更新はここを編集します。

## 開発環境セットアップ

### 1. 依存関係インストール

リポジトリルートで:

```bash
pnpm install
```

### 2. 開発サーバー起動

```bash
pnpm -F web dev
```

`http://localhost:3000` でアクセスできます。

### 3. 環境変数

API 連携が必要な場合は、`apps/web/.env.local` を作成して環境変数を設定します。`.env.local` は Git にコミットしないでください。

## スクリプト一覧

`apps/web/package.json`:

- `pnpm -F web dev`: Next.js dev server 起動
- `pnpm -F web build`: 本番ビルド
- `pnpm -F web start`: ビルド済みアプリの起動
- `pnpm -F web typecheck`: TypeScript 型チェック
- `pnpm -F web preview`: OpenNext によるローカルプレビュー（Workers 環境を再現）
- `pnpm -F web deploy`: OpenNext build + Cloudflare Workers へデプロイ
- `pnpm -F web upload`: OpenNext build + Workers へアップロード（プロモート前段）
- `pnpm -F web cf-typegen`: `worker-configuration.d.ts` 生成
- `pnpm -F web api-typegen`: ルートの `openapi.json` から API 型を再生成

リポジトリルート（品質管理）:

- `pnpm check`: Ultracite/Biome による静的チェック
- `pnpm fix`: Ultracite/Biome による自動修正・整形

## デプロイ

OpenNext を経由して Cloudflare Workers にデプロイします。

```bash
# ローカルで本番ビルドを Workers ランタイムで確認
pnpm -F web preview

# 本番デプロイ
pnpm -F web deploy
```

設定は [`wrangler.jsonc`](./wrangler.jsonc) と [`open-next.config.ts`](./open-next.config.ts) を参照してください。

## OpenAPI 型同期

API のスキーマが変わった場合は、ルートで `pnpm gen-openapi` を実行した上で、本パッケージの型を再生成してください。

```bash
pnpm gen-openapi
pnpm -F web api-typegen
```

生成先: `apps/web/src/lib/api/paths.ts`
