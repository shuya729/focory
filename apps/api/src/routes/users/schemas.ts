import z from "zod";
import { userSchema } from "../../schemas/user";

export const getUsersQuerySchema = z.object({
  q: z.string().optional(),
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GetUsersQuerySchema = z.infer<typeof getUsersQuerySchema>;

export const getUserParamSchema = z.object({
  id: z.uuid(),
});

export type GetUserParamSchema = z.infer<typeof getUserParamSchema>;

export const userResponseSchema = z.object({
  id: userSchema.shape.id,
  name: userSchema.shape.name,
});

export type UserResponse = z.infer<typeof userResponseSchema>;

export const getUsersResponseSchema = z.object({
  data: z.object({
    users: z.array(userResponseSchema),
  }),
  meta: z.object({
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    nextCursor: z.string().nullable(),
  }),
});

export type GetUsersResponse = z.infer<typeof getUsersResponseSchema>;

export const getUserResponseSchema = z.object({
  data: z.object({
    user: userResponseSchema,
  }),
});

export type GetUserResponse = z.infer<typeof getUserResponseSchema>;
