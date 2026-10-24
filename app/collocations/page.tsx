"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Brain, Check, ChevronDown, Filter, GraduationCap, Heart, Home, RotateCcw, Search, Sparkles, Volume2, X } from "lucide-react";
import { phrases, type Phrase, type PhraseType } from "./data";

type Progress = { known: string[]; favorites: string[]; seen: Record<string, number>; correct: Record<string, number> };
const STORAGE_KEY = "lexora.collocations.v1";
const emptyProgress: Progress = { known: [], favorites: [], seen: {}, correct: {} };
const levels = ["همه سطح‌ها", "A2", "B1", "B2", "C1"];
const types = ["همه انواع", "Collocation", "Idiom", "Phrasal verb"];
const categories = ["همه موضوع‌ها", ...Array.from(new Set(phrases.map(p => p.category))).sort()];
const typeFa: Record<string, string> = { "Collocation": "هم‌آیند", "Idiom": "اصطلاح", "Phrasal verb": "فعل عبارتی" };
const levelFa: Record<string, string> = { A2: "پایه", B1: "متوسط", B2: "متوسط رو به بالا", C1: "پیشرفته" };

function shuffle<T,>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function CollocationsPage() {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("همه سطح‌ها");
  const [type, setType] = useState("همه انواع");
  const [category, setCategory] = useState("همه موضوع‌ها");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [mode, setMode] = useState<"library" | "learn" | "quiz">("library");
  const [revealed, setRevealed] = useState<string[]>([]);
  const [learnQueue, setLearnQueue] = useState<Phrase[]>([]);
  const [learnIndex, setLearnIndex] = useState(0);
  const [quizQueue, setQuizQueue] = useState<Phrase[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizChoice, setQuizChoice] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [quizOptions, setQuizOptions] = useState<Phrase[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Progress>;
        setProgress({
          known: Array.isArray(parsed.known) ? parsed.known.filter((x): x is string => typeof x === "string") : [],
          favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter((x): x is string => typeof x === "string") : [],
          seen: parsed.seen && typeof parsed.seen === "object" ? parsed.seen : {},
          correct: parsed.correct && typeof parsed.correct === "object" ? parsed.correct : {}
        });
      }
    } catch { /* Keep the library usable if local progress is unavailable. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* Storage may be full or disabled. */ }
    }
  }, [progress, hydrated]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return phrases.filter(p =>
      (level === "همه سطح‌ها" || p.level === level) &&
      (type === "همه انواع" || p.type === type) &&
      (category === "همه موضوع‌ها" || p.category === category) &&
      (!onlyFavorites || progress.favorites.includes(p.id)) &&
      (!q || [p.phrase, p.meaning, p.definition, p.example, p.category, p.exampleFa].some(v => v.toLowerCase().includes(q)))
    );
  }, [query, level, type, category, onlyFavorites, progress.favorites]);

  const dueCount = phrases.filter(p => !progress.known.includes(p.id)).length;
  const activeLearn = learnQueue[learnIndex];
  const activeQuiz = quizQueue[quizIndex];

  useEffect(() => {
    if (mode !== "quiz" || !activeQuiz) { setQuizOptions([]); return; }
    const distractors = shuffle(phrases.filter(p => p.id !== activeQuiz.id)).slice(0, 3);
    const options = shuffle([activeQuiz, ...distractors]);
    setQuizOptions(options);
  }, [mode, activeQuiz, quizIndex]);

  function toggleFavorite(id: string) {
    setProgress(current => ({ ...current, favorites: current.favorites.includes(id) ? current.favorites.filter(x => x !== id) : [...current.favorites, id] }));
  }

  function toggleReveal(id: string) {
    setRevealed(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  }

  function startLearn() {
    const pool = filtered.filter(p => !progress.known.includes(p.id));
    if (!pool.length) { alert("در این فیلتر واژهٔ تازه‌ای برای یادگیری باقی نمانده؛ فیلتر را تغییر بده یا از آزمون استفاده کن."); return; }
    setLearnQueue(shuffle(pool).slice(0, 10));
    setLearnIndex(0);
    setMode("learn");
  }

  function rateLearn(known: boolean) {
    const item = activeLearn;
    if (!item) return;
    setProgress(current => ({
      ...current,
      known: known ? (current.known.includes(item.id) ? current.known : [...current.known, item.id]) : current.known.filter(id => id !== item.id),
      seen: { ...current.seen, [item.id]: (current.seen[item.id] || 0) + 1 }
    }));
    if (learnIndex + 1 >= learnQueue.length) setMode("library");
    else setLearnIndex(i => i + 1);
  }

  function startQuiz() {
    if (filtered.length < 2) {
      window.alert("برای آزمون باید حداقل دو عبارت با فیلترهای فعلی پیدا شود.");
      return;
    }
    const pool = filtered;
    setQuizQueue(shuffle(pool).slice(0, Math.min(10, pool.length)));
    setQuizIndex(0); setQuizChoice(null); setQuizScore(0); setQuizDone(false); setMode("quiz");
  }

  function answerQuiz(id: string) {
    if (!activeQuiz || quizChoice) return;
    const correct = id === activeQuiz.id;
    setQuizChoice(id);
    if (correct) setQuizScore(s => s + 1);
    setProgress(current => ({
      ...current,
      seen: { ...current.seen, [activeQuiz.id]: (current.seen[activeQuiz.id] || 0) + 1 },
      correct: { ...current.correct, [activeQuiz.id]: (current.correct[activeQuiz.id] || 0) + (correct ? 1 : 0) }
    }));
  }

  function nextQuiz() {
    if (quizIndex + 1 >= quizQueue.length) setQuizDone(true);
    else { setQuizIndex(i => i + 1); setQuizChoice(null); }
  }

  function speak(text: string) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-GB";
      utterance.rate = 0.88;
      window.speechSynthesis.speak(utterance);
    }
  }

  return (
    <main className="app-shell coll-page">
      <header className="topbar coll-topbar">
        <Link className="brand coll-brand" href="/">
          <div className="brand-mark"><BookOpen size={22} strokeWidth={2.4}/></div>
          <div><div className="brand-name">LEXORA</div><div className="brand-sub">COLLOCATIONS & IDIOMS</div></div>
        </Link>
        <div className="coll-top-actions">
          <Link className="btn btn-small" href="/"><Home size={15}/> صفحهٔ واژگان من</Link>
          <button className="btn btn-small" onClick={() => { setOnlyFavorites(v => !v); setMode("library"); }}><Heart size={15} fill={onlyFavorites ? "currentColor" : "none"}/>{onlyFavorites ? "همهٔ موارد" : "علاقه‌مندی‌ها"}</button>
        </div>
      </header>

      <section className="coll-hero panel">
        <div className="coll-hero-copy">
          <span className="eyebrow">LEXORA LANGUAGE LAB · LEARN IN CHUNKS</span>
          <h1>روان‌تر صحبت کن؛<br/><span>عبارت‌ها را یک‌جا یاد بگیر.</span></h1>
          <p>کتابخانه‌ای مستقل برای هم‌آیندها، اصطلاحات و فعل‌های عبارتی؛ با معنی فارسی، تعریف روشن، مثال طبیعی، تلفظ، فیلتر سطح و تمرین بازیابی.</p>
          <div className="coll-hero-actions">
            <button className="btn btn-primary" onClick={startLearn}><GraduationCap size={17}/> شروع یادگیری <ArrowLeft size={15}/></button>
            <button className="btn" onClick={startQuiz}><Brain size={17}/> آزمون از موارد فیلترشده</button>
          </div>
          <div className="coll-source-note"><Sparkles size={14}/> محتوای منتخب و مثال‌های آموزشی اختصاصی؛ مناسب تمرین روزانه</div>
        </div>
        <div className="coll-hero-stats">
          <div><strong>{phrases.length}</strong><span>عبارت آماده</span></div>
          <div><strong>{progress.known.length}</strong><span>یادگرفته‌شده</span></div>
          <div><strong>{progress.favorites.length}</strong><span>علاقه‌مندی</span></div>
          <div className="coll-mini-progress"><div className="progress-track"><div className="progress-fill" style={{width: `${Math.round(progress.known.length / phrases.length * 100)}%`}}/></div><small>{Math.round(progress.known.length / phrases.length * 100)}٪ از کتابخانه علامت‌گذاری شده</small></div>
        </div>
      </section>

      {mode === "library" && <>
        <section className="coll-tools panel">
          <div className="coll-search"><Search size={18}/><input className="field" value={query} onChange={e => setQuery(e.target.value)} placeholder="جست‌وجو: phrase، معنی فارسی، مثال یا موضوع..."/>{query && <button className="icon-btn" aria-label="پاک کردن جست‌وجو" onClick={() => setQuery("")}><X size={15}/></button>}</div>
          <div className="coll-filter-grid">
            <label><span><Filter size={14}/> سطح CEFR</span><select className="field" value={level} onChange={e => setLevel(e.target.value)}>{levels.map(v => <option key={v}>{v}</option>)}</select></label>
            <label><span>نوع عبارت</span><select className="field" value={type} onChange={e => setType(e.target.value)}>{types.map(v => <option key={v}>{v}</option>)}</select></label>
            <label><span>موضوع</span><select className="field" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(v => <option key={v}>{v}</option>)}</select></label>
          </div>
          <div className="coll-results-line"><span>{filtered.length} عبارت پیدا شد</span><button className="text-action" onClick={() => { setQuery(""); setLevel("همه سطح‌ها"); setType("همه انواع"); setCategory("همه موضوع‌ها"); setOnlyFavorites(false); }}>پاک‌کردن فیلترها</button></div>
        </section>

        <div className="coll-section-heading"><div><h2>کتابخانهٔ عبارت‌ها</h2><p>هر عبارت را باز کن، معنی و کاربردش را ببین و با صدای بلند تکرار کن.</p></div><span className="level">{filtered.length} RESULTS</span></div>
        {filtered.length ? <section className="coll-card-grid">
          {filtered.map((p, index) => {
            const open = revealed.includes(p.id);
            const known = progress.known.includes(p.id);
            const fav = progress.favorites.includes(p.id);
            return <article className={`coll-card ${open ? "is-open" : ""}`} key={p.id}>
              <div className="coll-card-head"><span className={`coll-type type-${p.type === "Idiom" ? "idiom" : p.type === "Phrasal verb" ? "phrasal" : "collocation"}`}>{typeFa[p.type]}</span><span className="level">{p.level}</span><button className="icon-btn coll-fav" title={fav ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"} onClick={() => toggleFavorite(p.id)}><Heart size={16} fill={fav ? "currentColor" : "none"}/></button></div>
              <button className="coll-phrase-button" onClick={() => toggleReveal(p.id)}><span dir="ltr">{p.phrase}</span><span className="coll-chevron"><ChevronDown size={17}/></span></button>
              <div className="coll-card-meta"><span>{p.category}</span>{known && <span className="coll-known"><Check size={12}/> یادگرفته‌شده</span>}</div>
              {open && <div className="coll-answer">
                <div className="coll-meaning">{p.meaning}</div><p className="coll-definition">{p.definition}</p>
                <div className="coll-example"><div className="coll-example-head"><span>EXAMPLE IN CONTEXT</span><button className="icon-btn" aria-label="شنیدن تلفظ" title="شنیدن عبارت" onClick={() => speak(p.phrase)}><Volume2 size={16}/></button></div><p dir="ltr">{p.example}</p><p className="coll-example-fa">{p.exampleFa}</p></div>
                <div className="coll-card-actions"><button className="btn btn-small" onClick={() => speak(p.phrase)}><Volume2 size={14}/> شنیدن</button><button className="btn btn-small" onClick={() => { setProgress(current => ({...current, known: current.known.includes(p.id) ? current.known.filter(x => x !== p.id) : [...current.known, p.id]})); }}><Check size={14}/>{known ? "برداشتن علامت تسلط" : "بلدم"}</button></div>
              </div>}
              <button className="coll-card-toggle" onClick={() => toggleReveal(p.id)}>{open ? "بستن توضیحات" : "نمایش معنی و مثال"} <ChevronDown size={14}/></button>
            </article>;
          })}
        </section> : <div className="panel coll-empty"><Search size={24}/><strong>عبارتی پیدا نشد</strong><p>املای عبارت را تغییر بده یا بخشی از معنی فارسی را جست‌وجو کن.</p><button className="btn" onClick={() => {setQuery("");setLevel("همه سطح‌ها");setType("همه انواع");setCategory("همه موضوع‌ها");setOnlyFavorites(false);}}>نمایش همهٔ عبارت‌ها</button></div>}
      </>}

      {mode === "learn" && <section className="panel coll-session">
        <div className="coll-session-head"><button className="icon-btn" aria-label="بازگشت به کتابخانه" onClick={() => setMode("library")}><X size={18}/></button><span>جلسهٔ یادگیری کوتاه</span><span>{Math.min(learnIndex + 1, learnQueue.length)} از {learnQueue.length}</span></div>
        <div className="progress-track"><div className="progress-fill" style={{width:`${((learnIndex + 1) / learnQueue.length) * 100}%`}}/></div>
        {activeLearn ? <div className="coll-study-card"><span className="coll-type">{typeFa[activeLearn.type]} · {activeLearn.level}</span><h2 dir="ltr">{activeLearn.phrase}</h2><button className="btn" onClick={() => speak(activeLearn.phrase)}><Volume2 size={16}/> شنیدن تلفظ</button><p className="coll-study-prompt">قبل از دیدن پاسخ، معنی و یک موقعیت مناسب برای استفاده از عبارت را از حافظه به یاد بیاور.</p><div className="coll-study-answer"><strong>{activeLearn.meaning}</strong><p>{activeLearn.definition}</p><div className="coll-example"><p dir="ltr">{activeLearn.example}</p><p className="coll-example-fa">{activeLearn.exampleFa}</p></div></div><div className="coll-study-rating"><button className="coll-rate-again" onClick={() => rateLearn(false)}><RotateCcw size={16}/><strong>هنوز بلد نیستم</strong><small>بعداً دوباره تمرین می‌کنم</small></button><button className="coll-rate-good" onClick={() => rateLearn(true)}><Check size={16}/><strong>یاد گرفتم</strong><small>در مرور کلی هم می‌توانم تمرین کنم</small></button></div></div> : <p>عبارتی برای نمایش وجود ندارد.</p>}
      </section>}

      {mode === "quiz" && <section className="panel coll-session">
        <div className="coll-session-head"><button className="icon-btn" aria-label="بازگشت به کتابخانه" onClick={() => setMode("library")}><X size={18}/></button><span>آزمون عبارت‌ها</span>{!quizDone && <span>{quizIndex + 1} از {quizQueue.length}</span>}</div>
        {!quizDone && <div className="progress-track"><div className="progress-fill" style={{width:`${((quizIndex + (quizChoice ? 1 : 0)) / Math.max(1, quizQueue.length)) * 100}%`}}/></div>}
        {quizDone ? <div className="coll-quiz-result"><div className="academy-orb"><GraduationCap size={28}/></div><h2>آزمون تمام شد</h2><div className="goal-number">{quizScore} <span>/ {quizQueue.length}</span></div><p>درصد پاسخ درست: {Math.round(quizScore / Math.max(1, quizQueue.length) * 100)}٪</p><button className="btn btn-primary" onClick={startQuiz}><RotateCcw size={16}/> آزمون دوباره</button><button className="btn" onClick={() => setMode("library")}>بازگشت به کتابخانه</button></div> :
        activeQuiz ? <div className="coll-quiz-body"><span className="coll-type">{typeFa[activeQuiz.type]} · {activeQuiz.level}</span><h2 dir="ltr">{activeQuiz.phrase}</h2><p>معنی درست این عبارت کدام است؟</p><div className="coll-quiz-options">{quizOptions.map(option => <button key={option.id} disabled={!!quizChoice} className={`quiz-option ${quizChoice && option.id === activeQuiz.id ? "correct" : ""} ${quizChoice === option.id && option.id !== activeQuiz.id ? "wrong" : ""}`} onClick={() => answerQuiz(option.id)}>{option.meaning}</button>)}</div>{quizChoice && <div className="notice">{quizChoice === activeQuiz.id ? "درست بود! عالی پیش می‌روی." : `پاسخ درست: ${activeQuiz.meaning}`}<p dir="ltr" style={{marginTop:8}}>{activeQuiz.example}</p><p className="coll-example-fa">{activeQuiz.exampleFa}</p><button className="btn btn-primary btn-small" onClick={nextQuiz}>{quizIndex + 1 >= quizQueue.length ? "دیدن نتیجه" : "سؤال بعدی"} <ArrowLeft size={14}/></button></div>}</div> : <p>برای این فیلتر عبارت کافی نیست.</p>}
      </section>}

      <section className="coll-source-panel panel">
        <div><span className="eyebrow">LEARNING SOURCES</span><h3>منابع و روش تدوین</h3><p>این کتابخانه با مثال‌های آموزشی تألیفی و ترجمهٔ فارسی تنظیم شده است. برای بررسی کاربردها و معنی‌های دیگر، از فرهنگ‌های معتبر هم کمک بگیر.</p></div>
        <div className="coll-source-links"><a href="https://dictionary.cambridge.org/" target="_blank" rel="noreferrer">Cambridge Dictionary <ArrowRight size={14}/></a><a href="https://learnenglish.britishcouncil.org/vocabulary" target="_blank" rel="noreferrer">British Council · Vocabulary <ArrowRight size={14}/></a><a href="https://www.oxfordlearnersdictionaries.com/" target="_blank" rel="noreferrer">Oxford Learner’s Dictionaries <ArrowRight size={14}/></a></div>
      </section>
      <footer className="footer"><span>LEXORA LANGUAGE LAB · BUILD NATURAL ENGLISH</span><span>پیشرفت و علاقه‌مندی‌های این بخش جداگانه روی همین دستگاه ذخیره می‌شوند.</span></footer>
    </main>
  );
}
