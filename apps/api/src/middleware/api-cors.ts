import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";

const ALLOW_HEADERS = ["Content-Type"] as const;
const ALLOW_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
] as const;
const CORS_MAX_AGE_SECONDS = 86_400;

const CORS_ORIGINS_REGEX = /[,\s]+/;
const parseCorsOrigins = (corsOrigins: string): string[] =>
  corsOrigins
    .split(CORS_ORIGINS_REGEX)
    .map((origin) => origin.trim())
    .filter(Boolean);

const apiCors = createMiddleware<{
  Bindings: CloudflareBindings;
}>((c, next) => {
  const corsMiddlewareHandler = cors({
    origin: parseCorsOrigins(c.env.CORS_ORIGINS),
    allowHeaders: [...ALLOW_HEADERS],
    allowMethods: [...ALLOW_METHODS],
    maxAge: CORS_MAX_AGE_SECONDS,
  });

  return corsMiddlewareHandler(c, next);
});

export default apiCors;
