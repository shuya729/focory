import { expoClient } from "@better-auth/expo/client";
import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: `${process.env.EXPO_PUBLIC_API_URL}/auth`,
  plugins: [
    expoClient({
      storagePrefix: "focory",
      storage: SecureStore,
    }),
    anonymousClient(),
  ],
});
