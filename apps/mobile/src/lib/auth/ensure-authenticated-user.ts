import { authClient } from "./client";

export async function ensureAuthenticatedUser() {
  const session = await authClient.getSession();

  if (session.data) {
    return;
  }

  const result = await authClient.signIn.anonymous();

  if (result.error) {
    throw result.error;
  }
}
