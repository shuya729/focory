# フロントエンド開発パターン（React Native + Expo）

React Native、Expo、Expo Router を用いて、保守性・再利用性・ネイティブ体験を両立するためのモダンなフロントエンドパターン。

## ディレクトリパターン

Expo Router では、画面ルートは `src/app` に置き、共通 UI や hooks などの非ナビゲーション部品は `src/app` の外へ出すのが基本です。`_layout.tsx` は各ディレクトリのナビゲーションレイアウトで、ルートの `_layout.tsx` は従来の `App.tsx` 相当の初期化ポイントです。`index.tsx` はその階層の既定画面になり、`(tabs)` のような route group、`[id].tsx` のような動的セグメント、`+not-found.tsx` などの特殊ファイルも使えます。なお、Expo Router のルートディレクトリ変更は可能ですが、公式には強く非推奨です。([Expo Documentation][3])

```text
apps/mobile
└─ src
   ├─ app
   │  ├─ _layout.tsx
   │  ├─ +not-found.tsx
   │  ├─ (tabs)/
   │  │  ├─ _layout.tsx
   │  │  ├─ index.tsx
   │  │  ├─ markets.tsx
   │  │  └─ settings.tsx
   │  ├─ auth/
   │  │  ├─ _layout.tsx
   │  │  ├─ sign-in.tsx
   │  │  └─ _components/
   │  ├─ markets/
   │  │  ├─ index.tsx
   │  │  ├─ [marketId].tsx
   │  │  ├─ _components/
   │  │  ├─ _hooks/
   │  │  ├─ _types/
   │  │  ├─ _contexts/
   │  │  ├─ _utils/
   │  │  ├─ _constants/
   │  │  └─ _schemas/
   │  └─ modal.tsx
   ├─ components
   │  ├─ ui/
   │  ├─ layout/
   │  └─ elements/
   ├─ hooks/
   ├─ types/
   ├─ contexts/
   ├─ utils/
   ├─ constants/
   ├─ schemas/
   └─ lib/
      ├─ api/
      ├─ auth/
      ├─ storage/
      ├─ notifications/
      └─ analytics/
```

### “コロケーション + 境界” を最優先にする

* `src/app/<route>/**` は **その画面・そのナビゲーショングループ専用** の実装置き場

  * `_<category>/` は **ルート専用品** とみなし、外部から import しない
* `src/{components,hooks,types,contexts,utils,constants,schemas}/**` は **アプリ全体の共通資産**
* `src/lib/**` は **外部依存との接続点**

  * API クライアント
  * 認証 SDK
  * Secure Store
  * Notifications
  * Analytics
  * Linking / deep link helper

> **意図**: 画面数が増えても、「どこに置くか」「誰が誰に依存してよいか」「何がルート専用か」が崩れないようにする。

### 依存方向（import の矢印）を固定する

依存は原則として次の方向のみ許可します。

* `app/<route>` → `components|hooks|types|contexts|utils|constants|schemas|lib`
* `components` → `components/elements|components/ui|types|utils|constants|lib`
* `hooks|contexts` → `types|utils|constants|schemas|lib`
* `schemas` → `types|constants|utils`
* `lib` → 他層へ原則依存しない
* `utils` → UI 層へ依存しない

**禁止例**

* `src/components/**` から `src/app/**/_components` を import
* `utils` が `components` や `app` を import
* `lib` が `react-native` の画面描画コンポーネントへ依存

## Expo Router の責務を薄く保つ

Expo Router のルール上、画面は `src/app` 配下のファイルで定義され、ルート `_layout.tsx` はトップレベルナビゲーションや初期化コードの置き場になります。認証が必要な導線は Protected Routes で制御でき、deep link で直接入ってきた場合にも保護が適用されます。さらに Typed Routes を有効にすると、`Link` の `href` やルート文字列に型が付きます。([Expo Documentation][1])

