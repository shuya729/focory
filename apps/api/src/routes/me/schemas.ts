import z from "zod";
import { userSchema } from "../../schemas/user";

export const patchMeJsonSchema = z.object({
  name: z.string().min(1).max(250),
});

export type PatchMeJsonSchema = z.infer<typeof patchMeJsonSchema>;

export const meResponseSchema = z.object({
  id: userSchema.shape.id,
  name: userSchema.shape.name,
});

export type MeResponse = z.infer<typeof meResponseSchema>;

export const getMeResponseSchema = z.object({
  data: z.object({
    me: meResponseSchema,
  }),
});

export type GetMeResponse = z.infer<typeof getMeResponseSchema>;

export const patchMeResponseSchema = z.object({
  data: z.object({
    me: meResponseSchema,
  }),
});

export type PatchMeResponse = z.infer<typeof patchMeResponseSchema>;
