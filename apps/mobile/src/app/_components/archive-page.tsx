import { ChevronLeft } from "lucide-react-native";
import { FlatList, View, type ViewProps } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { PAGES } from "@/constants/pages";
import { useArchiveCalendar } from "@/hooks/use-archive-calendar";
import {
  type ArchiveMonthSection,
  CALENDAR_CELL_CLASS_NAMES,
  type CalendarCellTone,
  DAY_LABELS,
  LEGEND_ITEMS,
} from "@/services/archive-service";
import { cn } from "@/utils/cn";
import PageHeaderIconButton from "./page-header-icon-button";

export interface ArchivePageProps extends Omit<ViewProps, "children"> {
  handleChangePage: (page: number) => void;
}

function ArchivePage({
  collapsable = false,
  className,
  handleChangePage,
  ...props
}: ArchivePageProps) {
  const { loadMoreMonths, monthSections } = useArchiveCalendar();

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

        <FlatList
          className="flex-1"
          contentContainerStyle={{
            alignItems: "center",
            gap: 16,
            paddingBottom: 8,
          }}
          data={monthSections}
          keyExtractor={(monthSection) => monthSection.id}
          onEndReached={loadMoreMonths}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => <MonthSection monthSection={item} />}
          showsVerticalScrollIndicator={false}
        />
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
  monthSection: ArchiveMonthSection;
}

function MonthSection({ monthSection }: MonthSectionProps) {
  return (
    <Card className="w-full max-w-96 gap-3 border-0 bg-transparent py-0 shadow-none">
      <View className="flex-row items-center justify-between">
        <Text className="font-bold text-lg">{monthSection.title}</Text>
        <Text className="font-jetbrains-mono-semibold text-primary text-sm">
          {monthSection.totalTimeLabel}
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
        {monthSection.weeks.map((weekDays, weekIndex) => (
          <View
            className="flex-row items-center justify-between"
            key={`${monthSection.id}-week-${weekIndex.toString()}`}
          >
            {weekDays.map((weekDay, dayIndex) => (
              <CalendarCell
                dayOfMonth={weekDay.dayOfMonth}
                key={`${monthSection.id}-week-${weekIndex.toString()}-day-${dayIndex.toString()}`}
                tone={weekDay.tone}
              />
            ))}
          </View>
        ))}
      </View>
    </Card>
  );
}

interface CalendarCellProps {
  dayOfMonth: number | null;
  tone: CalendarCellTone;
}

function CalendarCell({ dayOfMonth, tone }: CalendarCellProps) {
  return (
    <View
      className={cn(
        "h-10 w-10 items-end rounded-md px-1.5 py-1",
        CALENDAR_CELL_CLASS_NAMES[tone]
      )}
    >
      {dayOfMonth ? (
        <Text
          className={cn(
            "font-jetbrains-mono-medium text-[10px]",
            tone === "transparent" ? "text-transparent" : "text-foreground"
          )}
        >
          {dayOfMonth.toString()}
        </Text>
      ) : null}
    </View>
  );
}

export default ArchivePage;
