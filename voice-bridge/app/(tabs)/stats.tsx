import React, { useMemo } from "react";
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
import { useApp } from "@/contexts/AppContext";
import { findLang } from "@/constants/languages";
import { resetStats } from "@/utils/storage";
import { tapHaptic } from "@/utils/haptics";

export default function StatsScreen() {
  const c = useColors();
  const { stats, refreshStats, settings } = useApp();

  const langRows = useMemo(() => {
    const entries = Object.entries(stats.perLanguage).sort(
      (a, b) => b[1] - a[1],
    );
    const max = entries[0]?.[1] ?? 1;
    return entries.map(([code, count]) => ({
      lang: findLang(code),
      count,
      pct: max ? count / max : 0,
    }));
  }, [stats.perLanguage]);

  const last7Days = useMemo(() => {
    const days: { key: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({
        key,
        label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
        count: stats.perDay[key] ?? 0,
      });
    }
    return days;
  }, [stats.perDay]);

  const maxDay = Math.max(1, ...last7Days.map((d) => d.count));

  async function onReset() {
    tapHaptic(settings.haptics);
    await resetStats();
    await refreshStats();
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Header
        title="Stats"
        subtitle="Your translation activity"
        right={
          <Pressable onPress={onReset} hitSlop={10}>
            <Ionicons name="refresh-outline" size={20} color={c.mutedForeground} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        {/* Big numbers */}
        <View style={styles.bigRow}>
          <BigStat
            label="Translations"
            value={stats.totalTranslations.toLocaleString()}
            icon="language"
            color={c.primary}
          />
          <BigStat
            label="Day streak"
            value={String(stats.streakDays)}
            icon="flame"
            color={c.warn}
          />
        </View>
        <View style={styles.bigRow}>
          <BigStat
            label="Conversation msgs"
            value={stats.totalConversationMessages.toLocaleString()}
            icon="chatbubbles"
            color={c.accent}
          />
          <BigStat
            label="Characters"
            value={
              stats.charactersTranslated >= 1000
                ? (stats.charactersTranslated / 1000).toFixed(1) + "k"
                : String(stats.charactersTranslated)
            }
            icon="text"
            color={c.primary}
          />
        </View>

        {/* Last 7 days */}
        <View
          style={[
            styles.card,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: c.text }]}>Last 7 days</Text>
          <View style={styles.barRow}>
            {last7Days.map((d) => {
              const h = d.count === 0 ? 6 : 6 + (d.count / maxDay) * 90;
              return (
                <View key={d.key} style={styles.barCol}>
                  <Text style={{ color: c.mutedForeground, fontSize: 11 }}>
                    {d.count}
                  </Text>
                  <View
                    style={{
                      height: h,
                      width: 18,
                      borderRadius: 6,
                      backgroundColor: d.count > 0 ? c.primary : c.surface2,
                      marginTop: 4,
                    }}
                  />
                  <Text
                    style={{
                      color: c.mutedForeground,
                      fontSize: 10,
                      marginTop: 6,
                    }}
                  >
                    {d.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Per language */}
        <View
          style={[
            styles.card,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: c.text }]}>By language</Text>
          {langRows.length === 0 ? (
            <Text style={{ color: c.mutedForeground, fontSize: 13 }}>
              No data yet — translate something to see your most-used languages.
            </Text>
          ) : (
            langRows.map((r) => (
              <View key={r.lang.code} style={{ marginVertical: 8 }}>
                <View style={styles.langStatRow}>
                  <Text style={{ fontSize: 16 }}>{r.lang.flag}</Text>
                  <Text
                    style={{
                      color: c.text,
                      flex: 1,
                      fontFamily: "Inter_500Medium",
                      fontSize: 13,
                    }}
                  >
                    {r.lang.label}
                  </Text>
                  <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                    {r.count}
                  </Text>
                </View>
                <View
                  style={{
                    height: 6,
                    backgroundColor: c.surface2,
                    borderRadius: 3,
                    marginTop: 6,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${Math.max(6, r.pct * 100)}%`,
                      height: "100%",
                      backgroundColor: c.primary,
                    }}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function BigStat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  const c = useColors();
  return (
    <View
      style={[
        styles.big,
        { backgroundColor: c.surface, borderColor: c.border },
      ]}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: c.surface2,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text
        style={{
          color: c.text,
          fontSize: 22,
          fontFamily: "Inter_700Bold",
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: c.mutedForeground,
          fontSize: 11,
          marginTop: 2,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bigRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  big: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  card: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  barRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 10,
  },
  barCol: { alignItems: "center", flex: 1 },
  langStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
