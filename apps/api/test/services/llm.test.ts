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

  it("prompt を Vertex AI の generateContent API に送り、candidates の text を返す", async () => {
    const fetchMock = stubFetch(
      createJsonResponse({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "  集中を続けられました。次もこの調子です。  ",
                },
              ],
            },
          },
        ],
      })
    );
    const service = new LlmService({
      apiKey: "test-key",
      location: "global",
      modelId: "gemini-2.5-flash-lite",
      projectId: "test-project",
    });

    const result = await service.generateText("短い応援文を作ってください");

    expect(result).toBe("集中を続けられました。次もこの調子です。");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe(
      "https://aiplatform.googleapis.com/v1/projects/test-project/locations/global/publishers/google/models/gemini-2.5-flash-lite:generateContent"
    );
    expect(call[1].headers).toEqual({
      "Content-Type": "application/json",
      "x-goog-api-key": "test-key",
    });
    expect(JSON.parse(call[1].body as string)).toEqual({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "短い応援文を作ってください",
            },
          ],
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
      location: "global",
      modelId: "gemini-test",
      projectId: "test-project",
    });

    await expect(service.generateText("prompt")).resolves.toBe(
      "少しずつ戻れば十分です。"
    );
  });

  it("設定不足なら fetch せずに失敗する", async () => {
    const fetchMock = stubFetch();
    const service = new LlmService({
      apiKey: "",
      location: "global",
      modelId: "gemini-2.5-flash-lite",
      projectId: "test-project",
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
      location: "global",
      modelId: "gemini-2.5-flash-lite",
      projectId: "test-project",
    });

    await expect(service.generateText("prompt")).rejects.toThrow(
      "Failed to generate text"
    );
  });
});
