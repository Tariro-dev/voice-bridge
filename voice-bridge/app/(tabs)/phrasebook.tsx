import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Header } from "@/components/Header";
import { LanguagePicker } from "@/components/LanguagePicker";
import { useApp } from "@/contexts/AppContext";
import { useTranslate } from "@/hooks/useTranslate";
import {
  PHRASEBOOK,
  findLang,
  type Language,
} from "@/constants/languages";
import { speak } from "@/utils/speech";
import { saveNote } from "@/utils/storage";
import { successHaptic, tapHaptic } from "@/utils/haptics";

export default function PhrasebookScreen() {
  const c = useColors();
  const { settings } = useApp();
  const [target, setTarget] = useState<Language>(findLang(settings.defaultToLang));
  const [picker, setPicker] = useState(false);
  const [activeCat, setActiveCat] = useState(PHRASEBOOK[0]!.category);
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const { run } = useTranslate();

  const cat = useMemo(
    () => PHRASEBOOK.find((p) => p.category === activeCat) ?? PHRASEBOOK[0]!,
    [activeCat],
  );

  async function onPlay(phrase: string) {
    tapHaptic(settings.haptics);
    setBusy(phrase);
    let translated = results[`${target.code}|${phrase}`];
    if (!translated) {
      const res = await run({
        text: phrase,
        sourceLanguage: "English",
        targetLanguage: target.code,
      });
      if (res) {
        translated = res.translation;
        setResults((r) => ({ ...r, [`${target.code}|${phrase}`]: res.translation }));
        successHaptic(settings.haptics);
      }
    }
    if (translated) {
      speak(translated, target.code, settings.speechRate);
    }
    setBusy(null);
  }

  async function onSave(phrase: string) {
    const translation = results[`${target.code}|${phrase}`];
    if (!translation) {
      await onPlay(phrase);
      return;
    }
    tapHaptic(settings.haptics);
    await saveNote({
      sourceText: phrase,
      translation,
      fromLang: "English",
      toLang: target.code,
      tags: [cat.category],
      isDraft: false,
      isFavorite: true,
    });
    successHaptic(settings.haptics);
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Header title="Phrasebook" subtitle="Tap to translate and speak" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        <Pressable
          onPress={() => setPicker(true)}
          style={[
            styles.targetRow,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
            Translating English to
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 22 }}>{target.flag}</Text>
            <Text
              style={{
                color: c.text,
                fontFamily: "Inter_600SemiBold",
                fontSize: 16,
              }}
            >
              {target.label}
            </Text>
            <Ionicons name="chevron-down" size={16} color={c.mutedForeground} />
          </View>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
        >
          {PHRASEBOOK.map((p) => {
            const active = p.category === activeCat;
            return (
              <Pressable
                key={p.category}
                onPress={() => {
                  tapHaptic(settings.haptics);
                  setActiveCat(p.category);
                }}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: active ? c.primary : c.surface,
                    borderColor: active ? c.primary : c.border,
                  },
                ]}
              >
                <Ionicons
                  name={p.iconName}
                  size={14}
                  color={active ? c.primaryForeground : c.text}
                />
                <Text
                  style={{
                    color: active ? c.primaryForeground : c.text,
                    fontSize: 12,
                    fontFamily: "Inter_600SemiBold",
                  }}
                >
                  {p.category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ gap: 10 }}>
          {cat.phrases.map((phrase) => {
            const translated = results[`${target.code}|${phrase}`];
            const isBusy = busy === phrase;
            return (
              <View
                key={phrase}
                style={[
                  styles.phraseCard,
                  { backgroundColor: c.surface, borderColor: c.border },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: c.text,
                      fontSize: 15,
                      fontFamily: "Inter_500Medium",
                    }}
                  >
                    {phrase}
                  </Text>
                  {translated && (
                    <Text
                      style={{
                        color: c.primary,
                        fontSize: 14,
                        marginTop: 6,
                        fontFamily: "Inter_600SemiBold",
                      }}
                    >
                      {translated}
                    </Text>
                  )}
                </View>
                <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <Pressable
                    onPress={() => onSave(phrase)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="bookmark-outline"
                      size={18}
                      color={c.mutedForeground}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => onPlay(phrase)}
                    style={[
                      styles.playBtn,
                      { backgroundColor: c.primary, opacity: isBusy ? 0.6 : 1 },
                    ]}
                  >
                    <Ionicons
                      name={isBusy ? "hourglass-outline" : "volume-high"}
                      size={16}
                      color={c.primaryForeground}
                    />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <LanguagePicker
        visible={picker}
        title="Translate phrases to"
        selectedCode={target.code}
        onSelect={(l) => setTarget(l)}
        onClose={() => setPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  phraseCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
