export const MOCK_TIMER = {
  coachMessage:
    "英単語をあと5つだけ進めよう。今の集中は、ちゃんと次につながっています。",
  durationMinutes: 25,
  durationSeconds: 0,
  formattedRemainingTime: "24:32",
  hasCoachMessage: true,
  isFinished: false,
  isRunning: true,
  isTransitioning: false,
} as const;

export const MOCK_SETTINGS = {
  behaviorOptions: [
    "やさしい",
    "厳しい",
    "明るい",
    "落ち着き",
    "おもしろい",
    "クール",
  ],
  objective: "英単語の復習",
  purpose: "来週の確認テストで迷わず答えられるようにするため",
  selectedBehavior: "やさしい",
} as const;

export const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export const LEGEND_ITEMS = [
  { colorClassName: "bg-muted", label: "0h" },
  { colorClassName: "bg-popover", label: "~2h" },
  { colorClassName: "bg-accent", label: "~4h" },
  { colorClassName: "bg-primary", label: "~6h" },
  { colorClassName: "bg-destructive", label: "6h~" },
] as const;

export const CALENDAR_CELL_CLASS_NAMES = {
  accent: "bg-primary",
  "accent-muted": "bg-accent",
  "accent-soft": "bg-popover",
  "accent-strong": "bg-destructive",
  "surface-subtle": "bg-muted",
  transparent: "bg-transparent",
} as const;

export type CalendarCellTone = keyof typeof CALENDAR_CELL_CLASS_NAMES;

export interface CalendarDay {
  dayOfMonth: number | null;
  tone: CalendarCellTone;
}

export interface ArchiveMonthSection {
  id: string;
  title: string;
  totalTimeLabel: string;
  weeks: CalendarDay[][];
}

