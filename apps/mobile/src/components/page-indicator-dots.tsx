import { View } from "react-native";

interface PageIndicatorDotsProps {
  currentPage: number;
  pagesLength: number;
}

export function PageIndicatorDots({
  currentPage,
  pagesLength,
}: PageIndicatorDotsProps) {
  return (
    <View className="flex-row items-center justify-center gap-3 py-2">
      {Array.from({ length: pagesLength }).map((_, index) => {
        const isActivePage = currentPage === index;

        return (
          <View
            className={
              isActivePage
                ? "h-2.5 w-2.5 rounded-full bg-app-accent"
                : "h-2 w-2 rounded-full bg-app-neutral-soft"
            }
            key={`page-dot-${index.toString()}`}
          />
        );
      })}
    </View>
  );
}
