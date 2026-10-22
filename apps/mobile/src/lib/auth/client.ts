import { expoClient } from "@better-auth/expo/client";
import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import {
  getItem,
  getItemAsync,
  setItem,
  setItemAsync,
} from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: `${process.env.EXPO_PUBLIC_API_URL}/v1/auth`,
  plugins: [
    expoClient({
      storagePrefix: "focory",
      storage: { getItem, getItemAsync, setItem, setItemAsync },
    }),
    anonymousClient(),
  ],
});
