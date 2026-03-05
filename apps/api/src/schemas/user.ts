import z from "zod";
import { objectSchema } from "./object";

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string().max(250),
  objectId: z.uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  object: objectSchema.nullable().optional(),
});

export type User = z.infer<typeof userSchema>;
