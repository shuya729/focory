import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import withClients, { type ClientsVariables } from "../middleware/with-clients";
import contacts from "./contacts/route";
import messages from "./messages/route";
import pushTokens from "./push-tokens/route";

const app = new Hono<{
  Variables: ClientsVariables;
}>();

app.use(logger());
app.use(withClients);
app.on(["POST", "GET"], "/auth/*", (c) => c.get("ac").handler(c.req.raw));
app.route("/contacts", contacts);
app.route("/push-tokens", pushTokens);
app.route("/messages", messages);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    if (err.cause) {
      console.error(err.cause);
    }
    return c.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return c.json({ error: "Internal server error" }, { status: 500 });
});

export default app;