* `index.tsx` / `[id].tsx` / `settings.tsx` などの画面ファイルは **合成（composition）** を主目的にする
* ビジネスロジック・複雑な副作用・状態遷移は `_hooks` / `lib` / `_contexts` へ退避
* 画面ファイルに「取得・整形・表示・副作用・イベント処理」を全部詰め込まない
* `Link` / `router.push()` / `router.replace()` に渡すパスは極力型付きで扱う
* ルート保護は画面ごとの `if (!session)` 分岐より、レイアウト境界でまとめて扱う

## ファイル役割

### `index.tsx` / `[id].tsx`

* 役割: 画面構造を決める / 必要な hook を呼ぶ / 表示用 props を組み立てる
* ルール:

  * JSX 以外の処理が増えたら `_hooks` / `_utils` / `lib` に逃がす
  * 画面ファイルでは「何を表示するか」に集中し、「どう取得するか」は隠す

### `_layout.tsx`

* 役割: ナビゲーター定義、Provider 合成、認証境界、初期化コード
* ルール:

  * root `_layout.tsx` はフォント読み込み、splash 制御、グローバル Provider 合成の入口
  * 画面単位でしか使わない Provider はその配下の `_contexts` か、そのルートの `_layout.tsx` に閉じる
  * tabs / stack / modal などのナビゲーション責務をここへ集約する

### `+not-found.tsx`

* 役割: 存在しないルートへのフォールバック画面
* ルール:

  * エラーメッセージは簡潔に
  * ホームや既知の安全な画面へ戻れる導線を置く

### `_<category>/`

* `_components/`: その画面固有の UI
* `_hooks/`: その画面固有の状態・副作用
* `_types/`: その画面固有の型
* `_schemas/`: 入力検証、フォーム検証、DTO 整形
* `_utils/`: 純粋関数
* `_constants/`: 文言、閾値、キー名、表示定数
* `_contexts/`: そのルート専用の Context / Provider

---

## コンポーネントパターン

React Native の基本 UI は `View` / `Text` / `Image` / `Pressable` / `TextInput` などで組み立て、スタイルは `style` prop で与えます。`StyleSheet.create()` はネイティブ用 style に対する静的型チェックが実利です。([React Native][4])

### 継承よりコンポジション

```typescript
import { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface CardProps {
  children: ReactNode
  variant?: 'default' | 'outlined'
}

export function Card({ children, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.card, variant === 'outlined' && styles.cardOutlined]}>
      {children}
    </View>
  )
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <View style={styles.header}>{children}</View>
}

export function CardBody({ children }: { children: ReactNode }) {
  return <View style={styles.body}>{children}</View>
}

// Usage
<Card>
  <CardHeader>
    <Text style={styles.title}>Title</Text>
  </CardHeader>
  <CardBody>
    <Text>Content</Text>
  </CardBody>
</Card>

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
  },
  cardOutlined: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  header: {
    gap: 4,
  },
  body: {
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
})
```

### 複合コンポーネント

`Pressable` は touch input の基本部品として扱いやすく、`TouchableOpacity` より将来志向です。([React Native][5])

```typescript
import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

export function Tabs({
  children,
  defaultTab,
}: {
  children: ReactNode
  defaultTab: string
}) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const value = useMemo(() => ({ activeTab, setActiveTab }), [activeTab])

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}

export function TabList({ children }: { children: ReactNode }) {
  return <View style={styles.list}>{children}</View>
}

export function Tab({
  id,
  children,
}: {
  id: string
  children: ReactNode
}) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tab must be used within Tabs')

  const isActive = context.activeTab === id

  return (
    <Pressable
      onPress={() => context.setActiveTab(id)}
      style={[styles.tab, isActive && styles.activeTab]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>
        {children}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
  },
  activeTab: {
    backgroundColor: '#111',
  },
  tabText: {
    color: '#222',
  },
  activeTabText: {
    color: '#fff',
  },
})
```

