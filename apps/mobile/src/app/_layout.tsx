import "../global.css";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { hide, preventAutoHideAsync } from "expo-splash-screen";
import { useEffect } from "react";

preventAutoHideAsync();

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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
