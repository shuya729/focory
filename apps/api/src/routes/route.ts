import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import withClients from "../middleware/with-clients";
import me from "./me/route";
import users from "./users/route";

const app = new Hono();

app.use(logger());
app.use(withClients);
app.route("/users", users);
app.route("/me", me);

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
