import { Toaster as SonnerToaster, type ToasterProps } from "sonner-native";
import { THEME } from "@/theme";

const FONT_FAMILY_SEMIBOLD = "JetBrainsMono-SemiBold";

export function Toaster({ toastOptions, ...props }: ToasterProps) {
  const { style, titleStyle, ...rest } = toastOptions ?? {};
  return (
    <SonnerToaster
      richColors={false}
      {...props}
      toastOptions={{
        style: {
          backgroundColor: THEME.light.muted,
          borderWidth: 1,
          borderColor: THEME.light.border,
          shadowColor: "#000000",
          shadowOpacity: 0.1,
          ...style,
        },
        titleStyle: {
          color: THEME.light.foreground,
          fontFamily: FONT_FAMILY_SEMIBOLD,
          ...titleStyle,
        },
        ...rest,
      }}
    />
  );
}
