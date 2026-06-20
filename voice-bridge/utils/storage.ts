import AsyncStorage from "@react-native-async-storage/async-storage";

export type Note = {
  id: string;
  createdAt: number;
  sourceText: string;
  translation: string;
  fromLang: string;
  toLang: string;
  tags: string[];
  isDraft: boolean;
  isFavorite: boolean;
};

export type ConversationLog = {
  id: string;
  createdAt: number;
  langA: string;
  langB: string;
  messages: Array<{
    side: "A" | "B";
    original: string;
    translation: string;
    fromLang: string;
    toLang: string;
    ts: number;
  }>;
};

export type Settings = {
  defaultFromLang: string;
  defaultToLang: string;
  autoSpeak: boolean;
  haptics: boolean;
  speechRate: number;
};

export type Stats = {
  totalTranslations: number;
  totalConversationMessages: number;
  charactersTranslated: number;
  perLanguage: Record<string, number>;
  perDay: Record<string, number>;
  streakDays: number;
  lastActiveDay: string | null;
};

const KEYS = {
  notes: "vb.notes.v1",
  conversations: "vb.conversations.v1",
  settings: "vb.settings.v1",
  stats: "vb.stats.v1",
  recents: "vb.recents.v1",
} as const;

export const DEFAULT_SETTINGS: Settings = {
  defaultFromLang: "English",
  defaultToLang: "Shona",
  autoSpeak: true,
  haptics: true,
  speechRate: 1,
};

export const DEFAULT_STATS: Stats = {
  totalTranslations: 0,
  totalConversationMessages: 0,
  charactersTranslated: 0,
  perLanguage: {},
  perDay: {},
  streakDays: 0,
  lastActiveDay: null,
};

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function write<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// Notes
export async function getNotes(): Promise<Note[]> {
  return read<Note[]>(KEYS.notes, []);
}

export async function saveNote(
  note: Omit<Note, "id" | "createdAt"> & { id?: string; createdAt?: number },
): Promise<Note> {
  const list = await getNotes();
  const full: Note = {
    id: note.id ?? newId(),
    createdAt: note.createdAt ?? Date.now(),
    sourceText: note.sourceText,
    translation: note.translation,
    fromLang: note.fromLang,
    toLang: note.toLang,
    tags: note.tags,
    isDraft: note.isDraft,
    isFavorite: note.isFavorite,
  };
  const updated = [full, ...list.filter((n) => n.id !== full.id)];
  await write(KEYS.notes, updated);
  return full;
}

export async function deleteNote(id: string): Promise<void> {
  const list = await getNotes();
  await write(
    KEYS.notes,
    list.filter((n) => n.id !== id),
  );
}

export async function toggleFavorite(id: string): Promise<void> {
  const list = await getNotes();
  await write(
    KEYS.notes,
    list.map((n) => (n.id === id ? { ...n, isFavorite: !n.isFavorite } : n)),
  );
}

// Conversations
export async function getConversations(): Promise<ConversationLog[]> {
  return read<ConversationLog[]>(KEYS.conversations, []);
}

export async function saveConversation(c: ConversationLog): Promise<void> {
  const list = await getConversations();
  const updated = [c, ...list.filter((x) => x.id !== c.id)];
  await write(KEYS.conversations, updated);
}

export async function deleteConversation(id: string): Promise<void> {
  const list = await getConversations();
  await write(
    KEYS.conversations,
    list.filter((c) => c.id !== id),
  );
}

// Settings
export async function getSettings(): Promise<Settings> {
  const s = await read<Partial<Settings>>(KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...s };
}

export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const cur = await getSettings();
  const next = { ...cur, ...patch };
  await write(KEYS.settings, next);
  return next;
}

// Stats
export async function getStats(): Promise<Stats> {
  return { ...DEFAULT_STATS, ...(await read<Partial<Stats>>(KEYS.stats, {})) };
}

export async function recordTranslation(opts: {
  characters: number;
  toLang: string;
  isConversation?: boolean;
}): Promise<Stats> {
  const s = await getStats();
  const day = todayKey();
  const perLanguage = { ...s.perLanguage };
  perLanguage[opts.toLang] = (perLanguage[opts.toLang] ?? 0) + 1;
  const perDay = { ...s.perDay };
  perDay[day] = (perDay[day] ?? 0) + 1;

  let streakDays = s.streakDays;
  if (s.lastActiveDay !== day) {
    if (s.lastActiveDay) {
      const prev = new Date(s.lastActiveDay);
      const today = new Date(day);
      const diff = Math.round(
        (today.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
      );
      streakDays = diff === 1 ? streakDays + 1 : 1;
    } else {
      streakDays = 1;
    }
  }

  const next: Stats = {
    totalTranslations: s.totalTranslations + 1,
    totalConversationMessages:
      s.totalConversationMessages + (opts.isConversation ? 1 : 0),
    charactersTranslated: s.charactersTranslated + opts.characters,
    perLanguage,
    perDay,
    streakDays,
    lastActiveDay: day,
  };
  await write(KEYS.stats, next);
  return next;
}

export async function resetStats(): Promise<void> {
  await write(KEYS.stats, DEFAULT_STATS);
}

// Recents (recent translations on Translate screen)
export type Recent = {
  id: string;
  ts: number;
  source: string;
  translation: string;
  fromLang: string;
  toLang: string;
};

export async function getRecents(): Promise<Recent[]> {
  return read<Recent[]>(KEYS.recents, []);
}

export async function pushRecent(r: Omit<Recent, "id" | "ts">): Promise<void> {
  const list = await getRecents();
  const item: Recent = { ...r, id: newId(), ts: Date.now() };
  const updated = [item, ...list].slice(0, 20);
  await write(KEYS.recents, updated);
}

export async function clearRecents(): Promise<void> {
  await write(KEYS.recents, []);
}
