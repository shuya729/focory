<p align="center">
  <img src="./assets/logo.svg" alt="Focory" width="320" />
</p>

<h1 align="center">Focory</h1>

<p align="center">
  <strong>スマホを置いて、いまやることへ。</strong><br />
  AI があなただけの言葉で集中を後押しする、ひとり集中のための学習タイマー。
</p>

<p align="center">
  <a href="https://apps.apple.com/jp/app/focory-aiが声がけする集中タイマー/id6767747914">
    <img alt="Download on the App Store" src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" height="48" />
  </a>
  &nbsp;
  <a href="https://play.google.com/store/apps/details?id=com.focory.app">
    <img alt="Get it on Google Play" src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" height="48" />
  </a>
</p>

---

## Focory とは

**Focory（フォコリー）** は、AI があなただけの言葉で声をかけてくれる、ひとり集中のための学習タイマーです。「あと5分だけ」をなくし、勉強・作業・読書へまっすぐ向かう習慣を後押しします。

タイマーをスタートしたあとにスマホを触ったり、アプリから離脱したりすると、AI が即座に検知。あらかじめ登録した「目的」「なぜ」と、選んだ AI の性格に合わせた“あなた専用のメッセージ”を通知でお届けし、自然と集中へ引き戻します。

### こんな人におすすめ

- スマホを触らずに勉強・作業に集中したい
- ポモドーロタイマーを習慣化したい受験生・学生・社会人
- 在宅ワーク、資格勉強、読書、執筆、プログラミング学習に集中したい
- ひとりだとサボってしまうけれど、勉強時間を共有するのは少し恥ずかしい

### スクリーンショット

<p align="center">
  <img src="./assets/screenshots/app-store/AppStore%20SS%201%20-%20Intro.png" alt="イントロ画面" width="22%" />
  <img src="./assets/screenshots/app-store/AppStore%20SS%202%20-%20Timer.png" alt="タイマー画面" width="22%" />
  <img src="./assets/screenshots/app-store/AppStore%20SS%203%20-%20Log.png" alt="学習ログ画面" width="22%" />
  <img src="./assets/screenshots/app-store/AppStore%20SS%204%20-%20Settings.png" alt="設定画面" width="22%" />
</p>

<p align="center">
  <sub>左から: イントロ / 集中タイマー / 過去の記録 / 設定</sub>
</p>

### 主な機能

- **⏱ シンプルな集中タイマー**: 余計な設定は不要。スタートを押すだけで、すぐに集中モードへ。
- **🤖 AI のひと言で集中へ引き戻す**: アプリから離れた瞬間を検知し、テンプレではない“あなた専用のメッセージ”を通知でお届け。
- **🎭 6 種類から選べる AI の性格**: `やさしい` / `厳しい` / `明るい` / `落ち着き` / `おもしろい` / `クール` から、その日の気分に合わせて切り替え。
- **📅 ヒートマップで継続を可視化**: 日々の集中時間をカレンダーで色濃く積み上げ、続ける自信に変える。
- **🎯 目的と「なぜ」を AI が学習**: 志望校合格・資格取得・副業など、あなたの想いを踏まえた言葉で背中を押します。

### ダウンロード / 公式サイト

- 公式サイト: <https://focory.com/>
- App Store: <https://apps.apple.com/jp/app/focory-aiが声がけする集中タイマー/id6767747914>
- Google Play: <https://play.google.com/store/apps/details?id=com.focory.app>

---

## アーキテクチャと技術スタック

Focory は pnpm workspaces によるモノレポ構成で、モバイルアプリ・Web ランディング・API バックエンドを 1 リポジトリで管理しています。モバイル ⇄ API の型は OpenAPI 経由で共有しています。

