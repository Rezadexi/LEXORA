"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, AudioLines, BookOpen, Check, ChevronDown, ChevronRight,
  Headphones, Pause, Play, Podcast as PodcastIcon, RotateCcw, Save,
  Search, SkipBack, SkipForward, Sparkles, Volume2, X
} from "lucide-react";
import "./podcast.css";

type Word = {
  id: string;
  word: string;
  meaning: string;
  level?: string;
  category?: string;
  definition?: string;
  example?: string;
  exampleFa?: string;
};
type Segment = {
  id: string;
  section: "intro" | "vocabulary" | "story" | "conversation" | "outro";
  label: string;
  speaker: string;
  text: string;
  wordId?: string;
};
type Episode = {
  id: string;
  title: string;
  createdAt: number;
  wordIds: string[];
  segments: Segment[];
};
type SavedEpisode = Episode;

const WORDS_KEY = "lexora.words.v1";
const EPISODES_KEY = "lexora.podcast.episodes.v1";

function makeSegments(words: Word[], title: string): Segment[] {
  const segments: Segment[] = [{
    id: "intro",
    section: "intro",
    label: "Welcome",
    speaker: "Host",
    text: `Welcome to LEXORA Podcast. I'm your host. Today's episode is called ${title}. We'll learn ${words.length} useful English words, hear them in context, and finish with a listening and vocabulary challenge. Take a breath, listen carefully, and let's begin.`
  }];

  words.forEach((word, index) => {
    const definition = word.definition?.trim() || `The Persian meaning is ${word.meaning || "not added yet"}.`;
    const example = word.example?.trim();
    segments.push({
      id: `vocab-${word.id}`,
      section: "vocabulary",
      label: `${index + 1}. ${word.word}`,
      speaker: "Host",
      wordId: word.id,
      text: `Word number ${index + 1}: ${word.word}. ${definition} ${example ? `Listen to this example: ${example}` : `Try to make your own sentence with the word ${word.word}.`}`
    });
  });

  segments.push({
    id: "story-start",
    section: "story",
    label: "A day in context · Part 1",
    speaker: "Narrator",
    text: "Now, let's follow Maya through a busy week. She has decided to improve her English. Every day, she listens carefully, writes down useful expressions, and tries to notice how people use them in real situations. As you listen, pay attention to today's vocabulary."
  });

  words.forEach((word, index) => {
    const example = word.example?.trim();
    segments.push({
      id: `story-${word.id}`,
      section: "story",
      label: `Story · ${word.word}`,
      speaker: "Narrator",
      wordId: word.id,
      text: example
        ? `On day ${index + 1}, Maya heard this sentence: ${example} She wrote down the word ${word.word} and connected it with its meaning.`
        : `On day ${index + 1}, Maya reviewed the word ${word.word}. She said it aloud, checked its meaning, and created a new sentence of her own.`
    });
  });

  segments.push({
    id: "story-end",
    section: "story",
    label: "A day in context · Part 2",
    speaker: "Narrator",
    text: "By the end of the week, Maya had done more than memorize a list. She had heard the words, understood their meanings, and practiced using them. That's how vocabulary becomes part of your active English."
  });

  words.forEach((word, index) => {
    if (index % 2 !== 0 && words.length > 1) return;
    const partner = words[index + 1];
    segments.push({
      id: `dialogue-${word.id}`,
      section: "conversation",
      label: `Conversation · ${word.word}`,
      speaker: "Host & Learner",
      wordId: word.id,
      text: partner
        ? `Host: Let's review two words. What does ${word.word} mean? Learner: ${word.definition || word.meaning}. Host: Good. And what about ${partner.word}? Learner: ${partner.definition || partner.meaning}. Host: Excellent. Now listen to the examples again and notice the pronunciation.`
        : `Host: One final question. What does ${word.word} mean? Learner: ${word.definition || word.meaning}. Host: Exactly. Say the word one more time and make your own sentence.`
    });
  });

  segments.push({
    id: "outro",
    section: "outro",
    label: "Wrap-up",
    speaker: "Host",
    text: "That's the end of this LEXORA episode. Before you go, try the short quiz on the screen. Then come back tomorrow and listen again. Repetition, attention, and active use make vocabulary stick. Thanks for listening."
  });

  return segments;
}

