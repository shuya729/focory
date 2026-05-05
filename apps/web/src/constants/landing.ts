export type LandingFeatureIcon = "calendar" | "message" | "timer";

export const LANDING_HERO = {
  description:
    "Focoryは、AIがあなただけの言葉で集中を後押しする、学習タイマー。「あと5分だけ」を、今日からなくしませんか。",
  mobileDescription:
    "Focoryは、AIがあなただけの言葉で集中を後押しする、学習タイマー。",
  title: "スマホを置いて、\nいまやることへ。",
  visualCaption: "AIが、あなたに合わせて声がけ",
  visualMessage: "いい調子だね。\nこの集中、続けてみよう。",
} as const;

export const LANDING_FEATURES = [
  {
    description: "勉強・作業時間をすっきり管理。難しい設定はいりません。",
    icon: "timer",
    title: "シンプルな集中タイマー",
  },
  {
    description:
      "ライバル・クール・コーチなど、自分に合う声がけで、自然と集中に戻れます。",
    icon: "message",
    title: "AIのひと言で、作業へ引き戻す",
  },
  {
    description:
      "過去の集中時間がひと目で分かり、今日の積み重ねが、自信に変わります。",
    icon: "calendar",
    title: "カレンダーで積み重ねを可視化",
  },
] as const satisfies ReadonlyArray<{
  description: string;
  icon: LandingFeatureIcon;
  title: string;
}>;

export const LANDING_FEATURES_HEADING = "集中をやさしく支える、3つのこと";

export const LANDING_CTA = {
  description: "ひとりで集中したい人のために、Focory。",
  mobileDescription: "ひとりで集中したい人のために。",
  title: "今日から、はじめてみませんか？",
} as const;
