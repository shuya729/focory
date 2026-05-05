import z from "zod";

const CONTACT_NAME_MAX_LENGTH = 200;
const CONTACT_EMAIL_MAX_LENGTH = 320;
const CONTACT_CONTENT_MAX_LENGTH = 5000;

export const postContactJsonSchema = z.object({
  name: z.string().trim().min(1).max(CONTACT_NAME_MAX_LENGTH),
  email: z
    .string()
    .trim()
    .pipe(z.email().max(CONTACT_EMAIL_MAX_LENGTH))
    .nullable(),
  content: z.string().trim().min(1).max(CONTACT_CONTENT_MAX_LENGTH),
});

export type PostContactJsonSchema = z.infer<typeof postContactJsonSchema>;

export const contactResponseSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  email: z.string().nullable(),
  content: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ContactResponse = z.infer<typeof contactResponseSchema>;

export const postContactResponseSchema = z.object({
  data: z.object({
    contact: contactResponseSchema,
  }),
});

export type PostContactResponse = z.infer<typeof postContactResponseSchema>;
