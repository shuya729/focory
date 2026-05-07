import createFetchClient from "openapi-fetch";
import type { paths } from "./paths";

export const serverApi = createFetchClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
});
