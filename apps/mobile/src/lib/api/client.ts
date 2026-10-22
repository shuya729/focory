import createFetchClient, { type Middleware } from "openapi-fetch";
import createClient from "openapi-react-query";
import { authClient } from "../auth/client";
import type { paths } from "./paths";

const middleware: Middleware = {
  onRequest: async ({ request }) => {
    const cookie = await authClient.getCookie();

    if (cookie) {
      request.headers.set("Cookie", cookie);
    }

    return request;
  },
};

const fetchClient = createFetchClient<paths>({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
  credentials: "include",
});
fetchClient.use(middleware);

export const apiClient = createClient<paths>(fetchClient);
