import { HTTPException } from "hono/http-exception";
import type { DbClient } from "../../lib/db/client";
import { LlmService, type TextGenerationService } from "../../services/llm";
import {
  PushNotificationService,
  type UserPushNotificationService,
} from "../../services/push-notifications";
import { PushTokensRepository } from "../push-tokens/repository";
import {
  type BehaviorValue,
  type BuildPromptInput,
  buildPrompt,
} from "./prompots";
import {
  MessagesRepository,
  type MessagesRepositoryInterface,
} from "./repository";
import type {
  MessageType,
  PostMessageJsonSchema,
  PostMessageResponse,
} from "./schemas";

const LEADING_QUOTE_REGEX = /^["「『]/;
const TRAILING_QUOTE_REGEX = /["」』]$/;
const MESSAGE_NOTIFICATION_TITLE = "Focory";

interface MessagePromptInput extends BuildPromptInput {
  timerId: string;
  durationSec: number;
  elapsedSec: number;
}

interface MessagesServiceOptions {
  expoPushReceiptsUrl: string;
  expoPushSendUrl: string;
  gcpApiKey: string;
  llmBaseUrl: string;
  llmModel: string;
}

interface MessagesServiceDependencies {
  llmService?: TextGenerationService;
  pushNotificationService?: UserPushNotificationService;
  repository?: MessagesRepositoryInterface;
}

export class MessagesService {
  private readonly llmService: TextGenerationService;
  private readonly pushNotificationService: UserPushNotificationService;
  private readonly repository: MessagesRepositoryInterface;

  constructor(
    db: DbClient,
    options: MessagesServiceOptions,
    dependencies: MessagesServiceDependencies = {}
  ) {
    this.repository = dependencies.repository ?? new MessagesRepository(db);
    this.llmService =
      dependencies.llmService ??
      new LlmService({
        apiKey: options.gcpApiKey,
        baseUrl: options.llmBaseUrl,
        model: options.llmModel,
      });
    this.pushNotificationService =
      dependencies.pushNotificationService ??
      new PushNotificationService(new PushTokensRepository(db), {
        receiptsUrl: options.expoPushReceiptsUrl,
        sendUrl: options.expoPushSendUrl,
      });
  }

  async createMessage(
    userId: string,
    json: PostMessageJsonSchema
  ): Promise<PostMessageResponse> {
    const input = MessagesService.normalizePromptInput(json);
    const content = await this.generatePersonalizedMessage(input);
    const message = await this.repository.create({
      userId,
      timerId: input.timerId,
      type: input.type,
      behavior: input.behavior,
      content,
      objective: input.objective,
      purpose: input.purpose,
      durationSec: input.durationSec,
      elapsedSec: input.elapsedSec,
    });

    if (!message) {
      throw new HTTPException(500, { message: "Failed to save message" });
    }

    if (input.type === "stop") {
      await this.pushNotificationService.sendToUser(userId, {
        title: MESSAGE_NOTIFICATION_TITLE,
        body: message.content,
      });
    }

    return {
      data: {
        message,
      },
    };
  }

  private async generatePersonalizedMessage(
    input: MessagePromptInput
  ): Promise<string> {
    const generatedText = await this.llmService.generateText(
      buildPrompt({
        type: input.type,
        behavior: input.behavior,
        objective: input.objective,
        purpose: input.purpose,
      })
    );
    const content = MessagesService.cleanGeneratedMessage(generatedText);

    if (!content) {
      throw new HTTPException(502, {
        message: "Failed to generate message",
        cause: new Error(
          "Generated text did not include usable message content"
        ),
      });
    }

    return content;
  }

  private static cleanGeneratedMessage(message: string): string | null {
    const cleanedMessage = message
      .trim()
      .replace(LEADING_QUOTE_REGEX, "")
      .replace(TRAILING_QUOTE_REGEX, "")
      .trim();

    return cleanedMessage.length > 0 ? cleanedMessage : null;
  }

  private static normalizePromptInput(
    json: PostMessageJsonSchema
  ): MessagePromptInput {
    return {
      timerId: json.timerId,
      type: json.type satisfies MessageType,
      behavior: json.behavior satisfies BehaviorValue,
      objective: MessagesService.normalizeOptionalText(json.objective),
      purpose: MessagesService.normalizeOptionalText(json.purpose),
      durationSec: json.durationSec,
      elapsedSec: json.elapsedSec,
    };
  }

  private static normalizeOptionalText(
    value: string | null | undefined
  ): string | null {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : null;
  }
}
