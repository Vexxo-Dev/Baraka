import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  driver: 'expo',
  out: './drizzle',
  dialect: 'sqlite',
});
