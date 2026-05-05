import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import type { ClientsVariables } from "../../middleware/with-clients";
import { errorResponseSchema } from "../../schemas/error";
import { postContactJsonSchema, postContactResponseSchema } from "./schemas";
import { ContactsService } from "./service";

const app = new Hono<{
  Variables: ClientsVariables;
}>();

app.post(
  "/",
  describeRoute({
    tags: ["Contacts"],
    summary: "問い合わせ内容を保存",
    responses: {
      200: {
        description: "保存された問い合わせ",
        content: {
          "application/json": {
            schema: resolver(postContactResponseSchema),
          },
        },
      },
      400: {
        description: "リクエスト不正",
        content: {
          "application/json": {
            schema: resolver(errorResponseSchema),
          },
        },
      },
      500: {
        description: "サーバーエラー",
        content: {
          "application/json": {
            schema: resolver(errorResponseSchema),
          },
        },
      },
    },
  }),
  validator("json", postContactJsonSchema),
  async (c) => {
    const dc = c.get("dc");
    const json = c.req.valid("json");
    const service = new ContactsService(dc);
    const result = await service.createContact(json);
    return c.json(result);
  }
);

export default app;
