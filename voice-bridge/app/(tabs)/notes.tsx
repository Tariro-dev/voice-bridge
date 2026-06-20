import React, { useMemo, useState } from "react";
import {
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
import { useApp } from "@/contexts/AppContext";
import { findLang } from "@/constants/languages";
import { speak } from "@/utils/speech";
import {
  deleteNote,
  toggleFavorite,
  type Note,
} from "@/utils/storage";
import { successHaptic, tapHaptic } from "@/utils/haptics";

type Filter = "all" | "favorites";

export default function NotesScreen() {
  const c = useColors();
  const { notes, refreshNotes, settings } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (filter === "favorites" && !n.isFavorite) return false;
      if (q === "") return true;
      return (
        n.sourceText.toLowerCase().includes(q) ||
        n.translation.toLowerCase().includes(q)
      );
    });
  }, [notes, filter, query]);

  async function onDelete(id: string) {
    tapHaptic(settings.haptics);
    await deleteNote(id);
    await refreshNotes();
  }

  async function onToggleFav(id: string) {
    tapHaptic(settings.haptics);
    await toggleFavorite(id);
    await refreshNotes();
    successHaptic(settings.haptics);
  }

  async function onCopy(text: string) {
    tapHaptic(settings.haptics);
    await Clipboard.setStringAsync(text);
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Header title="Notes" subtitle={`${notes.length} saved translations`} />
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <View
          style={[
            styles.search,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <Ionicons name="search" size={16} color={c.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search notes"
            placeholderTextColor={c.mutedForeground}
            style={[styles.searchInput, { color: c.text }]}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          {(["all", "favorites"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.tab,
                {
                  backgroundColor: filter === f ? c.primary : c.surface,
                  borderColor: filter === f ? c.primary : c.border,
                },
              ]}
            >
              <Text
                style={{
                  color: filter === f ? c.primaryForeground : c.text,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 12,
                }}
              >
                {f === "all" ? "All" : "Favorites"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        {filtered.length === 0 ? (
          <View style={[styles.empty, { borderColor: c.border }]}>
            <Ionicons
              name="bookmark-outline"
              size={28}
              color={c.mutedForeground}
            />
            <Text style={{ color: c.text, fontFamily: "Inter_600SemiBold" }}>
              {query ? "No matching notes" : "No saved notes yet"}
            </Text>
            <Text
              style={{
                color: c.mutedForeground,
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Tap the bookmark on any translation to save it here.
            </Text>
          </View>
        ) : (
          filtered.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              onDelete={() => onDelete(n.id)}
              onFav={() => onToggleFav(n.id)}
              onCopy={() => onCopy(n.translation)}
              onSpeak={() => speak(n.translation, n.toLang, settings.speechRate)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function NoteCard({
  note,
  onDelete,
  onFav,
  onCopy,
  onSpeak,
}: {
  note: Note;
  onDelete: () => void;
  onFav: () => void;
  onCopy: () => void;
  onSpeak: () => void;
}) {
  const c = useColors();
  const date = new Date(note.createdAt);
  const fromL = findLang(note.fromLang);
  const toL = findLang(note.toLang);
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.surface, borderColor: c.border },
      ]}
    >
      <View style={styles.cardTop}>
        <Text style={{ fontSize: 11, color: c.mutedForeground }}>
          {fromL.flag} {fromL.label} → {toL.flag} {toL.label} ·{" "}
          {date.toLocaleDateString()}{" "}
          {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        <Pressable onPress={onFav} hitSlop={8}>
          <Ionicons
            name={note.isFavorite ? "star" : "star-outline"}
            size={18}
            color={note.isFavorite ? c.warn : c.mutedForeground}
          />
        </Pressable>
      </View>
      <Text style={{ color: c.mutedForeground, fontSize: 13, marginTop: 8 }}>
        {note.sourceText}
      </Text>
      <Text
        style={{
          color: c.text,
          fontSize: 16,
          marginTop: 6,
          fontFamily: "Inter_600SemiBold",
          lineHeight: 22,
        }}
      >
        {note.translation}
      </Text>
      {note.tags.length > 0 && (
        <View style={{ flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {note.tags.map((t) => (
            <View
              key={t}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: c.surface2,
              }}
            >
              <Text style={{ color: c.mutedForeground, fontSize: 10 }}>{t}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.actions}>
        <ActionBtn icon="volume-high-outline" onPress={onSpeak} />
        <ActionBtn icon="copy-outline" onPress={onCopy} />
        <ActionBtn icon="trash-outline" onPress={onDelete} danger />
      </View>
    </View>
  );
}

function ActionBtn({
  icon,
  onPress,
  danger,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  danger?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          backgroundColor: c.surface2,
          borderColor: c.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={danger ? c.destructive : c.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  empty: {
    marginTop: 40,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    gap: 8,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    justifyContent: "flex-end",
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
