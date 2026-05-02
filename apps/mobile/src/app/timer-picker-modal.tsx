import WheelPicker, {
  type PickerItem,
  type WheelPickerProps,
} from "@quidone/react-native-wheel-picker";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { Pressable, type TextStyle, View } from "react-native";
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
  lineHeight: 44,
};

const pickerCommonProps: Partial<WheelPickerProps<PickerItem<number>>> = {
  enableScrollByTapOnItem: true,
  itemHeight: 44,
  itemTextStyle: pickerItemTextStyle,
  renderOverlay: null,
  visibleItemCount: 5,
  width: 104,
};

function TimerPickerModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    isSaveDisabled,
    saveSelectedDuration,
    selectedMinutes,
    selectedSeconds,
    setSelectedMinutes,
    setSelectedSeconds,
  } = useTimerDurationEditor();

  const handleCloseModal = () => {
    router.back();
  };

  const handleSaveDuration = async () => {
    if (isSaveDisabled) {
      return;
    }

    const didSaveDuration = await saveSelectedDuration();

    if (didSaveDuration) {
      handleCloseModal();
    }
  };

  return (
    <View className="flex-1 justify-end bg-black/40">
      <Pressable
        accessibilityLabel="タイマー編集モーダルを閉じる"
        accessibilityRole="button"
        className="absolute inset-0"
        onPress={handleCloseModal}
      />

      <View
        className="rounded-t-[24px] bg-background px-6 pt-3"
        style={{
          paddingBottom: Math.max(insets.bottom, 24) + 16,
        }}
      >
        <View className="items-center pb-7">
          <View className="h-1 w-10 rounded-full bg-border" />
        </View>

        <View className="flex-row items-center justify-between pb-7">
          <Text className="font-bold text-foreground text-lg">
            タイマー編集
          </Text>

          <Button
            accessibilityLabel="タイマー編集モーダルを閉じる"
            className="h-9 w-9 rounded-full shadow-none"
            hitSlop={8}
            onPress={handleCloseModal}
            size="icon"
            variant="secondary"
          >
            <Icon as={X} className="size-[18px] text-foreground" />
          </Button>
        </View>

        <View className="pb-7">
          <View className="items-center justify-center overflow-hidden py-1">
            <View className="absolute right-0 left-0 h-14 rounded-[14px] bg-secondary" />

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
          disabled={isSaveDisabled}
          onPress={handleSaveDuration}
        >
          <Text className="font-bold text-base text-primary-foreground">
            保存
          </Text>
        </Button>
      </View>
    </View>
  );
}

export default TimerPickerModal;
