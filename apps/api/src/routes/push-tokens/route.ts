import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import requireAuth, {
  type RequireAuthVariables,
} from "../../middleware/require-auth";
import { errorResponseSchema } from "../../schemas/error";
import {
  postPushTokenJsonSchema,
  postPushTokenResponseSchema,
} from "./schemas";
import { PushTokensService } from "./service";

const app = new Hono<{
  Variables: RequireAuthVariables;
}>();

app.post(
  "/",
  describeRoute({
    tags: ["Push Tokens"],
    summary: "プッシュトークンを登録",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "登録済みまたは更新済みのプッシュトークン",
        content: {
          "application/json": {
            schema: resolver(postPushTokenResponseSchema),
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
      401: {
        description: "未認証",
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
  requireAuth,
  validator("json", postPushTokenJsonSchema),
  async (c) => {
    const dc = c.get("dc");
    const userId = c.get("userId");
    const json = c.req.valid("json");
    const service = new PushTokensService(dc);
    const result = await service.savePushToken(userId, json);
    return c.json(result);
  }
);

export default app;
