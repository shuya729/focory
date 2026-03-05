# バックエンド開発パターン

スケーラブルなサーバーサイドアプリケーションのためのバックエンドアーキテクチャパターンとベストプラクティス。

## 規格化ルール

### ディレクトリ・ファイル契約

`src/routes/<domain>` は次の責務分離を必須とする。

- `route.ts`: ルーティング定義、ミドルウェア合成、HTTP 入出力
- `service.ts`: ユースケース実装、アプリケーションルール
- `repository.ts`: Drizzle による永続化アクセス
- `schemas.ts`: Zod スキーマ、`z.infer` 型

必要に応じて `types.ts` / `utils.ts` / `constants.ts` を同ディレクトリへ追加
複数ドメインで再利用が確定した時だけ `src/types` / `src/utils` / `src/constants` へ昇格

### 依存方向 `route -> service -> repository`

- `route.ts` から `repository.ts` を直接呼ばない
- `repository.ts` に認証・認可・HTTP レスポンス整形を入れない
- `service.ts` に `c.req` / `c.env` / `c.get(...)` の Hono Context 依存を入れない

依存を一方向に固定することで、機能追加時の影響範囲とテスト対象を局所化

### route.ts

- `describeRoute(...)` で OpenAPI 仕様を定義
- `validator("param" | "query" | "json", schema)` で入力検証
- `requireAuth` / `optionalAuth` / `requireUser` / `optionalUser` を宣言的に合成
- ハンドラー内は「依存取得 -> `c.req.valid(...)` -> service 呼び出し -> `c.json(...)`」の最短経路

### service.ts

- HTTP ステータスの判断（`404`, `409` など）は service で `HTTPException` を投げて明示する
- service はビジネスルールとレスポンス DTO 整形に集中する
- 1 メソッド 1 ユースケースを原則にし、ルート固有の分岐を持ち込まない

### repository.ts

- DB アクセス以外の責務を持たせない
- `select` では必要列を明示し、`select()` の無制限取得を避ける
- DB 例外は `try-catch` で `HTTPException(500, { message: "Internal server error", cause })` へ統一変換する
- 返却型は `Promise<T | undefined>` などで「見つからない可能性」を明示する

### スキーマ駆動とレスポンス形を統一する

- 入出力は `schemas.ts` で定義し、実装側は `z.infer` 型を利用する
- 成功レスポンスは `{ data: ... }` を基本とし、一覧系は `{ meta: { limit, total, nextCursor } }` を併設する
- 失敗レスポンスは `errorResponseSchema` に合わせる

### OpenAPI と実装を同時更新する

仕様変更時は `describeRoute` / Zod スキーマを更新した上で `pnpm -F api gen-openapi` を実行

### テストの最低ライン

新規ドメイン追加時は、最低でも以下を追加

- `test/routes/<domain>/route.test.ts`
- `test/routes/<domain>/service.test.ts`
- `test/routes/<domain>/repository.test.ts`
- `test/routes/<domain>/schemas.test.ts`

ミドルウェア追加・変更時は `test/middleware/*.test.ts` を必ず追加し、`test/helpers` の既存テストヘルパーを優先利用

### 変更完了前の実行コマンド

- `pnpm -F api test`
- `pnpm -F api gen-openapi`（API 仕様変更時）
- `pnpm check`（必要に応じて `pnpm fix`）

## API設計パターン

### RESTful API構造

```typescript
// ✅ リソースベースのURL
GET    /api/markets                 # リソースのリスト
GET    /api/markets/:id             # 単一リソースの取得
POST   /api/markets                 # リソースの作成
PUT    /api/markets/:id             # リソースの置換
PATCH  /api/markets/:id             # リソースの更新
DELETE /api/markets/:id             # リソースの削除

// ✅ フィルタリング、ソート、ページネーション用のクエリパラメータ
GET /api/markets?status=active&sort=volume&limit=20&offset=0
```

### リポジトリパターン

