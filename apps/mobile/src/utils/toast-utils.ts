import { toast } from "sonner-native";

const DEFAULT_ERROR_DESCRIPTION = "しばらくしてからもう一度お試しください。";

const toErrorDescription = (error: unknown, fallbackDescription: string) => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackDescription;
};

export const showErrorToast = (
  error: unknown,
  title: string,
  fallbackDescription = DEFAULT_ERROR_DESCRIPTION
) => {
  toast.error(title, {
    description: toErrorDescription(error, fallbackDescription),
  });
};
