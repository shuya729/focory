import type { ValidationTargets } from "hono";
import { validator } from "hono-openapi";
import type z from "zod";
import { ValidationError } from "../errors";

export const validateRequest = <
  Schema extends z.ZodType,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: Schema
) =>
  validator(target, schema, (result) => {
    if (!result.success) {
      throw new ValidationError("Invalid request");
    }
  });
