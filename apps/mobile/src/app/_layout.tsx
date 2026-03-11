import { ThemeProvider } from "@react-navigation/native";
import "../global.css";
import { PortalHost } from "@rn-primitives/portal";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { hide, preventAutoHideAsync } from "expo-splash-screen";
import { useEffect } from "react";
import { TimerDurationProvider } from "@/hooks/use-timer-duration";
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

  useEffect(() => {
    if (loaded) {
      hide();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <TimerDurationProvider>
      <ThemeProvider value={NAV_THEME}>
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
        <PortalHost />
      </ThemeProvider>
    </TimerDurationProvider>
  );
}
