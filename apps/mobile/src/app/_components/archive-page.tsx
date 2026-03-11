import { ChevronLeft } from "lucide-react-native";
import { ScrollView, View, type ViewProps } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { PAGES } from "@/constants/pages";
import { cn } from "@/utils/cn";
import PageHeaderIconButton from "./page-header-icon-button";

export interface ArchivePageProps extends Omit<ViewProps, "children"> {
  handleChangePage: (page: number) => void;
}

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

const LEGEND_ITEMS = [
  { colorClassName: "bg-muted", label: "0h" },
  { colorClassName: "bg-popover", label: "~1h" },
  { colorClassName: "bg-accent", label: "~2h" },
  { colorClassName: "bg-primary", label: "~4h" },
  { colorClassName: "bg-destructive", label: "~6h" },
] as const;

const CALENDAR_CELL_CLASS_NAMES = {
  accent: "bg-primary",
  "accent-muted": "bg-accent",
  "accent-soft": "bg-popover",
  "accent-strong": "bg-destructive",
  "surface-subtle": "bg-muted",
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
          <PageHeaderIconButton
            accessibilityLabel="タイマー画面に移動"
            onPress={() => handleChangePage(PAGES.timer.page)}
          >
            <Icon as={ChevronLeft} className="size-5 text-ring" />
          </PageHeaderIconButton>
          <Text className="font-semibold text-lg">過去の記録</Text>
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
    <Badge
      className="min-w-0 flex-1 justify-center gap-1.5 rounded-none border-0 bg-transparent px-0 py-0"
      variant="outline"
    >
      <View className={cn("h-3.5 w-3.5 rounded-[3px]", colorClassName)} />
      <Text className="font-jetbrains-mono-medium text-[11px] text-muted-foreground">
        {label}
      </Text>
    </Badge>
  );
}

interface MonthSectionProps {
  monthRecord: MonthRecord;
}

function MonthSection({ monthRecord }: MonthSectionProps) {
  return (
    <Card className="w-full max-w-96 gap-3 border-0 bg-transparent py-0 shadow-none">
      <View className="flex-row items-center justify-between">
        <Text className="font-bold text-lg">{monthRecord.title}</Text>
        <Text className="font-jetbrains-mono-semibold text-primary text-sm">
          {monthRecord.totalTime}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        {DAY_LABELS.map((dayLabel) => (
          <Text
            className="w-10 text-center text-[11px] text-muted-foreground"
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
    </Card>
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
