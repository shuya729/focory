export const PAGES = {
  settings: { key: "settings-page", page: 0 },
  timer: { key: "timer-page", page: 1 },
  archive: { key: "archive-page", page: 2 },
} as const;
export type PageKey = (typeof PAGES)[keyof typeof PAGES]["key"];
export type PageIndex = (typeof PAGES)[keyof typeof PAGES]["page"];

export const InitialPageKey = PAGES.timer.key;
export const InitialPageIndex = PAGES.timer.page;
