import { useRouter } from "expo-router";
import { Pause, Pencil, Play, RotateCcw } from "lucide-react-native";
import type { ReactNode } from "react";
import { View } from "react-native";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useTimer } from "@/contexts/timer-context";
import { THEME } from "@/theme";
import { cn } from "@/utils/cn";
import { formatTimerClock } from "@/utils/timer-utils";

function TimerCard() {
  const router = useRouter();
  const {
    isFinished,
    isReady,
    pauseTimer,
    resetTimer,
    startOrResumeTimer,
    timerState,
  } = useTimer();
  const { durationSeconds, isRunning, isTransitioning, remainingSeconds } =
    timerState;
  const formattedRemainingTime = formatTimerClock(remainingSeconds);
  const isTimerActionDisabled = !isReady || isTransitioning;
  const isStartDisabled = isTimerActionDisabled || durationSeconds === 0;

  const handleOpenTimerPicker = () => {
    router.push("/timer-picker-modal");
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
        disabled={isTimerActionDisabled}
        onPress={resetTimer}
        variant="secondary"
      >
        <Icon as={RotateCcw} className="size-[22px] text-primary" />
      </TimerActionButton>
    );
  } else if (isRunning) {
    timerActionButtons = (
      <TimerActionButton
        accessibilityLabel="タイマーを一時停止"
        disabled={isTimerActionDisabled}
        onPress={pauseTimer}
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
          disabled={isTimerActionDisabled}
          onPress={handleOpenTimerPicker}
          variant="secondary"
        >
          <Icon as={Pencil} className="size-[22px] text-primary" />
        </TimerActionButton>
        <TimerActionButton
          accessibilityLabel="タイマーを開始"
          disabled={isStartDisabled}
          onPress={startOrResumeTimer}
          variant="primary"
        >
          <Icon as={Play} className="size-[26px] text-primary-foreground" />
        </TimerActionButton>
        <TimerActionButton
          accessibilityLabel="タイマーをリセット"
          disabled={isTimerActionDisabled}
          onPress={resetTimer}
          variant="secondary"
        >
          <Icon as={RotateCcw} className="size-[22px] text-primary" />
        </TimerActionButton>
      </>
    );
  }

  return (
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
          : "h-[52px] w-[52px] border-0 bg-background shadow-none active:bg-secondary active:opacity-50",
        className
      )}
      hitSlop={hitSlop}
      size="icon"
      variant={buttonVariant}
      {...props}
    />
  );
}

export default TimerCard;
