import z from "zod";
import { objectSchema } from "../../schemas/object";
import { userSchema } from "../../schemas/user";

export const putMeJsonSchema = z.object({
  name: z.string().min(1).max(250),
  objectId: z.uuid(),
});

export type PutMeJsonSchema = z.infer<typeof putMeJsonSchema>;

export const userObjectSchema = objectSchema.pick({
  id: true,
  key: true,
});

export type UserObject = z.infer<typeof userObjectSchema>;

export const meResponseSchema = z.object({
  id: userSchema.shape.id,
  name: userSchema.shape.name,
  object: userObjectSchema.nullable(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;

export const getMeResponseSchema = z.object({
  data: z.object({
    me: meResponseSchema,
  }),
});

export type GetMeResponse = z.infer<typeof getMeResponseSchema>;

export const putMeResponseSchema = z.object({
  data: z.object({
    me: meResponseSchema,
  }),
});

export type PutMeResponse = z.infer<typeof putMeResponseSchema>;
