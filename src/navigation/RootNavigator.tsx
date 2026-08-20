import { Stack } from "expo-router";
import { useSettingsStore } from "@store/settingsStore";

export function RootNavigator() {
  const onboardingComplete = useSettingsStore(
    (s) => s.settings.onboardingComplete,
  );

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={onboardingComplete}>
        <Stack.Screen name='(tabs)' options={{ animation: "none" }} />
        <Stack.Screen
          name='activity/[id]'
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name='learn/[id]' options={{ presentation: "card" }} />
      </Stack.Protected>

      <Stack.Protected guard={!onboardingComplete}>
        <Stack.Screen name='onboarding' options={{ gestureEnabled: false }} />
      </Stack.Protected>
    </Stack>
  );
}
