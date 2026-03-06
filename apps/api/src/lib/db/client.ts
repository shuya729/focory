import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const getDb = (env: CloudflareBindings) => {
  const sql = postgres(env.HYPERDRIVE.connectionString, {
    max: 5,
    fetch_types: false,
  });
  return drizzle(sql);
};

export type DbClient = ReturnType<typeof getDb>;
