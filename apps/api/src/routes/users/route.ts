import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import type { ClientsVariables } from "../../middleware/with-clients";
import { errorResponseSchema } from "../../schemas/error";
import {
  getUserParamSchema,
  getUserResponseSchema,
  getUsersQuerySchema,
  getUsersResponseSchema,
} from "./schemas";
import { UsersService } from "./service";

const app = new Hono<{
  Variables: ClientsVariables;
}>();

app.get(
  "/",
  describeRoute({
    tags: ["Users"],
    summary: "ユーザー一覧を取得",
    responses: {
      200: {
        description: "ユーザー一覧",
        content: {
          "application/json": {
            schema: resolver(getUsersResponseSchema),
          },
        },
      },
      400: {
        description: "クエリパラメータ不正",
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
  validator("query", getUsersQuerySchema),
  async (c) => {
    const dc = c.get("dc");
    const query = c.req.valid("query");
    const service = new UsersService(dc);
    const result = await service.getUsers(query);
    return c.json(result);
  }
);

app.get(
  "/:id",
  describeRoute({
    tags: ["Users"],
    summary: "ユーザー詳細を取得",
    responses: {
      200: {
        description: "ユーザー詳細",
        content: {
          "application/json": {
            schema: resolver(getUserResponseSchema),
          },
        },
      },
      400: {
        description: "パスパラメータ不正",
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
  validator("param", getUserParamSchema),
  async (c) => {
    const dc = c.get("dc");
    const param = c.req.valid("param");
    const service = new UsersService(dc);
    const result = await service.getUser(param.id);
    return c.json(result);
  }
);

export default app;
