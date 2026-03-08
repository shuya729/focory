export const Pages = {
  settings: { key: "settings-page", page: 0 },
  timer: { key: "timer-page", page: 1 },
  archive: { key: "archive-page", page: 2 },
} as const;
export type PageKey = (typeof Pages)[keyof typeof Pages]["key"];
export type PageIndex = (typeof Pages)[keyof typeof Pages]["page"];

export const InitialPageKey = Pages.timer.key;
export const InitialPageIndex = Pages.timer.page;