### モバイル（[apps/mobile](apps/mobile/)）
- **React Native** + **Expo (SDK 54)** / **Expo Router**
- **NativeWind** (Tailwind CSS for React Native)
- **TanStack Query** + **openapi-react-query**
- **Better Auth (Expo)** による認証
- **Drizzle ORM** + **expo-sqlite**（ローカル DB）
- **Expo Notifications**（離脱時のプッシュ通知）

### Web ランディング（[apps/web](apps/web/)）
- **Next.js 16** (App Router) / **React 19**
- **Tailwind CSS v4** + **shadcn/ui** (Radix UI / Base UI)
- **OpenNext for Cloudflare** によるエッジデプロイ
- **TanStack Query** + **openapi-react-query**

### バックエンド（[apps/api](apps/api/)）
- **Hono** + **hono-openapi**
- **Cloudflare Workers** (`wrangler`)
- **Drizzle ORM** + **Postgres**（Hyperdrive 経由）
- **Better Auth** + **@better-auth/drizzle-adapter**
- **Upstash Redis**（レート制限・キャッシュ）
- **Zod** によるスキーマバリデーション
- **Vertex AI / Gemini** による AI メッセージ生成
- **Expo Push Notifications** 連携

### 共通基盤
- **TypeScript** / **pnpm workspaces**
- **Biome / Ultracite** による Lint & Format
- **OpenAPI** 経由でモバイル・Web ⇄ API の型共有

### プロジェクト構成

```
focory/
├── apps/
│   ├── mobile/     # React Native + Expo アプリ
│   ├── web/        # Next.js ランディングサイト
│   └── api/        # Hono + Cloudflare Workers API
├── assets/         # ロゴ・スクリーンショット
├── design/         # .pen デザインファイル
├── compose.yaml    # ローカル開発用インフラ（Postgres / Redis）
├── biome.jsonc     # Biome / Ultracite 設定
├── openapi.json    # API スキーマ（自動生成）
└── package.json    # pnpm workspace ルート
```

各アプリの詳細なアーキテクチャは、各 README を参照してください。

- [apps/mobile/README.md](apps/mobile/README.md)
- [apps/web/README.md](apps/web/README.md)
- [apps/api/README.md](apps/api/README.md)

---

## 開発を始める

### 必要要件
- Node.js (推奨: LTS)
- pnpm `10.26.2` 以上
- iOS / Android 実機または Simulator（モバイル開発時）
- Cloudflare アカウント（API / Web デプロイ時）

### インストール

```bash
pnpm install
```

### ローカルインフラ起動（Docker Compose）

API のローカル開発には PostgreSQL と Upstash 互換 Redis が必要です。これらはリポジトリルートの [`compose.yaml`](./compose.yaml) でまとめて起動できます。

```bash
docker compose up -d
```

起動するサービス:

- `db`: PostgreSQL 18（`localhost:5432` / user: `user` / password: `password` / db: `db`）
- `redis`: Redis 8.4（`localhost:6379`）
- `serverless-redis-http`: Upstash Redis 互換 HTTP プロキシ（`http://localhost:8079` / token: `password`）

停止する場合:

```bash
docker compose down
```

### 開発サーバー起動

全ワークスペースを並列で起動:

```bash
pnpm dev
```

個別に起動する場合:

```bash
# モバイル
pnpm -F mobile dev

# Web
pnpm -F web dev

# API
pnpm -F api dev
```

### コード品質

```bash
# チェック
pnpm check

# 自動修正
pnpm fix

# 型チェック（全ワークスペース）
pnpm typecheck
```

### DB マイグレーション（API）

```bash
pnpm db:generate   # マイグレーションファイル生成
pnpm db:migrate    # マイグレーション実行
pnpm db:studio     # Drizzle Studio 起動
```

### OpenAPI 型生成

API のスキーマを更新したら、各クライアントの型定義を再生成します。

```bash
pnpm gen-openapi                       # openapi.json を生成
pnpm -F mobile api-typegen             # モバイルの型定義を更新
pnpm -F web api-typegen                # Web の型定義を更新
```
