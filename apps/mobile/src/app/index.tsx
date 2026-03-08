import { useState } from "react";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { PageIndicatorDots } from "@/components/page-indicator-dots";
import {
  ARCHIVE_PAGE,
  INITIAL_PAGE_INDEX,
  PAGES,
  SETTINGS_PAGE,
  TIMER_PAGE,
} from "@/constants/pages";
import ArchivePage from "./_components/archive-page";
import SettingsPage from "./_components/settings-page";
import TimerPage from "./_components/timer-page";

export default function Index() {
  const [currentPage, setCurrentPage] = useState<number>(INITIAL_PAGE_INDEX);

  const handlePageSelected = (event: PagerViewOnPageSelectedEvent) => {
    setCurrentPage(event.nativeEvent.position);
  };

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <PagerView
        initialPage={INITIAL_PAGE_INDEX}
        onPageSelected={handlePageSelected}
        style={{ flex: 1 }}
      >
        <SettingsPage key={SETTINGS_PAGE} />
        <TimerPage key={TIMER_PAGE} />
        <ArchivePage key={ARCHIVE_PAGE} />
      </PagerView>
      <PageIndicatorDots currentPage={currentPage} pagesLength={PAGES.length} />
    </SafeAreaView>
  );
}
