import { z } from "zod";

const MAX_CONTENT_LENGTH = 5000;
const MAX_EMAIL_LENGTH = 255;
const MAX_NAME_LENGTH = 100;

const optionalEmailSchema = z
  .string()
  .trim()
  .max(MAX_EMAIL_LENGTH, {
    error: `メールアドレスは${MAX_EMAIL_LENGTH}文字以内で入力してください。`,
  })
  .refine((value) => value.length === 0 || z.email().safeParse(value).success, {
    error: "有効なメールアドレスを入力してください。",
  })
  .transform((value) => (value.length > 0 ? value : null));

export const contactFormSchema = z.object({
  content: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "お問い合わせ内容を入力してください。"
          : "お問い合わせ内容を文字列で入力してください。",
    })
    .trim()
    .min(1, { error: "お問い合わせ内容を入力してください。" })
    .max(MAX_CONTENT_LENGTH, {
      error: `お問い合わせ内容は${MAX_CONTENT_LENGTH}文字以内で入力してください。`,
    }),
  email: optionalEmailSchema,
  name: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "お名前を入力してください。"
          : "お名前を文字列で入力してください。",
    })
    .trim()
    .min(1, { error: "お名前を入力してください。" })
    .max(MAX_NAME_LENGTH, {
      error: `お名前は${MAX_NAME_LENGTH}文字以内で入力してください。`,
    }),
});

export type ContactFormInput = z.input<typeof contactFormSchema>;
export type ContactFormOutput = z.output<typeof contactFormSchema>;
