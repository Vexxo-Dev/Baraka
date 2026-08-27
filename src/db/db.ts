import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";

export const expoDb = openDatabaseSync("baraka.db", {
  enableChangeListener: true,
}); // required for useLiveQuery
expoDb.execSync("PRAGMA foreign_keys = ON;"); // expo-sqlite does not enable FKs by default

export const db = drizzle(expoDb, { schema });
export type BarakaDB = typeof db;
