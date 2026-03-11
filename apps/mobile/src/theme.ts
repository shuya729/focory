import { DefaultTheme, type Theme } from "@react-navigation/native";

export const THEME = {
  light: {
    background: "hsl(32.7 35.5% 93.9%)",
    foreground: "hsl(0 0% 17.3%)",
    card: "hsl(0 0% 100%)",
    cardForeground: "hsl(0 0% 17.3%)",
    popover: "hsl(156.7 26.5% 86.7%)",
    popoverForeground: "hsl(0 0% 29%)",
    primary: "hsl(166.6 26.9% 48.8%)",
    primaryForeground: "hsl(32.7 35.5% 93.9%)",
    secondary: "hsl(36 17.9% 89%)",
    secondaryForeground: "hsl(0 0% 17.3%)",
    muted: "hsl(32.7 23.4% 90.8%)",
    mutedForeground: "hsl(0 0% 67.1%)",
    accent: "hsl(166.7 32% 61.4%)",
    accentForeground: "hsl(0 0% 17.3%)",
    destructive: "hsl(166.2 33.3% 35.9%)",
    border: "hsl(35 15% 84.3%)",
    input: "hsl(34.3 10% 72.5%)",
    ring: "hsl(0 0% 35.7%)",
    radius: "0.625rem",
    chart1: "hsl(156.7 26.5% 86.7%)",
    chart2: "hsl(166.7 32% 61.4%)",
    chart3: "hsl(166.6 26.9% 48.8%)",
    chart4: "hsl(166.2 33.3% 35.9%)",
    chart5: "hsl(34.3 10% 72.5%)",
  },
};

export const NAV_THEME: Theme = {
  ...DefaultTheme,
  colors: {
    background: THEME.light.background,
    border: THEME.light.border,
    card: THEME.light.card,
    notification: THEME.light.destructive,
    primary: THEME.light.primary,
    text: THEME.light.foreground,
  },
};
