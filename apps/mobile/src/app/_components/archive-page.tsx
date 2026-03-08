import { Text, View, type ViewProps } from "react-native";
import { cn } from "@/utils/cn";

export interface ArchivePageProps extends Omit<ViewProps, "children"> {}

function ArchivePage({
  collapsable = false,
  className,
  ...props
}: ArchivePageProps) {
  return (
    <View
      className={cn("flex-1 items-center justify-center", className)}
      collapsable={collapsable}
      {...props}
    >
      <Text>Archive Page</Text>
    </View>
  );
}

export default ArchivePage;