```typescript
// データアクセスロジックの抽象化
interface MarketRepositoryInterface {
  findAll(filters?: MarketFilters): Promise<Market[]>
  findById(id: string): Promise<Market | null>
  create(data: CreateMarketDto): Promise<Market>
  update(id: string, data: UpdateMarketDto): Promise<Market>
  delete(id: string): Promise<void>
}

class MarketRepository implements MarketRepositoryInterface {
  db: PostgresJsDatabase;
  constructor(db: PostgresJsDatabase) {
    this.db = db;
  }

  async findAll(filters?: MarketFilters): Promise<Market[]> {
    const where = filters?.status ? eq(markets.status, filters.status) : undefined

    const rows = await this.db
      .select()
      .from(markets)
      .where(where)
      .orderBy(asc(markets.id))
      .limit(filters?.limit ?? 20)

    return rows
  }

  // その他のメソッド...
}
```

### サービスレイヤーパターン

```typescript
// ビジネスロジックをデータアクセスから分離
class MarketService {
  marketRepo: MarketRepository;
  constructor(db: PostgresJsDatabase) {
    this.marketRepo = new MarketRepository(db);
  }

  async searchMarkets(query: string, limit: number = 10): Promise<Market[]> {
    // ビジネスロジック
    const embedding = await generateEmbedding(query)
    const results = await this.vectorSearch(embedding, limit)

    // 完全なデータを取得
    const markets = await this.marketRepo.findByIds(results.map(r => r.id))

    // 類似度でソート
    return markets.sort((a, b) => {
      const scoreA = results.find(r => r.id === a.id)?.score || 0
      const scoreB = results.find(r => r.id === b.id)?.score || 0
      return scoreA - scoreB
    })
  }

  private async vectorSearch(embedding: number[], limit: number) {
    // ベクトル検索の実装
  }
}
```

## ミドルウェアパターン

### リクエストスコープ依存注入

```typescript
interface ClientsVariables {
  dc: PostgresJsDatabase;
  sc: S3;
  rc: Redis;
  ac: ClerkClient;
}

const withClients = createMiddleware<{
  Bindings: CloudflareBindings;
  Variables: ClientsVariables;
}>(async (c, next) => {
  // ✅ 各リクエストで必要なクライアントを初期化してContextへ集約
  c.set("dc", getDb(c.env));
  c.set("sc", getS3(c.env));
  c.set("rc", getRedis(c.env));
  c.set("ac", getAuth(c.env));
  await next();
});

// 使用方法
const app = new Hono<{ Variables: ClientsVariables }>();
app.use(withClients);
```

### 認証ガードミドルウェア

```typescript
interface RequireAuthVariables extends ClientsVariables {
  authId: string;
}

const requireAuth = createMiddleware<{
  Variables: RequireAuthVariables;
}>(async (c, next) => {
  const state = await c.get("ac").authenticateRequest(c.req.raw);

  // ✅ 失敗時は早期returnではなくHTTPExceptionで統一
  if (!state.isAuthenticated) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  c.set("authId", state.toAuth().userId);
  await next();
});
```

### ミドルウェアチェーン（認証 + バリデーション）

```typescript
// ❌ 悪い: ハンドラー内に認証・検証ロジックが分散
app.put("/me", async (c) => {
  // 認証判定
  // JSONバリデーション
  // 本来のユースケース実行
});

// ✅ 良い: ルート宣言でミドルウェアを合成し、責務を分離
app.put(
  "/me",
  requireAuth,
  zValidator("json", putMeJsonSchema),
  async (c) => {
    const authId = c.get("authId");
    const input = c.req.valid("json");
    const result = await service.putMe(authId, input);
    return c.json(result);
  }
);
```

## データベースパターン

### クエリ最適化

```typescript
// ✅ 良い: 必要な列のみを選択
const rows = await db
  .select({
    id: markets.id,
    name: markets.name,
    status: markets.status,
    volume: markets.volume,
  })
  .from(markets)
  .where(eq(markets.status, "active"))
  .orderBy(desc(markets.volume))
  .limit(10)

// ❌ 悪い: すべてを選択（列数が多いほど転送量・デコードコストが増える）
const rowsAll = await db.select().from(markets)
```

### N+1クエリ防止

```typescript
// ❌ 悪い: N+1クエリ問題
const markets = await getMarkets()
for (const market of markets) {
  market.creator = await getUser(market.creator_id)  // Nクエリ
}

// ✅ 良い: バッチフェッチ
const markets = await getMarkets()
const creatorIds = markets.map(m => m.creator_id)
const creators = await getUsers(creatorIds)  // 1クエリ
const creatorMap = new Map(creators.map(c => [c.id, c]))

markets.forEach(market => {
  market.creator = creatorMap.get(market.creator_id)
})
```

