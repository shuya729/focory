export interface Page {
  key: string;
  page: number;
}

export const SETTINGS_PAGE: Page = { key: "settings", page: 0 } as const;
export const TIMER_PAGE: Page = { key: "timer", page: 1 } as const;
export const ARCHIVE_PAGE: Page = { key: "archive", page: 2 } as const;

export const PAGE = {
  SETTINGS: SETTINGS_PAGE,
  TIMER: TIMER_PAGE,
  ARCHIVE: ARCHIVE_PAGE,
} as const;
export const PAGES: Page[] = [SETTINGS_PAGE, TIMER_PAGE, ARCHIVE_PAGE];

export const DEFAULT_PAGE = TIMER_PAGE;
