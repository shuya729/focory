import { Hono } from "hono";
import { logger } from "hono/logger";
import apiCors from "../middleware/api-cors";
import { handleError } from "../middleware/handle-error";
import withClients, { type ClientsVariables } from "../middleware/with-clients";
import contacts from "./contacts/route";
import messages from "./messages/route";
import pushTokens from "./push-tokens/route";

const app = new Hono<{
  Variables: ClientsVariables;
}>()
  .use(logger())
  .use(apiCors)
  .use(withClients)
  .on(["POST", "GET"], "/auth/*", (c) => c.get("ac").handler(c.req.raw))
  .onError(handleError)
  .route("/contacts", contacts)
  .route("/push-tokens", pushTokens)
  .route("/messages", messages);

export type AppType = typeof app;
export default app;
