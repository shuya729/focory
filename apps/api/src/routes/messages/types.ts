import type { BEHAVIOR_VALUES, MESSAGE_TYPE_VALUES } from "./constants";

export type MessageType = (typeof MESSAGE_TYPE_VALUES)[number];
export type BehaviorValue = (typeof BEHAVIOR_VALUES)[number];

export interface CreateMessageInput {
  timerId: string;
  type: MessageType;
  behavior: BehaviorValue;
  objective?: string | null;
  purpose?: string | null;
  durationSec: number;
  elapsedSec: number;
}

export interface CreateMessageValue extends CreateMessageInput {
  userId: string;
  content: string;
  objective: string | null;
  purpose: string | null;
}

export interface StoredMessage extends Omit<CreateMessageValue, "userId"> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessagesRepositoryInterface {
  create(value: CreateMessageValue): Promise<StoredMessage | undefined>;
}

export interface TextGenerationService {
  generateText(prompt: string): Promise<string>;
}

export interface PushNotificationPayload {
  body: string;
  title: string;
}

export interface UserPushNotificationService {
  sendToUser(
    userId: string,
    notification: PushNotificationPayload
  ): Promise<void>;
}

export interface MessagesServiceDependencies {
  repository: MessagesRepositoryInterface;
  llmService: TextGenerationService;
  pushNotificationService: UserPushNotificationService;
}