### レンダープロップパターン

```typescript
import { ReactNode, useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

interface DataLoaderProps<T> {
  fetcher: () => Promise<T>
  children: (
    data: T | null,
    loading: boolean,
    error: Error | null
  ) => ReactNode
}

export function DataLoader<T>({ fetcher, children }: DataLoaderProps<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    fetcher()
      .then((result) => {
        if (mounted) setData(result)
      })
      .catch((err) => {
        if (mounted) setError(err as Error)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [fetcher])

  return <>{children(data, loading, error)}</>
}

// Usage
<DataLoader<Market[]> fetcher={fetchMarkets}>
  {(markets, loading, error) => {
    if (loading) return <ActivityIndicator />
    if (error) return <Text>{error.message}</Text>
    return <MarketList markets={markets ?? []} />
  }}
</DataLoader>
```

---

## カスタムフックパターン

### 状態管理フック

```typescript
import { useCallback, useState } from 'react'

export function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => {
    setValue((current) => !current)
  }, [])

  return [value, toggle]
}
```

### 非同期データ取得フック

```typescript
import { useCallback, useEffect, useState } from 'react'

interface UseQueryOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  enabled?: boolean
}

export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: UseQueryOptions<T>
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      setData(result)
      options?.onSuccess?.(result)
    } catch (err) {
      const nextError = err as Error
      setError(nextError)
      options?.onError?.(nextError)
    } finally {
      setLoading(false)
    }
  }, [fetcher, options])

  useEffect(() => {
    if (options?.enabled !== false) {
      void refetch()
    }
  }, [key, refetch, options?.enabled])

  return { data, error, loading, refetch }
}
```

### デバウンスフック

```typescript
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

### AppState フック（モバイル特有）

React Native では `AppState` で foreground / background の変化を監視できます。通知処理や復帰時の再取得、セッション更新の入口として使うのが自然です。([React Native][6])

```typescript
import { AppState, AppStateStatus } from 'react-native'
import { useEffect, useState } from 'react'

export function useAppState() {
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  )

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState)
    return () => subscription.remove()
  }, [])

  return appState
}
```

---

## 状態管理パターン

### Context + Reducer パターン

```typescript
import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useReducer,
} from 'react'

interface State {
  markets: Market[]
  selectedMarket: Market | null
  loading: boolean
}

type Action =
  | { type: 'SET_MARKETS'; payload: Market[] }
  | { type: 'SELECT_MARKET'; payload: Market | null }
  | { type: 'SET_LOADING'; payload: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MARKETS':
      return { ...state, markets: action.payload }
    case 'SELECT_MARKET':
      return { ...state, selectedMarket: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

const MarketContext = createContext<
  | {
      state: State
      dispatch: Dispatch<Action>
    }
  | undefined
>(undefined)

export function MarketProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    markets: [],
    selectedMarket: null,
    loading: false,
  })

  return (
    <MarketContext.Provider value={{ state, dispatch }}>
      {children}
    </MarketContext.Provider>
  )
}

export function useMarkets() {
  const context = useContext(MarketContext)
  if (!context) {
    throw new Error('useMarkets must be used within MarketProvider')
  }
  return context
}
```

---

## パフォーマンス最適化

React Native では、Web のコード分割よりも、**不要再レンダリングの削減・長いリストの仮想化・JS スレッド負荷の抑制**が先に効くことが多いです。`ScrollView` は子をまとめて描画するため大量件数には不向きで、一覧は `FlatList` / `SectionList` を優先します。固定高の行なら `getItemLayout`、依存値が外にあるなら `extraData`、安定した key には `keyExtractor` を使うのが基本です。([React Native][2])

### メモ化

```typescript
import React, { useCallback, useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

const sortedMarkets = useMemo(() => {
  return [...markets].sort((a, b) => b.volume - a.volume)
}, [markets])

const handleSearch = useCallback((query: string) => {
  setSearchQuery(query)
}, [])

interface MarketCardProps {
  market: Market
}

export const MarketCard = React.memo<MarketCardProps>(({ market }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{market.name}</Text>
      <Text style={styles.description}>{market.description}</Text>
    </View>
  )
})

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    marginTop: 6,
    color: '#666',
  },
})
```

### 長いリストの仮想化

```typescript
import { useCallback } from 'react'
import { FlatList, ListRenderItem, Text, View } from 'react-native'

