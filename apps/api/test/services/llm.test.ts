import { afterEach, describe, expect, it, vi } from "vitest";
import { LlmService } from "../../src/services/llm";

const createJsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const stubFetch = (...responses: Response[]) => {
  const fetchMock = vi.fn();

  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("LlmService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("prompt を LLM API に送り、choices の text を返す", async () => {
    const fetchMock = stubFetch(
      createJsonResponse({
        choices: [
          {
            message: {
              content: "  集中を続けられました。次もこの調子です。  ",
            },
          },
        ],
      })
    );
    const service = new LlmService({
      apiKey: "test-key",
      baseUrl: "https://example.com/chat/completions",
      model: "openai/gpt-oss-120b-maas",
    });

    const result = await service.generateText("短い応援文を作ってください");

    expect(result).toBe("集中を続けられました。次もこの調子です。");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe("https://example.com/chat/completions?key=test-key");
    expect(JSON.parse(call[1].body as string)).toEqual({
      model: "openai/gpt-oss-120b-maas",
      messages: [
        {
          role: "user",
          content: "短い応援文を作ってください",
        },
      ],
    });
  });

  it("Gemini 形式の candidates から text を返す", async () => {
    stubFetch(
      createJsonResponse({
        candidates: [
          {
            content: {
              parts: [{ text: "少しずつ戻れば十分です。" }],
            },
          },
        ],
      })
    );
    const service = new LlmService({
      apiKey: "test-key",
      baseUrl: "https://example.com/generateContent",
      model: "gemini-test",
    });

    await expect(service.generateText("prompt")).resolves.toBe(
      "少しずつ戻れば十分です。"
    );
  });

  it("設定不足なら fetch せずに失敗する", async () => {
    const fetchMock = stubFetch();
    const service = new LlmService({
      apiKey: "",
      baseUrl: "https://example.com/chat/completions",
      model: "openai/gpt-oss-120b-maas",
    });

    await expect(service.generateText("prompt")).rejects.toThrow(
      "LLM is not configured"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("LLM API がエラーなら 502 として失敗する", async () => {
    stubFetch(
      createJsonResponse(
        {
          error: {
            message: "model unavailable",
          },
        },
        503
      )
    );
    const service = new LlmService({
      apiKey: "test-key",
      baseUrl: "https://example.com/chat/completions",
      model: "openai/gpt-oss-120b-maas",
    });

    await expect(service.generateText("prompt")).rejects.toThrow(
      "Failed to generate text"
    );
  });
});
