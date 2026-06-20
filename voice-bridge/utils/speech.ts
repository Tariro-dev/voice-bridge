import { Platform } from "react-native";
import * as Speech from "expo-speech";
import { findLang } from "@/constants/languages";

export async function speak(
  text: string,
  langCode: string,
  rate = 1,
): Promise<void> {
  if (!text) return;
  const lang = findLang(langCode);
  try {
    Speech.stop();
  } catch {
    /* no-op */
  }
  if (Platform.OS === "web" && typeof globalThis !== "undefined") {
    const w = globalThis as unknown as {
      speechSynthesis?: {
        speak: (u: unknown) => void;
        cancel: () => void;
      };
      SpeechSynthesisUtterance?: new (t: string) => {
        lang: string;
        rate: number;
      };
    };
    if (w.speechSynthesis && w.SpeechSynthesisUtterance) {
      w.speechSynthesis.cancel();
      const utter = new w.SpeechSynthesisUtterance(text);
      utter.lang = lang.ttsLocale;
      utter.rate = rate;
      w.speechSynthesis.speak(utter);
      return;
    }
  }
  Speech.speak(text, { language: lang.ttsLocale, rate });
}

export function stopSpeaking(): void {
  try {
    Speech.stop();
  } catch {
    /* no-op */
  }
  if (Platform.OS === "web") {
    const w = globalThis as unknown as {
      speechSynthesis?: { cancel: () => void };
    };
    w.speechSynthesis?.cancel();
  }
}