const ITEM_HEIGHT = 88

export function MarketList({ markets }: { markets: Market[] }) {
  const renderItem = useCallback<ListRenderItem<Market>>(
    ({ item }) => <MarketCard market={item} />,
    []
  )

  return (
    <FlatList
      data={markets}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      initialNumToRender={10}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      ListEmptyComponent={<Text>No markets found.</Text>}
    />
  )
}
```

### セクション付きリスト

```typescript
import { SectionList, Text, View } from 'react-native'

interface MarketSection {
  title: string
  data: Market[]
}

export function GroupedMarketList({
  sections,
}: {
  sections: MarketSection[]
}) {
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 16 }}>
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => <MarketCard market={item} />}
    />
  )
}
```

---

## フォーム処理パターン

React Native には HTML の `<form>` や submit イベントがないため、`TextInput` と `Pressable` を組み合わせて自前で送信制御します。キーボードに隠れやすい画面では `KeyboardAvoidingView` を使い、Safe Area は `react-native-safe-area-context` の `SafeAreaView` を使うのが基本です。`TextInput` は `onChangeText`、`keyboardType`、`onSubmitEditing` などで入力体験を作ります。([React Native][7])

```typescript
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface FormData {
  name: string
  description: string
  endDate: string
}

interface FormErrors {
  name?: string
  description?: string
  endDate?: string
}

export function CreateMarketForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    endDate: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required'
    } else if (formData.name.length > 200) {
      nextErrors.name = 'Name must be under 200 characters'
    }

    if (!formData.description.trim()) {
      nextErrors.description = 'Description is required'
    }

    if (!formData.endDate.trim()) {
      nextErrors.endDate = 'End date is required'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await createMarket(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={formData.name}
            onChangeText={(name) =>
              setFormData((prev) => ({ ...prev, name }))
            }
            placeholder="Market name"
            style={styles.input}
            accessibilityLabel="Market name"
          />
          {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={formData.description}
            onChangeText={(description) =>
              setFormData((prev) => ({ ...prev, description }))
            }
            placeholder="Description"
            multiline
            style={[styles.input, styles.multiline]}
            accessibilityLabel="Market description"
          />
          {errors.description ? (
            <Text style={styles.error}>{errors.description}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>End date</Text>
          <TextInput
            value={formData.endDate}
            onChangeText={(endDate) =>
              setFormData((prev) => ({ ...prev, endDate }))
            }
            placeholder="YYYY-MM-DD"
            style={styles.input}
            accessibilityLabel="End date"
          />
          {errors.endDate ? (
            <Text style={styles.error}>{errors.endDate}</Text>
          ) : null}
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.pressed,
            isSubmitting && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Create Market'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  error: {
    color: '#c62828',
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#111',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
})
```

---

## エラーバウンダリパターン

Expo Router では、各 route から `ErrorBoundary` を export して、その画面単位のエラー UI を定義できます。Web のクラスベース ErrorBoundary を全体に 1 個置くより、**ルート境界ごとに局所化**した方が画面責務と相性が良いです。([Expo Documentation][8])

```typescript
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { type ErrorBoundaryProps } from 'expo-router'

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error.message}</Text>

      <Pressable
        onPress={retry}
        style={styles.button}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  message: {
    color: '#666',
  },
  button: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#111',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
})
```

---

## アニメーションパターン

React Native では `Animated` と `LayoutAnimation` が標準の選択肢です。特に `Animated` は declarative に時間変化を扱え、`LayoutAnimation` はレイアウト変更時のアニメーションに向いています。([React Native][9])

### フェードイン

```typescript
import { useEffect, useRef } from 'react'
import { Animated, Text } from 'react-native'

