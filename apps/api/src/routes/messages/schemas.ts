import z from "zod";
import { BEHAVIOR_VALUES } from "./prompots";

const MESSAGE_CONTEXT_MAX_LENGTH = 1000;

export const messageTypeSchema = z.enum(["start", "stop", "restart", "finish"]);

export type MessageType = z.infer<typeof messageTypeSchema>;

export const behaviorSchema = z.enum(BEHAVIOR_VALUES);

const optionalMessageContextSchema = z
  .string()
  .trim()
  .max(MESSAGE_CONTEXT_MAX_LENGTH)
  .nullish();

export const postMessageJsonSchema = z
  .object({
    timerId: z.uuid(),
    type: messageTypeSchema,
    behavior: behaviorSchema,
    objective: optionalMessageContextSchema,
    purpose: optionalMessageContextSchema,
    durationSec: z.number().int().positive(),
    elapsedSec: z.number().int().min(0),
  })
  .refine((value) => value.elapsedSec <= value.durationSec, {
    message: "elapsedSec must be less than or equal to durationSec",
    path: ["elapsedSec"],
  });

export type PostMessageJsonSchema = z.infer<typeof postMessageJsonSchema>;

export const messageResponseSchema = z.object({
  id: z.uuid(),
  timerId: z.uuid(),
  type: messageTypeSchema,
  behavior: behaviorSchema,
  content: z.string().min(1),
  objective: z.string().nullable(),
  purpose: z.string().nullable(),
  durationSec: z.number().int().positive(),
  elapsedSec: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MessageResponse = z.infer<typeof messageResponseSchema>;

export const postMessageResponseSchema = z.object({
  data: z.object({
    message: messageResponseSchema,
  }),
});

export type PostMessageResponse = z.infer<typeof postMessageResponseSchema>;
