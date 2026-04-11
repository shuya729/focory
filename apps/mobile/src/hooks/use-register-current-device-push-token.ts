import Constants from "expo-constants";
import {
  AndroidImportance,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from "expo-notifications";
import { useCallback } from "react";
import { Platform } from "react-native";
import { apiClient } from "@/lib/api/client";
import { toApiError } from "@/lib/api/error";
import type { paths } from "@/lib/api/paths";

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

async function getCurrentDevicePushToken() {
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

export function useRegisterCurrentDevicePushToken() {
  const { mutateAsync } = apiClient.useMutation("post", "/push-tokens");

  const registerCurrentDevicePushToken = useCallback(async () => {
    const token = await getCurrentDevicePushToken();

    if (!token) {
      return null;
    }

    try {
      const response = await mutateAsync({
        body: {
          token,
        } satisfies PostPushTokenRequestBody,
      });

      return response.data.pushToken.token;
    } catch (error) {
      throw toApiError(error, "プッシュトークンの登録に失敗しました。");
    }
  }, [mutateAsync]);

  return { registerCurrentDevicePushToken };
}
