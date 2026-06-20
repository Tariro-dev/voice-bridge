import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  getNotes,
  getRecents,
  getSettings,
  getStats,
  type Note,
  type Recent,
  type Settings,
  type Stats,
} from "@/utils/storage";

type AppContextValue = {
  ready: boolean;
  settings: Settings;
  setSettingsState: (s: Settings) => void;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  refreshNotes: () => Promise<void>;
  stats: Stats;
  setStatsState: (s: Stats) => void;
  refreshStats: () => Promise<void>;
  recents: Recent[];
  refreshRecents: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [recents, setRecents] = useState<Recent[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, n, st, r] = await Promise.all([
        getSettings(),
        getNotes(),
        getStats(),
        getRecents(),
      ]);
      if (cancelled) return;
      setSettings(s);
      setNotes(n);
      setStats(st);
      setRecents(r);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshNotes = useCallback(async () => {
    setNotes(await getNotes());
  }, []);
  const refreshStats = useCallback(async () => {
    setStats(await getStats());
  }, []);
  const refreshRecents = useCallback(async () => {
    setRecents(await getRecents());
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      settings,
      setSettingsState: setSettings,
      notes,
      setNotes,
      refreshNotes,
      stats,
      setStatsState: setStats,
      refreshStats,
      recents,
      refreshRecents,
    }),
    [
      ready,
      settings,
      notes,
      stats,
      recents,
      refreshNotes,
      refreshStats,
      refreshRecents,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return ctx;
}
