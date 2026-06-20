const palette = {
  bg: "#0c0e10",
  surface: "#141618",
  surface2: "#1c1f22",
  border: "#1f2428",
  primary: "#4af0a0",
  accent2: "#7b6ef6",
  text: "#f0ede8",
  muted: "#6b7280",
  mutedSoft: "#4b5563",
  danger: "#ef4444",
  warn: "#f59e0b",
};

const colors = {
  light: {
    text: palette.text,
    tint: palette.primary,

    background: palette.bg,
    foreground: palette.text,

    card: palette.surface,
    cardForeground: palette.text,

    primary: palette.primary,
    primaryForeground: palette.bg,

    secondary: palette.surface2,
    secondaryForeground: palette.text,

    muted: palette.surface2,
    mutedForeground: palette.muted,

    accent: palette.accent2,
    accentForeground: palette.text,

    destructive: palette.danger,
    destructiveForeground: palette.text,

    border: palette.border,
    input: palette.border,

    bg: palette.bg,
    surface: palette.surface,
    surface2: palette.surface2,
    warn: palette.warn,
    mutedSoft: palette.mutedSoft,
  },
  dark: {
    text: palette.text,
    tint: palette.primary,

    background: palette.bg,
    foreground: palette.text,

    card: palette.surface,
    cardForeground: palette.text,

    primary: palette.primary,
    primaryForeground: palette.bg,

    secondary: palette.surface2,
    secondaryForeground: palette.text,

    muted: palette.surface2,
    mutedForeground: palette.muted,

    accent: palette.accent2,
    accentForeground: palette.text,

    destructive: palette.danger,
    destructiveForeground: palette.text,

    border: palette.border,
    input: palette.border,

    bg: palette.bg,
    surface: palette.surface,
    surface2: palette.surface2,
    warn: palette.warn,
    mutedSoft: palette.mutedSoft,
  },
  radius: 14,
};

export default colors;
