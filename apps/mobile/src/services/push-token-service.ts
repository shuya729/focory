import Constants from "expo-constants";
import {
  AndroidImportance,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from "expo-notifications";
import { Platform } from "react-native";
import type { paths } from "@/lib/api/paths";
import { postAuthenticatedJson } from "./api-service";

const PUSH_NOTIFICATION_CHANNEL_ID = "default";

type PostPushTokenRequestBody =
  paths["/push-tokens"]["post"]["requestBody"]["content"]["application/json"];
type PostPushTokenResponse =
  paths["/push-tokens"]["post"]["responses"][200]["content"]["application/json"];

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

export async function registerCurrentDevicePushToken() {
  const token = await getCurrentDevicePushToken();

  if (!token) {
    return null;
  }

  const response = await postAuthenticatedJson<PostPushTokenResponse>(
    "/push-tokens",
    {
      token,
    } satisfies PostPushTokenRequestBody
  );

  return response.data.pushToken.token;
}