### トランザクションパターン

```typescript
async function createMarketWithPosition(
  db: PostgresJsDatabase,
  marketData: CreateMarketDto,
  positionData: CreatePositionDto
) {
  return await db.transaction(async (tx) => {
    const createdMarkets = await tx.insert(markets).values(marketData).returning()
    const market = createdMarkets[0]!

    const createdPositions = await tx
      .insert(positions)
      .values({ ...positionData, marketId: market.id })
      .returning()

    return { market, position: createdPositions[0]! }
  })
}
```

## キャッシング戦略

### Redisキャッシングレイヤー

```typescript
class CachedMarketRepository implements MarketRepository {
  baseRepo: MarketRepository;
  redis: Redis;
  constructor(
    db: PostgresJsDatabase,
    redis: Redis
  ) {
    this.baseRepo = new MarketRepository(db);
    this.redis = redis;
  }

  async findById(id: string): Promise<Market | undefined> {
    const cacheKey = `market:${id}`

    // キャッシュを試す
    const cached = await this.redis.get<Market>(cacheKey)
    if (cached) {
      return cached
    }

    // キャッシュミス - DBから取得
    const market = await this.baseRepo.findById(id);

    if (market) {
      // 5分間キャッシュ
      await this.redis.set(cacheKey, market, { ex: 300 });
    }

    return market
  }

  async invalidateCache(id: string): Promise<void> {
    await this.redis.del(`market:${id}`)
  }
}
```

### Cache-Asideパターン

```typescript
async function getMarketWithCache(
  redis: Redis,
  db: PostgresJsDatabase,
  id: string
): Promise<Market> {
  const cacheKey = `market:${id}`

  // キャッシュを試す
  const cached = await redis.get<Market>(cacheKey)
  if (cached) {
    return cached
  }

  // キャッシュミス - DBから取得（Drizzle）
  const rows = await db.select().from(markets).where(eq(markets.id, id)).limit(1)
  const market = rows[0]

  if (!market) throw new Error('Market not found')

  // キャッシュを更新
  await redis.set(cacheKey, market, { ex: 300 })

  return market
}
```

## エラーハンドリングパターン

### 集中エラーハンドラー

```typescript
app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json(
      { error: error.message },
      { status: error.status }
    )
  }

  // 予期しないエラーをログに記録
  console.error(error)

  return c.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
})
```

### 指数バックオフによるリトライ

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | undefined

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (i < maxRetries - 1) {
        // 指数バックオフ: 1秒、2秒、4秒
        const delay = Math.pow(2, i) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

// 使用方法
const data = await fetchWithRetry(() => fetchFromAPI())
```

## レート制限

### シンプルなインメモリレートリミッター

```typescript
class RateLimiter {
  requests: Map<string, number[]>;
  constructor() {
    this.requests = new Map<string, number[]>();
  }

  async checkLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): Promise<boolean> {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []

    // ウィンドウ外の古いリクエストを削除
    const recentRequests = requests.filter(time => now - time < windowMs)

    if (recentRequests.length >= maxRequests) {
      return false  // レート制限超過
    }

    // 現在のリクエストを追加
    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)

    return true
  }
}

const limiter = new RateLimiter()

app.get("/api/markets", async (c) => {
  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for") ??
    "unknown"

  const allowed = await limiter.checkLimit(ip, 100, 60_000)

  if (!allowed) {
    return c.json({ error: "Rate limit exceeded" }, 429)
  }

  // リクエストを続行
})
```

## テストパターン

### テストで書くべきタイプ

#### ユニットテスト（必須）

純粋関数/小さなユーティリティを分離してテスト。

```typescript
import { describe, it, expect } from "vitest"
import { calculateSimilarity } from "./utils"

describe("calculateSimilarity", () => {
  it("returns 1.0 for identical embeddings", () => {
    const embedding = [0.1, 0.2, 0.3]
    expect(calculateSimilarity(embedding, embedding)).toBe(1.0)
  })

  it("returns 0.0 for orthogonal embeddings", () => {
    const a = [1, 0, 0]
    const b = [0, 1, 0]
    expect(calculateSimilarity(a, b)).toBe(0.0)
  })
})
```

## 外部依存関係のモック

### 依存注入

```typescript
import { Hono } from "hono"
import { createMiddleware } from "hono/factory"

