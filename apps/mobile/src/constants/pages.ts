export interface Page {
  key: string;
  page: number;
}

export const SETTINGS_PAGE: Page = { key: "settings", page: 0 };
export const TIMER_PAGE: Page = { key: "timer", page: 1 };
export const ARCHIVE_PAGE: Page = { key: "archive", page: 2 };

export const PAGES: Page[] = [SETTINGS_PAGE, TIMER_PAGE, ARCHIVE_PAGE];

export const DEFAULT_PAGE = TIMER_PAGE;
