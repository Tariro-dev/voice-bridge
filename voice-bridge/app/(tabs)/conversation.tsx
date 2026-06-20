import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useColors } from "@/hooks/useColors";
import { Header } from "@/components/Header";
import { LanguagePicker } from "@/components/LanguagePicker";
import { MicButton } from "@/components/MicButton";
import { useApp } from "@/contexts/AppContext";
import { useTranslate } from "@/hooks/useTranslate";
import { findLang, type Language } from "@/constants/languages";
import { speak, stopSpeaking } from "@/utils/speech";
import { successHaptic, tapHaptic, warnHaptic } from "@/utils/haptics";
import { newId, saveConversation, type ConversationLog } from "@/utils/storage";
import {
  isWebSpeechSupported,
  startWebSpeech,
  type VoiceSession,
} from "@/utils/voiceInput";

type Msg = ConversationLog["messages"][number];

export default function ConversationScreen() {
  const c = useColors();
  const { settings } = useApp();
  const [langA, setLangA] = useState<Language>(findLang(settings.defaultFromLang));
  const [langB, setLangB] = useState<Language>(findLang(settings.defaultToLang));
  const [picker, setPicker] = useState<"A" | "B" | null>(null);
  const [draft, setDraft] = useState("");
  const [activeSide, setActiveSide] = useState<"A" | "B">("A");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [recording, setRecording] = useState<"A" | "B" | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const conversationId = useMemo(() => newId(), []);

  const { run, loading } = useTranslate();

  useEffect(() => {
    setLangA(findLang(settings.defaultFromLang));
    setLangB(findLang(settings.defaultToLang));
  }, [settings.defaultFromLang, settings.defaultToLang]);

  useEffect(() => {
    if (messages.length === 0) return;
    saveConversation({
      id: conversationId,
      createdAt: messages[0]!.ts,
      langA: langA.code,
      langB: langB.code,
      messages,
    });
  }, [messages, conversationId, langA.code, langB.code]);

  async function onSend(side: "A" | "B" = activeSide) {
    if (!draft.trim()) {
      warnHaptic(settings.haptics);
      return;
    }
    const fromLang = side === "A" ? langA : langB;
    const toLang = side === "A" ? langB : langA;
    const sourceText = draft;
    setDraft("");
    tapHaptic(settings.haptics);
    const res = await run({
      text: sourceText,
      sourceLanguage: fromLang.code,
      targetLanguage: toLang.code,
      track: { isConversation: true },
    });
    if (!res) return;
    successHaptic(settings.haptics);
    const msg: Msg = {
      side,
      original: sourceText,
      translation: res.translation,
      fromLang: fromLang.code,
      toLang: toLang.code,
      ts: Date.now(),
    };
    setMessages((m) => [...m, msg]);
    setActiveSide(side === "A" ? "B" : "A");
    if (settings.autoSpeak) {
      speak(res.translation, toLang.code, settings.speechRate);
    }
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }

  function onMic(side: "A" | "B") {
    if (recording === side) {
      sessionRef.current?.stop();
      sessionRef.current = null;
      setRecording(null);
      return;
    }
    if (recording) {
      sessionRef.current?.stop();
      sessionRef.current = null;
    }
    setActiveSide(side);
    if (Platform.OS !== "web" || !isWebSpeechSupported()) {
      warnHaptic(settings.haptics);
      return;
    }
    tapHaptic(settings.haptics);
    setRecording(side);
    const lang = side === "A" ? langA : langB;
    const session = startWebSpeech({
      langLocale: lang.ttsLocale,
      onResult: (transcript) => {
        setDraft((prev) => (prev ? prev + " " + transcript : transcript));
      },
      onError: () => {
        setRecording(null);
        sessionRef.current = null;
      },
      onEnd: () => {
        setRecording(null);
        sessionRef.current = null;
      },
    });
    sessionRef.current = session;
  }

  function onClear() {
    tapHaptic(settings.haptics);
    setMessages([]);
    setDraft("");
    stopSpeaking();
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Header
        title="Conversation"
        subtitle="Two-way live interpretation"
        right={
          messages.length > 0 ? (
            <Pressable onPress={onClear} hitSlop={10}>
              <Ionicons name="trash-outline" size={20} color={c.mutedForeground} />
            </Pressable>
          ) : null
        }
      />

      {/* Speaker selector */}
      <View
        style={[
          styles.speakerRow,
          { backgroundColor: c.surface, borderBottomColor: c.border },
        ]}
      >
        <SpeakerCard
          label="Speaker A"
          lang={langA}
          active={activeSide === "A"}
          recording={recording === "A"}
          onTapMic={() => onMic("A")}
          onTapLang={() => setPicker("A")}
          onTapCard={() => setActiveSide("A")}
        />
        <SpeakerCard
          label="Speaker B"
          lang={langB}
          active={activeSide === "B"}
          recording={recording === "B"}
          onTapMic={() => onMic("B")}
          onTapLang={() => setPicker("B")}
          onTapCard={() => setActiveSide("B")}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: false })
          }
        >
          {messages.length === 0 ? (
            <View style={[styles.empty, { borderColor: c.border }]}>
              <Ionicons name="chatbubbles-outline" size={32} color={c.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: c.text }]}>
                Start a conversation
              </Text>
              <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
                Pick who is speaking, type or speak in their language, and we'll
                translate it into the other language out loud.
              </Text>
            </View>
          ) : (
            messages.map((m, i) => <Bubble key={`${m.ts}-${i}`} msg={m} />)
          )}
        </ScrollView>

        {/* Composer */}
        <View
          style={[
            styles.composer,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              paddingBottom: Platform.OS === "web" ? 96 : 28,
            },
          ]}
        >
          <View style={styles.composerSideRow}>
            <Text style={[styles.composerHint, { color: c.mutedForeground }]}>
              {activeSide === "A" ? langA.label : langB.label} →{" "}
              {activeSide === "A" ? langB.label : langA.label}
            </Text>
          </View>
          <View style={styles.composerInputRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={`Type in ${(activeSide === "A" ? langA : langB).label}…`}
              placeholderTextColor={c.mutedForeground}
              multiline
              style={[
                styles.composerInput,
                {
                  color: c.text,
                  backgroundColor: c.surface2,
                  borderColor: c.border,
                },
              ]}
              onSubmitEditing={() => onSend()}
            />
            <Pressable
              onPress={() => onSend()}
              disabled={loading || !draft.trim()}
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor: c.primary,
                  opacity: loading || !draft.trim() ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons name="arrow-up" size={20} color={c.primaryForeground} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <LanguagePicker
        visible={picker === "A"}
        title="Speaker A language"
        selectedCode={langA.code}
        excludeCode={langB.code}
        onSelect={(l) => setLangA(l)}
        onClose={() => setPicker(null)}
      />
      <LanguagePicker
        visible={picker === "B"}
        title="Speaker B language"
        selectedCode={langB.code}
        excludeCode={langA.code}
        onSelect={(l) => setLangB(l)}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

function SpeakerCard({
  label,
  lang,
  active,
  recording,
  onTapMic,
  onTapLang,
  onTapCard,
}: {
  label: string;
  lang: Language;
  active: boolean;
  recording: boolean;
  onTapMic: () => void;
  onTapLang: () => void;
  onTapCard: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onTapCard}
      style={[
        styles.speakerCard,
        {
          backgroundColor: active ? c.surface2 : "transparent",
          borderColor: active ? c.primary : c.border,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.mutedForeground, fontSize: 11, marginBottom: 2 }}>
          {label}
        </Text>
        <Pressable onPress={onTapLang} hitSlop={6} style={styles.speakerLangRow}>
          <Text style={{ fontSize: 18 }}>{lang.flag}</Text>
          <Text
            style={{
              color: c.text,
              fontSize: 13,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            {lang.label}
          </Text>
          <Ionicons name="chevron-down" size={12} color={c.mutedForeground} />
        </Pressable>
      </View>
      <MicButton active={recording} onPress={onTapMic} size={42} />
    </Pressable>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const c = useColors();
  const { settings } = useApp();
  const isA = msg.side === "A";
  const align = isA ? "flex-start" : "flex-end";
  const bubbleColor = isA ? c.surface2 : c.primary;
  const textColor = isA ? c.text : c.primaryForeground;
  const subColor = isA ? c.mutedForeground : c.primaryForeground;
  return (
    <View style={{ alignItems: align, marginBottom: 14 }}>
      <View style={{ maxWidth: "86%" }}>
        <Text
          style={{
            color: c.mutedForeground,
            fontSize: 11,
            marginBottom: 4,
            paddingHorizontal: 6,
          }}
        >
          {findLang(msg.fromLang).flag} {findLang(msg.fromLang).label} →{" "}
          {findLang(msg.toLang).flag} {findLang(msg.toLang).label}
        </Text>
        <View
          style={{
            backgroundColor: bubbleColor,
            padding: 12,
            borderRadius: 16,
            borderTopLeftRadius: isA ? 4 : 16,
            borderTopRightRadius: isA ? 16 : 4,
          }}
        >
          <Text style={{ color: subColor, fontSize: 12, opacity: 0.85, marginBottom: 6 }}>
            {msg.original}
          </Text>
          <Text
            style={{
              color: textColor,
              fontSize: 16,
              lineHeight: 22,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            {msg.translation}
          </Text>
          <Pressable
            onPress={() => speak(msg.translation, msg.toLang, settings.speechRate)}
            hitSlop={6}
            style={{
              marginTop: 8,
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons
              name="volume-high-outline"
              size={14}
              color={isA ? c.primary : c.primaryForeground}
            />
            <Text
              style={{
                color: isA ? c.primary : c.primaryForeground,
                fontSize: 11,
                fontFamily: "Inter_600SemiBold",
              }}
            >
              Replay
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  speakerRow: {
    flexDirection: "row",
    gap: 10,
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  speakerCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  speakerLangRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  empty: {
    marginTop: 60,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  composer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  composerSideRow: { marginBottom: 6 },
  composerHint: {
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    fontFamily: "Inter_600SemiBold",
  },
  composerInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
