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
}>();

app.use(logger());
app.use(apiCors);
app.use(withClients);
app.on(["POST", "GET"], "/auth/*", (c) => c.get("ac").handler(c.req.raw));
app.route("/contacts", contacts);
app.route("/push-tokens", pushTokens);
app.route("/messages", messages);

app.onError(handleError);

export default app;
