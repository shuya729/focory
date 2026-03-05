import z from "zod";

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string().max(250),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;
