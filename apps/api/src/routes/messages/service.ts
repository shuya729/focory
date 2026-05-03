import { HTTPException } from "hono/http-exception";
import type { DbClient } from "../../lib/db/client";
import { LlmService, type TextGenerationService } from "../../services/llm";
import {
  PushNotificationService,
  type UserPushNotificationService,
} from "../../services/push-notifications";
import { PushTokensRepository } from "../push-tokens/repository";
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

interface MessagePromptInput {
  timerId: string;
  type: MessageType;
  objective: string | null;
  purpose: string | null;
  behavior: string | null;
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
      content,
      objective: input.objective,
      purpose: input.purpose,
      behavior: input.behavior,
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
      MessagesService.buildPrompt(input)
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

  private static buildPrompt(input: MessagePromptInput): string {
    return [
      "あなたはユーザーの継続行動を支援する日本語コーチです。",
      "以下のタイマー状況をもとに、ユーザー本人へ送る自然で短いメッセージを1つだけ作成してください。",
      "条件:",
      "- 日本語で80文字以内",
      "- 1文から2文で簡潔にする",
      "- type=start は開始をやさしく後押しする",
      "- type=stop は中断を責めず、次の小さな一歩を促す",
      "- type=restart は再開を歓迎し、集中を取り戻せる一言にする",
      "- type=finish は達成感を具体的に称える",
      "- objective / purpose / behavior が未設定なら無理に言及しない",
      "- 箇条書き、引用符、絵文字、前置きは不要",
      "",
      `timerId: ${input.timerId}`,
      `type: ${input.type}`,
      `objective: ${input.objective ?? "未設定"}`,
      `purpose: ${input.purpose ?? "未設定"}`,
      `behavior: ${input.behavior ?? "未設定"}`,
      `durationSec: ${input.durationSec}`,
      `elapsedSec: ${input.elapsedSec}`,
      `duration: ${MessagesService.formatDuration(input.durationSec)}`,
      `elapsed: ${MessagesService.formatDuration(input.elapsedSec)}`,
      `completionRate: ${MessagesService.getCompletionRate(input)}%`,
    ].join("\n");
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
      type: json.type,
      objective: MessagesService.normalizeOptionalText(json.objective),
      purpose: MessagesService.normalizeOptionalText(json.purpose),
      behavior: MessagesService.normalizeOptionalText(json.behavior),
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

  private static getCompletionRate(input: MessagePromptInput): number {
    const completionRate = (input.elapsedSec / input.durationSec) * 100;
    return Math.max(0, Math.min(100, Math.round(completionRate)));
  }

  private static formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours}時間`);
    }

    if (minutes > 0) {
      parts.push(`${minutes}分`);
    }

    if (seconds > 0 || parts.length === 0) {
      parts.push(`${seconds}秒`);
    }

    return parts.join("");
  }
}