function sectionName(section: Segment["section"]) {
  return ({
    intro: "شروع",
    vocabulary: "آموزش واژگان",
    story: "داستان",
    conversation: "مکالمه",
    outro: "جمع‌بندی"
  })[section];
}

export default function PodcastPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("A New Beginning");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(0.9);
  const [savedEpisodes, setSavedEpisodes] = useState<SavedEpisode[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeTab, setActiveTab] = useState<"studio" | "player" | "quiz" | "library">("studio");
  const [notice, setNotice] = useState("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentIndexRef = useRef(0);
  const segmentsRef = useRef<Segment[]>([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(WORDS_KEY) || "[]");
      const valid = Array.isArray(parsed) ? parsed.filter((item): item is Word =>
        !!item && typeof item.id === "string" && typeof item.word === "string" && typeof item.meaning === "string"
      ) : [];
      setWords(valid);
      setSelectedIds(valid.slice(0, 8).map(item => item.id));
      const saved = JSON.parse(localStorage.getItem(EPISODES_KEY) || "[]");
      setSavedEpisodes(Array.isArray(saved) ? saved : []);
    } catch {
      setWords([]);
      setSelectedIds([]);
      setSavedEpisodes([]);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const selectedWords = useMemo(
    () => selectedIds.map(id => words.find(word => word.id === id)).filter((word): word is Word => !!word),
    [selectedIds, words]
  );
  const filteredWords = useMemo(() => words.filter(word =>
    `${word.word} ${word.meaning} ${word.level || ""} ${word.category || ""}`.toLowerCase().includes(search.toLowerCase().trim())
  ), [words, search]);
  const currentSegment = segments[currentIndex];
  const quizWord = selectedWords[quizIndex];
  const quizOptions = useMemo(() => {
    if (!quizWord) return [];
    const others = selectedWords.filter(word => word.id !== quizWord.id);
    const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
    return [...shuffled, quizWord].sort(() => Math.random() - 0.5);
  }, [quizWord, selectedWords, quizIndex]);
  const quizScore = selectedWords.filter(word => quizAnswers[word.id] === word.id).length;

  function toggleWord(id: string) {
    setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }

  function stopAudio() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsPlaying(false);
  }

  function speakSegment(index: number) {
    const segment = segmentsRef.current[index];
    if (!segment || !("speechSynthesis" in window)) {
      setNotice("پخش گفتار در این مرورگر پشتیبانی نمی‌شود.");
      setIsPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.onend = () => {
      const next = index + 1;
      if (next < segmentsRef.current.length) {
        currentIndexRef.current = next;
        setCurrentIndex(next);
        window.setTimeout(() => speakSegment(next), 180);
      } else {
        setIsPlaying(false);
        setNotice("قسمت به پایان رسید. حالا آزمون شنیداری را امتحان کن.");
      }
    };
    utterance.onerror = () => setIsPlaying(false);
    utteranceRef.current = utterance;
    currentIndexRef.current = index;
    setCurrentIndex(index);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  }

  function play() {
    if (!segments.length) return;
    if ("speechSynthesis" in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      return;
    }
    speakSegment(currentIndex);
  }

  function pause() {
    if ("speechSynthesis" in window) window.speechSynthesis.pause();
    setIsPlaying(false);
  }

  function changeSegment(nextIndex: number) {
    const bounded = Math.max(0, Math.min(segments.length - 1, nextIndex));
    stopAudio();
    setCurrentIndex(bounded);
  }

  function generateEpisode() {
    if (selectedWords.length < 3) {
      setNotice("برای ساخت قسمت، حداقل ۳ واژه انتخاب کن.");
      return;
    }
    stopAudio();
    const nextSegments = makeSegments(selectedWords, title.trim() || "Your Vocabulary Story");
    setSegments(nextSegments);
    setCurrentIndex(0);
    setQuizAnswers({});
    setQuizIndex(0);
    setShowQuiz(false);
    setActiveTab("player");
    setNotice("قسمت ساخته شد. برای شنیدن، دکمه پخش را بزن.");
  }

  function saveEpisode() {
    if (!segments.length) return;
    const episode: SavedEpisode = {
      id: `episode-${Date.now()}`,
      title: title.trim() || "LEXORA Episode",
      createdAt: Date.now(),
      wordIds: selectedWords.map(word => word.id),
      segments
    };
    const next = [episode, ...savedEpisodes].slice(0, 30);
    setSavedEpisodes(next);
    try {
      localStorage.setItem(EPISODES_KEY, JSON.stringify(next));
      setNotice("قسمت در آرشیو همین دستگاه ذخیره شد.");
    } catch {
      setNotice("فضای ذخیره‌سازی مرورگر کافی نیست؛ قسمت ذخیره نشد.");
    }
  }

  function openEpisode(episode: SavedEpisode) {
    stopAudio();
    setTitle(episode.title);
    setSelectedIds(episode.wordIds);
    setSegments(episode.segments);
    setCurrentIndex(0);
    setActiveTab("player");
    setNotice("قسمت ذخیره‌شده آماده پخش است.");
  }

  function deleteEpisode(id: string) {
    const next = savedEpisodes.filter(item => item.id !== id);
    setSavedEpisodes(next);
    localStorage.setItem(EPISODES_KEY, JSON.stringify(next));
  }

  function answerQuiz(wordId: string) {
    if (!quizWord || quizAnswers[quizWord.id]) return;
    setQuizAnswers(current => ({ ...current, [quizWord.id]: wordId }));
  }

  function nextQuiz() {
    if (quizIndex + 1 >= selectedWords.length) {
      setShowQuiz(true);
      return;
    }
    setQuizIndex(index => index + 1);
  }

  function resetQuiz() {
    setQuizAnswers({});
    setQuizIndex(0);
    setShowQuiz(false);
  }

  const progress = segments.length ? Math.round(((currentIndex + 1) / segments.length) * 100) : 0;

  return (
    <main className="podcast-shell">
      <header className="podcast-topbar">
        <a className="podcast-brand" href="/LEXORA/"><span className="podcast-brand-mark"><PodcastIcon size={22}/></span><span><strong>LEXORA</strong><small>PODCAST STUDIO</small></span></a>
        <div className="podcast-top-actions">
          <span className="podcast-accent"><AudioLines size={15}/> AMERICAN ENGLISH</span>
          <a className="podcast-back-link" href="/LEXORA/"><ArrowLeft size={15}/> بازگشت به بانک لغات</a>
        </div>
      </header>

      <section className="podcast-hero">
        <div className="podcast-hero-copy">
          <span className="podcast-eyebrow"><Sparkles size={14}/> LISTEN · LEARN · SPEAK</span>
          <h1>کلماتت را <span>بشنو، بفهم و زندگی کن.</span></h1>
          <p>از بانک واژگانت یک جلسه شنیداری بساز؛ با آموزش کلمه، داستان، مکالمه و آزمون درک مطلب.</p>
          <div className="podcast-hero-meta"><span><Headphones size={15}/> تلفظ آمریکایی</span><span><BookOpen size={15}/> متصل به بانک شخصی</span><span><AudioLines size={15}/> پخش صوتی مرورگر</span></div>
        </div>
        <div className="podcast-orb-wrap"><div className="podcast-orb"><AudioLines size={44}/><span>LEXORA</span></div><div className="podcast-orb-ring ring-one"/><div className="podcast-orb-ring ring-two"/></div>
      </section>

      <nav className="podcast-tabs" aria-label="بخش‌های پادکست">
        <button className={activeTab === "studio" ? "active" : ""} onClick={() => setActiveTab("studio")}><Sparkles size={15}/> استودیو</button>
        <button className={activeTab === "player" ? "active" : ""} disabled={!segments.length} onClick={() => setActiveTab("player")}><Headphones size={15}/> پخش‌کننده</button>
        <button className={activeTab === "quiz" ? "active" : ""} disabled={!segments.length} onClick={() => { setActiveTab("quiz"); resetQuiz(); }}><Check size={15}/> آزمون Listening</button>
        <button className={activeTab === "library" ? "active" : ""} onClick={() => setActiveTab("library")}><BookOpen size={15}/> آرشیو</button>
      </nav>

      {activeTab === "studio" && (
        <section className="podcast-studio-grid">
          <div className="podcast-panel podcast-word-picker">
            <div className="podcast-section-heading"><div><span className="podcast-kicker">STEP 01</span><h2>انتخاب واژه‌ها</h2><p>واژه‌هایی را که می‌خواهی در این قسمت تمرین کنی انتخاب کن.</p></div><span className="podcast-count">{selectedIds.length} انتخاب</span></div>
            <div className="podcast-search"><Search size={16}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="جست‌وجوی واژه یا معنی..."/></div>
            {!hydrated ? <div className="podcast-empty">در حال خواندن بانک لغات…</div> : words.length === 0 ? <div className="podcast-empty"><BookOpen size={24}/><strong>بانک لغات خالی است</strong><span>ابتدا چند واژه در صفحه اصلی LEXORA ثبت کن.</span><a href="/LEXORA/">رفتن به بانک لغات <ArrowLeft size={14}/></a></div> : (
              <div className="podcast-word-list">
                {filteredWords.map(word => (
                  <label className={selectedIds.includes(word.id) ? "podcast-word-option selected" : "podcast-word-option"} key={word.id}>
                    <input type="checkbox" checked={selectedIds.includes(word.id)} onChange={() => toggleWord(word.id)}/>
                    <span className="podcast-word-option-main"><strong dir="ltr">{word.word}</strong><small>{word.meaning}</small></span>
                    <span className="podcast-word-level">{word.level || "—"}</span>
                    <button type="button" className="podcast-word-sound" title="شنیدن تلفظ" onClick={event => { event.preventDefault(); event.stopPropagation(); const u = new SpeechSynthesisUtterance(word.word); u.lang = "en-US"; speechSynthesis.cancel(); speechSynthesis.speak(u); }}><Volume2 size={15}/></button>
                  </label>
                ))}
              </div>
            )}
            <div className="podcast-picker-footer"><button className="podcast-text-button" onClick={() => setSelectedIds(filteredWords.map(word => word.id))}>انتخاب نتایج</button><button className="podcast-text-button" onClick={() => setSelectedIds([])}>پاک‌کردن انتخاب</button><span>پیشنهاد: ۵ تا ۱۲ واژه</span></div>
          </div>

          <aside className="podcast-panel podcast-settings">
            <span className="podcast-kicker">STEP 02</span><h2>تنظیم قسمت</h2>
            <label className="podcast-field-label">عنوان اپیزود</label>
            <input className="podcast-title-input" value={title} onChange={event => setTitle(event.target.value)} placeholder="A New Beginning"/>
            <div className="podcast-setting-row"><span>لهجه</span><strong>American English</strong></div>
            <div className="podcast-setting-row"><span>سطح</span><strong>B1 · Intermediate</strong></div>
            <div className="podcast-setting-row"><span>ساختار</span><strong>آموزش + داستان + مکالمه</strong></div>
            <div className="podcast-setting-row"><span>گوینده</span><strong>صدای انگلیسی مرورگر</strong></div>
            <div className="podcast-note"><AudioLines size={17}/><span>پخش از صدای انگلیسی دستگاه استفاده می‌کند. صدای در دسترس به مرورگر و تنظیمات گوشی بستگی دارد.</span></div>
            <button className="podcast-generate" onClick={generateEpisode}><Sparkles size={17}/> ساخت قسمت با {selectedIds.length} واژه <ChevronRight size={17}/></button>
            <p className="podcast-disclaimer">متن با قالب آموزشی LEXORA ساخته می‌شود؛ برای تولید متن تازه با هوش مصنوعی به سرویس و اتصال جداگانه نیاز است.</p>
          </aside>
        </section>
      )}

      {activeTab === "player" && segments.length > 0 && (
        <section className="podcast-player-layout">
          <div className="podcast-panel podcast-player-main">
            <div className="podcast-player-header"><span className="podcast-kicker">NOW PLAYING</span><span className="podcast-accent"><AudioLines size={14}/> en-US</span></div>
            <div className="podcast-cover"><div className="podcast-cover-lines"/><div className="podcast-cover-icon"><PodcastIcon size={42}/></div><span>LEXORA ORIGINAL</span><strong>{title}</strong><small>VOCABULARY · STORY · LISTENING</small></div>
            <div className="podcast-now-title"><span>{sectionName(currentSegment?.section || "intro")} · {currentIndex + 1}/{segments.length}</span><h2>{currentSegment?.label}</h2><small>{currentSegment?.speaker}</small></div>
            <div className="podcast-progress"><div style={{width: `${progress}%`}}/></div>
            <div className="podcast-controls">
              <button title="بخش قبلی" onClick={() => changeSegment(currentIndex - 1)} disabled={currentIndex === 0}><SkipBack size={19}/></button>
              {isPlaying ? <button className="podcast-play-main" title="مکث" onClick={pause}><Pause size={22} fill="currentColor"/></button> : <button className="podcast-play-main" title="پخش" onClick={play}><Play size={22} fill="currentColor"/></button>}
              <button title="بخش بعدی" onClick={() => changeSegment(currentIndex + 1)} disabled={currentIndex >= segments.length - 1}><SkipForward size={19}/></button>
              <button title="توقف کامل" onClick={() => { stopAudio(); setCurrentIndex(0); }}><RotateCcw size={17}/></button>
            </div>
            <div className="podcast-speed"><label htmlFor="podcast-rate">سرعت پخش</label><strong>{rate.toFixed(2)}×</strong><input id="podcast-rate" type="range" min="0.7" max="1.15" step="0.05" value={rate} onChange={event => setRate(Number(event.target.value))}/></div>
            <div className="podcast-player-actions"><button onClick={saveEpisode}><Save size={15}/> ذخیره در آرشیو</button><button onClick={() => { setActiveTab("quiz"); resetQuiz(); }}><Check size={15}/> رفتن به آزمون</button></div>
            {notice && <p className="podcast-notice" role="status">{notice}</p>}
          </div>
          <div className="podcast-panel podcast-transcript">
            <div className="podcast-section-heading"><div><span className="podcast-kicker">LISTEN & READ</span><h2>متن هم‌زمان</h2><p>بخش فعلی را بخوان و کلمات هدف را دنبال کن.</p></div><span className="podcast-count">{segments.length} بخش</span></div>
            <div className="podcast-segment-list">
              {segments.map((segment, index) => {
                const word = words.find(item => item.id === segment.wordId);
                return <button key={segment.id} className={index === currentIndex ? "podcast-segment active" : "podcast-segment"} onClick={() => changeSegment(index)}>
                  <span className="podcast-segment-top"><small>{sectionName(segment.section)} · {segment.speaker}</small>{index === currentIndex && <AudioLines size={14}/>}</span>
                  <strong>{segment.label}</strong>
                  <span className="podcast-segment-text" dir="ltr">{segment.text}</span>
                  {word && <span className="podcast-segment-meaning">{word.word} · {word.meaning}</span>}
                </button>;
              })}
            </div>
          </div>
        </section>
      )}

      {activeTab === "quiz" && segments.length > 0 && (
        <section className="podcast-panel podcast-quiz">
          <div className="podcast-section-heading"><div><span className="podcast-kicker">LISTENING CHECK</span><h2>چقدر متوجه شدی؟</h2><p>معنی درست واژه‌ای را که در این قسمت شنیدی انتخاب کن.</p></div><span className="podcast-count">{quizScore}/{selectedWords.length} درست</span></div>
          {showQuiz ? <div className="podcast-quiz-result"><div className="podcast-result-orb"><Check size={28}/></div><h2>آزمون تمام شد</h2><strong>{quizScore} از {selectedWords.length}</strong><p>{Math.round(quizScore / Math.max(1, selectedWords.length) * 100)}٪ پاسخ درست</p><button className="podcast-generate" onClick={resetQuiz}><RotateCcw size={16}/> تکرار آزمون</button></div> : quizWord ? <div className="podcast-quiz-card"><span className="podcast-kicker">QUESTION {quizIndex + 1} / {selectedWords.length}</span><h3 dir="ltr">{quizWord.word}</h3><button className="podcast-word-sound large" onClick={() => { const u = new SpeechSynthesisUtterance(quizWord.word); u.lang = "en-US"; speechSynthesis.cancel(); speechSynthesis.speak(u); }}><Volume2 size={17}/> شنیدن واژه</button><p>کدام تعریف با این واژه مطابقت دارد؟</p><div className="podcast-quiz-options">{quizOptions.map(option => <button key={option.id} disabled={!!quizAnswers[quizWord.id]} className={quizAnswers[quizWord.id] === option.id ? (option.id === quizWord.id ? "correct" : "wrong") : ""} onClick={() => answerQuiz(option.id)}>{option.definition || option.meaning}</button>)}</div>{quizAnswers[quizWord.id] && <div className={quizAnswers[quizWord.id] === quizWord.id ? "podcast-answer-feedback correct" : "podcast-answer-feedback wrong"}><strong>{quizAnswers[quizWord.id] === quizWord.id ? "درست بود!" : `پاسخ درست: ${quizWord.meaning}`}</strong>{quizWord.example && <p dir="ltr">{quizWord.example}</p>}<button onClick={nextQuiz}>{quizIndex + 1 >= selectedWords.length ? "دیدن نتیجه" : "سؤال بعدی"} <ArrowLeft size={14}/></button></div>}</div> : <div className="podcast-empty">برای آزمون، ابتدا یک قسمت با حداقل ۳ واژه بساز.</div>}
        </section>
      )}

      {activeTab === "library" && (
        <section className="podcast-panel podcast-library">
          <div className="podcast-section-heading"><div><span className="podcast-kicker">YOUR COLLECTION</span><h2>آرشیو قسمت‌ها</h2><p>قسمت‌های ذخیره‌شده فقط روی همین دستگاه نگهداری می‌شوند.</p></div><span className="podcast-count">{savedEpisodes.length} قسمت</span></div>
          {savedEpisodes.length ? <div className="podcast-episode-list">{savedEpisodes.map(episode => <article className="podcast-episode-card" key={episode.id}><div className="podcast-episode-icon"><PodcastIcon size={21}/></div><div><strong>{episode.title}</strong><small>{episode.wordIds.length} واژه · {new Date(episode.createdAt).toLocaleDateString("fa-IR")}</small></div><button onClick={() => openEpisode(episode)}><Play size={15}/> پخش</button><button className="delete" title="حذف قسمت" onClick={() => deleteEpisode(episode.id)}><X size={16}/></button></article>)}</div> : <div className="podcast-empty"><PodcastIcon size={25}/><strong>هنوز قسمتی ذخیره نکرده‌ای</strong><span>بعد از ساخت اولین قسمت، آن را از پخش‌کننده ذخیره کن.</span><button onClick={() => setActiveTab("studio")}>رفتن به استودیو <ArrowLeft size={14}/></button></div>}
        </section>
      )}

      <footer className="podcast-footer"><span>LEXORA PODCAST STUDIO · 2026</span><span>صدای دستگاه · English (United States)</span></footer>
    </main>
  );
}
