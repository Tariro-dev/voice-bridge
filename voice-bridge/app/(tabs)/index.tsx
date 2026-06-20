import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useColors } from "@/hooks/useColors";
import { Header } from "@/components/Header";
import { LanguagePicker } from "@/components/LanguagePicker";
import { MicButton } from "@/components/MicButton";
import { useApp } from "@/contexts/AppContext";
import { useTranslate } from "@/hooks/useTranslate";
import { findLang, type Language } from "@/constants/languages";
import { speak, stopSpeaking } from "@/utils/speech";
import { successHaptic, tapHaptic, warnHaptic } from "@/utils/haptics";
import { saveNote, pushRecent } from "@/utils/storage";
import {
  isWebSpeechSupported,
  startWebSpeech,
  type VoiceSession,
} from "@/utils/voiceInput";

export default function TranslateScreen() {
  const c = useColors();
  const { settings, refreshRecents, recents } = useApp();
  const [from, setFrom] = useState<Language>(findLang(settings.defaultFromLang));
  const [to, setTo] = useState<Language>(findLang(settings.defaultToLang));
  const [picker, setPicker] = useState<"from" | "to" | null>(null);
  const [text, setText] = useState("");
  const [translation, setTranslation] = useState("");
  const [detected, setDetected] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const sessionRef = useRef<VoiceSession | null>(null);

  const { run, loading, error } = useTranslate();

  useEffect(() => {
    setFrom(findLang(settings.defaultFromLang));
    setTo(findLang(settings.defaultToLang));
  }, [settings.defaultFromLang, settings.defaultToLang]);

  async function onTranslate() {
    if (!text.trim()) {
      warnHaptic(settings.haptics);
      return;
    }
    tapHaptic(settings.haptics);
    const res = await run({
      text,
      targetLanguage: to.code,
      sourceLanguage: from.code,
    });
    if (res) {
      setTranslation(res.translation);
      setDetected(res.sourceLanguage ?? null);
      successHaptic(settings.haptics);
      await pushRecent({
        source: text,
        translation: res.translation,
        fromLang: from.code,
        toLang: to.code,
      });
      await refreshRecents();
      if (settings.autoSpeak) {
        speak(res.translation, to.code, settings.speechRate);
      }
    }
  }

  function onSwap() {
    tapHaptic(settings.haptics);
    setFrom(to);
    setTo(from);
    setText(translation);
    setTranslation(text);
    setDetected(null);
  }

  async function onSave() {
    if (!translation) return;
    tapHaptic(settings.haptics);
    await saveNote({
      sourceText: text,
      translation,
      fromLang: from.code,
      toLang: to.code,
      tags: [],
      isDraft: false,
      isFavorite: false,
    });
    successHaptic(settings.haptics);
  }

  async function onCopy(value: string) {
    if (!value) return;
    tapHaptic(settings.haptics);
    await Clipboard.setStringAsync(value);
  }

  function onMic() {
    if (recording) {
      sessionRef.current?.stop();
      sessionRef.current = null;
      setRecording(false);
      return;
    }
    if (Platform.OS !== "web" || !isWebSpeechSupported()) {
      // Mobile/native voice not wired in this build — type for now.
      warnHaptic(settings.haptics);
      return;
    }
    tapHaptic(settings.haptics);
    setRecording(true);
    const session = startWebSpeech({
      langLocale: from.ttsLocale,
      onResult: (transcript) => {
        setText((prev) => (prev ? prev + " " + transcript : transcript));
      },
      onError: () => {
        setRecording(false);
        sessionRef.current = null;
      },
      onEnd: () => {
        setRecording(false);
        sessionRef.current = null;
      },
    });
    sessionRef.current = session;
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Header title="Translate" subtitle="Voice or text · 10 languages" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 18, paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Language switcher */}
          <View
            style={[
              styles.langBar,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <LangChip
              lang={from}
              onPress={() => setPicker("from")}
              label="From"
            />
            <Pressable
              onPress={onSwap}
              hitSlop={10}
              style={[
                styles.swap,
                { backgroundColor: c.surface2, borderColor: c.border },
              ]}
            >
              <Ionicons name="swap-horizontal" size={18} color={c.primary} />
            </Pressable>
            <LangChip lang={to} onPress={() => setPicker("to")} label="To" />
          </View>

          {/* Input card */}
          <View
            style={[
              styles.card,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardLabel, { color: c.mutedForeground }]}>
                {from.label}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {text.length > 0 && (
                  <Pressable
                    onPress={() => {
                      setText("");
                      setTranslation("");
                      setDetected(null);
                    }}
                    hitSlop={10}
                  >
                    <Ionicons name="close-circle" size={18} color={c.mutedForeground} />
                  </Pressable>
                )}
                <Pressable onPress={() => onCopy(text)} hitSlop={10}>
                  <Ionicons name="copy-outline" size={18} color={c.mutedForeground} />
                </Pressable>
              </View>
            </View>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type or tap the mic to speak"
              placeholderTextColor={c.mutedForeground}
              multiline
              style={[styles.input, { color: c.text }]}
            />
            <View style={styles.inputFooter}>
              <Text style={[styles.charCount, { color: c.mutedForeground }]}>
                {text.length}/4000
              </Text>
              <MicButton active={recording} onPress={onMic} size={48} />
            </View>
          </View>

          {/* Translate action */}
          <Pressable
            onPress={onTranslate}
            disabled={loading}
            style={({ pressed }) => [
              styles.translateBtn,
              {
                backgroundColor: c.primary,
                opacity: loading ? 0.7 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons
              name={loading ? "hourglass-outline" : "language"}
              size={18}
              color={c.primaryForeground}
            />
            <Text style={[styles.translateText, { color: c.primaryForeground }]}>
              {loading ? "Translating…" : `Translate to ${to.label}`}
            </Text>
          </Pressable>

          {error && (
            <View
              style={[
                styles.errorBox,
                { borderColor: c.destructive, backgroundColor: c.surface },
              ]}
            >
              <Ionicons name="alert-circle" size={16} color={c.destructive} />
              <Text style={{ color: c.destructive, fontSize: 13, flex: 1 }}>
                {error}
              </Text>
            </View>
          )}

          {/* Output card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: c.surface,
                borderColor: translation ? c.primary : c.border,
                marginTop: 12,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[styles.cardLabel, { color: c.primary }]}>
                  {to.label}
                </Text>
                {detected && (
                  <Text style={{ fontSize: 11, color: c.mutedForeground }}>
                    · detected: {detected}
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: "row", gap: 14 }}>
                <Pressable
                  onPress={() => {
                    if (translation) {
                      stopSpeaking();
                      speak(translation, to.code, settings.speechRate);
                    }
                  }}
                  hitSlop={10}
                  disabled={!translation}
                >
                  <Ionicons
                    name="volume-high-outline"
                    size={18}
                    color={translation ? c.primary : c.mutedForeground}
                  />
                </Pressable>
                <Pressable onPress={() => onCopy(translation)} hitSlop={10} disabled={!translation}>
                  <Ionicons
                    name="copy-outline"
                    size={18}
                    color={translation ? c.text : c.mutedForeground}
                  />
                </Pressable>
                <Pressable onPress={onSave} hitSlop={10} disabled={!translation}>
                  <Ionicons
                    name="bookmark-outline"
                    size={18}
                    color={translation ? c.text : c.mutedForeground}
                  />
                </Pressable>
              </View>
            </View>
            <Text
              style={[
                styles.outputText,
                { color: translation ? c.text : c.mutedForeground },
              ]}
            >
              {translation || "Your translation will appear here."}
            </Text>
          </View>

          {/* Recents */}
          {recents.length > 0 && (
            <View style={{ marginTop: 22 }}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>
                Recent
              </Text>
              {recents.slice(0, 5).map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => {
                    setFrom(findLang(r.fromLang));
                    setTo(findLang(r.toLang));
                    setText(r.source);
                    setTranslation(r.translation);
                  }}
                  style={[
                    styles.recentRow,
                    { backgroundColor: c.surface, borderColor: c.border },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: c.text,
                        fontSize: 14,
                        fontFamily: "Inter_500Medium",
                      }}
                      numberOfLines={1}
                    >
                      {r.source}
                    </Text>
                    <Text
                      style={{ color: c.mutedForeground, fontSize: 12, marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {r.translation}
                    </Text>
                  </View>
                  <Text style={{ color: c.mutedForeground, fontSize: 11 }}>
                    {findLang(r.fromLang).flag} → {findLang(r.toLang).flag}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <LanguagePicker
        visible={picker === "from"}
        title="Translate from"
        selectedCode={from.code}
        excludeCode={to.code}
        onSelect={(l) => setFrom(l)}
        onClose={() => setPicker(null)}
      />
      <LanguagePicker
        visible={picker === "to"}
        title="Translate to"
        selectedCode={to.code}
        excludeCode={from.code}
        onSelect={(l) => setTo(l)}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

function LangChip({
  lang,
  label,
  onPress,
}: {
  lang: Language;
  label: string;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.langChip,
        {
          backgroundColor: c.surface2,
          borderColor: c.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={{ fontSize: 11, color: c.mutedForeground, marginBottom: 2 }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={{ fontSize: 18 }}>{lang.flag}</Text>
        <Text
          style={{
            color: c.text,
            fontFamily: "Inter_600SemiBold",
            fontSize: 14,
          }}
          numberOfLines={1}
        >
          {lang.label}
        </Text>
        <Ionicons name="chevron-down" size={14} color={c.mutedForeground} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  langBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  langChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  swap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  card: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    minHeight: 96,
    fontSize: 18,
    lineHeight: 26,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  inputFooter: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  charCount: { fontSize: 11 },
  translateBtn: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  translateText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  errorBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  outputText: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: "Inter_500Medium",
    minHeight: 60,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
});
