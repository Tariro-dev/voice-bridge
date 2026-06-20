import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function Header({ title, subtitle, right }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? 16 : insets.top + 8;

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: top,
          backgroundColor: c.bg,
          borderBottomColor: c.border,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
