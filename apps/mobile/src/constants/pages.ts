export const SETTINGS_PAGE = "settings-page" as const;
export const TIMER_PAGE = "timer-page" as const;
export const ARCHIVE_PAGE = "archive-page" as const;
export type PageKey =
  | typeof SETTINGS_PAGE
  | typeof TIMER_PAGE
  | typeof ARCHIVE_PAGE;

export const PAGES: PageKey[] = [
  SETTINGS_PAGE,
  TIMER_PAGE,
  ARCHIVE_PAGE,
] as const;
export const INITIAL_PAGE_INDEX = 1 as const;
