export type Language = {
  code: string;
  label: string;
  flag: string;
  ttsLocale: string;
};

export const LANGUAGES: Language[] = [
  { code: "English", label: "English", flag: "🇬🇧", ttsLocale: "en-US" },
  { code: "French", label: "French", flag: "🇫🇷", ttsLocale: "fr-FR" },
  { code: "Portuguese", label: "Portuguese", flag: "🇵🇹", ttsLocale: "pt-PT" },
  { code: "Shona", label: "Shona", flag: "🇿🇼", ttsLocale: "sn" },
  { code: "Ndebele", label: "Ndebele", flag: "🇿🇼", ttsLocale: "nd" },
  { code: "Zulu", label: "Zulu", flag: "🇿🇦", ttsLocale: "zu-ZA" },
  { code: "Swahili", label: "Swahili", flag: "🇰🇪", ttsLocale: "sw" },
  { code: "Spanish", label: "Spanish", flag: "🇪🇸", ttsLocale: "es-ES" },
  { code: "Arabic", label: "Arabic", flag: "🇸🇦", ttsLocale: "ar" },
  { code: "Mandarin", label: "Mandarin", flag: "🇨🇳", ttsLocale: "zh-CN" },
];

export function findLang(code: string): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]!;
}

export type PhraseCategory = {
  category: string;
  iconName:
    | "medkit-outline"
    | "airplane-outline"
    | "hand-right-outline"
    | "warning-outline"
    | "restaurant-outline"
    | "business-outline";
  phrases: string[];
};

export const PHRASEBOOK: PhraseCategory[] = [
  {
    category: "Medical",
    iconName: "medkit-outline",
    phrases: [
      "Where is the nearest hospital?",
      "I need a doctor.",
      "I am allergic to penicillin.",
      "I have chest pain.",
      "Please call an ambulance.",
      "I need medication.",
      "Where is the pharmacy?",
      "I have a fever.",
    ],
  },
  {
    category: "Travel",
    iconName: "airplane-outline",
    phrases: [
      "Where is the bus station?",
      "How much does this cost?",
      "Can I have the bill please?",
      "Where is the nearest ATM?",
      "I am lost.",
      "What time does it close?",
      "Is there Wi-Fi here?",
      "I need a taxi.",
    ],
  },
  {
    category: "Greetings",
    iconName: "hand-right-outline",
    phrases: [
      "Good morning.",
      "Good evening.",
      "How are you?",
      "My name is…",
      "Nice to meet you.",
      "Thank you very much.",
      "You are welcome.",
      "Goodbye.",
    ],
  },
  {
    category: "Emergency",
    iconName: "warning-outline",
    phrases: [
      "Help!",
      "Call the police.",
      "There has been an accident.",
      "I need water.",
      "I am in danger.",
      "Where is the exit?",
      "Do not move.",
      "It is an emergency.",
    ],
  },
  {
    category: "Dining",
    iconName: "restaurant-outline",
    phrases: [
      "A table for two, please.",
      "What do you recommend?",
      "I am vegetarian.",
      "The bill, please.",
      "Is this spicy?",
      "May I have some water?",
      "It was delicious.",
      "I have a food allergy.",
    ],
  },
  {
    category: "Business",
    iconName: "business-outline",
    phrases: [
      "Pleased to meet you.",
      "Could we schedule a meeting?",
      "Here is my business card.",
      "What is your role?",
      "Could you repeat that, please?",
      "Let us follow up by email.",
      "I appreciate your time.",
      "Looking forward to working together.",
    ],
  },
];
