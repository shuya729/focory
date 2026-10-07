import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  ConfigurationError,
  SaveFailedError,
  TextGenerationError,
  ValidationError,
} from "../errors";

export const handleError: ErrorHandler = (error, c) => {
  if (error instanceof ValidationError) {
    return c.json({ error: error.message }, 400);
  }

  if (error instanceof HTTPException) {
    if (error.cause) {
      console.error(error.cause);
    }
    return c.json({ error: error.message }, error.status);
  }

  console.error(error.cause ?? error);
  if (error instanceof TextGenerationError) {
    return c.json({ error: error.message }, 502);
  }
  if (error instanceof SaveFailedError || error instanceof ConfigurationError) {
    return c.json({ error: error.message }, 500);
  }
  return c.json({ error: "Internal server error" }, 500);
};
