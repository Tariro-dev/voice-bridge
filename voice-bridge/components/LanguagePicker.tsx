import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { LANGUAGES, type Language } from "@/constants/languages";

type Props = {
  visible: boolean;
  selectedCode: string;
  excludeCode?: string;
  title?: string;
  onSelect: (lang: Language) => void;
  onClose: () => void;
};

export function LanguagePicker({
  visible,
  selectedCode,
  excludeCode,
  title = "Select language",
  onSelect,
  onClose,
}: Props) {
  const c = useColors();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LANGUAGES.filter(
      (l) =>
        l.code !== excludeCode &&
        (q === "" || l.label.toLowerCase().includes(q)),
    );
  }, [query, excludeCode]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.text }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={c.mutedForeground} />
            </Pressable>
          </View>
          <View
            style={[
              styles.searchRow,
              { backgroundColor: c.surface2, borderColor: c.border },
            ]}
          >
            <Ionicons name="search" size={16} color={c.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search languages"
              placeholderTextColor={c.mutedForeground}
              style={[styles.searchInput, { color: c.text }]}
            />
          </View>
          <ScrollView
            style={{ maxHeight: 360 }}
            keyboardShouldPersistTaps="handled"
          >
            {filtered.map((lang) => {
              const active = lang.code === selectedCode;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => {
                    onSelect(lang);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      borderColor: c.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.label,
                      {
                        color: active ? c.primary : c.text,
                        fontFamily: active
                          ? "Inter_600SemiBold"
                          : "Inter_500Medium",
                      },
                    ]}
                  >
                    {lang.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={18} color={c.primary} />
                  )}
                </Pressable>
              );
            })}
            {filtered.length === 0 && (
              <Text
                style={{
                  color: c.mutedForeground,
                  textAlign: "center",
                  paddingVertical: 24,
                }}
              >
                No languages match
              </Text>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flag: { fontSize: 22 },
  label: { flex: 1, fontSize: 15 },
});
