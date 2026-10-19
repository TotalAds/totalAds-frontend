import { resolveMergeTagsAndSpintax } from "./htmlPreviewUtils";

export type ReadabilityLabel =
  | "Very Hard"
  | "Hard"
  | "Moderate"
  | "Easy"
  | "Very Easy";

export type SentenceFlag = {
  text: string;
  words: number;
  veryHard: boolean;
};

export type EmailQualityReport = {
  score: number;
  label: ReadabilityLabel;
  words: number;
  sentences: number;
  avgWordsPerSentence: number;
  passiveVoiceUses: number;
  adverbCount: number;
  hardSentences: SentenceFlag[];
  veryHardSentences: SentenceFlag[];
  spamHits: { word: string; count: number }[];
  spamWordCount: number;
  exclamationCount: number;
  allCapsWords: string[];
  hasPersonalization: boolean;
  shortSentences: boolean;
  activeVoice: boolean;
  minimalAdverbs: boolean;
  noVeryHardSentences: boolean;
  noSpamWords: boolean;
  punctuationOk: boolean;
  noAllCaps: boolean;
  inboxSafe: boolean;
};

const SPAM_PHRASES = [
  "buy now",
  "limited offer",
  "act now",
  "click here",
  "risk-free",
  "risk free",
  "no obligation",
  "earn money",
  "make money",
  "double your",
  "extra income",
  "100% free",
  "special promotion",
  "exclusive deal",
  "order now",
  "call now",
  "don't delete",
  "this isn't spam",
  "increase sales",
  "million dollars",
  "cash bonus",
  "work from home",
  "once in a lifetime",
];

const SPAM_WORDS = [
  "free",
  "guarantee",
  "guaranteed",
  "winner",
  "congratulations",
  "urgent",
  "viagra",
  "cash",
  "credit",
  "loan",
  "opportunity",
];

const ADVERB_ALLOWLIST = new Set([
  "only",
  "early",
  "family",
  "apply",
  "reply",
  "supply",
  "july",
  "rely",
  "ugly",
  "holy",
  "assembly",
  "italy",
  "daily",
]);

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"');
}

function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;
  const groups = cleaned
    .replace(/e$/, "")
    .match(/[aeiouy]+/g);
  return Math.max(1, groups?.length ?? 1);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function wordCount(text: string): number {
  const words = text.match(/[A-Za-z0-9''-]+/g);
  return words?.length ?? 0;
}

function labelForScore(score: number): ReadabilityLabel {
  if (score >= 90) return "Very Easy";
  if (score >= 70) return "Easy";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "Hard";
  return "Very Hard";
}

function countPhrase(text: string, phrase: string): number {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = text.match(new RegExp(`\\b${escaped}\\b`, "gi"));
  return matches?.length ?? 0;
}

export function analyzeEmailQuality(
  subject: string,
  bodyHtml: string,
): EmailQualityReport {
  const sampleLead: Record<string, string> = {
    first_name: "Alex",
    firstName: "Alex",
    name: "Alex",
  };
  const resolvedSubject = resolveMergeTagsAndSpintax(subject || "", sampleLead, 0);
  const resolvedBody = resolveMergeTagsAndSpintax(bodyHtml || "", sampleLead, 0, {
    htmlContext: true,
  });
  const plain = [resolvedSubject, stripHtml(resolvedBody)]
    .filter(Boolean)
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const sentenceTexts = plain ? splitSentences(plain) : [];
  const sentences = Math.max(sentenceTexts.length, plain ? 1 : 0);
  const words = wordCount(plain);
  const syllables = (plain.match(/[A-Za-z0-9''-]+/g) || []).reduce(
    (sum, word) => sum + countSyllables(word),
    0,
  );

  let score = 100;
  if (words > 0 && sentences > 0) {
    const raw =
      206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    score = Math.round(Math.min(100, Math.max(0, raw)));
  }

  const sentenceFlags: SentenceFlag[] = sentenceTexts.map((text) => {
    const wordsInSentence = wordCount(text);
    return {
      text,
      words: wordsInSentence,
      veryHard: wordsInSentence > 30,
    };
  });
  const hardSentences = sentenceFlags.filter((item) => item.words > 20);
  const veryHardSentences = sentenceFlags.filter((item) => item.veryHard);

  const passiveVoiceUses = (
    plain.match(
      /\b(am|is|are|was|were|be|been|being)\s+([a-z]+ed|written|seen|made|done|known|given|taken|sent|shown|told|built|found|held|kept|left|sold|bought|paid|said|read|driven|chosen|spoken|broken)\b/gi,
    ) || []
  ).length;

  const adverbCount = (plain.match(/\b[a-z]{4,}ly\b/gi) || []).filter(
    (word) => !ADVERB_ALLOWLIST.has(word.toLowerCase()),
  ).length;

  const haystack = plain.toLowerCase();
  const spamHits: { word: string; count: number }[] = [];
  for (const phrase of [...SPAM_PHRASES, ...SPAM_WORDS]) {
    const count = countPhrase(haystack, phrase);
    if (count > 0) spamHits.push({ word: phrase, count });
  }
  const spamWordCount = spamHits.reduce((sum, hit) => sum + hit.count, 0);

  const exclamationCount = (plain.match(/!/g) || []).length;
  const allCapsWords = Array.from(
    new Set(
      (plain.match(/\b[A-Z]{3,}\b/g) || []).filter(
        (word) => !["HTML", "URL", "CTA", "API", "AI"].includes(word),
      ),
    ),
  );

  const rawSource = `${subject}\n${bodyHtml}`;
  const hasPersonalization =
    /\{\{\s*(first[_ ]?name|firstname|name)\b/i.test(rawSource);

  const shortSentences = hardSentences.length === 0;
  const activeVoice = passiveVoiceUses === 0;
  const minimalAdverbs = adverbCount <= 3;
  const noVeryHardSentences = veryHardSentences.length === 0;
  const noSpamWords = spamWordCount === 0;
  const punctuationOk = exclamationCount <= 2;
  const noAllCaps = allCapsWords.length === 0;
  const inboxSafe = noSpamWords && punctuationOk && noAllCaps;

  return {
    score,
    label: labelForScore(score),
    words,
    sentences,
    avgWordsPerSentence:
      sentences > 0 ? Math.round((words / sentences) * 10) / 10 : 0,
    passiveVoiceUses,
    adverbCount,
    hardSentences,
    veryHardSentences,
    spamHits,
    spamWordCount,
    exclamationCount,
    allCapsWords,
    hasPersonalization,
    shortSentences,
    activeVoice,
    minimalAdverbs,
    noVeryHardSentences,
    noSpamWords,
    punctuationOk,
    noAllCaps,
    inboxSafe,
  };
}
