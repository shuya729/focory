import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import migrationBundle from "../../../drizzle/migrations";

const expoDatabase = openDatabaseSync("db.db");

export const db = drizzle(expoDatabase);
export const migrations = migrationBundle;
