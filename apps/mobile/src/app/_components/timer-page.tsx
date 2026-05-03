import { CalendarDays, Settings } from "lucide-react-native";
import { View, type ViewProps } from "react-native";
import PageHeaderIconButton from "@/components/elements/page-header-icon-button";
import TimerBotMessage from "@/components/elements/timer-bot-message";
import TimerCard from "@/components/elements/timer-card";
import { Icon } from "@/components/ui/icon";
import { ARCHIVE_PAGE, SETTINGS_PAGE } from "@/constants/pages";
import { cn } from "@/utils/cn";

export interface TimerPageProps extends Omit<ViewProps, "children"> {
  handleChangePage: (page: number) => void;
}

function TimerPage({
  collapsable = false,
  className,
  handleChangePage,
  ...props
}: TimerPageProps) {
  return (
    <View
      className={cn("flex-1 px-6 pt-2 pb-2", className)}
      collapsable={collapsable}
      {...props}
    >
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <PageHeaderIconButton
            accessibilityLabel="設定画面に移動"
            onPress={() => handleChangePage(SETTINGS_PAGE.page)}
          >
            <Icon as={Settings} className="size-[22px] text-ring" />
          </PageHeaderIconButton>
          <PageHeaderIconButton
            accessibilityLabel="アーカイブ画面に移動"
            onPress={() => handleChangePage(ARCHIVE_PAGE.page)}
          >
            <Icon as={CalendarDays} className="size-[22px] text-ring" />
          </PageHeaderIconButton>
        </View>

        <View className="flex-1 items-center justify-between py-2">
          <TimerCard />
          <TimerBotMessage />
        </View>
      </View>
    </View>
  );
}

export default TimerPage;
