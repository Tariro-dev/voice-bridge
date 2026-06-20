import { useState } from "react";
import { translateText, type TranslateResponse } from "@workspace/api-client-react";
import { useApp } from "@/contexts/AppContext";
import { recordTranslation } from "@/utils/storage";

export function useTranslate() {
  const { refreshStats } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(opts: {
    text: string;
    targetLanguage: string;
    sourceLanguage?: string;
    track?: { isConversation?: boolean };
  }): Promise<TranslateResponse | null> {
    const text = opts.text.trim();
    if (!text) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await translateText({
        text,
        targetLanguage: opts.targetLanguage,
        sourceLanguage: opts.sourceLanguage,
      });
      await recordTranslation({
        characters: text.length,
        toLang: opts.targetLanguage,
        isConversation: opts.track?.isConversation,
      });
      await refreshStats();
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Translation failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { run, loading, error };
}
