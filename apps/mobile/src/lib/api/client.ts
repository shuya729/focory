import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./paths";

const fetchClient = createFetchClient<paths>({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
  credentials: "include",
});

export const apiClient = createClient<paths>(fetchClient);
