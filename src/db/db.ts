import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const expo = openDatabaseSync('baraka.db', { enableChangeListener: true }); // required for useLiveQuery
expo.execSync('PRAGMA foreign_keys = ON;'); // expo-sqlite does not enable FKs by default

export const db = drizzle(expo, { schema });
export type BarakaDB = typeof db;