export function createApp(deps: {
  dc: PostgresJsDatabase
  sc: S3
  rc: Redis
  ac: ClerkClient
}) {
  const app = new Hono<{ Variables: ClientsVariables }>()

  const withTestClients = createMiddleware(async (c, next) => {
    c.set("dc", deps.dc)
    c.set("sc", deps.sc)
    c.set("rc", deps.rc)
    c.set("ac", deps.ac)
    await next()
  })

  app.use(withTestClients)

  // app.route(...) ...
  return app
}
```

```typescript
import { describe, it, expect } from "vitest"
import { createApp } from "../src/app-factory"

describe("GET /api/markets/:id", () => {
  it("returns 404 when not found", async () => {
    const app = createApp({
      dc: fakeDb({ findById: async () => null }),
      sc: fakeS3(),
      rc: fakeRedis(),
      ac: fakeAuth(),
    })

    const res = await app.request("/api/markets/does-not-exist")
    expect(res.status).toBe(404)
  })
})
```

### Redis をモック

```typescript
import { vi } from "vitest"

vi.mock("../src/lib/redis", () => {
  return {
    getRedis: () => ({
      get: vi.fn(async () => null),
      set: vi.fn(async () => "OK"),
      del: vi.fn(async () => 1),
      searchMarketsByVector: vi.fn(async () => [
        { id: "test-1", score: 0.95 },
        { id: "test-2", score: 0.9 },
      ]),
    }),
  }
})
```

### Drizzle をモック

```typescript
import { vi } from "vitest"

type DbStub = Pick<PostgresJsDatabase, "select" | "insert" | "update" | "delete" | "transaction">

export function fakeDb(impl: Partial<DbStub> = {}): PostgresJsDatabase {
  return {
    select: impl.select ?? vi.fn(() => ({ from: vi.fn() })),
    insert: impl.insert ?? vi.fn(),
    update: impl.update ?? vi.fn(),
    delete: impl.delete ?? vi.fn(),
    transaction: impl.transaction ?? vi.fn(async (fn: () => Promise<void>) => fn()),
  } as PostgresJsDatabase
}
```

## テストすべきエッジケース

1. **Null/Undefined**: 入力が null の場合は?
2. **空**: 配列/文字列が空の場合は?
3. **無効な型**: 間違った型が渡された場合は?
4. **境界**: 最小/最大値
5. **エラー**: ネットワーク障害、データベースエラー
6. **競合状態**: 並行操作
7. **大規模データ**: 10k以上のアイテムでのパフォーマンス
8. **特殊文字**: Unicode、絵文字、SQL文字

## テスト品質チェックリスト

* [ ] すべての公開関数にユニットテストがある
* [ ] エッジケースがカバーされている（null、空、無効）
* [ ] エラーパスがテストされている（ハッピーパスだけでない）
* [ ] 外部依存関係にモック/DIが使用されている
* [ ] テストが独立している（共有状態なし）
* [ ] テスト名がテストする内容を説明している
* [ ] アサーションが具体的で意味がある
* [ ] カバレッジが80%以上（Istanbul + thresholds）

## テストの悪臭（アンチパターン）

### ❌ 実装の詳細をテスト

```typescript
// 内部状態をテストしない（例）
expect((service as any).internalCache.size).toBe(5)
```

### ✅ ユーザーに見える動作をテスト

```typescript
// ユーザーが見るものをテストする（HTTPレスポンス等）
const res = await app.request("/api/markets/123")
expect(res.status).toBe(200)
expect(await res.json()).toEqual({ id: "123", name: "..." })
```

### ❌ テストが互いに依存

```typescript
test("creates user", () => { /* ... */ })
test("updates same user", () => { /* 前のテストが必要 */ })
```

### ✅ 独立したテスト

```typescript
// 各テストでセットアップ
test("updates user", async () => {
  const user = await createTestUser()
  // テストロジック
})
```

## 実行コマンド

```bash
# テスト
pnpm -F api test

# カバレッジ
pnpm -F api test:coverage
```
