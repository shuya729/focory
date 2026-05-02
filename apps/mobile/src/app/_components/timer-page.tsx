import { useRouter } from "expo-router";
import {
  Bot,
  CalendarDays,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Settings,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import PageHeaderIconButton from "@/components/elements/page-header-icon-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { MOCK_TIMER } from "@/constants/mock-mobile-data";
import { PAGES } from "@/constants/pages";
import { THEME } from "@/theme";
import { cn } from "@/utils/cn";

const handleMockTimerAction = () => undefined;

export interface TimerPageProps extends Omit<ViewProps, "children"> {
  handleChangePage: (page: number) => void;
}

function TimerPage({
  collapsable = false,
  className,
  handleChangePage,
  ...props
}: TimerPageProps) {
  const router = useRouter();
  const {
    coachMessage,
    formattedRemainingTime,
    hasCoachMessage,
    isFinished,
    isRunning,
    isTransitioning,
  } = MOCK_TIMER;

  const handleOpenTimerPicker = () => {
    router.push("./timer-picker-modal");
  };
  let timerCardBackgroundClassName = "bg-secondary";
  let timerCardStyle:
    | {
        elevation: number;
        shadowColor: string;
        shadowOffset: { width: number; height: number };
        shadowOpacity: number;
        shadowRadius: number;
      }
    | undefined;

  if (isRunning) {
    timerCardBackgroundClassName = "bg-popover";
    timerCardStyle = {
      elevation: 6,
      shadowColor: THEME.light.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 20,
    };
  }

  if (isFinished) {
    timerCardBackgroundClassName = "bg-primary";
    timerCardStyle = {
      elevation: 8,
      shadowColor: THEME.light.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
    };
  }

  const timerCardClassName = cn(
    "h-[270px] w-[340px] justify-around self-center rounded-3xl border-0 px-7 pt-6 pb-[18px] shadow-none",
    timerCardBackgroundClassName
  );
  const timerTextClassName = cn(
    "text-center font-jetbrains-mono-extrabold text-[76px] leading-[92px] tracking-tight",
    isFinished ? "text-primary-foreground" : "text-foreground"
  );
  let timerActionButtons: ReactNode;

  if (isFinished) {
    timerActionButtons = (
      <TimerActionButton
        accessibilityLabel="タイマーをリセット"
        disabled={isTransitioning}
        onPress={handleMockTimerAction}
        variant="secondary"
      >
        <Icon as={RotateCcw} className="size-[22px] text-primary" />
      </TimerActionButton>
    );
  } else if (isRunning) {
    timerActionButtons = (
      <TimerActionButton
        accessibilityLabel="タイマーを一時停止"
        disabled={isTransitioning}
        onPress={handleMockTimerAction}
        variant="primary"
      >
        <Icon as={Pause} className="size-[26px] text-primary-foreground" />
      </TimerActionButton>
    );
  } else {
    timerActionButtons = (
      <>
        <TimerActionButton
          accessibilityLabel="タイマー時間を編集"
          disabled={isTransitioning}
          onPress={handleOpenTimerPicker}
          variant="secondary"
        >
          <Icon as={Pencil} className="size-[22px] text-primary" />
        </TimerActionButton>
        <TimerActionButton
          accessibilityLabel="タイマーを開始"
          disabled={isTransitioning}
          onPress={handleMockTimerAction}
          variant="primary"
        >
          <Icon as={Play} className="size-[26px] text-primary-foreground" />
        </TimerActionButton>
        <TimerActionButton
          accessibilityLabel="タイマーをリセット"
          disabled={isTransitioning}
          onPress={handleMockTimerAction}
          variant="secondary"
        >
          <Icon as={RotateCcw} className="size-[22px] text-primary" />
        </TimerActionButton>
      </>
    );
  }

  return (
    <View
      className={cn("flex-1 px-6 pt-2 pb-4", className)}
      collapsable={collapsable}
      {...props}
    >
      <View className="flex-1 gap-2">
        <View className="flex-row items-center justify-between pt-2 pb-4">
          <PageHeaderIconButton
            accessibilityLabel="設定画面に移動"
            onPress={() => handleChangePage(PAGES.settings.page)}
          >
            <Icon as={Settings} className="size-[22px] text-ring" />
          </PageHeaderIconButton>
          <PageHeaderIconButton
            accessibilityLabel="アーカイブ画面に移動"
            onPress={() => handleChangePage(PAGES.archive.page)}
          >
            <Icon as={CalendarDays} className="size-[22px] text-ring" />
          </PageHeaderIconButton>
        </View>

        <View className="flex-1 items-center justify-between">
          <Card className={timerCardClassName} style={timerCardStyle}>
            <Text
              adjustsFontSizeToFit
              className={timerTextClassName}
              numberOfLines={1}
            >
              {formattedRemainingTime}
            </Text>

            <View className="flex-row items-center justify-center gap-6">
              {timerActionButtons}
            </View>
          </Card>

          {hasCoachMessage ? (
            <View className="w-full flex-row items-end gap-3">
              <Avatar alt="Bot" className="size-12">
                <AvatarFallback className="bg-secondary">
                  <Icon as={Bot} className="size-6 text-primary" />
                </AvatarFallback>
              </Avatar>
              <Card className="flex-1 gap-0 rounded-t-3xl rounded-br-3xl rounded-bl-2xl border-0 bg-muted p-4 shadow-none">
                <Text className="text-base text-popover-foreground">
                  {coachMessage}
                </Text>
              </Card>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

interface TimerActionButtonProps extends Omit<ButtonProps, "variant"> {
  variant: "primary" | "secondary";
}

function TimerActionButton({
  variant,
  className,
  hitSlop = 8,
  ...props
}: TimerActionButtonProps) {
  const buttonVariant = variant === "primary" ? "default" : "outline";

  return (
    <Button
      className={cn(
        "rounded-full",
        variant === "primary"
          ? "h-14 w-14"
          : "h-[52px] w-[52px] border-0 bg-background shadow-none",
        className
      )}
      hitSlop={hitSlop}
      size="icon"
      variant={buttonVariant}
      {...props}
    />
  );
}

export default TimerPage;
