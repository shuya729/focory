import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import requireAuth, {
  type RequireAuthVariables,
} from "../../middleware/require-auth";
import { validateRequest } from "../../middleware/validate-request";
import { errorResponseSchema } from "../../schemas/error";
import { LlmService } from "../../services/llm";
import { PushNotificationService } from "../../services/push-notifications";
import { PushTokensRepository } from "../push-tokens/repository";
import { MessagesRepository } from "./repository";
import { postMessageJsonSchema, postMessageResponseSchema } from "./schemas";
import { MessagesService } from "./service";

const app = new Hono<{
  Bindings: CloudflareBindings;
  Variables: RequireAuthVariables;
}>().post(
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
  validateRequest("json", postMessageJsonSchema),
  async (c) => {
    const dc = c.get("dc");
    const userId = c.get("userId");
    const json = c.req.valid("json");
    const service = new MessagesService({
      repository: new MessagesRepository(dc),
      llmService: new LlmService({
        apiKey: c.env.GCP_API_KEY,
        location: c.env.GCP_LOCATION,
        projectId: c.env.GCP_PROJECT_ID,
        modelId: c.env.LLM_MODEL_ID,
      }),
      pushNotificationService: new PushNotificationService(
        new PushTokensRepository(dc),
        {
          receiptsUrl: c.env.EXPO_PUSH_RECEIPTS_URL,
          sendUrl: c.env.EXPO_PUSH_SEND_URL,
        }
      ),
    });
    const message = await service.createMessage(userId, json);
    return c.json({
      data: {
        message: {
          ...message,
          createdAt: message.createdAt.toISOString(),
          updatedAt: message.updatedAt.toISOString(),
        },
      },
    });
  }
);

export default app;
