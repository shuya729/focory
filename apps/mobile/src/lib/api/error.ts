interface ApiErrorResponse {
  error?: string;
}

export const toApiError = (error: unknown, fallbackMessage: string): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "object" && error !== null && "error" in error) {
    const { error: message } = error as ApiErrorResponse;

    if (typeof message === "string" && message.length > 0) {
      return new Error(message);
    }
  }

  return new Error(fallbackMessage);
};
