import { Text, View, type ViewProps } from "react-native";
import { cn } from "@/utils/cn";

export interface TimerPageProps extends Omit<ViewProps, "children"> {}

function TimerPage({
  collapsable = false,
  className,
  ...props
}: TimerPageProps) {
  return (
    <View
      className={cn("flex-1 items-center justify-center", className)}
      collapsable={collapsable}
      {...props}
    >
      <Text>Timer Page</Text>
    </View>
  );
}

export default TimerPage;
