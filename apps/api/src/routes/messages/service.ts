import { HTTPException } from "hono/http-exception";
import type { DbClient } from "../../lib/db/client";
import { PushTokensRepository } from "../push-tokens/repository";
import { MessagesRepository } from "./repository";
import type {
  MessageType,
  PostMessageJsonSchema,
  PostMessageResponse,
} from "./schemas";

const LEADING_QUOTE_REGEX = /^["「『]/;
const TRAILING_QUOTE_REGEX = /["」』]$/;

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
  fetcher?: typeof fetch;
  gcpApiKey: string;
  llmBaseUrl: string;
  llmModel: string;
}

interface ExpoPushErrorDetails {
  error?: string;
}

interface ExpoPushTicket {
  details?: ExpoPushErrorDetails;
  id?: string;
  message?: string;
  status?: "error" | "ok";
}

interface ExpoPushSendResponse {
  data?: ExpoPushTicket | ExpoPushTicket[];
  errors?: Array<{
    code?: string;
    details?: unknown;
    message?: string;
  }>;
}

interface ExpoPushReceipt {
  details?: ExpoPushErrorDetails;
  message?: string;
  status?: "error" | "ok";
}

interface ExpoPushReceiptsResponse {
  data?: Record<string, ExpoPushReceipt>;
  errors?: Array<{
    code?: string;
    details?: unknown;
    message?: string;
  }>;
}

interface LlmChoiceMessageContentPart {
  text?: string;
  type?: string;
}

interface LlmResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  choices?: Array<{
    message?: {
      content?: string | LlmChoiceMessageContentPart[];
    };
    text?: string;
  }>;
  error?: {
    message?: string;
  };
  output_text?: string;
}

export class MessagesService {
  expoPushReceiptsUrl: string;
  expoPushSendUrl: string;
  fetcher: typeof fetch;
  gcpApiKey: string;
  llmBaseUrl: string;
  llmModel: string;
  pushTokensRepository: PushTokensRepository;
  repository: MessagesRepository;

