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

export default function Home() {
  const [words, setWords] = useState<Word[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("همه");
  const [modal, setModal] = useState<"add" | "detail" | "quiz" | null>(null);
  const [selected, setSelected] = useState<Word | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizChoice, setQuizChoice] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [quizOrder, setQuizOrder] = useState<Word[]>([]);
  const [quizTotal, setQuizTotal] = useState(0);
  const [retriedIds, setRetriedIds] = useState<Set<string>>(new Set());
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
      if (saved) setWords(JSON.parse(saved) as Word[]);
      else setWords(demoWords);
    } catch {
      setWords(demoWords);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  }, [words, hydrated]);

  const filteredWords = useMemo(() => words.filter(w => {
    const matchesQuery = `${w.word} ${w.meaning} ${w.category}`.toLowerCase().includes(query.toLowerCase().trim());
    const matchesFilter = filter === "همه" || w.level === filter || w.category === filter;
    return matchesQuery && matchesFilter;
  }), [words, query, filter]);

  const mastered = words.filter(w => w.reviews >= 5 && w.correct >= 4).length;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const reviewedToday = words.filter(w => typeof w.lastReviewedAt === "number" && w.lastReviewedAt >= todayStart.getTime()).length;
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

  async function translateToPersian(text: string): Promise<string> {
    if (!text.trim()) return "";
    try {
      const data = await fetchJson<{ responseData?: { translatedText?: string }; responseStatus?: number }>(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en%7Cfa`,
        4500
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
    let term = form.word.trim();
    if (!term) { setEnrichMessage("اول کلمه انگلیسی را وارد کن."); return; }
    if (!/^[a-zA-Z][a-zA-Z' -]{0,59}$/.test(term)) {
      setEnrichMessage("لطفاً یک واژه یا عبارت انگلیسی وارد کن.");
      return;
    }

    setEnriching(true);
    setEnrichMessage("در حال دریافت اطلاعات…");
    try {
      type DictionaryResponse = Array<{ meanings?: DictionaryMeaning[] }>;
      type RelatedWord = { word: string; score?: number };
      let dictionaryData = await fetchJson<DictionaryResponse>("https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(term.toLowerCase()), 6500).catch(() => null as DictionaryResponse | null);
      let spellingCorrection = "";
      if (!dictionaryData?.[0]?.meanings?.length) {
        const suggestions = await fetchJson<RelatedWord[]>("https://api.datamuse.com/words?sp=" + encodeURIComponent(term.toLowerCase()) + "&max=5", 4500).catch(() => [] as RelatedWord[]);
        for (const candidate of suggestions) {
          if (!candidate.word || candidate.word.toLowerCase() === term.toLowerCase() || candidate.word.includes(" ")) continue;
          const verified = await fetchJson<DictionaryResponse>("https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(candidate.word), 4500).catch(() => null as DictionaryResponse | null);
          if (verified?.[0]?.meanings?.length) { spellingCorrection = candidate.word; term = candidate.word; dictionaryData = verified; break; }
        }
      }
      const [translatedMeaning, synonymData, antonymData] = await Promise.all([
        translateToPersian(term),
        fetchJson<RelatedWord[]>("https://api.datamuse.com/words?rel_syn=" + encodeURIComponent(term) + "&max=4", 4000).catch(() => [] as RelatedWord[]),
        fetchJson<RelatedWord[]>("https://api.datamuse.com/words?rel_ant=" + encodeURIComponent(term) + "&max=4", 4000).catch(() => [] as RelatedWord[])
      ]);

      let definition = "";
      let example = "";
      let relatedSynonyms: string[] = [];
      let relatedAntonyms: string[] = [];
      if (dictionaryData) {
        const meanings = dictionaryData[0]?.meanings ?? [];
        definition = meanings.flatMap(m => (m.definitions ?? []).map(d => d.definition ?? "")).find(Boolean) ?? "";
        example = meanings.flatMap(m => (m.definitions ?? []).map(d => d.example ?? "")).find(Boolean) ?? "";
        relatedSynonyms = [...new Set(meanings.flatMap(m => [
          ...(m.synonyms ?? []),
          ...(m.definitions ?? []).flatMap(d => d.synonyms ?? [])
        ]))].filter(v => v.toLowerCase() !== term.toLowerCase()).slice(0, 4);
        relatedAntonyms = [...new Set(meanings.flatMap(m => [
          ...(m.antonyms ?? []),
          ...(m.definitions ?? []).flatMap(d => d.antonyms ?? [])
        ]))].slice(0, 4);
      }
      if (!relatedSynonyms.length) relatedSynonyms = synonymData.map(item => item.word).filter(Boolean).slice(0, 4);
      if (!relatedAntonyms.length) relatedAntonyms = antonymData.map(item => item.word).filter(Boolean).slice(0, 4);

      const [exampleFa, synonymTranslations, antonymTranslations] = await Promise.all([
        translateToPersian(example),
        Promise.all(relatedSynonyms.map(async w => { const translation = await translateToPersian(w); return w + " — " + (translation || "معنی نامشخص"); })),
        Promise.all(relatedAntonyms.map(async w => { const translation = await translateToPersian(w); return w + " — " + (translation || "معنی نامشخص"); }))
      ]);

      const hasAnyData = !!(definition || example || translatedMeaning || relatedSynonyms.length || relatedAntonyms.length);
      if (!hasAnyData) throw new Error("دیکشنری پاسخ نداد. اتصال اینترنت را بررسی کن و دوباره امتحان کن.");
      const finalDefinition = definition || (translatedMeaning ? "Meaning in Persian: " + translatedMeaning : "");
      const finalExample = example || (finalDefinition ? "I learned the word " + term + " while studying English." : "");
      const finalExampleFa = exampleFa || (finalExample ? await translateToPersian(finalExample) : "");
      setForm(current => ({
        ...current, word: term, meaning: translatedMeaning || current.meaning || definition,
        definition: finalDefinition || current.definition, example: finalExample || current.example, exampleFa: finalExampleFa || current.exampleFa,
        synonyms: synonymTranslations.join(" || ") || relatedSynonyms.map(w => w + " — معنی نامشخص").join(" || ") || current.synonyms,
        antonyms: antonymTranslations.join(" || ") || relatedAntonyms.map(w => w + " — معنی نامشخص").join(" || ") || current.antonyms,
        level: estimateLevel(term, definition || term), category: inferCategory(term, definition)
      }));
      setEnrichMessage(spellingCorrection ? "املای واژه به «" + spellingCorrection + "» اصلاح شد و اطلاعاتش دریافت شد؛ بررسی‌اش کن." : (!definition || !example ? "مثال جایگزین ساخته شد چون دیکشنری مثال آماده نداشت؛ اطلاعات را بررسی کن." : "تکمیل انجام شد. اطلاعات را بررسی کن؛ اگر سرویسی پاسخ ندهد، فیلدهای موجود حفظ می‌شوند."));
    } catch (error) {
      setEnrichMessage(error instanceof Error ? `${error.message}؛ اطلاعات قبلی پاک نشد.` : "تکمیل خودکار ناموفق بود؛ دوباره امتحان کن.");
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
    if (words.some(w => w.word.trim().toLowerCase() === form.word.trim().toLowerCase())) {
      alert("این واژه از قبل در بانک وجود دارد. برای جلوگیری از تکرار، ذخیره نشد.");
      return;
    }
    const newWord: Word = {
      ...form, word: form.word.trim(), meaning: form.meaning.trim(),
      id: crypto.randomUUID(), createdAt: Date.now(), correct: 0, reviews: 0
    };
    const selectedRelatedWords = [...new Set(checkedRelated)].filter(w => w.trim() && w.toLowerCase() !== newWord.word.toLowerCase());
    const relatedEntries: Word[] = selectedRelatedWords
      .filter(w => !words.some(existing => existing.word.toLowerCase() === w.split(" — ")[0].trim().toLowerCase()))
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

  function startQuiz() {
    if (words.length < 2) {
      alert("برای شروع آزمون، حداقل دو لغت در بانک لازم است.");
      return;
    }
    const priority = [...words].sort((a, b) => {
      const rateA = a.reviews ? a.correct / a.reviews : 0;
      const rateB = b.reviews ? b.correct / b.reviews : 0;
      return rateA - rateB || a.reviews - b.reviews;
    });
    setQuizTotal(Math.min(10, priority.length)); setQuizOrder(priority); setQuizIndex(0); setQuizChoice(null); setQuizScore(0); setQuizDone(false); setRetriedIds(new Set()); setModal("quiz");
  }

  const quizWord = quizOrder.length ? quizOrder[quizIndex % quizOrder.length] : null;
  const quizOptions = useMemo(() => {
    if (!quizWord) return [];
    const others = words.filter(w => w.id !== quizWord.id).sort((a, b) => a.word.localeCompare(b.word)).slice(0, 3);
    return [...others, quizWord].sort((a, b) => (a.id + quizIndex).localeCompare(b.id + quizIndex));
  }, [quizWord, words, quizIndex]);

  function answerQuiz(wordId: string) {
    if (!quizWord || quizChoice) return;
    setQuizChoice(wordId);
    const correct = wordId === quizWord.id;
    if (correct) setQuizScore(s => s + 1);
    setWords(current => current.map(w => w.id === quizWord.id ? {
      ...w, reviews: w.reviews + 1, correct: w.correct + (correct ? 1 : 0), lastReviewedAt: Date.now()
    } : w));
    if (!correct && !retriedIds.has(quizWord.id)) {
      setQuizOrder(current => {
        const updated = [...current];
        updated.splice(Math.min(quizIndex + 2, updated.length), 0, quizWord);
        return updated;
      });
      setQuizTotal(total => total + 1);
      setRetriedIds(current => new Set(current).add(quizWord.id));
    }
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
          lastReviewedAt: Number(item.lastReviewedAt) || undefined
        })).filter(item => item.word && item.meaning);
      if (!imported.length) throw new Error("empty");
      const existing = new Set(words.map(w => w.word.trim().toLowerCase()));
      const unique = imported.filter(w => !existing.has(w.word.trim().toLowerCase()));
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
            <button className="btn btn-primary" onClick={startQuiz}><Brain size={17}/> شروع تمرین هوشمند <ArrowLeft size={15}/></button>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#b5b7c6", fontSize: 12 }}>
            <Flame size={17} color="#ffbf7d"/> استمرار از شدت مهم‌تر است.
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
          <div className="word-list">
            {filteredWords.length ? filteredWords.map(word => (
              <div className="word-row" key={word.id}>
                <div className="word-main" style={{ cursor: "pointer" }} onClick={() => { setSelected(word); setModal("detail"); }}>
                  <div className="word-top"><span className="word-en">{word.word}</span><span className="level">{word.level}</span></div>
                  <div className="word-meaning">{word.meaning}</div>
                  <div className="word-category">{word.category}</div>
                </div>
                <div className="row-actions">
                  <button className="icon-btn" title="شنیدن تلفظ" onClick={() => speak(word.word)}><Volume2 size={16}/></button>
                  <button className="icon-btn" title="جزئیات" onClick={() => { setSelected(word); setModal("detail"); }}><ChevronLeft size={17}/></button>
                  {!word.id.startsWith("demo-") && <button className="icon-btn" title="حذف" onClick={() => deleteWord(word.id)}><Trash2 size={15}/></button>}
                </div>
              </div>
            )) : <div className="empty">چیزی پیدا نشد. با افزودن یک واژه جدید شروع کن.</div>}
          </div>
        </div>

        <aside className="side-stack">
          <div className="panel side-panel">
            <div className="side-title"><span>مسیر یادگیری</span><Sparkles size={17} color="#b8a5ff"/></div>
            <button className="quick-action" onClick={startQuiz}>
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
            <div className="side-title"><span>یادداشت نسخه اولیه</span><CircleHelp size={17} color="#6ee7c2"/></div>
            <p className="muted" style={{ lineHeight: 2, marginBottom: 0 }}>اطلاعات این نسخه روی همین مرورگر ذخیره می‌شود. برای حفظ واژه‌ها، هر از گاهی خروجی بانک را دانلود کن. اتصال دیکشنری آنلاین و مرور فاصله‌دار در مراحل بعدی اضافه می‌شوند.</p>
          </div>
        </aside>
      </section>

      <footer className="footer"><span>LEXORA © 2026 · BUILD YOUR VOCABULARY, BUILD YOURSELF.</span><span>* شاخص تسلط فعلاً بر اساس تعداد تمرین‌ها محاسبه می‌شود.</span></footer>

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
            {quizDone ? (
              <div style={{ textAlign: "center", padding: "25px 0" }}>
                <div className="stat-icon mint" style={{ margin: "0 auto 15px", width: 58, height: 58 }}><GraduationCap size={27}/></div>
                <h2>آفرین، تمرین تمام شد!</h2>
                <div className="goal-number" style={{ textAlign: "center" }}>{quizScore} <span>/ {quizTotal}</span></div>
                <p className="muted">پاسخ درست در این دور. تکرار منظم به تثبیت حافظه کمک می‌کند.</p>
                <button className="btn btn-primary" onClick={startQuiz}><RotateCcw size={16}/> دوباره تمرین کن</button>
              </div>
            ) : quizWord ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}><span className="muted">سؤال {quizIndex + 1} از {quizTotal}</span><span className="level">امتیاز: {quizScore}</span></div>
                <div className="quiz-question"><span style={{ color: "#b8a5ff", fontFamily: "DM Sans, sans-serif", direction: "ltr", display: "inline-flex", alignItems: "center", gap: 8 }}><span>{quizWord.word}</span><button type="button" className="icon-btn" title="شنیدن تلفظ" aria-label={`شنیدن تلفظ ${quizWord.word}`} onClick={() => speak(quizWord.word)}><Volume2 size={17}/></button></span><br/><span style={{ fontSize: 13, color: "#a1a3b3", fontWeight: 400 }}>معنی درست این واژه کدام است؟</span></div>
                <div className="quiz-options">
                  {quizOptions.map(option => <button key={option.id} disabled={!!quizChoice} className={`quiz-option ${quizChoice && option.id === quizWord.id ? "correct" : ""} ${quizChoice === option.id && option.id !== quizWord.id ? "wrong" : ""}`} onClick={() => answerQuiz(option.id)}>{option.meaning}</button>)}
                </div>
                {quizChoice && <div className="notice">{quizChoice === quizWord.id ? "درست بود! عالی پیش می‌ری." : `پاسخ درست: ${quizWord.meaning}`}<div style={{ marginTop: 12 }}><button className="btn btn-primary btn-small" onClick={nextQuestion}>{quizIndex + 1 >= Math.min(10, words.length) ? "دیدن نتیجه" : "سؤال بعدی"} <ArrowLeft size={14}/></button></div></div>}
              </>
            ) : <div className="empty">برای آزمون، ابتدا چند لغت ذخیره کن.</div>}
          </div>
        </div>
      )}
    </main>
  );
}
