import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type Props = {
  label: string;
  onPress?: () => void;
  active?: boolean;
};

export function Pill({ label, onPress, active }: Props) {
  const c = useColors();
  const Wrap = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean } = {}) => [
        styles.pill,
        {
          backgroundColor: active ? c.primary : c.surface2,
          borderColor: active ? c.primary : c.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: active ? c.primaryForeground : c.text,
            fontFamily: active ? "Inter_600SemiBold" : "Inter_500Medium",
          },
        ]}
      >
        {label}
      </Text>
    </Wrap>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: { fontSize: 12, letterSpacing: 0.2 },
});
