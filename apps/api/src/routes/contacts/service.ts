import { SaveFailedError } from "../../errors";
import type {
  ContactsRepositoryInterface,
  CreateContactInput,
  StoredContact,
} from "./types";

export class ContactsService {
  private readonly repository: ContactsRepositoryInterface;

  constructor(repository: ContactsRepositoryInterface) {
    this.repository = repository;
  }

  async createContact(input: CreateContactInput): Promise<StoredContact> {
    const contact = await this.repository.create(input);
    if (!contact) {
      throw new SaveFailedError("Failed to save contact");
    }
    return contact;
  }
}
