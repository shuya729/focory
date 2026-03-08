import { Text, View, type ViewProps } from "react-native";
import { cn } from "@/utils/cn";

export interface SettingsPageProps extends Omit<ViewProps, "children"> {
  handleChangePage: (page: number) => void;
}

function SettingsPage({
  collapsable = false,
  className,
  handleChangePage,
  ...props
}: SettingsPageProps) {
  return (
    <View
      className={cn("flex-1 items-center justify-center", className)}
      collapsable={collapsable}
      {...props}
    >
      <Text>Settings Page</Text>
    </View>
  );
}

export default SettingsPage;
