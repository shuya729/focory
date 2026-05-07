import { HTTPException } from "hono/http-exception";
import type { DbClient } from "../../lib/db/client";
import {
  ContactsRepository,
  type ContactsRepositoryInterface,
} from "./repository";
import type { PostContactJsonSchema, PostContactResponse } from "./schemas";

interface ContactsServiceDependencies {
  repository?: ContactsRepositoryInterface;
}

export class ContactsService {
  private readonly repository: ContactsRepositoryInterface;

  constructor(db: DbClient, dependencies: ContactsServiceDependencies = {}) {
    this.repository = dependencies.repository ?? new ContactsRepository(db);
  }

  async createContact(
    json: PostContactJsonSchema
  ): Promise<PostContactResponse> {
    const contact = await this.repository.create({
      name: json.name,
      email: json.email,
      content: json.content,
    });

    if (!contact) {
      throw new HTTPException(500, { message: "Failed to save contact" });
    }

    return {
      data: {
        contact,
      },
    };
  }
}
