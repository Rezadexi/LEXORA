"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft, ArrowLeft, AudioLines, BookOpen, Brain, Check, ChevronLeft,
  CircleHelp, Flame, GraduationCap, Layers3, Plus, Search, Sparkles, Target,
  Trash2, Volume2, X, Zap, Bookmark, RotateCcw
} from "lucide-react";

type DictionaryDefinition = { definition?: string; example?: string; synonyms?: string[]; antonyms?: string[] };
type DictionaryMeaning = { definitions?: DictionaryDefinition[]; synonyms?: string[]; antonyms?: string[] };
type Word = {
  id: string;
  word: string;
  meaning: string;
  category: string;
  level: string;
  definition: string;
  example: string;
  exampleFa: string;
  synonyms: string;
  antonyms: string;
  createdAt: number;
  correct: number;
  reviews: number;
  lastReviewedAt?: number;
  correctStreak?: number;
  nextReviewAt?: number;
  intervalDays?: number;
  lapses?: number;
  academySeen?: number;
  academyCorrectStreak?: number;
  academyNextReviewAt?: number;
  academyLastStudiedAt?: number;
};

type RelatedItem = { word: string; meaning: string; value: string };
function parseRelatedItems(raw: string): RelatedItem[] {
  const parts = raw.includes("||") ? raw.split(/\s*\|\|\s*/) : raw.split(/[،,;؛]/);
  return parts.map(part => part.trim()).filter(Boolean).map(part => {
    const pieces = part.split(/\s+[—–-]\s+/);
    const word = pieces.shift()?.trim() ?? part;
    const meaning = pieces.join(" — ").trim();
    return { word, meaning, value: meaning ? word + " — " + meaning : word };
  }).filter(item => item.word);
}

const STORAGE_KEY = "lexora.words.v1";
const demoWords: Word[] = [
  {
    id: "demo-1", word: "Resilient", meaning: "تاب‌آور، انعطاف‌پذیر",
    category: "Personal growth", level: "B2",
    definition: "Able to recover quickly after difficulties or change.",
    example: "Children can be remarkably resilient after difficult experiences.",
    exampleFa: "کودکان می‌توانند پس از تجربه‌های دشوار، به شکل شگفت‌انگیزی تاب‌آور باشند.",
    synonyms: "strong, adaptable", antonyms: "fragile, vulnerable",
    createdAt: Date.now() - 86400000, correct: 0, reviews: 0
  },
  {
    id: "demo-2", word: "Subtle", meaning: "ظریف، نامحسوس، غیرمستقیم",
    category: "Daily English", level: "C1",
    definition: "Not obvious; difficult to notice or understand immediately.",
    example: "There is a subtle difference between the two expressions.",
    exampleFa: "تفاوت ظریفی بین این دو عبارت وجود دارد.",
    synonyms: "delicate, nuanced", antonyms: "obvious, blatant",
    createdAt: Date.now() - 172800000, correct: 0, reviews: 0
  },
  {
    id: "demo-3", word: "Efficient", meaning: "کارآمد، بهینه",
    category: "Work & study", level: "B1",
    definition: "Working well without wasting time, energy, or resources.",
    example: "A short daily review is an efficient way to remember vocabulary.",
    exampleFa: "مرور کوتاه روزانه راهی کارآمد برای به خاطر سپردن واژگان است.",
    synonyms: "effective, productive", antonyms: "inefficient, wasteful",
    createdAt: Date.now() - 259200000, correct: 0, reviews: 0
  }
];

const levels = ["A1", "A2", "B1", "B2", "C1", "C2", "نامشخص"];
const categories = ["Daily English", "Work & study", "Personal growth", "Travel", "Academic", "Other"];

