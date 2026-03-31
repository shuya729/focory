import Constants from "expo-constants";
import {
  AndroidImportance,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { PageIndicatorDots } from "@/components/elements/page-indicator-dots";
import { InitialPageIndex, PAGES } from "@/constants/pages";
import ArchivePage from "./_components/archive-page";
import SettingsPage from "./_components/settings-page";
import TimerPage from "./_components/timer-page";

const PUSH_NOTIFICATION_CHANNEL_ID = "default";
const isDevelopment = process.env.NODE_ENV === "development";

const getExpoProjectId = (): string => {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error("Expo projectId is not configured.");
  }

  return projectId;
};

const getExpoPushToken = async (): Promise<string | null> => {
  if (Platform.OS === "web") {
    return null;
  }

  if (Platform.OS === "android") {
    await setNotificationChannelAsync(PUSH_NOTIFICATION_CHANNEL_ID, {
      name: "Default",
      importance: AndroidImportance.MAX,
    });
  }

  const { status: currentPermissionStatus } = await getPermissionsAsync();
  const permissionStatus =
    currentPermissionStatus === "granted"
      ? currentPermissionStatus
      : (await requestPermissionsAsync()).status;

  if (permissionStatus !== "granted") {
    return null;
  }

  const expoPushToken = await getExpoPushTokenAsync({
    projectId: getExpoProjectId(),
  });

  return expoPushToken.data;
};

export default function Index() {
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState<number>(InitialPageIndex);

  useEffect(() => {
    let isActive = true;

    const logExpoPushToken = async () => {
      try {
        const expoPushToken = await getExpoPushToken();

        if (!(isActive && isDevelopment)) {
          return;
        }

        if (expoPushToken) {
          console.info("Expo push token:", expoPushToken);
          return;
        }

        console.info("Expo push token was not acquired.");
      } catch (error: unknown) {
        if (isDevelopment) {
          console.error("Failed to get Expo push token.", error);
        }
      }
    };

    logExpoPushToken();

    return () => {
      isActive = false;
    };
  }, []);

  const handlePageSelected = (event: PagerViewOnPageSelectedEvent) => {
    setCurrentPage(event.nativeEvent.position);
  };

  const handleChangePage = (page: number) => {
    pagerRef.current?.setPage(page);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <PagerView
        initialPage={InitialPageIndex}
        onPageSelected={handlePageSelected}
        ref={pagerRef}
        style={{ flex: 1 }}
      >
        <SettingsPage
          handleChangePage={handleChangePage}
          key={PAGES.settings.key}
        />
        <TimerPage handleChangePage={handleChangePage} key={PAGES.timer.key} />
        <ArchivePage
          handleChangePage={handleChangePage}
          key={PAGES.archive.key}
        />
      </PagerView>
      <PageIndicatorDots
        currentPage={currentPage}
        pagesLength={Object.keys(PAGES).length}
      />
    </SafeAreaView>
  );
}
