import { Platform } from "react-native";

type WebSpeechRecognition = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type WebGlobal = {
  SpeechRecognition?: new () => WebSpeechRecognition;
  webkitSpeechRecognition?: new () => WebSpeechRecognition;
};

export function isWebSpeechSupported(): boolean {
  if (Platform.OS !== "web") return false;
  const w = globalThis as unknown as WebGlobal;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export type VoiceSession = {
  stop: () => void;
};

export function startWebSpeech(opts: {
  langLocale: string;
  onResult: (text: string) => void;
  onError: (msg: string) => void;
  onEnd: () => void;
}): VoiceSession | null {
  if (Platform.OS !== "web") return null;
  const w = globalThis as unknown as WebGlobal;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = opts.langLocale;
  rec.continuous = false;
  rec.interimResults = false;
  rec.onresult = (event) => {
    const first = event.results[0];
    if (first && first[0]) {
      opts.onResult(first[0].transcript);
    }
  };
  rec.onerror = (event) => {
    opts.onError(event.error || "speech error");
  };
  rec.onend = () => {
    opts.onEnd();
  };
  try {
    rec.start();
  } catch (e) {
    opts.onError(String(e));
    return null;
  }
  return {
    stop: () => {
      try {
        rec.stop();
      } catch {
        /* no-op */
      }
    },
  };
}
