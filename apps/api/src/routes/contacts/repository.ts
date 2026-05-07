import { HTTPException } from "hono/http-exception";
import type { DbClient } from "../../lib/db/client";
import { contacts } from "../../lib/db/schema";
import type { ContactResponse } from "./schemas";

export interface CreateContactValue {
  name: string;
  email: string | null;
  content: string;
}

export interface ContactsRepositoryInterface {
  create(value: CreateContactValue): Promise<ContactResponse | undefined>;
}

export class ContactsRepository implements ContactsRepositoryInterface {
  db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  async create(
    value: CreateContactValue
  ): Promise<ContactResponse | undefined> {
    try {
      const rows = await this.db
        .insert(contacts)
        .values({
          name: value.name,
          email: value.email,
          content: value.content,
        })
        .returning({
          id: contacts.id,
          name: contacts.name,
          email: contacts.email,
          content: contacts.content,
          createdAt: contacts.createdAt,
          updatedAt: contacts.updatedAt,
        });

      return rows[0];
    } catch (cause) {
      throw new HTTPException(500, { message: "Internal server error", cause });
    }
  }
}
