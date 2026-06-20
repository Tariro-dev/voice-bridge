import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Header } from "@/components/Header";
import { LanguagePicker } from "@/components/LanguagePicker";
import { useApp } from "@/contexts/AppContext";
import { findLang } from "@/constants/languages";
import {
  setSettings,
  type Settings as SettingsT,
} from "@/utils/storage";
import { speak } from "@/utils/speech";
import { tapHaptic } from "@/utils/haptics";

export default function SettingsScreen() {
  const c = useColors();
  const { settings, setSettingsState } = useApp();
  const [picker, setPicker] = useState<"from" | "to" | null>(null);

  async function update(patch: Partial<SettingsT>) {
    tapHaptic(settings.haptics || patch.haptics === true);
    const next = await setSettings(patch);
    setSettingsState(next);
  }

  const fromLang = findLang(settings.defaultFromLang);
  const toLang = findLang(settings.defaultToLang);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Header title="Settings" subtitle="Defaults and preferences" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        <Section title="Default languages">
          <Row
            label="From"
            value={
              <RowValue text={`${fromLang.flag}  ${fromLang.label}`} chevron />
            }
            onPress={() => setPicker("from")}
          />
          <Row
            label="To"
            value={
              <RowValue text={`${toLang.flag}  ${toLang.label}`} chevron />
            }
            onPress={() => setPicker("to")}
          />
        </Section>

        <Section title="Speech">
          <Row
            label="Speak translations aloud"
            value={
              <Switch
                value={settings.autoSpeak}
                onValueChange={(v) => update({ autoSpeak: v })}
                trackColor={{ false: c.surface2, true: c.primary }}
                thumbColor="#fff"
              />
            }
          />
          <Row
            label="Speech rate"
            sublabel={`${settings.speechRate.toFixed(2)}x`}
            value={
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[0.75, 1, 1.25, 1.5].map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => update({ speechRate: r })}
                    style={[
                      styles.rateChip,
                      {
                        backgroundColor:
                          settings.speechRate === r ? c.primary : c.surface2,
                        borderColor:
                          settings.speechRate === r ? c.primary : c.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          settings.speechRate === r
                            ? c.primaryForeground
                            : c.text,
                        fontSize: 11,
                        fontFamily: "Inter_600SemiBold",
                      }}
                    >
                      {r}x
                    </Text>
                  </Pressable>
                ))}
              </View>
            }
          />
          <Row
            label="Test voice"
            onPress={() =>
              speak("Hello, this is Voice Bridge.", "English", settings.speechRate)
            }
            value={
              <RowValue text="Play sample" chevron icon="play-circle-outline" />
            }
          />
        </Section>

        <Section title="Feedback">
          <Row
            label="Haptic feedback"
            value={
              <Switch
                value={settings.haptics}
                onValueChange={(v) => update({ haptics: v })}
                trackColor={{ false: c.surface2, true: c.primary }}
                thumbColor="#fff"
              />
            }
          />
        </Section>

        <Section title="About">
          <Row
            label="Voice Bridge"
            sublabel="Version 1.0.0 · Powered by Gemini"
          />
          <Row
            label="Supported languages"
            sublabel="English · French · Portuguese · Shona · Ndebele · Zulu · Swahili · Spanish · Arabic · Mandarin"
          />
        </Section>
      </ScrollView>

      <LanguagePicker
        visible={picker === "from"}
        title="Default source language"
        selectedCode={fromLang.code}
        onSelect={(l) => update({ defaultFromLang: l.code })}
        onClose={() => setPicker(null)}
      />
      <LanguagePicker
        visible={picker === "to"}
        title="Default target language"
        selectedCode={toLang.code}
        onSelect={(l) => update({ defaultToLang: l.code })}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const c = useColors();
  return (
    <View style={{ marginBottom: 18 }}>
      <Text
        style={{
          color: c.mutedForeground,
          fontSize: 11,
          fontFamily: "Inter_600SemiBold",
          letterSpacing: 0.6,
          textTransform: "uppercase",
          marginBottom: 8,
          paddingHorizontal: 4,
        }}
      >
        {title}
      </Text>
      <View
        style={[
          {
            backgroundColor: c.surface,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: 14,
            overflow: "hidden",
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  sublabel,
  value,
  onPress,
}: {
  label: string;
  sublabel?: string;
  value?: React.ReactNode;
  onPress?: () => void;
}) {
  const c = useColors();
  const Wrap: React.ComponentType<{ children: React.ReactNode }> = onPress
    ? ({ children }) => (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.row,
            { borderColor: c.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          {children}
        </Pressable>
      )
    : ({ children }) => (
        <View style={[styles.row, { borderColor: c.border }]}>{children}</View>
      );
  return (
    <Wrap>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 14, fontFamily: "Inter_500Medium" }}>
          {label}
        </Text>
        {sublabel && (
          <Text style={{ color: c.mutedForeground, fontSize: 12, marginTop: 4 }}>
            {sublabel}
          </Text>
        )}
      </View>
      {value}
    </Wrap>
  );
}

function RowValue({
  text,
  chevron,
  icon,
}: {
  text: string;
  chevron?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {icon && <Ionicons name={icon} size={16} color={c.primary} />}
      <Text style={{ color: c.text, fontSize: 13 }}>{text}</Text>
      {chevron && (
        <Ionicons name="chevron-forward" size={14} color={c.mutedForeground} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rateChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
});
