import "react-native-get-random-values";
import { useRef, useState } from "react";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { PageIndicatorDots } from "@/components/elements/page-indicator-dots";
import {
  ARCHIVE_PAGE,
  DEFAULT_PAGE,
  PAGES,
  SETTINGS_PAGE,
  TIMER_PAGE,
} from "@/constants/pages";
import { useInitialPushTokenRegistration } from "@/hooks/use-initial-push-token-registration";
import ArchivePage from "./_components/archive-page";
import SettingsPage from "./_components/settings-page";
import TimerPage from "./_components/timer-page";

export default function Index() {
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState<number>(DEFAULT_PAGE.page);
  const [archiveRefreshKey, setArchiveRefreshKey] = useState(0);
  useInitialPushTokenRegistration();

  const handlePageSelected = (event: PagerViewOnPageSelectedEvent) => {
    setCurrentPage(event.nativeEvent.position);
  };

  const handleChangePage = (page: number) => {
    pagerRef.current?.setPage(page);
  };

  const handleArchiveChanged = () => {
    setArchiveRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <PagerView
        initialPage={DEFAULT_PAGE.page}
        onPageSelected={handlePageSelected}
        ref={pagerRef}
        style={{ flex: 1 }}
      >
        <SettingsPage
          handleChangePage={handleChangePage}
          key={SETTINGS_PAGE.key}
        />
        <TimerPage
          handleChangePage={handleChangePage}
          key={TIMER_PAGE.key}
          onArchiveChanged={handleArchiveChanged}
        />
        <ArchivePage
          handleChangePage={handleChangePage}
          key={ARCHIVE_PAGE.key}
          refreshKey={archiveRefreshKey}
        />
      </PagerView>
      <PageIndicatorDots currentPage={currentPage} pagesLength={PAGES.length} />
    </SafeAreaView>
  );
}
