# apps/mobile

Focory のモバイルアプリ本体です。React Native + Expo (SDK 54) + Expo Router で構築しています。

[App Store](https://apps.apple.com/jp/app/focory-aiが声がけする集中タイマー/id6767747914) / [Google Play](https://play.google.com/store/apps/details?id=com.focory.app) で配信中です。

## アーキテクチャ概要

### 1. ルーティング（Expo Router）

画面ルートは `src/app` 配下のファイルベースルーティングで定義します。

- `_layout.tsx`: ナビゲーション・Provider 合成・認証境界・初期化コード
- `index.tsx` / `[id].tsx`: 画面合成（取得 / 整形 / 表示の組み立て）
- `+not-found.tsx`: 未定義ルートのフォールバック
- `_<category>/`: そのルート専用の `_components` / `_hooks` / `_utils` など（外部 import 禁止）

設計の詳細は [`AGENTS.md`](./AGENTS.md) を参照してください。

### 2. レイヤー分離

```text
src/
├── app/                  # 画面ルート（Expo Router）
├── components/           # アプリ全体共通の UI（ui / layout / elements）
├── hooks/                # 共通カスタムフック
├── contexts/             # アプリ全体共通 Provider
├── constants/            # 共通定数
├── types/                # 共通型
├── utils/                # 純粋ユーティリティ
├── services/             # ドメインサービス
└── lib/                  # 外部依存接続点
    ├── api/              # OpenAPI 型 + openapi-fetch / openapi-react-query
    ├── auth/             # Better Auth (Expo)
    ├── db/               # Drizzle ORM + expo-sqlite（ローカル DB）
    └── notifications/    # Expo Notifications
```

依存方向は「`app` → 共通層 → `lib`」で固定し、`lib` は他層に依存しません。

### 3. 主要ライブラリ

- **UI**: NativeWind (Tailwind for RN) / `@rn-primitives/*` / `lucide-react-native` / `sonner-native`
- **状態 / データ取得**: TanStack Query + openapi-react-query
- **認証**: Better Auth (Expo) + expo-secure-store
- **ローカル DB**: Drizzle ORM + expo-sqlite
- **通知**: expo-notifications（離脱検知時の push 送信）
- **アニメーション / ジェスチャ**: react-native-reanimated / react-native-gesture-handler

## 開発環境セットアップ

### 前提

- Node.js / pnpm
- Xcode（iOS 開発時）/ Android Studio（Android 開発時）
- API サーバーがローカル起動済み（[apps/api](../api/) を参照）

### 1. 依存関係インストール

リポジトリルートで:

```bash
pnpm install
```

### 2. 環境変数

`apps/mobile/.env` または Expo の `app.json` の `extra` で API エンドポイント等を設定します。`.env` は Git にコミットしないでください。

### 3. 開発サーバー起動

```bash
pnpm -F mobile dev
```

iOS / Android のネイティブビルドが必要な場合:

```bash
pnpm -F mobile ios
pnpm -F mobile android
```

## スクリプト一覧

`apps/mobile/package.json`:

- `pnpm -F mobile dev`: Expo dev server 起動
- `pnpm -F mobile ios`: iOS ネイティブビルド + 実行
- `pnpm -F mobile android`: Android ネイティブビルド + 実行
- `pnpm -F mobile build:ios` / `build:android`: Expo Export
- `pnpm -F mobile typecheck`: TypeScript 型チェック
- `pnpm -F mobile doctor`: `expo-doctor` による診断
- `pnpm -F mobile check:deps`: Expo 互換バージョン確認
- `pnpm -F mobile db:generate`: ローカル DB マイグレーション生成
- `pnpm -F mobile api-typegen`: ルートの `openapi.json` から API 型を再生成

リポジトリルート（品質管理）:

- `pnpm check`: Ultracite/Biome による静的チェック
- `pnpm fix`: Ultracite/Biome による自動修正・整形

## ビルド・配信

EAS（Expo Application Services）を使ってビルド・配信します。設定は [`eas.json`](./eas.json) を参照してください。

```bash
# プロファイル指定でビルド
pnpm -F mobile exec eas build --profile production --platform ios
pnpm -F mobile exec eas build --profile production --platform android

# ストア提出
pnpm -F mobile exec eas submit --platform ios
pnpm -F mobile exec eas submit --platform android
```

## OpenAPI 型同期

API のスキーマが変わった場合は、ルートで `pnpm gen-openapi` を実行した上で、本パッケージの型を再生成してください。

```bash
pnpm gen-openapi
pnpm -F mobile api-typegen
```

生成先: `apps/mobile/src/lib/api/paths.ts`
