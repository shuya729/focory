import { ThemeProvider } from "@react-navigation/native";
import "../global.css";
import { PortalHost } from "@rn-primitives/portal";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { hide, preventAutoHideAsync } from "expo-splash-screen";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "@/components/elements/toaster";
import { ArchiveInvalidationProvider } from "@/contexts/archive-invalidation-context";
import { TimerProvider } from "@/contexts/timer-context";
import { useAppBootstrap } from "@/hooks/use-app-bootstrap";
import { NAV_THEME } from "@/theme";

preventAutoHideAsync();

export const unstable_settings = {
  anchor: "index",
};

export default function RootLayout() {
  const [loaded] = useFonts({
    "JetBrainsMono-Bold": require("../../assets/fonts/JetBrainsMono-Bold.ttf"),
    "JetBrainsMono-ExtraBold": require("../../assets/fonts/JetBrainsMono-ExtraBold.ttf"),
    "JetBrainsMono-ExtraLight": require("../../assets/fonts/JetBrainsMono-ExtraLight.ttf"),
    "JetBrainsMono-Light": require("../../assets/fonts/JetBrainsMono-Light.ttf"),
    "JetBrainsMono-Medium": require("../../assets/fonts/JetBrainsMono-Medium.ttf"),
    "JetBrainsMono-Regular": require("../../assets/fonts/JetBrainsMono-Regular.ttf"),
    "JetBrainsMono-SemiBold": require("../../assets/fonts/JetBrainsMono-SemiBold.ttf"),
    "JetBrainsMono-Thin": require("../../assets/fonts/JetBrainsMono-Thin.ttf"),
  });
  const { error, isReady } = useAppBootstrap(loaded);

  useEffect(() => {
    if (loaded && (isReady || error)) {
      hide();
    }
  }, [error, isReady, loaded]);

  if (!(loaded && (isReady || error))) {
    return null;
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center font-medium text-base text-foreground">
          アプリの初期化に失敗しました。再起動してもう一度お試しください。
        </Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={NAV_THEME}>
      <SafeAreaProvider>
        <GestureHandlerRootView>
          <ArchiveInvalidationProvider>
            <TimerProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen
                  name="timer-picker-modal"
                  options={{
                    animation: "fade",
                    presentation: "transparentModal",
                  }}
                />
              </Stack>
            </TimerProvider>
          </ArchiveInvalidationProvider>
          <PortalHost />
          <Toaster />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
