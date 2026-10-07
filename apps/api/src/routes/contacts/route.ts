import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { validateRequest } from "../../middleware/validate-request";
import type { ClientsVariables } from "../../middleware/with-clients";
import { errorResponseSchema } from "../../schemas/error";
import { ContactsRepository } from "./repository";
import { postContactJsonSchema, postContactResponseSchema } from "./schemas";
import { ContactsService } from "./service";

const app = new Hono<{
  Variables: ClientsVariables;
}>().post(
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
  validateRequest("json", postContactJsonSchema),
  async (c) => {
    const dc = c.get("dc");
    const json = c.req.valid("json");
    const service = new ContactsService(new ContactsRepository(dc));
    const contact = await service.createContact(json);
    return c.json({
      data: {
        contact: {
          ...contact,
          createdAt: contact.createdAt.toISOString(),
          updatedAt: contact.updatedAt.toISOString(),
        },
      },
    });
  }
);

export default app;
