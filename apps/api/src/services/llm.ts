import { HTTPException } from "hono/http-exception";

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

export interface LlmServiceOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface TextGenerationService {
  generateText(prompt: string): Promise<string>;
}

export class LlmService implements TextGenerationService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(options: LlmServiceOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
    this.model = options.model;
  }

  async generateText(prompt: string): Promise<string> {
    if (!(this.apiKey && this.baseUrl && this.model)) {
      throw new HTTPException(500, { message: "LLM is not configured" });
    }

    let response: Response;
    let data: LlmResponse;

    try {
      response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      data = (await response.json()) as LlmResponse;
    } catch (cause) {
      throw new HTTPException(502, {
        message: "Failed to generate text",
        cause,
      });
    }

    if (!response.ok) {
      throw new HTTPException(502, {
        message: "Failed to generate text",
        cause: new Error(
          data.error?.message ?? "LLM request returned a non-success status"
        ),
      });
    }

    const text = LlmService.extractGeneratedText(data);

    if (!text) {
      throw new HTTPException(502, {
        message: "Failed to generate text",
        cause: new Error("LLM response did not include usable text content"),
      });
    }

    return text;
  }

  private static extractGeneratedText(data: LlmResponse): string | null {
    const choice = data.choices?.[0];

    if (typeof choice?.message?.content === "string") {
      return LlmService.cleanGeneratedText(choice.message.content);
    }

    if (Array.isArray(choice?.message?.content)) {
      const text = choice.message.content
        .map((part) => part.text)
        .filter((part): part is string => Boolean(part))
        .join("");

      return LlmService.cleanGeneratedText(text);
    }

    if (typeof choice?.text === "string") {
      return LlmService.cleanGeneratedText(choice.text);
    }

    if (typeof data.output_text === "string") {
      return LlmService.cleanGeneratedText(data.output_text);
    }

    const candidateText = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter((part): part is string => Boolean(part))
      .join("");

    if (candidateText) {
      return LlmService.cleanGeneratedText(candidateText);
    }

    return null;
  }

  private static cleanGeneratedText(text: string): string | null {
    const cleanedText = text.trim();
    return cleanedText.length > 0 ? cleanedText : null;
  }
}
