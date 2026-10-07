export interface SavePushTokenInput {
  token: string;
}

export interface StoredPushToken extends SavePushTokenInput {
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PushTokensRepositoryInterface {
  upsert(userId: string, token: string): Promise<StoredPushToken | undefined>;
  findByUserId(userId: string): Promise<StoredPushToken[]>;
  deleteByToken(token: string): Promise<StoredPushToken | undefined>;
}

export interface PushNotificationTokenRepository {
  deleteByToken(token: string): Promise<unknown>;
  findByUserId(userId: string): Promise<Array<{ token: string }>>;
}
