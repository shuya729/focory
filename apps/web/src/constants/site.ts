export const SITE = {
  appStoreHref: "#download",
  copyright: "© 2026 Focory. All rights reserved.",
  description:
    "Focoryは、AIがあなただけの言葉で集中を後押しする、学習タイマーです。",
  googlePlayHref: "#download",
  name: "Focory",
  tagline: "ひとりで集中したい人のための、学習タイマー。",
} as const;

export interface SiteLink {
  href: string;
  label: string;
}

interface SiteFooterGroup {
  links: readonly SiteLink[];
  title: string;
}

export const SITE_NAV_ITEMS = [
  {
    href: "/contact",
    label: "お問い合わせ",
  },
  {
    href: "/term",
    label: "利用規約",
  },
  {
    href: "/privacy",
    label: "プライバシー",
  },
] as const satisfies readonly SiteLink[];

export const SITE_FOOTER_GROUPS = [
  {
    links: [
      {
        href: "/",
        label: "ホーム",
      },
      {
        href: "/contact",
        label: "お問い合わせ",
      },
    ],
    title: "プロダクト",
  },
  {
    links: [
      {
        href: "#download",
        label: "App Store",
      },
      {
        href: "#download",
        label: "Google Play",
      },
    ],
    title: "ストア",
  },
  {
    links: [
      {
        href: "/term",
        label: "利用規約",
      },
      {
        href: "/privacy",
        label: "プライバシーポリシー",
      },
    ],
    title: "法務",
  },
] as const satisfies readonly SiteFooterGroup[];

export const SITE_FOOTER_LINKS = [
  {
    href: "/",
    label: "ホーム",
  },
  {
    href: "/contact",
    label: "お問い合わせ",
  },
  {
    href: "/term",
    label: "利用規約",
  },
  {
    href: "/privacy",
    label: "プライバシーポリシー",
  },
] as const satisfies readonly SiteLink[];
