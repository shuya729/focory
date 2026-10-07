export interface CreateContactInput {
  name: string;
  email: string | null;
  content: string;
}

export interface StoredContact extends CreateContactInput {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactsRepositoryInterface {
  create(input: CreateContactInput): Promise<StoredContact | undefined>;
}
