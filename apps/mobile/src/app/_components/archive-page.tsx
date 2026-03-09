import { ChevronLeft } from "lucide-react-native";
import {
  Pressable,
  type PressableProps,
  ScrollView,
  Text,
  View,
  type ViewProps,
} from "react-native";
import { PAGES } from "@/constants/pages";
import { cn } from "@/utils/cn";

export interface ArchivePageProps extends Omit<ViewProps, "children"> {
  handleChangePage: (page: number) => void;
}

const ICON_COLOR = "rgb(91 91 91)";
const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

const LEGEND_ITEMS = [
  { colorClassName: "bg-app-surface-subtle", label: "0h" },
  { colorClassName: "bg-app-accent-soft", label: "~1h" },
  { colorClassName: "bg-app-accent-muted", label: "~2h" },
  { colorClassName: "bg-app-accent", label: "~4h" },
  { colorClassName: "bg-app-accent-strong", label: "~6h" },
] as const;

const CALENDAR_CELL_CLASS_NAMES = {
  accent: "bg-app-accent",
  "accent-muted": "bg-app-accent-muted",
  "accent-soft": "bg-app-accent-soft",
  "accent-strong": "bg-app-accent-strong",
  "surface-subtle": "bg-app-surface-subtle",
  transparent: "bg-transparent",
} as const;

type CalendarCellTone = keyof typeof CALENDAR_CELL_CLASS_NAMES;

interface MonthRecord {
  title: string;
  totalTime: string;
  weeks: CalendarCellTone[][];
}

const MONTH_RECORDS: MonthRecord[] = [
  {
    title: "2026年 3月",
    totalTime: "12h 30m",
    weeks: [
      [
        "accent-muted",
        "accent-soft",
        "accent",
        "surface-subtle",
        "accent-soft",
        "accent-muted",
        "accent-strong",
      ],
      [
        "surface-subtle",
        "accent",
        "accent-soft",
        "accent-muted",
        "surface-subtle",
        "accent-soft",
        "surface-subtle",
      ],
      [
        "accent-soft",
        "accent-muted",
        "accent-strong",
        "accent-soft",
        "accent",
        "surface-subtle",
        "accent-muted",
      ],
      [
        "accent",
        "surface-subtle",
        "accent-soft",
        "surface-subtle",
        "accent-muted",
        "accent-strong",
        "accent-soft",
      ],
      [
        "surface-subtle",
        "accent-muted",
        "accent-soft",
        "transparent",
        "transparent",
        "transparent",
        "transparent",
      ],
    ],
  },
  {
    title: "2026年 2月",
    totalTime: "12h 30m",
    weeks: [
      [
        "accent-soft",
        "accent-strong",
        "accent-muted",
        "accent",
        "accent-soft",
        "surface-subtle",
        "accent-muted",
      ],
      [
        "accent",
        "accent-soft",
        "surface-subtle",
        "accent-strong",
        "accent-muted",
        "accent",
        "accent-soft",
      ],
      [
        "surface-subtle",
        "accent-muted",
        "accent-soft",
        "accent",
        "surface-subtle",
        "accent-strong",
        "accent-muted",
      ],
      [
        "accent-soft",
        "accent",
        "accent-muted",
        "surface-subtle",
        "accent-soft",
        "accent",
        "accent-strong",
      ],
    ],
  },
] as const;

function ArchivePage({
  collapsable = false,
  className,
  handleChangePage,
  ...props
}: ArchivePageProps) {
  return (
    <View
      className={cn("flex-1 px-5 pt-2 pb-4", className)}
      collapsable={collapsable}
      {...props}
    >
      <View className="flex-1 gap-4">
        <View className="flex-row items-center justify-between pt-2">
          <HeaderIconButton
            accessibilityLabel="タイマー画面に移動"
            onPress={() => handleChangePage(PAGES.timer.page)}
          >
            <ChevronLeft color={ICON_COLOR} size={20} />
          </HeaderIconButton>
          <Text className="font-semibold text-app-text-primary text-lg">
            過去の記録
          </Text>
          <View className="h-11 w-11" />
        </View>

        <LegendBar />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="items-center gap-4 pb-2">
            {MONTH_RECORDS.map((monthRecord) => (
              <MonthSection key={monthRecord.title} monthRecord={monthRecord} />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

interface HeaderIconButtonProps extends PressableProps {}

function HeaderIconButton({
  accessibilityRole = "button",
  children,
  className,
  hitSlop = 8,
  ...props
}: HeaderIconButtonProps) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      className={cn(
        "h-11 w-11 items-center justify-center rounded-full",
        className
      )}
      hitSlop={hitSlop}
      {...props}
    >
      {children}
    </Pressable>
  );
}

function LegendBar() {
  return (
    <View className="mx-auto w-full max-w-96 flex-row items-center justify-around gap-2">
      {LEGEND_ITEMS.map((legendItem) => (
        <LegendItem
          colorClassName={legendItem.colorClassName}
          key={legendItem.label}
          label={legendItem.label}
        />
      ))}
    </View>
  );
}

interface LegendItemProps {
  colorClassName: string;
  label: string;
}

function LegendItem({ colorClassName, label }: LegendItemProps) {
  return (
    <View className="min-w-0 flex-1 flex-row items-center justify-center gap-1.5">
      <View className={cn("h-3.5 w-3.5 rounded-[3px]", colorClassName)} />
      <Text className="font-jetbrains-mono-medium text-[11px] text-app-text-muted">
        {label}
      </Text>
    </View>
  );
}

interface MonthSectionProps {
  monthRecord: MonthRecord;
}

function MonthSection({ monthRecord }: MonthSectionProps) {
  return (
    <View className="w-full max-w-96 gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-bold text-app-text-primary text-lg">
          {monthRecord.title}
        </Text>
        <Text className="font-jetbrains-mono-semibold text-app-accent text-sm">
          {monthRecord.totalTime}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        {DAY_LABELS.map((dayLabel) => (
          <Text
            className="w-10 text-center text-[11px] text-app-text-muted"
            key={dayLabel}
          >
            {dayLabel}
          </Text>
        ))}
      </View>

      <View className="gap-1">
        {monthRecord.weeks.map((weekTones, weekIndex) => (
          <View
            className="flex-row items-center justify-between"
            key={`${monthRecord.title}-week-${weekIndex.toString()}`}
          >
            {weekTones.map((tone, dayIndex) => (
              <CalendarCell
                key={`${monthRecord.title}-week-${weekIndex.toString()}-day-${dayIndex.toString()}`}
                tone={tone}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

interface CalendarCellProps {
  tone: CalendarCellTone;
}

function CalendarCell({ tone }: CalendarCellProps) {
  return (
    <View
      className={cn("h-10 w-10 rounded-md", CALENDAR_CELL_CLASS_NAMES[tone])}
    />
  );
}

export default ArchivePage;
