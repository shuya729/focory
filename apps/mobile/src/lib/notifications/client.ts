import Constants from "expo-constants";
import {
  AndroidImportance,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from "expo-notifications";
import { Platform } from "react-native";

const PUSH_NOTIFICATION_CHANNEL_ID = "default";

export async function getCurrentDevicePushToken() {
  if (Platform.OS === "web") {
    return null;
  }

  if (Platform.OS === "android") {
    await setNotificationChannelAsync(PUSH_NOTIFICATION_CHANNEL_ID, {
      importance: AndroidImportance.MAX,
      name: "Default",
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

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    throw new Error("Expo projectId is not configured.");
  }
  const expoPushToken = await getExpoPushTokenAsync({ projectId });

  return expoPushToken.data;
}
