import z from "zod";
import {
  objectContentTypes,
  objectStatuses,
  objectTypes,
} from "../lib/db/schema";

export const objectSchema = z.object({
  id: z.uuid(),
  key: z.string(),
  type: z.enum(objectTypes),
  status: z.enum(objectStatuses),
  contentType: z.enum(objectContentTypes),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Object = z.infer<typeof objectSchema>;
