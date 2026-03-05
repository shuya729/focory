import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import requireAuth, {
  type RequireAuthVariables,
} from "../../middleware/require-auth";
import { errorResponseSchema } from "../../schemas/error";
import {
  getMeResponseSchema,
  patchMeJsonSchema,
  patchMeResponseSchema,
} from "./schemas";
import { MeService } from "./service";

const app = new Hono<{
  Variables: RequireAuthVariables;
}>();

app.get(
  "/",
  describeRoute({
    tags: ["Me"],
    summary: "ユーザー情報を取得",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "ユーザー情報",
        content: {
          "application/json": {
            schema: resolver(getMeResponseSchema),
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
      404: {
        description: "ユーザーが見つからない",
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
  async (c) => {
    const dc = c.get("dc");
    const userId = c.get("userId");
    const service = new MeService(dc);
    const result = await service.getMe(userId);
    return c.json(result);
  }
);

app.patch(
  "/",
  describeRoute({
    tags: ["Me"],
    summary: "ユーザー情報を更新",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "更新されたユーザー情報",
        content: {
          "application/json": {
            schema: resolver(patchMeResponseSchema),
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
      404: {
        description: "ユーザーまたはが見つからない",
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
  validator("json", patchMeJsonSchema),
  async (c) => {
    const dc = c.get("dc");
    const userId = c.get("userId");
    const json = c.req.valid("json");
    const service = new MeService(dc);
    const result = await service.patchMe(userId, json);
    return c.json(result);
  }
);

app.delete(
  "/",
  describeRoute({
    tags: ["Me"],
    summary: "ユーザー情報を削除",
    security: [{ bearerAuth: [] }],
    responses: {
      204: {
        description: "削除成功",
      },
      401: {
        description: "未認証",
        content: {
          "application/json": {
            schema: resolver(errorResponseSchema),
          },
        },
      },
      404: {
        description: "ユーザーが見つからない",
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
  async (c) => {
    const dc = c.get("dc");
    const userId = c.get("userId");
    const service = new MeService(dc);
    await service.deleteMe(userId);
    return c.body(null, 204);
  }
);

export default app;
