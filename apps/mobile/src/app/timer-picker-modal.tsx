import WheelPicker, {
  type PickerItem,
  type WheelPickerProps,
} from "@quidone/react-native-wheel-picker";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Pressable,
  type TextStyle,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  TIMER_MINUTE_PICKER_ITEMS,
  TIMER_SECOND_PICKER_ITEMS,
} from "@/constants/timer-constants";
import { useTimerDurationEditor } from "@/hooks/use-timer-duration-editor";
import { THEME } from "@/theme";

const pickerItemTextStyle: TextStyle = {
  color: THEME.light.foreground,
  fontFamily: "JetBrainsMono-ExtraBold",
  fontSize: 36,
  lineHeight: 48,
};

const pickerCommonProps: Partial<WheelPickerProps<PickerItem<number>>> = {
  enableScrollByTapOnItem: true,
  itemHeight: 48,
  itemTextStyle: pickerItemTextStyle,
  renderOverlay: null,
  visibleItemCount: 5,
  width: 104,
};

const MODAL_OPEN_ANIMATION_DURATION_MS = 240;
const MODAL_CLOSE_ANIMATION_DURATION_MS = 180;

function TimerPickerModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const animationProgress = useSharedValue(0);
  const isClosingRef = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const {
    isSaveDisabled,
    saveSelectedDuration,
    selectedMinutes,
    selectedSeconds,
    setSelectedMinutes,
    setSelectedSeconds,
  } = useTimerDurationEditor();

  const navigateBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleCloseModal = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    setIsClosing(true);
    animationProgress.value = withTiming(
      0,
      {
        duration: MODAL_CLOSE_ANIMATION_DURATION_MS,
        easing: Easing.in(Easing.cubic),
      },
      (didFinish) => {
        if (didFinish) {
          runOnJS(navigateBack)();
        }
      }
    );
  }, [animationProgress, navigateBack]);

  useEffect(() => {
    animationProgress.value = withTiming(1, {
      duration: MODAL_OPEN_ANIMATION_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [animationProgress]);

  useEffect(() => {
    const backSubscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleCloseModal();
        return true;
      }
    );

    return () => {
      backSubscription.remove();
    };
  }, [handleCloseModal]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: animationProgress.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY: interpolate(
            animationProgress.value,
            [0, 1],
            [windowHeight, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
    }),
    [windowHeight]
  );

  const handleSaveDuration = async () => {
    if (isSaveDisabled || isClosing) {
      return;
    }

    const didSaveDuration = await saveSelectedDuration();

    if (didSaveDuration) {
      handleCloseModal();
    }
  };

  return (
    <View className="flex-1 justify-end">
      <Animated.View
        className="absolute inset-0 bg-black/40"
        style={overlayAnimatedStyle}
      />
      <Pressable
        accessibilityLabel="タイマー編集モーダルを閉じる"
        accessibilityRole="button"
        className="absolute inset-0"
        disabled={isClosing}
        onPress={handleCloseModal}
      />

      <Animated.View
        className="rounded-t-[24px] bg-background px-6 pt-6"
        style={[
          {
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
          sheetAnimatedStyle,
        ]}
      >
        <View className="flex-row items-center justify-between pb-6">
          <Text className="font-bold text-foreground text-lg">
            タイマー編集
          </Text>

          <Button
            accessibilityLabel="タイマー編集モーダルを閉じる"
            className="h-9 w-9 rounded-full shadow-none"
            disabled={isClosing}
            hitSlop={8}
            onPress={handleCloseModal}
            size="icon"
            variant="secondary"
          >
            <Icon as={X} className="size-[18px] text-foreground" />
          </Button>
        </View>

        <View className="pb-6">
          <View className="items-center justify-center overflow-hidden py-1">
            <View className="absolute right-0 left-0 h-14 rounded-lg bg-secondary" />

            <View className="flex-row items-center justify-center gap-2">
              <WheelPicker
                {...pickerCommonProps}
                data={TIMER_MINUTE_PICKER_ITEMS}
                onValueChanged={({ item }) => {
                  setSelectedMinutes(item.value);
                }}
                value={selectedMinutes}
              />

              <Text className="font-medium text-base text-muted-foreground">
                分
              </Text>

              <WheelPicker
                {...pickerCommonProps}
                data={TIMER_SECOND_PICKER_ITEMS}
                onValueChanged={({ item }) => {
                  setSelectedSeconds(item.value);
                }}
                value={selectedSeconds}
              />

              <Text className="font-medium text-base text-muted-foreground">
                秒
              </Text>
            </View>
          </View>
        </View>

        <Button
          className="h-[52px] rounded-2xl shadow-none"
          disabled={isSaveDisabled || isClosing}
          onPress={handleSaveDuration}
        >
          <Text className="font-bold text-base text-primary-foreground">
            保存
          </Text>
        </Button>
      </Animated.View>
    </View>
  );
}

export default TimerPickerModal;
