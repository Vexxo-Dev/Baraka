import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { getTodayString } from "@utils/date";

export function useToday(): string {
  const [today, setToday] = useState(getTodayString);

  const current = getTodayString();

  // Zero-idle-cost fallback to catch foreground wall-clock jumps (e.g. timezone changes).
  if (current !== today) {
    setToday(current);
  }

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNextMidnight = () => {
      const now = new Date();
      const msUntilMidnight =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
        ).getTime() - now.getTime();

      timeoutId = setTimeout(() => {
        setToday(getTodayString());
        scheduleNextMidnight();
      }, msUntilMidnight);
    };

    const sync = () => {
      const current = getTodayString();
      setToday((prev) => (prev === current ? prev : current));
    };

    sync();
    scheduleNextMidnight();

    const subscription = AppState.addEventListener(
      "change",
      (next: AppStateStatus) => {
        if (next === "active") {
          sync();
          clearTimeout(timeoutId);
          scheduleNextMidnight();
        }
      },
    );

    return () => {
      subscription.remove();
      clearTimeout(timeoutId);
    };
  }, []);

  return today;
}
