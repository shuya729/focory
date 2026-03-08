import { Text, View, type ViewProps } from "react-native";
import { cn } from "@/utils/cn";

export interface ArchivePageProps extends Omit<ViewProps, "children"> {
  handleChangePage: (page: number) => void;
}

function ArchivePage({
  collapsable = false,
  className,
  handleChangePage,
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
