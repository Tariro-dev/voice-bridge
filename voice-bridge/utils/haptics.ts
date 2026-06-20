import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export function tapHaptic(enabled: boolean): void {
  if (!enabled || Platform.OS === "web") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function successHaptic(enabled: boolean): void {
  if (!enabled || Platform.OS === "web") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {},
  );
}

export function warnHaptic(enabled: boolean): void {
  if (!enabled || Platform.OS === "web") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
    () => {},
  );
}
