import { useRef, useState } from "react";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { PageIndicatorDots } from "@/components/page-indicator-dots";
import { InitialPageIndex, Pages } from "@/constants/pages";
import ArchivePage from "./_components/archive-page";
import SettingsPage from "./_components/settings-page";
import TimerPage from "./_components/timer-page";

export default function Index() {
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState<number>(InitialPageIndex);

  const handlePageSelected = (event: PagerViewOnPageSelectedEvent) => {
    setCurrentPage(event.nativeEvent.position);
  };

  const handleChangePage = (page: number) => {
    pagerRef.current?.setPage(page);
  };

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <PagerView
        initialPage={InitialPageIndex}
        onPageSelected={handlePageSelected}
        ref={pagerRef}
        style={{ flex: 1 }}
      >
        <SettingsPage
          handleChangePage={handleChangePage}
          key={Pages.settings.key}
        />
        <TimerPage handleChangePage={handleChangePage} key={Pages.timer.key} />
        <ArchivePage
          handleChangePage={handleChangePage}
          key={Pages.archive.key}
        />
      </PagerView>
      <PageIndicatorDots
        currentPage={currentPage}
        pagesLength={Object.keys(Pages).length}
      />
    </SafeAreaView>
  );
}
