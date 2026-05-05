import type { paths } from "@/lib/api/paths";
import { serverApi } from "@/lib/api/server";

type PostContactRequestBody =
  paths["/contacts"]["post"]["requestBody"]["content"]["application/json"];

export type SendContactInput = PostContactRequestBody;

const DEFAULT_CONTACT_ERROR_MESSAGE =
  "お問い合わせの送信に失敗しました。時間をおいて再度お試しください。";

export async function sendContact(input: SendContactInput) {
  const { data, error } = await serverApi.POST("/contacts", {
    body: input satisfies PostContactRequestBody,
  });

  if (error) {
    throw new Error(error.error || DEFAULT_CONTACT_ERROR_MESSAGE);
  }

  const contact = data?.data.contact;

  if (!contact) {
    throw new Error(DEFAULT_CONTACT_ERROR_MESSAGE);
  }

  return contact;
}