export function FadeInText({ children }: { children: string }) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }, [opacity])

  return (
    <Animated.Text style={{ opacity, fontSize: 16 }}>
      {children}
    </Animated.Text>
  )
}
```

### レイアウト変化のアニメーション

```typescript
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native'
import { useEffect, useState } from 'react'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export function ExpandableSection() {
  const [expanded, setExpanded] = useState(false)

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded((prev) => !prev)
  }

  return (
    <View>
      <Pressable onPress={toggle}>
        <Text>{expanded ? 'Hide details' : 'Show details'}</Text>
      </Pressable>

      {expanded ? (
        <View style={{ marginTop: 12 }}>
          <Text>More content...</Text>
        </View>
      ) : null}
    </View>
  )
}
```

---

## アクセシビリティパターン

React Native は iOS の VoiceOver、Android の TalkBack へ接続するためのアクセシビリティ API を提供しています。Web と違って DOM / ARIA の丸写しではなく、`accessibilityRole`、`accessibilityLabel`、`accessibilityHint`、`accessibilityState`、`accessibilityActions` をネイティブ部品に載せる意識が重要です。([React Native][10])

### ボタン・選択状態

```typescript
import { Pressable, Text } from 'react-native'

export function FavoriteButton({
  selected,
  onPress,
}: {
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Favorite market"
      accessibilityHint="Adds or removes this market from favorites"
      accessibilityState={{ selected }}
    >
      <Text>{selected ? '★ Favorited' : '☆ Favorite'}</Text>
    </Pressable>
  )
}
```

### アクセシビリティアクション

```typescript
import { Pressable, Text } from 'react-native'

export function SwipeLikeActions({
  onArchive,
  onDelete,
}: {
  onArchive: () => void
  onDelete: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Message actions"
      accessibilityActions={[
        { name: 'activate', label: 'Open' },
        { name: 'archive', label: 'Archive' },
        { name: 'delete', label: 'Delete' },
      ]}
      onAccessibilityAction={(event) => {
        switch (event.nativeEvent.actionName) {
          case 'archive':
            onArchive()
            break
          case 'delete':
            onDelete()
            break
        }
      }}
    >
      <Text>Open actions</Text>
    </Pressable>
  )
}
```

---

## モバイルで追加すべき実務ルール

### Safe Area を全画面で意識する

ノッチやホームインジケータをまたぐ画面では、`react-native-safe-area-context` の `SafeAreaView` または inset を使って余白を吸収します。特に独自ヘッダー、フルスクリーンモーダル、固定フッターの画面では必須です。([Expo Documentation][11])

### 画面遷移は URL 互換で考える

Expo Router の各画面は URL と対応し、ネイティブでも deep link として扱えます。画面間データの受け渡しは「その場限りの巨大オブジェクト」ではなく、route params / search params / グローバル状態 / キャッシュを使い分けます。([Expo Documentation][1])

### 認証境界はレイアウトで切る

認証済み・未認証で表示可能画面が変わる場合、個々の画面で毎回 redirect 判定するより、Protected Routes や `_layout.tsx` 境界に集約する方が保守しやすいです。deep link から直接入った場合も同じ境界で守れます。([Expo Documentation][12])

---

## 覚えておいてください

React Native + Expo では、**Web の思想をそのまま移植する**のではなく、**ルーティングは Expo Router、レイアウトは Safe Area、入力は Pressable / TextInput、一覧は FlatList / SectionList、ライフサイクルは AppState** に置き換えて考えるのが重要です。これにより、保守しやすく、ネイティブらしく、性能面でも破綻しにくい UI を作れます。([Expo Documentation][3])
