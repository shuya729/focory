import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ConfigurationError,
  SaveFailedError,
  TextGenerationError,
} from "../../src/errors";
import { handleError } from "../../src/middleware/handle-error";

describe("handleError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    {
      error: new HTTPException(401, {
        message: "Unauthorized",
        cause: new Error("private auth details"),
      }),
      status: 401,
      message: "Unauthorized",
    },
    {
      error: new SaveFailedError("Failed to save contact"),
      status: 500,
      message: "Failed to save contact",
    },
    {
      error: new ConfigurationError("LLM is not configured"),
      status: 500,
      message: "LLM is not configured",
    },
    {
      error: new TextGenerationError("Failed to generate message", {
        cause: new Error("private generation details"),
      }),
      status: 502,
      message: "Failed to generate message",
    },
    {
      error: new Error("private database details"),
      status: 500,
      message: "Internal server error",
    },
  ])("$message を $status として返し、内部の原因を公開しない", async ({
    error,
    status,
    message,
  }) => {
    const logError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const app = new Hono();
    app.onError(handleError);
    app.get("/", () => {
      throw error;
    });
    const response = await app.request("/");
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ error: message });
    expect(logError).toHaveBeenCalledWith(error.cause ?? error);
  });
});
