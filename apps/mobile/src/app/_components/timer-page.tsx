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
import {
  Platform,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from "react-native";
import { Pages } from "@/constants/pages";
import { cn } from "@/utils/cn";

export interface TimerPageProps extends Omit<ViewProps, "children"> {
  handleChangePage: (page: number) => void;
}

const TIMER_PRESETS_IN_SECONDS = [15 * 60, 25 * 60, 50 * 60] as const;
const DEFAULT_TIMER_PRESET_INDEX = 1;
const COACH_MESSAGE =
  "いい調子だね！あと少しで一区切りだよ。集中できていてすごい！";

const TIMER_FONT_FAMILY = Platform.select({
  android: "monospace",
  default: "monospace",
  ios: "Menlo",
});

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
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(
    DEFAULT_TIMER_PRESET_INDEX
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    TIMER_PRESETS_IN_SECONDS[DEFAULT_TIMER_PRESET_INDEX]
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const selectedPresetSeconds =
    TIMER_PRESETS_IN_SECONDS[selectedPresetIndex] ??
    TIMER_PRESETS_IN_SECONDS[DEFAULT_TIMER_PRESET_INDEX];

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

  const handleCyclePreset = () => {
    const nextPresetIndex =
      (selectedPresetIndex + 1) % TIMER_PRESETS_IN_SECONDS.length;
    const nextPresetSeconds =
      TIMER_PRESETS_IN_SECONDS[nextPresetIndex] ??
      TIMER_PRESETS_IN_SECONDS[DEFAULT_TIMER_PRESET_INDEX];

    setSelectedPresetIndex(nextPresetIndex);
    setRemainingSeconds(nextPresetSeconds);
    setIsRunning(false);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setRemainingSeconds(selectedPresetSeconds);
  };

  const handleToggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      return;
    }

    if (remainingSeconds === 0) {
      setRemainingSeconds(selectedPresetSeconds);
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
          <HeaderIconButton
            accessibilityLabel="設定画面に移動"
            onPress={() => handleChangePage(Pages.settings.page)}
          >
            <Settings color="rgb(91 91 91)" size={22} />
          </HeaderIconButton>
          <HeaderIconButton
            accessibilityLabel="アーカイブ画面に移動"
            onPress={() => handleChangePage(Pages.archive.page)}
          >
            <CalendarDays color="rgb(91 91 91)" size={22} />
          </HeaderIconButton>
        </View>

        <View className="flex-1 items-center justify-between">
          <View className="justify-between gap-10 self-center rounded-3xl bg-app-surface-muted px-16 pt-14 pb-12">
            <Text
              adjustsFontSizeToFit
              className="font-extrabold text-8xl text-app-text-primary"
              numberOfLines={1}
              style={styles.timerText}
            >
              {formattedRemainingTime}
            </Text>

            <View className="flex-row items-center justify-center gap-6">
              <TimerActionButton
                accessibilityLabel="タイマー時間を切り替える"
                onPress={handleCyclePreset}
                variant="secondary"
              >
                <Pencil color="rgb(91 158 143)" size={22} />
              </TimerActionButton>
              <TimerActionButton
                accessibilityLabel={
                  isRunning ? "タイマーを一時停止" : "タイマーを開始"
                }
                onPress={handleToggleTimer}
                variant="primary"
              >
                {isRunning ? (
                  <Pause color="rgb(245 240 234)" size={26} />
                ) : (
                  <Play color="rgb(245 240 234)" size={26} />
                )}
              </TimerActionButton>
              <TimerActionButton
                accessibilityLabel="タイマーをリセット"
                onPress={handleResetTimer}
                variant="secondary"
              >
                <RotateCcw color="rgb(91 158 143)" size={22} />
              </TimerActionButton>
            </View>
          </View>

          <View className="w-full flex-row items-end gap-3">
            <View className="items-center justify-center rounded-full bg-app-surface-muted p-3">
              <Bot color="rgb(91 158 143)" size={24} />
            </View>
            <View className="flex-1 rounded-t-3xl rounded-br-3xl rounded-bl-2xl bg-app-surface-subtle p-4">
              <Text className="text-app-text-secondary text-base">
                {COACH_MESSAGE}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

interface HeaderIconButtonProps extends PressableProps {}

function HeaderIconButton({
  accessibilityRole = "button",
  hitSlop = 8,
  children,
  className,
  ...props
}: HeaderIconButtonProps) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      className={cn("items-center justify-center rounded-full", className)}
      hitSlop={hitSlop}
      {...props}
    >
      {children}
    </Pressable>
  );
}

interface TimerActionButtonProps extends PressableProps {
  variant: "primary" | "secondary";
}

function TimerActionButton({
  variant,
  accessibilityRole = "button",
  hitSlop = 8,
  children,
  className,
  ...props
}: TimerActionButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      className={cn(
        "items-center justify-center rounded-full p-4",
        isPrimary ? "bg-app-accent" : "bg-app-background",
        className
      )}
      hitSlop={hitSlop}
      {...props}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  timerText: {
    fontFamily: TIMER_FONT_FAMILY,
    letterSpacing: -3,
  },
});

export default TimerPage;
