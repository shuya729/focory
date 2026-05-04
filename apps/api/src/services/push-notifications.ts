import { HTTPException } from "hono/http-exception";

const DEVICE_NOT_REGISTERED_ERROR = "DeviceNotRegistered";
const EXPO_PUSH_HEADERS = {
  Accept: "application/json",
  "Accept-Encoding": "gzip, deflate",
  "Content-Type": "application/json",
} as const;

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

export interface PushNotificationPayload {
  body: string;
  title: string;
}

export interface PushNotificationServiceOptions {
  receiptsUrl: string;
  sendUrl: string;
}

export interface PushNotificationTokenRepository {
  deleteByToken(token: string): Promise<unknown>;
  findByUserId(userId: string): Promise<Array<{ token: string }>>;
}

export interface UserPushNotificationService {
  sendToUser(
    userId: string,
    notification: PushNotificationPayload
  ): Promise<void>;
}

export class PushNotificationService implements UserPushNotificationService {
  private readonly receiptsUrl: string;
  private readonly sendUrl: string;
  private readonly tokenRepository: PushNotificationTokenRepository;

  constructor(
    tokenRepository: PushNotificationTokenRepository,
    options: PushNotificationServiceOptions
  ) {
    this.tokenRepository = tokenRepository;
    this.receiptsUrl = options.receiptsUrl;
    this.sendUrl = options.sendUrl;
  }

  async sendToUser(
    userId: string,
    notification: PushNotificationPayload
  ): Promise<void> {
    const pushTokens = await this.tokenRepository.findByUserId(userId);

    if (pushTokens.length === 0) {
      return;
    }

    await this.sendToTokens(
      pushTokens.map(({ token }) => token),
      notification
    );
  }

  async sendToTokens(
    tokens: readonly string[],
    notification: PushNotificationPayload
  ): Promise<void> {
    if (tokens.length === 0) {
      return;
    }

    if (!(this.sendUrl && this.receiptsUrl)) {
      throw new HTTPException(500, {
        message: "Expo push notification is not configured",
      });
    }

    await Promise.all(
      tokens.map(async (token) => {
        await this.sendPushNotification(token, notification);
      })
    );
  }

  private async sendPushNotification(
    token: string,
    notification: PushNotificationPayload
  ): Promise<void> {
    try {
      const response = await fetch(this.sendUrl, {
        method: "POST",
        headers: EXPO_PUSH_HEADERS,
        body: JSON.stringify({
          to: token,
          title: notification.title,
          body: notification.body,
        }),
      });

      const result = (await response.json()) as ExpoPushSendResponse;

      if (!response.ok) {
        console.error("Expo push request failed", {
          error: result.errors,
          status: response.status,
          token: PushNotificationService.maskPushToken(token),
        });
        return;
      }

      const [ticket] = PushNotificationService.getTickets(result);

      if (!ticket) {
        console.error("Expo push response did not include a ticket", {
          token: PushNotificationService.maskPushToken(token),
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
        token: PushNotificationService.maskPushToken(token),
      });
    }
  }

  private async inspectPushReceipt(
    token: string,
    ticketId: string
  ): Promise<void> {
    try {
      const response = await fetch(this.receiptsUrl, {
        method: "POST",
        headers: EXPO_PUSH_HEADERS,
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
          token: PushNotificationService.maskPushToken(token),
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
        token: PushNotificationService.maskPushToken(token),
      });
    }
  }

  private async handlePushError(
    token: string,
    errorCode: string | undefined,
    message: string | undefined
  ): Promise<void> {
    if (errorCode === DEVICE_NOT_REGISTERED_ERROR) {
      await this.tokenRepository.deleteByToken(token);
    }

    console.error("Expo push notification failed", {
      errorCode,
      message,
      token: PushNotificationService.maskPushToken(token),
    });
  }

  private static getTickets(result: ExpoPushSendResponse): ExpoPushTicket[] {
    if (!result.data) {
      return [];
    }

    return Array.isArray(result.data) ? result.data : [result.data];
  }

  private static maskPushToken(token: string): string {
    if (token.length <= 12) {
      return token;
    }

    return `${token.slice(0, 8)}...${token.slice(-4)}`;
  }
}
