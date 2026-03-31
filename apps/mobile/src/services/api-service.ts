import { authClient } from "@/lib/auth/client";

interface ErrorResponseBody {
  error?: string;
}

const getApiBaseUrl = () => {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured.");
  }

  return apiBaseUrl;
};

const toError = (error: unknown) =>
  error instanceof Error ? error : new Error("Unknown error");

async function parseErrorMessage(response: Response) {
  try {
    const errorBody = (await response.json()) as ErrorResponseBody;
    return errorBody.error ?? "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export async function postAuthenticatedJson<TResponse>(
  pathname: string,
  body: unknown
): Promise<TResponse> {
  const headers = new Headers({
    "Content-Type": "application/json",
  });
  const cookie = authClient.getCookie();

  if (cookie) {
    headers.set("Cookie", cookie);
  }

  const response = await fetch(`${getApiBaseUrl()}${pathname}`, {
    body: JSON.stringify(body),
    credentials: "omit",
    headers,
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  try {
    return (await response.json()) as TResponse;
  } catch (error) {
    throw toError(error);
  }
}
