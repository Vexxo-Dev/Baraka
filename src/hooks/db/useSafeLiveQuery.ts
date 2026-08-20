import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Sentry from "@sentry/react-native";
import type { AnySQLiteSelect } from "drizzle-orm/sqlite-core";
import { SQLiteRelationalQuery } from "drizzle-orm/sqlite-core/query-builders/query";

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

/**
 * Wraps Drizzle's `useLiveQuery` to fix two native bugs:
 * 1. If the initial query fails (e.g. table missing during boot), Drizzle silently
 *    swallows the error and gets stuck in an eternal "loading" state.
 * 2. Errors are never reported to crash trackers like Sentry.
 *
 * This wrapper catches and reports errors, retries up to 3 times, and sets
 * `isLoading: false` on failure so the UI can show an error instead of an infinite skeleton.
 */
export function useSafeLiveQuery<
  T extends Pick<AnySQLiteSelect, "_" | "then"> | SQLiteRelationalQuery<"sync", unknown>,
>(query: T, deps: unknown[] = [], tableName?: string) {
  const [retryCount, setRetryCount] = useState(0);
  const reportedErrorRef = useRef<Error | undefined>(undefined);

  const { data, error, updatedAt } = useLiveQuery(query, [...deps, retryCount]);

  useEffect(() => {
    if (!error) return;

    if (reportedErrorRef.current !== error) {
      reportedErrorRef.current = error;
      Sentry.captureException(error, {
        tags: { feature: "db" },
        extra: { table: tableName, retryCount },
      });
    }

    if (retryCount >= MAX_RETRIES) return;

    const timeoutId = setTimeout(
      () => setRetryCount((count) => count + 1),
      RETRY_BASE_DELAY_MS * (retryCount + 1),
    );
    return () => clearTimeout(timeoutId);
  }, [error, retryCount, tableName]);

  // Only show loading if updated at is undefined and there is no error or we still trying to retry
  const isLoading = updatedAt === undefined && (!error || retryCount < MAX_RETRIES);

  return { data, error, updatedAt, isLoading };
}