  constructor(db: DbClient, options: MessagesServiceOptions) {
    this.repository = new MessagesRepository(db);
    this.pushTokensRepository = new PushTokensRepository(db);
    this.expoPushSendUrl = options.expoPushSendUrl;
    this.expoPushReceiptsUrl = options.expoPushReceiptsUrl;
    this.fetcher = options.fetcher ?? fetch;
    this.gcpApiKey = options.gcpApiKey;
    this.llmBaseUrl = options.llmBaseUrl;
    this.llmModel = options.llmModel;
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
      await this.sendStopNotifications(userId, message.content);
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
    if (!(this.gcpApiKey && this.llmBaseUrl && this.llmModel)) {
      throw new HTTPException(500, { message: "LLM is not configured" });
    }

    let response: Response;
    let data: LlmResponse;

    try {
      response = await this.fetcher(
        `${this.llmBaseUrl}?key=${this.gcpApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.llmModel,
            messages: [
              {
                role: "user",
                content: MessagesService.buildPrompt(input),
              },
            ],
          }),
        }
      );

      data = (await response.json()) as LlmResponse;
    } catch (cause) {
      throw new HTTPException(502, {
        message: "Failed to generate message",
        cause,
      });
    }

    if (!response.ok) {
      throw new HTTPException(502, {
        message: "Failed to generate message",
        cause: new Error(
          data.error?.message ?? "LLM request returned a non-success status"
        ),
      });
    }

    const content = MessagesService.extractGeneratedMessage(data);

    if (!content) {
      throw new HTTPException(502, {
        message: "Failed to generate message",
        cause: new Error("LLM response did not include usable message content"),
      });
    }

    return content;
  }

  private async sendStopNotifications(
    userId: string,
    content: string
  ): Promise<void> {
    const pushTokens = await this.pushTokensRepository.findByUserId(userId);

    if (pushTokens.length === 0) {
      return;
    }

    await Promise.all(
      pushTokens.map(async ({ token }) => {
        await this.sendPushNotification(token, content);
      })
    );
  }

  private async sendPushNotification(
    token: string,
    content: string
  ): Promise<void> {
    if (!(this.expoPushSendUrl && this.expoPushReceiptsUrl)) {
      throw new HTTPException(500, {
        message: "Expo push notification is not configured",
      });
    }

    try {
      const response = await this.fetcher(this.expoPushSendUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: token,
          title: "Focory",
          body: content,
        }),
      });

      const result = (await response.json()) as ExpoPushSendResponse;

      if (!response.ok) {
        console.error("Expo push request failed", {
          error: result.errors,
          status: response.status,
          token: MessagesService.maskPushToken(token),
        });
        return;
      }

      const [ticket] = MessagesService.getTickets(result);

      if (!ticket) {
        console.error("Expo push response did not include a ticket", {
          token: MessagesService.maskPushToken(token),
        });
        return;
      }

      if (ticket.status === "error") {
        await this.handlePushError(
          token,
          ticket.details?.error,
          ticket.message
        );
        return;
      }

      if (ticket.id) {
        await this.inspectPushReceipt(token, ticket.id);
      }
    } catch (cause) {
      console.error("Expo push notification request threw an error", {
        cause,
        token: MessagesService.maskPushToken(token),
      });
    }
  }

  private async inspectPushReceipt(
    token: string,
    ticketId: string
  ): Promise<void> {
    try {
      // Expo recommends delayed receipt polling; we still inspect any receipt
      // that is already available so invalid tokens can be pruned early.
      const response = await this.fetcher(this.expoPushReceiptsUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: [ticketId],
        }),
      });

      const result = (await response.json()) as ExpoPushReceiptsResponse;

      if (!response.ok) {
        console.error("Expo push receipt request failed", {
          error: result.errors,
          status: response.status,
          ticketId,
          token: MessagesService.maskPushToken(token),
        });
        return;
      }

      const receipt = result.data?.[ticketId];

      if (!receipt || receipt.status !== "error") {
        return;
      }

      await this.handlePushError(
        token,
        receipt.details?.error,
        receipt.message
      );
    } catch (cause) {
      console.error("Expo push receipt request threw an error", {
        cause,
        ticketId,
        token: MessagesService.maskPushToken(token),
      });
    }
  }

  private async handlePushError(
    token: string,
    errorCode: string | undefined,
    message: string | undefined
  ): Promise<void> {
    if (errorCode === "DeviceNotRegistered") {
      await this.pushTokensRepository.deleteByToken(token);
    }

    console.error("Expo push notification failed", {
      errorCode,
      message,
      token: MessagesService.maskPushToken(token),
    });
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

  private static extractGeneratedMessage(data: LlmResponse): string | null {
    const choice = data.choices?.[0];

    if (typeof choice?.message?.content === "string") {
      return MessagesService.cleanGeneratedMessage(choice.message.content);
    }

    if (Array.isArray(choice?.message?.content)) {
      const text = choice.message.content
        .map((part) => part.text)
        .filter((part): part is string => Boolean(part))
        .join("");

      return MessagesService.cleanGeneratedMessage(text);
    }

    if (typeof choice?.text === "string") {
      return MessagesService.cleanGeneratedMessage(choice.text);
    }

    if (typeof data.output_text === "string") {
      return MessagesService.cleanGeneratedMessage(data.output_text);
    }

    const candidateText = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter((part): part is string => Boolean(part))
      .join("");

    if (candidateText) {
      return MessagesService.cleanGeneratedMessage(candidateText);
    }

    return null;
  }

  private static cleanGeneratedMessage(message: string): string | null {
    const cleanedMessage = message
      .trim()
      .replace(LEADING_QUOTE_REGEX, "")
      .replace(TRAILING_QUOTE_REGEX, "")
      .trim();

    return cleanedMessage.length > 0 ? cleanedMessage : null;
  }

  private static getTickets(result: ExpoPushSendResponse): ExpoPushTicket[] {
    if (!result.data) {
      return [];
    }

    return Array.isArray(result.data) ? result.data : [result.data];
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

  private static maskPushToken(token: string): string {
    if (token.length <= 12) {
      return token;
    }

    return `${token.slice(0, 8)}...${token.slice(-4)}`;
  }
}
