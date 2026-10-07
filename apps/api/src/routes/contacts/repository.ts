import type { DbClient } from "../../lib/db/client";
import { contacts } from "../../lib/db/schema";
import type {
  ContactsRepositoryInterface,
  CreateContactInput,
  StoredContact,
} from "./types";

export class ContactsRepository implements ContactsRepositoryInterface {
  private readonly db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }

  async create(input: CreateContactInput): Promise<StoredContact | undefined> {
    const rows = await this.db
      .insert(contacts)
      .values({
        name: input.name,
        email: input.email,
        content: input.content,
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
  }
}
