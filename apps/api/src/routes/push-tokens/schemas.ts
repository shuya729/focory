import z from "zod";

export const expoPushTokenSchema = z
  .string()
  .regex(/^(Exponent|Expo)PushToken\[[^\]]+\]$/, "Invalid Expo push token");

export const postPushTokenJsonSchema = z.object({
  token: expoPushTokenSchema,
});

export type PostPushTokenJsonSchema = z.infer<typeof postPushTokenJsonSchema>;

export const pushTokenResponseSchema = z.object({
  token: expoPushTokenSchema,
});

export type PushTokenResponse = z.infer<typeof pushTokenResponseSchema>;

export const postPushTokenResponseSchema = z.object({
  data: z.object({
    pushToken: pushTokenResponseSchema,
  }),
});

export type PostPushTokenResponse = z.infer<typeof postPushTokenResponseSchema>;
