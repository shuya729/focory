import { ChevronLeft } from "lucide-react-native";
import { FlatList, View, type ViewProps } from "react-native";
import PageHeaderIconButton from "@/components/elements/page-header-icon-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  DAY_CATEGORIES,
  DAY_LABELS,
  type DayCategory,
} from "@/constants/archive-constants";
import { TIMER_PAGE } from "@/constants/pages";
import { useArchiveRefreshKey } from "@/contexts/archive-invalidation-context";
import { useArchiveCalendar } from "@/hooks/use-archive-calendar";
import type { ArchiveMonth } from "@/types/archive";
import { getDayCategoryColorClassName } from "@/utils/archive-utils";
import { cn } from "@/utils/cn";
import { formatCompactDuration } from "@/utils/timer-utils";

export interface ArchivePageProps extends Omit<ViewProps, "children"> {
  handleChangePage: (page: number) => void;
}

function ArchivePage({
  collapsable = false,
  className,
  handleChangePage,
  ...props
}: ArchivePageProps) {
  const refreshKey = useArchiveRefreshKey();
  const { archiveMonths, loadMoreMonths } = useArchiveCalendar({ refreshKey });

  return (
    <View
      className={cn("flex-1 px-6 pt-2 pb-2", className)}
      collapsable={collapsable}
      {...props}
    >
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <PageHeaderIconButton
            accessibilityLabel="タイマー画面に移動"
            onPress={() => handleChangePage(TIMER_PAGE.page)}
          >
            <Icon as={ChevronLeft} className="size-5 text-ring" />
          </PageHeaderIconButton>
          <Text className="font-semibold text-lg">過去の記録</Text>
          <View className="h-11 w-11" />
        </View>

        <LegendBar />

        <FlatList
          className="flex-1"
          data={archiveMonths}
          keyExtractor={(month) => month.id}
          onEndReached={loadMoreMonths}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => <MonthSection month={item} />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

function LegendBar() {
  return (
    <View className="mx-auto w-full max-w-96 flex-row items-center justify-around gap-2 px-2 py-3">
      {DAY_CATEGORIES.map((dayCategory) => (
        <LegendItem
          colorClassName={dayCategory.color}
          key={dayCategory.key}
          label={dayCategory.label}
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
      <View className={cn("size-4 rounded-sm", colorClassName)} />
      <Text className="font-jetbrains-mono-medium text-muted-foreground text-xs">
        {label}
      </Text>
    </Badge>
  );
}

interface MonthSectionProps {
  month: ArchiveMonth;
}

function MonthSection({ month }: MonthSectionProps) {
  return (
    <Card className="mx-auto w-full max-w-96 gap-2 border-0 bg-transparent px-2 pt-2 pb-6 shadow-none">
      <View className="flex-row items-center justify-between py-1">
        <Text className="font-bold text-lg">{month.title}</Text>
        <Text className="font-jetbrains-mono-semibold text-primary text-sm">
          {formatCompactDuration(month.totalSeconds)}
        </Text>
      </View>

      <View className="flex-row items-center justify-between gap-1">
        {DAY_LABELS.map((dayLabel) => (
          <Text
            className="flex-1 text-center text-muted-foreground text-xs"
            key={dayLabel}
          >
            {dayLabel}
          </Text>
        ))}
      </View>

      <View className="gap-2">
        {month.weeks.map((weekDays, weekIndex) => (
          <View
            className="flex-row items-center justify-between gap-2"
            key={`${month.id}-week-${weekIndex.toString()}`}
          >
            {weekDays.map((weekDay, dayIndex) => (
              <CalendarCell
                category={weekDay.category}
                key={`${month.id}-week-${weekIndex.toString()}-day-${dayIndex.toString()}`}
              />
            ))}
          </View>
        ))}
      </View>
    </Card>
  );
}

interface CalendarCellProps {
  category: DayCategory | null;
}

function CalendarCell({ category }: CalendarCellProps) {
  return (
    <View
      className={cn(
        "aspect-square flex-1 rounded-md",
        getDayCategoryColorClassName(category)
      )}
    />
  );
}

export default ArchivePage;
