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
import { useEffect, useState } from "react";
import { View, type ViewProps } from "react-native";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { PAGES } from "@/constants/pages";
import { useTimerDuration } from "@/hooks/use-timer-duration";
import { cn } from "@/utils/cn";
import PageHeaderIconButton from "./page-header-icon-button";

export interface TimerPageProps extends Omit<ViewProps, "children"> {
  handleChangePage: (page: number) => void;
}

const COACH_MESSAGE =
  "いい調子だね！あと少しで一区切りだよ。集中できていてすごい！";

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function TimerPage({
  collapsable = false,
  className,
  handleChangePage,
  ...props
}: TimerPageProps) {
  const router = useRouter();
  const { timerDurationSeconds } = useTimerDuration();
  const [remainingSeconds, setRemainingSeconds] =
    useState<number>(timerDurationSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = setInterval(() => {
      setRemainingSeconds((currentRemainingSeconds) => {
        if (currentRemainingSeconds <= 1) {
          setIsRunning(false);
          return 0;
        }

        return currentRemainingSeconds - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning]);

  useEffect(() => {
    setIsRunning(false);
    setRemainingSeconds(timerDurationSeconds);
  }, [timerDurationSeconds]);

  const handleOpenTimerPicker = () => {
    router.push("./timer-picker-modal");
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setRemainingSeconds(timerDurationSeconds);
  };

  const handleToggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      return;
    }

    if (remainingSeconds === 0) {
      setRemainingSeconds(timerDurationSeconds);
    }

    setIsRunning(true);
  };

  const formattedRemainingTime = formatRemainingTime(remainingSeconds);

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
          <Card className="gap-10 self-center rounded-3xl border-0 bg-secondary px-16 pt-16 pb-12 shadow-none">
            <Text
              adjustsFontSizeToFit
              className="text-center font-jetbrains-mono-extrabold text-8xl tracking-tight"
              numberOfLines={1}
            >
              {formattedRemainingTime}
            </Text>

            <View className="flex-row items-center justify-center gap-6">
              <TimerActionButton
                accessibilityLabel="タイマー時間を編集"
                onPress={handleOpenTimerPicker}
                variant="secondary"
              >
                <Icon as={Pencil} className="size-[22px] text-primary" />
              </TimerActionButton>
              <TimerActionButton
                accessibilityLabel={
                  isRunning ? "タイマーを一時停止" : "タイマーを開始"
                }
                onPress={handleToggleTimer}
                variant="primary"
              >
                {isRunning ? (
                  <Icon
                    as={Pause}
                    className="size-[26px] text-primary-foreground"
                  />
                ) : (
                  <Icon
                    as={Play}
                    className="size-[26px] text-primary-foreground"
                  />
                )}
              </TimerActionButton>
              <TimerActionButton
                accessibilityLabel="タイマーをリセット"
                onPress={handleResetTimer}
                variant="secondary"
              >
                <Icon as={RotateCcw} className="size-[22px] text-primary" />
              </TimerActionButton>
            </View>
          </Card>

          <View className="w-full flex-row items-end gap-3">
            <Avatar alt="Bot" className="size-12">
              <AvatarFallback className="bg-secondary">
                <Icon as={Bot} className="size-6 text-primary" />
              </AvatarFallback>
            </Avatar>
            <Card className="flex-1 gap-0 rounded-t-3xl rounded-br-3xl rounded-bl-2xl border-0 bg-muted p-4 shadow-none">
              <Text className="text-base text-popover-foreground">
                {COACH_MESSAGE}
              </Text>
            </Card>
          </View>
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
          ? "h-16 w-16"
          : "h-14 w-14 border-0 bg-background shadow-none",
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
