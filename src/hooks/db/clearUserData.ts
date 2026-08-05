import { db } from "@/db/db";
import {
  userActivityPrefs,
  customActivities,
  customNiyyahOptions,
  dailyLogs,
  journalEntries,
} from "@/db/schema";

export async function clearUserData() {
  await db.transaction(async (tx) => {
    await tx.delete(userActivityPrefs);
    await tx.delete(customActivities);
    await tx.delete(customNiyyahOptions);
    await tx.delete(dailyLogs);
    await tx.delete(journalEntries);
  });
}
