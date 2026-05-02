import Constants from "expo-constants";
import {
  AndroidImportance,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from "expo-notifications";
import { Platform } from "react-native";
import { fetchClient } from "@/lib/api/client";
import type { paths } from "@/lib/api/paths";
import { toApiError } from "@/utils/api-error-utils";

const PUSH_NOTIFICATION_CHANNEL_ID = "default";

type PostPushTokenRequestBody =
  paths["/push-tokens"]["post"]["requestBody"]["content"]["application/json"];

const getExpoProjectId = () => {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error("Expo projectId is not configured.");
  }

  return projectId;
};

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

  const expoPushToken = await getExpoPushTokenAsync({
    projectId: getExpoProjectId(),
  });

  return expoPushToken.data;
}

export async function registerCurrentDevicePushToken() {
  const token = await getCurrentDevicePushToken();

  if (!token) {
    return null;
  }

  const { data, error } = await fetchClient.POST("/push-tokens", {
    body: { token } satisfies PostPushTokenRequestBody,
  });

  if (error) {
    throw toApiError(error, "プッシュトークンの登録に失敗しました。");
  }

  return data?.data.pushToken.token ?? null;
}