function normalizeWordKey(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function clozeExample(example: string, word: string): string {
  if (!example) return "I learned the word _____ while studying English.";
  const index = example.toLocaleLowerCase().indexOf(word.toLocaleLowerCase());
  if (index < 0) return "I learned the word _____ while studying English.";
  return example.slice(0, index) + "_____" + example.slice(index + word.length);
}

function deduplicateWords(items: Word[]): Word[] {
  const byKey = new Map<string, Word>();
  for (const item of items) {
    const key = normalizeWordKey(item.word || "");
    if (!key) continue;
    const existing = byKey.get(key);
    if (!existing) { byKey.set(key, item); continue; }
    // Keep the first stable ID, but preserve the richest content and the strongest learning history.
    const preferred = [existing, item].sort((a, b) =>
      [b.definition, b.example, b.exampleFa, b.synonyms, b.antonyms].filter(Boolean).join("").length -
      [a.definition, a.example, a.exampleFa, a.synonyms, a.antonyms].filter(Boolean).join("").length
    )[0];
    byKey.set(key, {
      ...existing,
      meaning: existing.meaning && !existing.meaning.includes("در دسترس نیست") ? existing.meaning : (item.meaning || existing.meaning),
      category: existing.category || item.category || "Other",
      level: existing.level && existing.level !== "نامشخص" ? existing.level : (item.level || "نامشخص"),
      definition: preferred.definition || existing.definition || item.definition || "",
      example: preferred.example || existing.example || item.example || "",
      exampleFa: preferred.exampleFa || existing.exampleFa || item.exampleFa || "",
      synonyms: preferred.synonyms || existing.synonyms || item.synonyms || "",
      antonyms: preferred.antonyms || existing.antonyms || item.antonyms || "",
      createdAt: Math.min(existing.createdAt || Date.now(), item.createdAt || Date.now()),
      correct: Math.max(existing.correct || 0, item.correct || 0),
      reviews: Math.max(existing.reviews || 0, item.reviews || 0),
      correctStreak: Math.max(existing.correctStreak || 0, item.correctStreak || 0),
      lastReviewedAt: Math.max(existing.lastReviewedAt || 0, item.lastReviewedAt || 0) || undefined,
      nextReviewAt: Math.min(existing.nextReviewAt || 0, item.nextReviewAt || 0) || undefined,
      intervalDays: Math.max(existing.intervalDays || 0, item.intervalDays || 0) || undefined,
      lapses: Math.max(existing.lapses || 0, item.lapses || 0),
      academySeen: Math.max(existing.academySeen || 0, item.academySeen || 0),
      academyCorrectStreak: Math.max(existing.academyCorrectStreak || 0, item.academyCorrectStreak || 0),
      academyNextReviewAt: Math.min(existing.academyNextReviewAt || 0, item.academyNextReviewAt || 0) || undefined,
      academyLastStudiedAt: Math.max(existing.academyLastStudiedAt || 0, item.academyLastStudiedAt || 0) || undefined
    });
  }
  return [...byKey.values()];
}

export default function Home() {
  const [words, setWords] = useState<Word[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("همه");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [modal, setModal] = useState<"add" | "detail" | "quiz" | "academy" | null>(null);
  const [academyQueue, setAcademyQueue] = useState<Word[]>([]);
  const [academyIndex, setAcademyIndex] = useState(0);
  const [academyRevealed, setAcademyRevealed] = useState(false);
  const [academyDone, setAcademyDone] = useState(false);
  const [academyCorrect, setAcademyCorrect] = useState(0);
  const [academyReviewed, setAcademyReviewed] = useState(0);
  const [selected, setSelected] = useState<Word | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizChoice, setQuizChoice] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [quizOrder, setQuizOrder] = useState<Word[]>([]);
  const [quizTotal, setQuizTotal] = useState(0);
  const [quizAnswerOffset, setQuizAnswerOffset] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizMode, setQuizMode] = useState<"smart" | "general" | "specialist" | "wrong" | "due" | "reverse" | "cloze">("smart");
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [enriching, setEnriching] = useState(false);
  const [enrichMessage, setEnrichMessage] = useState("");
  const [checkedRelated, setCheckedRelated] = useState<string[]>([]);
  const [form, setForm] = useState({
    word: "", meaning: "", category: "Daily English", level: "نامشخص",
    definition: "", example: "", exampleFa: "", synonyms: "", antonyms: ""
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Word[];
        const unique = deduplicateWords(Array.isArray(parsed) ? parsed : []);
        setWords(unique);
      } else setWords(demoWords);
    } catch {
      setWords(demoWords);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  }, [words, hydrated]);

  const filteredWords = useMemo(() => words.filter(w => {
    const matchesQuery = `${w.word} ${w.meaning} ${w.category} ${w.definition} ${w.example} ${w.synonyms} ${w.antonyms}`.toLowerCase().includes(query.toLowerCase().trim());
    const matchesFilter = filter === "همه" || w.level === filter || w.category === filter;
    return matchesQuery && matchesFilter;
  }), [words, query, filter]);

  const wordsByCategory = useMemo(() => {
    const groups = new Map<string, Word[]>();
    for (const word of filteredWords) {
      const key = word.category || "Other";
      const group = groups.get(key);
      if (group) group.push(word);
      else groups.set(key, [word]);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredWords]);

  const { mastered, dueWords, weakWords, reviewedToday } = useMemo(() => {
    let masteredCount = 0;
    let reviewedTodayCount = 0;
    const due: Word[] = [];
    const weak: Word[] = [];
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const today = todayStart.getTime();
    for (const word of words) {
      if ((word.correctStreak ?? 0) >= 5) masteredCount++;
      if ((word.nextReviewAt ?? 0) <= now) due.push(word);
      if (typeof word.lastReviewedAt === "number" && word.lastReviewedAt >= today) reviewedTodayCount++;
      if (word.reviews > 0 && word.correct / Math.max(1, word.reviews) < 0.6) weak.push(word);
    }
    weak.sort((a, b) => a.correct / Math.max(1, a.reviews) - b.correct / Math.max(1, b.reviews));
    return { mastered: masteredCount, dueWords: due, weakWords: weak.slice(0, 3), reviewedToday: reviewedTodayCount };
  }, [words]);
  const progress = Math.min(100, Math.round((reviewedToday / 10) * 100));

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("تلفظ صوتی در این مرورگر پشتیبانی نمی‌شود.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  }

  async function fetchJson<T>(url: string, timeoutMs = 7000): Promise<T> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`درخواست ناموفق بود (${response.status})`);
      return await response.json() as T;
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function translateToPersian(text: string, timeoutMs = 4500): Promise<string> {
    if (!text.trim()) return "";
    try {
      const data = await fetchJson<{ responseData?: { translatedText?: string }; responseStatus?: number }>(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en%7Cfa`,
        timeoutMs
      );
      const translated = String(data?.responseData?.translatedText ?? "").trim();
      if (data.responseStatus && data.responseStatus !== 200) return "";
      if (!translated || translated.toLowerCase().includes("please use") || translated.toLowerCase() === text.toLowerCase()) return "";
      return translated;
    } catch { return ""; }
  }

  function estimateLevel(word: string, definition: string): string {
    const w = word.toLowerCase();
    const beginner = new Set(["able","about","above","after","again","all","also","always","answer","ask","back","beautiful","because","begin","big","book","bring","call","change","child","city","come","day","different","easy","eat","enough","every","family","feel","find","first","food","friend","good","great","happy","help","home","house","important","know","learn","life","like","little","long","look","make","many","more","most","need","new","nice","often","people","place","play","problem","read","right","same","school","small","start","study","take","thing","think","time","today","try","use","want","water","work","world","write"]);
    if (beginner.has(w)) return "A1";
    if (w.length <= 4 && definition.length < 90) return "A2";
    if (w.length <= 6 && definition.length < 130) return "B1";
    if (w.length <= 9 && definition.length < 180) return "B2";
    return "C1";
  }

  function inferCategory(word: string, definition: string): string {
    const text = `${word} ${definition}`.toLowerCase();
    if (/travel|journey|flight|hotel|tourist|destination|airport|journey/.test(text)) return "Travel";
    if (/study|school|learn|academic|research|student|education|theory|essay/.test(text)) return "Academic";
    if (/work|business|job|company|career|office|professional|meeting/.test(text)) return "Work & study";
    if (/emotion|personality|character|resilien|confidence|habit|motivat|patient/.test(text)) return "Personal growth";
    return "Daily English";
  }

  async function enrichWord() {
    const term = form.word.trim();
    if (!term) { setEnrichMessage("اول کلمه انگلیسی را وارد کن."); return; }
    if (!/^[a-zA-Z][a-zA-Z' -]{0,59}$/.test(term)) {
      setEnrichMessage("لطفاً یک واژه یا عبارت انگلیسی وارد کن.");
      return;
    }

    setEnriching(true);
    setEnrichMessage("در حال تکمیل سریع اطلاعات…");
    type DictionaryResponse = Array<{ meanings?: DictionaryMeaning[] }>;
    type RelatedWord = { word: string; score?: number };
    try {
      // Ask independent sources simultaneously and cap each request so one slow source cannot stall the form.
      const [dictionaryData, translatedMeaning, synonymData, antonymData] = await Promise.all([
        fetchJson<DictionaryResponse>("https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(term.toLowerCase()), 1500).catch(() => null as DictionaryResponse | null),
        translateToPersian(term, 1500).catch(() => ""),
        fetchJson<RelatedWord[]>("https://api.datamuse.com/words?rel_syn=" + encodeURIComponent(term) + "&max=2", 1300).catch(() => [] as RelatedWord[]),
        fetchJson<RelatedWord[]>("https://api.datamuse.com/words?rel_ant=" + encodeURIComponent(term) + "&max=2", 1300).catch(() => [] as RelatedWord[])
      ]);

      const meanings = dictionaryData?.[0]?.meanings ?? [];
      const definition = meanings.flatMap(m => (m.definitions ?? []).map(d => d.definition ?? "")).find(Boolean) ?? "";
      const dictionaryExample = meanings.flatMap(m => (m.definitions ?? []).map(d => d.example ?? "")).find(Boolean) ?? "";
      const relatedSynonyms = [...new Set([
        ...meanings.flatMap(m => [...(m.synonyms ?? []), ...(m.definitions ?? []).flatMap(d => d.synonyms ?? [])]),
        ...synonymData.map(item => item.word)
      ])].filter(w => w && w.toLowerCase() !== term.toLowerCase()).slice(0, 2);
      const relatedAntonyms = [...new Set([
        ...meanings.flatMap(m => [...(m.antonyms ?? []), ...(m.definitions ?? []).flatMap(d => d.antonyms ?? [])]),
        ...antonymData.map(item => item.word)
      ])].filter(Boolean).slice(0, 2);

      // Fill every field immediately; translation of optional example/related words never blocks completion.
      const finalDefinition = definition || (translatedMeaning ? "Meaning in Persian: " + translatedMeaning : "Definition unavailable from the dictionary.");
      const finalExample = dictionaryExample || "I learned the word " + term + " while studying English.";
      const relatedText = (items: string[]) => items.map(w => w + " — معنی نامشخص").join(" || ");
      setForm(current => ({
        ...current,
        meaning: translatedMeaning || current.meaning || "ترجمه در دسترس نیست؛ معنی را بررسی کن",
        definition: finalDefinition,
        example: finalExample,
        exampleFa: current.exampleFa || "",
        synonyms: relatedText(relatedSynonyms) || current.synonyms,
        antonyms: relatedText(relatedAntonyms) || current.antonyms,
        level: estimateLevel(term, definition || term),
        category: inferCategory(term, definition)
      }));
      const hasRemoteData = !!(definition || translatedMeaning || relatedSynonyms.length || relatedAntonyms.length);
      setEnrichMessage(hasRemoteData
        ? "تکمیل سریع انجام شد؛ اگر معنی نامشخص است، آن را بررسی کن."
        : "منابع آنلاین سریع پاسخ ندادند؛ فیلدهای جایگزین پر شدند. اتصال را بررسی کن.");
      // Translate the example in the background without delaying the main autofill.
      if (!form.exampleFa && dictionaryExample) {
        void translateToPersian(dictionaryExample).then(translation => {
          if (translation) setForm(current => current.word.trim().toLowerCase() === term.toLowerCase() ? { ...current, exampleFa: translation } : current);
        });
      }
    } catch {
      setEnrichMessage("تکمیل سریع انجام نشد؛ فیلدها را بررسی کن و دوباره امتحان کن.");
    } finally {
      setEnriching(false);
    }
  }

  function openAdd() {
    setForm({ word: "", meaning: "", category: "Daily English", level: "نامشخص", definition: "", example: "", exampleFa: "", synonyms: "", antonyms: "" });
    setCheckedRelated([]);
    setModal("add");
  }

  function saveWord(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.word.trim() || !form.meaning.trim()) return;
    if (words.some(w => normalizeWordKey(w.word) === normalizeWordKey(form.word))) {
      alert("این واژه از قبل در بانک وجود دارد. برای جلوگیری از تکرار، ذخیره نشد.");
      return;
    }
    const newWord: Word = {
      ...form, word: form.word.trim(), meaning: form.meaning.trim(),
      id: crypto.randomUUID(), createdAt: Date.now(), correct: 0, reviews: 0
    };
    const selectedRelatedWords = [...new Set(checkedRelated)].filter(w => w.trim() && w.toLowerCase() !== newWord.word.toLowerCase());
    const relatedEntries: Word[] = selectedRelatedWords
      .filter(w => !words.some(existing => normalizeWordKey(existing.word) === normalizeWordKey(w.split(" — ")[0])))
      .map(item => {
        const [relatedWord, relatedMeaning] = item.split(" — ");
        return {
          id: crypto.randomUUID(), word: relatedWord.trim(), meaning: (relatedMeaning || "معنی وارد نشده").trim(),
          category: newWord.category, level: estimateLevel(relatedWord.trim(), relatedWord.trim()),
          definition: "", example: "", exampleFa: "", synonyms: "", antonyms: "",
          createdAt: Date.now(), correct: 0, reviews: 0
        };
      });
    setWords(current => [newWord, ...relatedEntries, ...current]);
    setModal(null);
    setQuery("");
    setFilter("همه");
  }

  function deleteWord(id: string) {
    if (!confirm("این لغت از بانک لغات حذف شود؟")) return;
    setWords(current => current.filter(w => w.id !== id));
    if (selected?.id === id) { setSelected(null); setModal(null); }
  }

  function startAcademy() {
    if (!words.length) { alert("اول چند واژه به بانک اضافه کن تا آکادمی بتواند به تو آموزش بدهد."); return; }
    const now = Date.now();
    const due = words.filter(w => (w.academyNextReviewAt ?? 0) <= now);
    const candidates = due.length ? due : words.filter(w => (w.academyCorrectStreak ?? 0) < 5);
    const ranked = [...(candidates.length ? candidates : words)].sort((a, b) => {
      const aNew = (a.academySeen ?? 0) === 0 ? 0 : 1;
      const bNew = (b.academySeen ?? 0) === 0 ? 0 : 1;
      if (aNew !== bNew) return aNew - bNew;
      const aStreak = a.academyCorrectStreak ?? 0;
      const bStreak = b.academyCorrectStreak ?? 0;
      if (aStreak !== bStreak) return aStreak - bStreak;
      const aRate = a.reviews ? a.correct / a.reviews : 0;
      const bRate = b.reviews ? b.correct / b.reviews : 0;
      return aRate - bRate || (a.academyLastStudiedAt ?? 0) - (b.academyLastStudiedAt ?? 0);
    });
    const queue = ranked.slice(0, Math.min(10, ranked.length));
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    setAcademyQueue(queue); setAcademyIndex(0); setAcademyRevealed(false);
    setAcademyDone(false); setAcademyCorrect(0); setAcademyReviewed(0); setModal("academy");
  }

  function rateAcademyWord(rating: "again" | "hard" | "good") {
    const currentWord = academyQueue[academyIndex];
    if (!currentWord) return;
    const now = Date.now();
    const previousStreak = currentWord.academyCorrectStreak ?? 0;
    const nextStreak = rating === "again" ? 0 : previousStreak + 1;
    const days = rating === "again" ? 0 : rating === "hard" ? 1 : [1, 3, 7, 14, 30][Math.min(4, previousStreak)];
    const delay = rating === "again" ? 10 * 60 * 1000 : days * 86400000;
    setWords(current => current.map(w => {
      if (w.id !== currentWord.id) return w;
      const wasCorrect = rating !== "again";
      const quizStreak = wasCorrect ? (w.correctStreak ?? 0) + 1 : 0;
      const quizDays = rating === "again" ? 0 : rating === "hard" ? 1 : [1, 3, 7, 14, 30][Math.min(4, w.correctStreak ?? 0)];
      return {
        ...w,
        academySeen: (w.academySeen ?? 0) + 1,
        academyCorrectStreak: nextStreak,
        academyNextReviewAt: now + delay,
        academyLastStudiedAt: now,
        reviews: (w.reviews ?? 0) + 1,
        correct: (w.correct ?? 0) + (wasCorrect ? 1 : 0),
        correctStreak: quizStreak,
        lapses: (w.lapses ?? 0) + (wasCorrect ? 0 : 1),
        intervalDays: quizDays,
        nextReviewAt: now + (rating === "again" ? 10 * 60 * 1000 : quizDays * 86400000),
        lastReviewedAt: now
      };
    }));
    setAcademyReviewed(n => n + 1);
    if (rating !== "again") setAcademyCorrect(n => n + 1);
    if (academyIndex + 1 >= academyQueue.length) setAcademyDone(true);
    else { setAcademyIndex(n => n + 1); setAcademyRevealed(false); }
  }

  function startQuiz(mode?: "smart" | "general" | "specialist" | "wrong" | "due" | "reverse" | "cloze") {
    if (!mode) { setQuizStarted(false); setQuizDone(false); setModal("quiz"); return; }
    setQuizMode(mode);
    const pool = words.filter(w => mode === "general" || mode === "reverse" || mode === "cloze" || (mode === "wrong"
      ? wrongIds.includes(w.id)
      : mode === "due" ? (w.nextReviewAt ?? 0) <= Date.now()
      : mode === "specialist" ? ((w.correctStreak ?? 0) < 5 && (w.reviews === 0 || w.correct < w.reviews))
      : (w.correctStreak ?? 0) < 5));
    if (pool.length < (mode === "due" ? 1 : 2)) { alert(mode === "wrong" ? "برای آزمون غلط‌ها، حداقل دو واژه غلط لازم است." : mode === "due" ? "فعلاً واژه‌ای برای مرور موعددار نداری؛ عالیه!" : "برای این نوع آزمون حداقل دو واژه لازم است."); return; }
    const priority = [...pool].sort((a, b) => {
      const streakA = a.correctStreak ?? 0, streakB = b.correctStreak ?? 0;
      const rateA = a.reviews ? a.correct / a.reviews : 0, rateB = b.reviews ? b.correct / b.reviews : 0;
      if (mode === "due") return (a.nextReviewAt ?? 0) - (b.nextReviewAt ?? 0);
      return (mode === "general" ? 0 : streakA - streakB) || rateA - rateB || a.reviews - b.reviews;
    });
    // The full-bank exam includes every saved word. Other focused drills stay short, but randomize their selected set.
    const size = mode === "general" ? priority.length : Math.min(10, priority.length);
    const selected = priority.slice(0, size);
    for (let i = selected.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selected[i], selected[j]] = [selected[j], selected[i]];
    }
    const selectedIds = new Set(selected.map(w => w.id));
    setQuizOrder(selected); setQuizTotal(size); setQuizIndex(0); setQuizChoice(null);
    setQuizAnswerOffset(Math.floor(Math.random() * 4));
    setQuizScore(0); setQuizDone(false); setQuizStarted(true);
    setWrongIds(mode === "wrong" ? wrongIds.filter(id => !selectedIds.has(id)) : []); setModal("quiz");
  }

  const quizWord = quizOrder.length ? quizOrder[quizIndex % quizOrder.length] : null;
  const quizOptions = useMemo(() => {
    if (!quizWord) return [];
    const pool = words.filter(w => w.id !== quizWord.id);
    // Fisher–Yates gives distractors a fair shuffle; the correct answer rotates through positions.
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const distractors = pool.slice(0, 3);
    const options = [...distractors];
    const correctSlot = (quizIndex + quizAnswerOffset) % (options.length + 1);
    options.splice(correctSlot, 0, quizWord);
    return options;
  }, [quizWord, words, quizIndex, quizAnswerOffset]);

  function answerQuiz(wordId: string) {
    if (!quizWord || quizChoice) return;
    setQuizChoice(wordId);
    const correct = wordId === quizWord.id;
    if (correct) setQuizScore(s => s + 1);
    if (!correct) setWrongIds(current => current.includes(quizWord.id) ? current : [...current, quizWord.id]);
    setWords(current => current.map(w => w.id === quizWord.id ? {
      ...w, reviews: w.reviews + 1, correct: w.correct + (correct ? 1 : 0),
      correctStreak: correct ? (w.correctStreak ?? 0) + 1 : 0,
      lapses: (w.lapses ?? 0) + (correct ? 0 : 1),
      intervalDays: correct ? ([1, 3, 7, 14, 30][Math.min(4, w.correctStreak ?? 0)] ?? 30) : 0,
      nextReviewAt: Date.now() + (correct ? ([1, 3, 7, 14, 30][Math.min(4, w.correctStreak ?? 0)] ?? 30) * 86400000 : 10 * 60000),
      lastReviewedAt: Date.now()
    } : w));
  }

  function nextQuestion() {
    if (quizIndex + 1 >= quizTotal) setQuizDone(true);
    else { setQuizIndex(i => i + 1); setQuizChoice(null); }
  }

  function exportWords() {
    const blob = new Blob([JSON.stringify(words, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "lexora-vocabulary-backup.json"; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importWords(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error("format");
      const imported: Word[] = parsed.filter((item): item is Word => !!item && typeof item === "object" && typeof (item as Word).word === "string" && typeof (item as Word).meaning === "string")
        .map(item => ({
          id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
          word: item.word.trim(), meaning: item.meaning, category: item.category || "Other", level: item.level || "نامشخص",
          definition: item.definition || "", example: item.example || "", exampleFa: item.exampleFa || "",
          synonyms: item.synonyms || "", antonyms: item.antonyms || "", createdAt: Number(item.createdAt) || Date.now(),
          correct: Math.max(0, Number(item.correct) || 0), reviews: Math.max(0, Number(item.reviews) || 0),
          lastReviewedAt: Number(item.lastReviewedAt) || undefined,
          nextReviewAt: Number(item.nextReviewAt) || undefined,
          intervalDays: Math.max(0, Number(item.intervalDays) || 0),
          correctStreak: Math.max(0, Number(item.correctStreak) || 0),
          lapses: Math.max(0, Number(item.lapses) || 0),
          academySeen: Math.max(0, Number(item.academySeen) || 0),
          academyCorrectStreak: Math.max(0, Number(item.academyCorrectStreak) || 0),
          academyNextReviewAt: Number(item.academyNextReviewAt) || undefined,
          academyLastStudiedAt: Number(item.academyLastStudiedAt) || undefined
        })).filter(item => item.word && item.meaning);
      if (!imported.length) throw new Error("empty");
      const existing = new Set(words.map(w => normalizeWordKey(w.word)));
      const unique = deduplicateWords(imported).filter(w => { const key = normalizeWordKey(w.word); if (existing.has(key)) return false; existing.add(key); return true; });
      if (!unique.length) { alert("همهٔ واژه‌های فایل از قبل در بانک هستند؛ چیزی تغییر نکرد."); return; }
      if (!confirm(`${unique.length} واژهٔ جدید به بانک اضافه شود؟ واژه‌های فعلی حذف نمی‌شوند.`)) return;
      setWords(current => [...unique, ...current]);
      alert(`${unique.length} واژه با موفقیت وارد شد.`);
    } catch {
      alert("فایل معتبر نیست. فایل پشتیبان JSON خروجی LEXORA را انتخاب کن.");
    } finally { e.target.value = ""; }
  }

  const input = (key: keyof typeof form, placeholder: string, required = false) => (
    <input className="field" value={form[key]} required={required} placeholder={placeholder}
      onChange={e => setForm(current => ({ ...current, [key]: e.target.value }))} />
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><BookOpen size={22} strokeWidth={2.4} /></div>
          <div>
            <div className="brand-name">LEXORA</div>
            <div className="brand-sub">YOUR PERSONAL LEXICON</div>
          </div>
        </div>
        <div className="top-actions">
          <a className="btn btn-small coll-nav-link" href="/LEXORA/collocations/"><Sparkles size={15}/> کالوکیشن و اصطلاحات</a>
          <button className="btn btn-small" onClick={exportWords}><ArrowDownLeft size={15}/> خروجی بانک</button>
          <button className="btn btn-small" onClick={() => document.getElementById("lexora-import-file")?.click()}><BookOpen size={15}/> ورود پشتیبان</button>
          <input id="lexora-import-file" type="file" accept="application/json,.json" onChange={importWords} style={{ display: "none" }} />
          <button className="btn btn-primary btn-small" onClick={openAdd}><Plus size={16}/> لغت جدید</button>
        </div>
      </header>

      <section className="hero">
        <div className="panel hero-main">
          <div className="eyebrow">YOUR NEXT LEVEL STARTS HERE</div>
          <h1>لغت یاد نگیر؛<br/><span style={{ color: "#b8a5ff" }}>به بخشی از ذهنت تبدیلش کن.</span></h1>
          <p>یک خانه برای تمام واژه‌هایی که در مسیر یادگیری پیدا می‌کنی؛ از اولین برخورد تا زمانی که بدون فکر از آن‌ها استفاده کنی.</p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={startAcademy}><GraduationCap size={17}/> شروع آموزش روزانه <ArrowLeft size={15}/></button>
            <button className="btn" onClick={() => startQuiz()}><Brain size={17}/> آزمون هوشمند</button>
            <button className="btn" onClick={openAdd}><Plus size={16}/> ثبت یک واژه</button>
          </div>
        </div>
        <div className="panel daily-panel">
          <div>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <span className="panel-heading">هدف امروز</span><Target size={19} color="#a78bfa"/>
            </div>
            <div className="goal-number">{Math.min(reviewedToday, 10)} <span>/ 10 واژه</span></div>
            <div className="muted">هر روز کمی بهتر از دیروز</div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }}/></div>
            <div className="muted">{progress}% از هدف روزانه بر اساس تمرین‌های امروز</div>
          </div>
          <div className="due-review-strip">
            <div><strong>{dueWords.length}</strong><span>واژه آماده مرور</span></div>
            <button className="btn btn-primary btn-small" onClick={() => startQuiz("due")}><RotateCcw size={14}/> مرور موعددار</button>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <div className="panel stat">
          <div className="stat-icon purple"><Layers3 size={20}/></div>
          <div><div className="stat-value">{words.length.toString().padStart(2, "0")}</div><div className="stat-label">واژه در بانک شخصی</div></div>
        </div>
        <div className="panel stat">
          <div className="stat-icon mint"><GraduationCap size={21}/></div>
          <div><div className="stat-value">{mastered.toString().padStart(2, "0")}</div><div className="stat-label">واژه‌های مسلط‌شده*</div></div>
        </div>
        <div className="panel stat">
          <div className="stat-icon orange"><Zap size={20}/></div>
          <div><div className="stat-value">{reviewedToday.toString().padStart(2, "0")}</div><div className="stat-label">واژه‌های تمرین‌شده امروز</div></div>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel words-panel">
          <div className="section-head">
            <div><h2>بانک واژگان</h2><p>مجموعه شخصی تو، همیشه در دسترس</p></div>
            <span className="level">{words.length} WORDS</span>
          </div>
          <div className="search-wrap"><Search size={17}/><input className="field" value={query} onChange={e => setQuery(e.target.value)} placeholder="جست‌وجوی لغت، معنی یا دسته..." /></div>
          <div className="filters">
            {["همه", ...levels.filter(l => words.some(w => w.level === l))].map(f => (
              <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
            {categories.filter(c => words.some(w => w.category === c)).map(f => (
              <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <div className="category-grid">
            {wordsByCategory.length ? wordsByCategory.map(([category, categoryWords]) => {
              const isExpanded = query.trim().length > 0 || expandedCategories.includes(category);
              return <section className="category-card" key={category}>
                <button className="category-toggle" aria-expanded={isExpanded} onClick={() => setExpandedCategories(current => current.includes(category) ? current.filter(item => item !== category) : [...current, category])}>
                  <span className="category-toggle-main"><Layers3 size={17}/><strong>{category}</strong></span>
                  <span className="category-count">{categoryWords.length} واژه <ChevronLeft size={16} style={{ transform: isExpanded ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform .18s" }}/></span>
                </button>
                {isExpanded && <div className="word-list category-word-list">
                  {categoryWords.map(word => <div className="word-row" key={word.id}>
                    <div className="word-main" style={{ cursor: "pointer" }} onClick={() => { setSelected(word); setModal("detail"); }}>
                      <div className="word-top"><span className="word-en">{word.word}</span><span className="level">{word.level}</span></div>
                      <div className="word-meaning">{word.meaning}</div>
                    </div>
                    <div className="row-actions">
                      <button className="icon-btn" title="شنیدن تلفظ" onClick={() => speak(word.word)}><Volume2 size={16}/></button>
                      <button className="icon-btn" title="جزئیات" onClick={() => { setSelected(word); setModal("detail"); }}><ChevronLeft size={17}/></button>
                      {!word.id.startsWith("demo-") && <button className="icon-btn" title="حذف" onClick={() => deleteWord(word.id)}><Trash2 size={15}/></button>}
                    </div>
                  </div>)}
                </div>}
              </section>;
            }) : <div className="empty">چیزی پیدا نشد. با افزودن یک واژه جدید شروع کن.</div>}
          </div>
        </div>

        <aside className="side-stack">
          <div className="panel side-panel academy-promo">
            <div className="side-title"><span>LEXORA Academy</span><GraduationCap size={18} color="#b8a5ff"/></div>
            <p className="muted" style={{ lineHeight: 1.9, margin: "0 0 12px" }}>کلمه را فقط نبین؛ از حافظه بیرون بکش، بازخورد بگیر و در فاصله‌های درست دوباره مرورش کن.</p>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={startAcademy}><Sparkles size={16}/> جلسه ۵ دقیقه‌ای من</button>
            <div className="academy-mini-stats"><span>{words.filter(w => (w.academySeen ?? 0) === 0).length} واژه تازه</span><span>{words.filter(w => (w.academyNextReviewAt ?? 0) <= Date.now() && (w.academySeen ?? 0) > 0).length} آماده مرور</span></div>
          </div>
          <div className="panel side-panel">
            <div className="side-title"><span>مسیر یادگیری</span><Sparkles size={17} color="#b8a5ff"/></div>
            <button className="quick-action" onClick={() => startQuiz()}>
              <span className="quick-icon"><Brain size={18}/></span><span><strong>تمرین چهارگزینه‌ای</strong><small>بازیابی فعال و سنجش حافظه</small></span><ChevronLeft size={17} style={{ marginRight: "auto", color: "#777b8d" }}/>
            </button>
            <button className="quick-action" onClick={() => { setFilter("همه"); setQuery(""); document.querySelector(".words-panel")?.scrollIntoView({ behavior: "smooth" }); }}>
              <span className="quick-icon"><BookOpen size={18}/></span><span><strong>مرور بانک لغات</strong><small>جست‌وجو و بازخوانی واژه‌ها</small></span><ChevronLeft size={17} style={{ marginRight: "auto", color: "#777b8d" }}/>
            </button>
            <button className="quick-action" onClick={exportWords}>
              <span className="quick-icon"><Bookmark size={18}/></span><span><strong>پشتیبان‌گیری</strong><small>دانلود نسخه JSON از بانک لغات</small></span><ChevronLeft size={17} style={{ marginRight: "auto", color: "#777b8d" }}/>
            </button>
          </div>
          <div className="panel side-panel">
            <div className="side-title"><span>رادار نقاط ضعف</span><Target size={17} color="#6ee7c2"/></div>
            {weakWords.length ? <div className="weak-list">{weakWords.map(word => <div className="weak-row" key={word.id}><div><strong>{word.word}</strong><small>{word.correct}/{word.reviews} پاسخ درست</small></div><span>{Math.round(word.correct / Math.max(1, word.reviews) * 100)}%</span></div>)}</div> : <p className="muted" style={{ lineHeight: 2, marginBottom: 0 }}>هنوز داده کافی برای تشخیص نقاط ضعف نداریم. با چند دور تمرین، LEXORA لغت‌هایی را که بیشتر اشتباه می‌زنی مشخص می‌کند.</p>}
            <p className="muted" style={{ lineHeight: 1.9, margin: "12px 0 0" }}>مرور فاصله‌دار: پاسخ غلط → ۱۰ دقیقه؛ پاسخ درست → فاصله مرور به‌تدریج تا ۳۰ روز افزایش می‌یابد.</p>
          </div>
        </aside>
      </section>

      <footer className="footer"><span>LEXORA © 2026 · BUILD YOUR VOCABULARY, BUILD YOURSELF.</span><span>تسلط با تکرار درست سنجیده می‌شود؛ مرور موعددار بر اساس عملکرد تنظیم می‌شود.</span></footer>

      {modal === "academy" && (
        <div className="modal-backdrop academy-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal academy-modal">
            <div className="modal-head"><div><span className="eyebrow">LEXORA ACADEMY · DAILY SESSION</span><h2 style={{ marginTop: 7 }}>یادگیری واقعی، نه حفظ موقت</h2></div><button className="icon-btn" onClick={() => setModal(null)} aria-label="بستن آموزش"><X size={18}/></button></div>
            {academyDone ? (
              <div className="academy-finish">
                <div className="academy-orb"><GraduationCap size={30}/></div>
                <h2>جلسه‌ات کامل شد ✨</h2>
                <p className="muted">مهم نیست چند پاسخ اشتباه بود؛ هر بار که جواب را به یاد می‌آوری، مسیر یادگیری قوی‌تر می‌شود.</p>
                <div className="academy-result-grid"><div><strong>{academyReviewed}</strong><span>واژه مرورشده</span></div><div><strong>{academyCorrect}</strong><span>پاسخ مطمئن</span></div><div><strong>{academyReviewed - academyCorrect}</strong><span>نیازمند مرور دوباره</span></div></div>
                <button className="btn btn-primary" onClick={() => setModal(null)}>بازگشت به خانه <ArrowLeft size={15}/></button>
                {words.some(w => (w.academyNextReviewAt ?? 0) <= Date.now() && (w.academySeen ?? 0) > 0) && <button className="btn" style={{ marginRight: 8 }} onClick={startAcademy}>یک دور دیگر</button>}
              </div>
            ) : academyQueue[academyIndex] ? (
              <>
                <div className="academy-progress-head"><span>جلسه کوتاه روزانه</span><span>{academyIndex + 1} از {academyQueue.length}</span></div>
                <div className="progress-track academy-track"><div className="progress-fill" style={{ width: `${((academyIndex + (academyRevealed ? .5 : 0)) / academyQueue.length) * 100}%` }}/></div>
                <div className="academy-card">
                  <div className="academy-card-top"><span className="level">{academyQueue[academyIndex].level}</span><span className="academy-category">{academyQueue[academyIndex].category}</span></div>
                  <div className="academy-word" dir="ltr">{academyQueue[academyIndex].word}</div>
                  <button className="icon-btn academy-sound" title="شنیدن تلفظ" aria-label="شنیدن تلفظ" onClick={() => speak(academyQueue[academyIndex].word)}><Volume2 size={19}/></button>
                  <p className="academy-prompt">قبل از دیدن پاسخ، سعی کن معنی را از حافظه به یاد بیاوری.</p>
                  {!academyRevealed ? <button className="btn btn-primary academy-reveal" onClick={() => setAcademyRevealed(true)}><Brain size={17}/> نمایش پاسخ و مثال</button> : (
                    <div className="academy-answer">
                      <div className="academy-meaning">{academyQueue[academyIndex].meaning || "معنی فارسی هنوز ثبت نشده است."}</div>
                      {academyQueue[academyIndex].definition && <div className="academy-definition">{academyQueue[academyIndex].definition}</div>}
                      {academyQueue[academyIndex].example && <div className="academy-example"><p dir="ltr">{academyQueue[academyIndex].example}</p>{academyQueue[academyIndex].exampleFa && <p>{academyQueue[academyIndex].exampleFa}</p>}</div>}
                      <div className="academy-recall-tip">حالا بدون نگاه‌کردن، معنی و کاربرد کلمه را یک بار با صدای بلند بگو.</div>
                      <div className="academy-rating-label">چقدر راحت یادت آمد؟</div>
                      <div className="academy-ratings">
                        <button className="academy-rate again" onClick={() => rateAcademyWord("again")}><RotateCcw size={16}/><strong>یادم نیامد</strong><small>مرور دوباره در ۱۰ دقیقه</small></button>
                        <button className="academy-rate hard" onClick={() => rateAcademyWord("hard")}><CircleHelp size={16}/><strong>با سختی</strong><small>مرور فردا</small></button>
                        <button className="academy-rate good" onClick={() => rateAcademyWord("good")}><Check size={16}/><strong>بلدم</strong><small>فاصله مرور بیشتر</small></button>
                      </div>
                    </div>
                  )}
                </div>
                <p className="academy-footnote">LEXORA پاسخ‌هایت را فقط روی همین دستگاه ذخیره می‌کند؛ بانک لغات فعلی دست‌نخورده می‌ماند.</p>
              </>
            ) : <div className="empty">برای شروع، چند واژه در بانک ذخیره کن.</div>}
          </div>
        </div>
      )}

      {modal === "add" && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal">
            <div className="modal-head"><h2>افزودن واژه به بانک</h2><button className="icon-btn" onClick={() => setModal(null)}><X size={18}/></button></div>
            <p className="muted" style={{ lineHeight: 1.8 }}>کلمه را وارد کن و دکمه زیر را بزن تا اطلاعات واژه به‌صورت خودکار دریافت شود. برای این قابلیت به اینترنت نیاز است.</p>
            <form onSubmit={saveWord}>
              <div className="form-grid">
                <div className="form-field"><label>واژه انگلیسی *</label><div className="word-input-with-sound"><input className="field" value={form.word} required placeholder="e.g. thoughtful" onBlur={() => { if (form.word.trim() && !enriching) void enrichWord(); }} onChange={e => setForm(current => ({ ...current, word: e.target.value }))}/><button className="icon-btn" type="button" title="شنیدن تلفظ واژه" aria-label="شنیدن تلفظ واژه" onClick={() => form.word.trim() && speak(form.word.trim())}><Volume2 size={17}/></button></div></div>
                <div className="form-field"><label>معنی فارسی *</label>{input("meaning", "مثلاً باملاحظه، متفکر", true)}</div>
                <div className="form-field"><label>سطح تقریبی</label><select className="field" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>{levels.map(l => <option key={l}>{l}</option>)}</select></div>
                <div className="form-field"><label>دسته‌بندی</label><select className="field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}><button className="btn btn-primary" type="button" onClick={enrichWord} disabled={enriching}>{enriching ? "در حال جست‌وجو…" : "✨ تکمیل خودکار اطلاعات"}</button>{enrichMessage && <span className="muted" role="status">{enrichMessage}</span>}</div>
              <div className="form-field"><label>تعریف انگلیسی</label>{input("definition", "Automatically filled definition")}</div>
              <div className="form-field"><label>مثال انگلیسی</label>{input("example", "A natural example sentence")}</div>
              <div className="form-field"><label>ترجمه مثال</label>{input("exampleFa", "ترجمه فارسی جمله")}</div>
              <div className="form-grid">
                <div className="form-field"><label>مترادف‌ها (واژه — معنی)</label>{input("synonyms", "considerate — باملاحظه || caring — دلسوز")}</div>
                <div className="form-field"><label>متضادها (واژه — معنی)</label>{input("antonyms", "careless — بی‌دقت || thoughtless — بی‌ملاحظه")}</div>
              </div>
              {(form.synonyms || form.antonyms) && <div className="related-pick-panel">
                <div className="related-pick-title">افزودن واژه‌های مرتبط به بانک؟</div>
                <p className="muted">تیک هر کلمه‌ای را که می‌خواهی جداگانه در بانک ذخیره شود بزن.</p>
                {[...parseRelatedItems(form.synonyms), ...parseRelatedItems(form.antonyms)].map((item, index) => <label className="related-pick" key={item.word + index}>
                  <input type="checkbox" checked={checkedRelated.includes(item.value)} onChange={e => setCheckedRelated(current => e.target.checked ? [...current, item.value] : current.filter(v => v !== item.value))}/>
                  <span dir="ltr">{item.word}</span><span className="related-pick-meaning">{item.meaning || "معنی نامشخص"}</span>
                </label>)}
              </div>}
              <div className="form-actions"><button className="btn btn-primary" type="submit"><Check size={16}/> ذخیره واژه</button><button className="btn" type="button" onClick={() => setModal(null)}>انصراف</button></div>
            </form>
          </div>
        </div>
      )}

      {modal === "detail" && selected && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal">
            <div className="modal-head"><span className="eyebrow">WORD PROFILE</span><button className="icon-btn" onClick={() => setModal(null)}><X size={18}/></button></div>
            <div className="detail-hero">
              <div className="detail-word">{selected.word}</div>
              <div className="detail-meaning">{selected.meaning}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}><span className="level">{selected.level}</span><span className="muted">{selected.category}</span><button className="icon-btn" onClick={() => speak(selected.word)} title="پخش تلفظ"><AudioLines size={16}/></button></div>
            </div>
            {selected.definition && <div className="detail-section"><h3>DEFINITION · توضیح انگلیسی</h3><p>{selected.definition}</p>{selected.meaning && <div className="meaning-under-definition"><strong>معنی فارسی</strong><span>{selected.meaning}</span></div>}</div>}
            {!selected.definition && selected.meaning && <div className="detail-section"><h3>معنی فارسی</h3><p>{selected.meaning}</p></div>}
            {selected.example && <div className="detail-section"><h3>EXAMPLE IN CONTEXT</h3><p dir="ltr" style={{ textAlign: "left" }}>{selected.example}</p>{selected.exampleFa && <p style={{ color: "#aaaabd", marginTop: 7 }}>{selected.exampleFa}</p>}</div>}
            {selected.synonyms && <div className="detail-section"><h3>SYNONYMS · مترادف‌ها</h3><div className="related-columns">{parseRelatedItems(selected.synonyms).map((item, index) => <div className="related-line" key={item.word + index}><span dir="ltr">{item.word}</span><span>{item.meaning || "—"}</span></div>)}</div></div>}
            {selected.antonyms && <div className="detail-section"><h3>ANTONYMS · متضادها</h3><div className="related-columns">{parseRelatedItems(selected.antonyms).map((item, index) => <div className="related-line" key={item.word + index}><span dir="ltr">{item.word}</span><span>{item.meaning || "—"}</span></div>)}</div></div>}
            <div className="form-actions"><button className="btn" onClick={() => { setModal(null); setSelected(null); }}><Check size={16}/> تمام</button>{!selected.id.startsWith("demo-") && <button className="btn" onClick={() => deleteWord(selected.id)}><Trash2 size={15}/> حذف واژه</button>}</div>
          </div>
        </div>
      )}

      {modal === "quiz" && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal">
            <div className="modal-head"><div><span className="eyebrow">RECALL ARENA</span><h2 style={{ marginTop: 6 }}>تمرین واژگان</h2></div><button className="icon-btn" onClick={() => setModal(null)}><X size={18}/></button></div>
            {!quizStarted ? (
              <div style={{ padding: "16px 0" }}>
                <h3>نوع آزمون را انتخاب کن</h3>
                <p className="muted">آزمون کلی از تمام واژه‌های بانک سؤال می‌سازد؛ ترتیب سؤال‌ها و گزینه‌ها تصادفی است. آزمون‌های تمرکزی کوتاه‌ترند.</p>
                <div className="quiz-mode-section" style={{ marginTop: 18 }}>
                  <h4 style={{ margin: "0 0 8px", color: "#b8a5ff" }}>تمرین عمومی</h4>
                  <div className="quiz-options">
                    <button className="quiz-option" onClick={() => startQuiz("general")}>آزمون کلی <small>سؤال از همه واژه‌های بانک، حتی واژه‌های مسلط‌شده</small></button>
                    <button className="quiz-option" onClick={() => startQuiz("smart")}>آزمون هوشمند <small>تمرکز روی واژه‌های یادنگرفته و دشوار</small></button>
                    <button className="quiz-option" onClick={() => startQuiz("reverse")}>آزمون معکوس <small>معنی فارسی را ببین و واژه انگلیسی را به یاد بیاور</small></button>
                    <button className="quiz-option" onClick={() => startQuiz("cloze")}>تکمیل جمله <small>واژه مناسب را از روی جمله و مفهوم انتخاب کن</small></button>
                  </div>
                </div>
                <div className="quiz-mode-section" style={{ marginTop: 18 }}>
                  <h4 style={{ margin: "0 0 8px", color: "#6ee7c2" }}>تمرین تخصصی</h4>
                  <div className="quiz-options">
                    <button className="quiz-option" onClick={() => startQuiz("specialist")}>آزمون تخصصی <small>فقط واژه‌های جدید یا واژه‌هایی که قبلاً اشتباه زده‌ای</small></button>
                    <button className="quiz-option" disabled={wrongIds.length < 2} onClick={() => startQuiz("wrong")}>مرور واژه‌های غلط ({wrongIds.length}) <small>فقط غلط‌های ثبت‌شده در این نشست</small></button>
                  </div>
                </div>
              </div>
            ) : quizDone ? (
              <div style={{ textAlign: "center", padding: "25px 0" }}>
                <div className="stat-icon mint" style={{ margin: "0 auto 15px", width: 58, height: 58 }}><GraduationCap size={27}/></div>
                <h2>آفرین، تمرین تمام شد!</h2>
                <div className="goal-number" style={{ textAlign: "center" }}>{quizScore} <span>/ {quizTotal}</span></div>
                <p className="muted">درصد پاسخ درست: {quizTotal ? Math.round(quizScore / quizTotal * 100) : 0}%</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", margin: "18px 0" }}>
                  <span className="level">درست: {quizScore}</span><span className="level">غلط: {wrongIds.length}</span><span className="level">تسلط کامل: {mastered} واژه</span>
                </div>
                {wrongIds.length >= 2 && <button className="btn" style={{ margin: "0 6px 10px" }} onClick={() => startQuiz("wrong")}>آزمون جداگانه واژه‌های غلط ({wrongIds.length})</button>}
                <button className="btn btn-primary" onClick={() => startQuiz()}><RotateCcw size={16}/> انتخاب آزمون دیگر</button>
              </div>
            ) : quizStarted && quizWord ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}><span className="muted">سؤال {quizIndex + 1} از {quizTotal}</span><span className="level">امتیاز: {quizScore}</span></div>
                <div className="quiz-question">
                  <span style={{ color: "#b8a5ff", fontFamily: "DM Sans, sans-serif", direction: "ltr", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span>{quizMode === "reverse" ? quizWord.meaning : quizMode === "cloze" ? clozeExample(quizWord.example, quizWord.word) : quizWord.word}</span>
                    {quizMode !== "reverse" && <button type="button" className="icon-btn" title="شنیدن تلفظ" aria-label={`شنیدن تلفظ ${quizWord.word}`} onClick={() => speak(quizWord.word)}><Volume2 size={17}/></button>}
                  </span>
                  <br/>
                  <span style={{ fontSize: 13, color: "#a1a3b3", fontWeight: 400 }}>
                    {quizMode === "reverse" ? "کدام واژه با این معنی مطابقت دارد؟" : quizMode === "cloze" ? "کدام واژه جای خالی جمله را کامل می‌کند؟" : "معنی درست این واژه کدام است؟"}
                  </span>
                </div>
                <div className="quiz-options">
                  {quizOptions.map(option => <button key={option.id} disabled={!!quizChoice} className={`quiz-option ${quizChoice && option.id === quizWord.id ? "correct" : ""} ${quizChoice === option.id && option.id !== quizWord.id ? "wrong" : ""}`} onClick={() => answerQuiz(option.id)}>{quizMode === "reverse" || quizMode === "cloze" ? option.word : option.meaning}</button>)}
                </div>
                {quizChoice && <div className="notice">{quizChoice === quizWord.id ? "درست بود! عالی پیش می‌ری." : `پاسخ درست: ${quizWord.meaning}`}{quizWord.definition && <p style={{ margin: "8px 0 0", color: "#c7c8d6", lineHeight: 1.9 }}>{quizWord.definition}</p>}{quizWord.example && <p dir="ltr" style={{ textAlign: "left", margin: "8px 0 0", color: "#b8b9ca", lineHeight: 1.8 }}>{quizWord.example}</p>}<div style={{ marginTop: 12 }}><button className="btn btn-primary btn-small" onClick={nextQuestion}>{quizIndex + 1 >= quizTotal ? "دیدن نتیجه" : "سؤال بعدی"} <ArrowLeft size={14}/></button></div></div>}
              </>
            ) : <div className="empty">برای آزمون، ابتدا چند لغت ذخیره کن.</div>}
          </div>
        </div>
      )}
    </main>
  );
}
