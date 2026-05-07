import { toast } from "sonner-native";

export const showErrorToast = (title: string) => {
  toast.error(title);
};