export const MOCK_ARCHIVE_MONTH_SECTIONS: ArchiveMonthSection[] = [
  {
    id: "2026-05",
    title: "2026年 05月",
    totalTimeLabel: "8h 20m",
    weeks: [
      [
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: 1, tone: "accent-soft" },
        { dayOfMonth: 2, tone: "accent" },
      ],
      [
        { dayOfMonth: 3, tone: "surface-subtle" },
        { dayOfMonth: 4, tone: "accent-muted" },
        { dayOfMonth: 5, tone: "accent" },
        { dayOfMonth: 6, tone: "accent-soft" },
        { dayOfMonth: 7, tone: "accent-muted" },
        { dayOfMonth: 8, tone: "accent-strong" },
        { dayOfMonth: 9, tone: "surface-subtle" },
      ],
      [
        { dayOfMonth: 10, tone: "accent-soft" },
        { dayOfMonth: 11, tone: "accent-muted" },
        { dayOfMonth: 12, tone: "accent" },
        { dayOfMonth: 13, tone: "surface-subtle" },
        { dayOfMonth: 14, tone: "accent-soft" },
        { dayOfMonth: 15, tone: "accent-muted" },
        { dayOfMonth: 16, tone: "surface-subtle" },
      ],
      [
        { dayOfMonth: 17, tone: "surface-subtle" },
        { dayOfMonth: 18, tone: "accent" },
        { dayOfMonth: 19, tone: "accent-muted" },
        { dayOfMonth: 20, tone: "accent-soft" },
        { dayOfMonth: 21, tone: "surface-subtle" },
        { dayOfMonth: 22, tone: "accent" },
        { dayOfMonth: 23, tone: "accent-soft" },
      ],
      [
        { dayOfMonth: 24, tone: "accent-muted" },
        { dayOfMonth: 25, tone: "accent-strong" },
        { dayOfMonth: 26, tone: "accent" },
        { dayOfMonth: 27, tone: "accent-soft" },
        { dayOfMonth: 28, tone: "surface-subtle" },
        { dayOfMonth: 29, tone: "accent-muted" },
        { dayOfMonth: 30, tone: "accent" },
      ],
      [
        { dayOfMonth: 31, tone: "surface-subtle" },
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: null, tone: "transparent" },
      ],
    ],
  },
  {
    id: "2026-04",
    title: "2026年 04月",
    totalTimeLabel: "34h 45m",
    weeks: [
      [
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: 1, tone: "accent-muted" },
        { dayOfMonth: 2, tone: "accent" },
        { dayOfMonth: 3, tone: "accent-soft" },
        { dayOfMonth: 4, tone: "accent-strong" },
      ],
      [
        { dayOfMonth: 5, tone: "accent-soft" },
        { dayOfMonth: 6, tone: "accent-muted" },
        { dayOfMonth: 7, tone: "accent" },
        { dayOfMonth: 8, tone: "accent-strong" },
        { dayOfMonth: 9, tone: "accent-muted" },
        { dayOfMonth: 10, tone: "accent" },
        { dayOfMonth: 11, tone: "surface-subtle" },
      ],
      [
        { dayOfMonth: 12, tone: "surface-subtle" },
        { dayOfMonth: 13, tone: "accent-soft" },
        { dayOfMonth: 14, tone: "accent-muted" },
        { dayOfMonth: 15, tone: "accent" },
        { dayOfMonth: 16, tone: "accent-muted" },
        { dayOfMonth: 17, tone: "accent-strong" },
        { dayOfMonth: 18, tone: "accent-soft" },
      ],
      [
        { dayOfMonth: 19, tone: "accent-muted" },
        { dayOfMonth: 20, tone: "accent" },
        { dayOfMonth: 21, tone: "accent-soft" },
        { dayOfMonth: 22, tone: "accent-muted" },
        { dayOfMonth: 23, tone: "accent-strong" },
        { dayOfMonth: 24, tone: "accent" },
        { dayOfMonth: 25, tone: "surface-subtle" },
      ],
      [
        { dayOfMonth: 26, tone: "accent-soft" },
        { dayOfMonth: 27, tone: "accent-muted" },
        { dayOfMonth: 28, tone: "accent" },
        { dayOfMonth: 29, tone: "accent-soft" },
        { dayOfMonth: 30, tone: "accent-muted" },
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: null, tone: "transparent" },
      ],
    ],
  },
  {
    id: "2026-03",
    title: "2026年 03月",
    totalTimeLabel: "21h 10m",
    weeks: [
      [
        { dayOfMonth: 1, tone: "surface-subtle" },
        { dayOfMonth: 2, tone: "accent-soft" },
        { dayOfMonth: 3, tone: "accent-muted" },
        { dayOfMonth: 4, tone: "accent" },
        { dayOfMonth: 5, tone: "accent-soft" },
        { dayOfMonth: 6, tone: "surface-subtle" },
        { dayOfMonth: 7, tone: "accent-muted" },
      ],
      [
        { dayOfMonth: 8, tone: "accent" },
        { dayOfMonth: 9, tone: "accent-soft" },
        { dayOfMonth: 10, tone: "accent-muted" },
        { dayOfMonth: 11, tone: "surface-subtle" },
        { dayOfMonth: 12, tone: "accent-soft" },
        { dayOfMonth: 13, tone: "accent" },
        { dayOfMonth: 14, tone: "accent-muted" },
      ],
      [
        { dayOfMonth: 15, tone: "surface-subtle" },
        { dayOfMonth: 16, tone: "accent-soft" },
        { dayOfMonth: 17, tone: "accent-muted" },
        { dayOfMonth: 18, tone: "accent" },
        { dayOfMonth: 19, tone: "accent-soft" },
        { dayOfMonth: 20, tone: "accent-muted" },
        { dayOfMonth: 21, tone: "accent-strong" },
      ],
      [
        { dayOfMonth: 22, tone: "surface-subtle" },
        { dayOfMonth: 23, tone: "accent-soft" },
        { dayOfMonth: 24, tone: "accent-muted" },
        { dayOfMonth: 25, tone: "accent" },
        { dayOfMonth: 26, tone: "surface-subtle" },
        { dayOfMonth: 27, tone: "accent-soft" },
        { dayOfMonth: 28, tone: "accent-muted" },
      ],
      [
        { dayOfMonth: 29, tone: "accent" },
        { dayOfMonth: 30, tone: "accent-soft" },
        { dayOfMonth: 31, tone: "accent-muted" },
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: null, tone: "transparent" },
        { dayOfMonth: null, tone: "transparent" },
      ],
    ],
  },
];
