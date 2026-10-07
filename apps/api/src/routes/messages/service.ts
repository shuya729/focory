import { SaveFailedError, TextGenerationError } from "../../errors";
import { buildPrompt } from "./prompots";
import type {
  CreateMessageInput,
  MessagesServiceDependencies,
  StoredMessage,
} from "./types";

const LEADING_QUOTE_REGEX = /^["「『]/;
const TRAILING_QUOTE_REGEX = /["」』]$/;
const MESSAGE_NOTIFICATION_TITLE = "Focory";

export class MessagesService {
  private readonly dependencies: MessagesServiceDependencies;

  constructor(dependencies: MessagesServiceDependencies) {
    this.dependencies = dependencies;
  }

  async createMessage(
    userId: string,
    input: CreateMessageInput
  ): Promise<StoredMessage> {
    const objective = MessagesService.normalizeOptionalText(input.objective);
    const purpose = MessagesService.normalizeOptionalText(input.purpose);
    const generatedText = await this.dependencies.llmService.generateText(
      buildPrompt({
        type: input.type,
        behavior: input.behavior,
        objective,
        purpose,
      })
    );
    const content = generatedText
      .trim()
      .replace(LEADING_QUOTE_REGEX, "")
      .replace(TRAILING_QUOTE_REGEX, "")
      .trim();
    if (!content) {
      throw new TextGenerationError("Failed to generate message", {
        cause: new Error(
          "Generated text did not include usable message content"
        ),
      });
    }
    const message = await this.dependencies.repository.create({
      userId,
      timerId: input.timerId,
      type: input.type,
      behavior: input.behavior,
      content,
      objective,
      purpose,
      durationSec: input.durationSec,
      elapsedSec: input.elapsedSec,
    });
    if (!message) {
      throw new SaveFailedError("Failed to save message");
    }
    if (input.type === "stop") {
      await this.dependencies.pushNotificationService.sendToUser(userId, {
        title: MESSAGE_NOTIFICATION_TITLE,
        body: message.content,
      });
    }
    return message;
  }

  private static normalizeOptionalText(
    value: string | null | undefined
  ): string | null {
    return value?.trim() || null;
  }
}
