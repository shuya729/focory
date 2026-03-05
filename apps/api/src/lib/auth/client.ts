import { createClerkClient } from "@clerk/backend";

export const getAuth = (env: CloudflareBindings) =>
  createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
  });
