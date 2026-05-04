import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import requireAuth, {
  type RequireAuthVariables,
} from "../../middleware/require-auth";
import { errorResponseSchema } from "../../schemas/error";
import { postMessageJsonSchema, postMessageResponseSchema } from "./schemas";
import { MessagesService } from "./service";

const app = new Hono<{
  Bindings: CloudflareBindings;
  Variables: RequireAuthVariables;
}>();

app.post(
  "/",
  describeRoute({
    tags: ["Messages"],
    summary: "パーソナライズされたメッセージを生成して保存",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "生成されたメッセージ",
        content: {
          "application/json": {
            schema: resolver(postMessageResponseSchema),
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
      502: {
        description: "メッセージ生成失敗",
        content: {
          "application/json": {
            schema: resolver(errorResponseSchema),
          },
        },
      },
    },
  }),
  requireAuth,
  validator("json", postMessageJsonSchema),
  async (c) => {
    const dc = c.get("dc");
    const userId = c.get("userId");
    const json = c.req.valid("json");
    const service = new MessagesService(dc, {
      expoPushReceiptsUrl: c.env.EXPO_PUSH_RECEIPTS_URL,
      expoPushSendUrl: c.env.EXPO_PUSH_SEND_URL,
      gcpApiKey: c.env.GCP_API_KEY,
      gcpLocation: c.env.GCP_LOCATION,
      gcpProjectId: c.env.GCP_PROJECT_ID,
      llmModelId: c.env.LLM_MODEL_ID,
    });
    const result = await service.createMessage(userId, json);
    return c.json(result);
  }
);

export default app;
