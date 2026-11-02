"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Check, Plus, Search, Volume2, Layers3 } from "lucide-react";

type LessonWord = { word: string; meaning: string; example: string; exampleFa: string; level: string };
const lessons: { id: number; title: string; topic: string; words: LessonWord[] }[] = [
  { id: 1, title: "درس ۱", topic: "آدم‌ها و توصیف‌ها", words: [
    {word:"friendly",meaning:"خوش‌برخورد، دوستانه",example:"Our new neighbor is very friendly.",exampleFa:"همسایهٔ جدید ما خیلی خوش‌برخورد است.",level:"A1"},
    {word:"quiet",meaning:"ساکت، آرام",example:"It is a quiet place to study.",exampleFa:"این‌جا جای آرامی برای درس خواندن است.",level:"A1"},
    {word:"polite",meaning:"مودب",example:"It is polite to say thank you.",exampleFa:"گفتنِ متشکرم نشانهٔ ادب است.",level:"A2"},
    {word:"helpful",meaning:"کمک‌کننده، مفید",example:"The staff were helpful.",exampleFa:"کارکنان کمک‌کننده بودند.",level:"A2"},
    {word:"careful",meaning:"مراقب، بادقت",example:"Be careful when you cross the road.",exampleFa:"هنگام عبور از خیابان مراقب باش.",level:"A2"},
    {word:"busy",meaning:"مشغول، پرکار",example:"I am busy this afternoon.",exampleFa:"امروز بعدازظهر مشغولم.",level:"A1"},
    {word:"honest",meaning:"صادق، راستگو",example:"She is always honest with her friends.",exampleFa:"او همیشه با دوستانش صادق است.",level:"A2"},
    {word:"kind",meaning:"مهربان",example:"It was kind of you to help.",exampleFa:"کمک‌کردنت از مهربانی تو بود.",level:"A1"}
  ]},
  { id: 2, title: "درس ۲", topic: "زندگی روزمره", words: [
    {word:"usually",meaning:"معمولاً",example:"I usually walk to school.",exampleFa:"من معمولاً پیاده به مدرسه می‌روم.",level:"A1"},
    {word:"sometimes",meaning:"گاهی",example:"We sometimes eat out.",exampleFa:"ما گاهی بیرون غذا می‌خوریم.",level:"A1"},
    {word:"early",meaning:"زود، زودهنگام",example:"She gets up early.",exampleFa:"او زود از خواب بیدار می‌شود.",level:"A1"},
    {word:"late",meaning:"دیر، دیرهنگام",example:"Don't be late for class.",exampleFa:"برای کلاس دیر نکن.",level:"A1"},
    {word:"prepare",meaning:"آماده‌کردن",example:"I prepare breakfast every morning.",exampleFa:"من هر صبح صبحانه آماده می‌کنم.",level:"A2"}
  ]},
  { id: 3, title: "درس ۳", topic: "خانه و وسایل", words: [
    {word:"comfortable",meaning:"راحت",example:"This chair is comfortable.",exampleFa:"این صندلی راحت است.",level:"A2"},
    {word:"crowded",meaning:"شلوغ، پرازدحام",example:"The kitchen gets crowded at dinner time.",exampleFa:"آشپزخانه هنگام شام شلوغ می‌شود.",level:"A2"},
    {word:"tidy",meaning:"مرتب",example:"Please keep your desk tidy.",exampleFa:"لطفاً میزت را مرتب نگه دار.",level:"A2"},
    {word:"repair",meaning:"تعمیرکردن",example:"We need to repair the door.",exampleFa:"باید در را تعمیر کنیم.",level:"A2"},
    {word:"borrow",meaning:"قرض‌گرفتن",example:"Can I borrow your pen?",exampleFa:"می‌توانم خودکارت را قرض بگیرم؟",level:"A2"}
  ]},
  { id: 4, title: "درس ۴", topic: "غذا و خرید", words: [
    {word:"fresh",meaning:"تازه",example:"We buy fresh fruit every week.",exampleFa:"ما هر هفته میوهٔ تازه می‌خریم.",level:"A1"},
    {word:"choose",meaning:"انتخاب‌کردن",example:"Choose a seat near the window.",exampleFa:"صندلی‌ای نزدیک پنجره انتخاب کن.",level:"A1"},
    {word:"price",meaning:"قیمت",example:"The price is reasonable.",exampleFa:"قیمت مناسب است.",level:"A1"},
    {word:"cheap",meaning:"ارزان",example:"This shop sells cheap clothes.",exampleFa:"این مغازه لباس ارزان می‌فروشد.",level:"A1"},
    {word:"expensive",meaning:"گران",example:"That restaurant is too expensive.",exampleFa:"آن رستوران بیش از حد گران است.",level:"A1"}
  ]},
  { id: 5, title: "درس ۵", topic: "سفر و رفت‌وآمد", words: [
    {word:"journey",meaning:"سفر، مسیر",example:"The journey takes two hours.",exampleFa:"سفر دو ساعت طول می‌کشد.",level:"A2"},
    {word:"arrive",meaning:"رسیدن",example:"We arrive at noon.",exampleFa:"ما ظهر می‌رسیم.",level:"A1"},
    {word:"ticket",meaning:"بلیط",example:"I bought a train ticket.",exampleFa:"من بلیط قطار خریدم.",level:"A1"},
    {word:"miss",meaning:"از دست دادن؛ جا ماندن از",example:"Don't miss the bus.",exampleFa:"از اتوبوس جا نمان.",level:"A2"},
    {word:"abroad",meaning:"در خارج از کشور",example:"She wants to study abroad.",exampleFa:"او می‌خواهد در خارج از کشور تحصیل کند.",level:"A2"}
  ]},
  { id: 6, title: "درس ۶", topic: "تحصیل و کار", words: [
    {word:"improve",meaning:"بهترکردن، پیشرفت‌کردن",example:"I want to improve my English.",exampleFa:"می‌خواهم انگلیسی‌ام را بهتر کنم.",level:"A2"},
    {word:"explain",meaning:"توضیح‌دادن",example:"Could you explain this word?",exampleFa:"می‌توانی این کلمه را توضیح بدهی؟",level:"A2"},
    {word:"practice",meaning:"تمرین‌کردن؛ تمرین",example:"You need to practice every day.",exampleFa:"باید هر روز تمرین کنی.",level:"A1"},
    {word:"mistake",meaning:"اشتباه",example:"Everyone makes mistakes.",exampleFa:"همه اشتباه می‌کنند.",level:"A1"},
    {word:"skill",meaning:"مهارت",example:"Writing is an important skill.",exampleFa:"نوشتن مهارت مهمی است.",level:"A2"}
  ]},
  { id: 7, title: "درس ۷", topic: "احساسات و نظرها", words: [
    {word:"excited",meaning:"هیجان‌زده",example:"I'm excited about the trip.",exampleFa:"برای سفر هیجان‌زده‌ام.",level:"A2"},
    {word:"worried",meaning:"نگران",example:"She is worried about the exam.",exampleFa:"او نگران امتحان است.",level:"A2"},
    {word:"surprised",meaning:"متعجب، غافلگیرشده",example:"We were surprised by the news.",exampleFa:"از خبر غافلگیر شدیم.",level:"A2"},
    {word:"prefer",meaning:"ترجیح‌دادن",example:"I prefer tea to coffee.",exampleFa:"چای را به قهوه ترجیح می‌دهم.",level:"A2"},
    {word:"agree",meaning:"موافق‌بودن",example:"I agree with your idea.",exampleFa:"با ایده‌ات موافقم.",level:"A2"}
  ]},
  { id: 8, title: "درس ۸", topic: "سلامت و بدن", words: [
    {word:"healthy",meaning:"سالم، سلامت",example:"A healthy diet is important.",exampleFa:"رژیم غذایی سالم مهم است.",level:"A2"},
    {word:"ill",meaning:"بیمار",example:"He was ill last week.",exampleFa:"او هفتهٔ پیش بیمار بود.",level:"A1"},
    {word:"recover",meaning:"بهبود یافتن",example:"It took her a week to recover.",exampleFa:"یک هفته طول کشید تا بهبود یابد.",level:"B1"},
    {word:"pain",meaning:"درد",example:"I have a pain in my back.",exampleFa:"پشتم درد می‌کند.",level:"A2"},
    {word:"exercise",meaning:"ورزش؛ ورزش‌کردن",example:"Regular exercise helps you feel better.",exampleFa:"ورزش منظم به بهترشدن حال کمک می‌کند.",level:"A2"}
  ]},
  { id: 9, title: "درس ۹", topic: "طبیعت و آب‌وهوا", words: [
    {word:"weather",meaning:"آب‌وهوا",example:"The weather is warm today.",exampleFa:"امروز هوا گرم است.",level:"A1"},
    {word:"cloudy",meaning:"ابری",example:"It may be cloudy tomorrow.",exampleFa:"ممکن است فردا هوا ابری باشد.",level:"A1"},
    {word:"field",meaning:"مزرعه؛ زمین",example:"The children played in the field.",exampleFa:"بچه‌ها در زمین بازی کردند.",level:"A2"},
    {word:"protect",meaning:"محافظت‌کردن",example:"We should protect nature.",exampleFa:"باید از طبیعت محافظت کنیم.",level:"A2"},
    {word:"dangerous",meaning:"خطرناک",example:"The road is dangerous at night.",exampleFa:"جاده شب‌ها خطرناک است.",level:"A2"}
  ]},
  { id: 10, title: "درس ۱۰", topic: "زمان و برنامه‌ها", words: [
    {word:"appointment",meaning:"قرار ملاقات",example:"I have a doctor's appointment.",exampleFa:"با پزشک قرار ملاقات دارم.",level:"A2"},
    {word:"schedule",meaning:"برنامهٔ زمانی",example:"My schedule is full today.",exampleFa:"برنامهٔ امروز من پر است.",level:"A2"},
    {word:"cancel",meaning:"لغوکردن",example:"They had to cancel the meeting.",exampleFa:"آن‌ها مجبور شدند جلسه را لغو کنند.",level:"A2"},
    {word:"available",meaning:"در دسترس؛ آزاد",example:"Are you available this evening?",exampleFa:"امشب وقت داری؟",level:"A2"},
    {word:"recently",meaning:"اخیراً",example:"I recently started a new course.",exampleFa:"من اخیراً دورهٔ جدیدی را شروع کردم.",level:"B1"}
  ]},
  { id: 11, title: "درس ۱۱", topic: "شهر و مکان‌ها", words: [
    {word:"neighborhood",meaning:"محله",example:"This is a safe neighborhood.",exampleFa:"این محله امن است.",level:"A2"},
    {word:"opposite",meaning:"روبروی؛ مخالف",example:"The bank is opposite the station.",exampleFa:"بانک روبروی ایستگاه است.",level:"A2"},
    {word:"nearby",meaning:"نزدیک، در نزدیکی",example:"Is there a pharmacy nearby?",exampleFa:"داروخانه‌ای در نزدیکی هست؟",level:"A2"},
    {word:"entrance",meaning:"ورودی",example:"Wait for me at the entrance.",exampleFa:"جلوی ورودی منتظرم بمان.",level:"A2"},
    {word:"direction",meaning:"جهت؛ مسیر",example:"Could you give me directions?",exampleFa:"می‌توانی مسیر را به من بگویی؟",level:"A2"}
  ]},
  { id: 12, title: "درس ۱۲", topic: "ارتباطات", words: [
    {word:"message",meaning:"پیام",example:"I left you a message.",exampleFa:"برای تو پیامی گذاشتم.",level:"A1"},
    {word:"reply",meaning:"پاسخ‌دادن؛ پاسخ",example:"Please reply to my email.",exampleFa:"لطفاً به ایمیلم پاسخ بده.",level:"A2"},
    {word:"invite",meaning:"دعوت‌کردن",example:"They invited us to dinner.",exampleFa:"آن‌ها ما را به شام دعوت کردند.",level:"A2"},
    {word:"conversation",meaning:"گفت‌وگو",example:"We had a long conversation.",exampleFa:"گفت‌وگوی طولانی‌ای داشتیم.",level:"A2"},
    {word:"mean",meaning:"منظور داشتن؛ معنی دادن",example:"What does this word mean?",exampleFa:"این کلمه چه معنی‌ای دارد؟",level:"A1"}
  ]},
  { id: 13, title: "درس ۱۳", topic: "پول و امور روزانه", words: [
    {word:"save",meaning:"پس‌اندازکردن؛ نجات‌دادن",example:"I'm saving money for a laptop.",exampleFa:"برای خرید لپ‌تاپ پول پس‌انداز می‌کنم.",level:"A2"},
    {word:"spend",meaning:"خرج‌کردن؛ گذراندن",example:"Don't spend all your money.",exampleFa:"همهٔ پولت را خرج نکن.",level:"A2"},
    {word:"cost",meaning:"هزینه داشتن؛ هزینه",example:"How much does it cost?",exampleFa:"قیمتش چقدر است؟",level:"A1"},
    {word:"lend",meaning:"قرض‌دادن",example:"Can you lend me a book?",exampleFa:"می‌توانی کتابی به من قرض بدهی؟",level:"A2"},
    {word:"afford",meaning:"از عهدهٔ هزینه برآمدن",example:"I can't afford a new phone.",exampleFa:"از عهدهٔ هزینهٔ گوشی جدید برنمی‌آیم.",level:"B1"}
  ]},
  { id: 14, title: "درس ۱۴", topic: "تجربه و خاطره", words: [
    {word:"remember",meaning:"به یادآوردن",example:"I remember her name.",exampleFa:"اسمش را به یاد دارم.",level:"A1"},
    {word:"forget",meaning:"فراموش‌کردن",example:"Don't forget your keys.",exampleFa:"کلیدهایت را فراموش نکن.",level:"A1"},
    {word:"experience",meaning:"تجربه",example:"It was a great experience.",exampleFa:"تجربهٔ فوق‌العاده‌ای بود.",level:"A2"},
    {word:"happen",meaning:"اتفاق‌افتادن",example:"What happened yesterday?",exampleFa:"دیروز چه اتفاقی افتاد؟",level:"A1"},
    {word:"perhaps",meaning:"شاید",example:"Perhaps we can meet tomorrow.",exampleFa:"شاید فردا بتوانیم همدیگر را ببینیم.",level:"A2"}
  ]},
  { id: 15, title: "درس ۱۵", topic: "توصیف و مقایسه", words: [
    {word:"similar",meaning:"مشابه، شبیه",example:"The two pictures are similar.",exampleFa:"این دو تصویر شبیه هم هستند.",level:"A2"},
    {word:"different",meaning:"متفاوت",example:"My opinion is different.",exampleFa:"نظر من متفاوت است.",level:"A1"},
    {word:"instead",meaning:"در عوض",example:"Let's walk instead of driving.",exampleFa:"به‌جای رانندگی پیاده برویم.",level:"A2"},
    {word:"especially",meaning:"به‌ویژه، مخصوصاً",example:"I enjoy reading, especially novels.",exampleFa:"از مطالعه، به‌ویژه رمان، لذت می‌برم.",level:"A2"},
    {word:"quite",meaning:"نسبتاً؛ کاملاً",example:"The test was quite easy.",exampleFa:"آزمون نسبتاً آسان بود.",level:"A2"}
  ]},
  { id: 16, title: "درس ۱۶", topic: "طبیعت و محیط زیست", words: [
    {word:"waste",meaning:"هدر دادن؛ زباله",example:"Don't waste water.",exampleFa:"آب را هدر نده.",level:"A2"},
    {word:"reduce",meaning:"کاهش‌دادن",example:"We should reduce plastic use.",exampleFa:"باید مصرف پلاستیک را کاهش دهیم.",level:"A2"},
    {word:"reuse",meaning:"دوباره استفاده‌کردن",example:"You can reuse this bag.",exampleFa:"می‌توانی دوباره از این کیسه استفاده کنی.",level:"A2"},
    {word:"pollution",meaning:"آلودگی",example:"Air pollution is a serious problem.",exampleFa:"آلودگی هوا مشکل جدی‌ای است.",level:"A2"},
    {word:"environment",meaning:"محیط زیست؛ محیط",example:"We must care for the environment.",exampleFa:"باید مراقب محیط زیست باشیم.",level:"A2"}
  ]},
  { id: 17, title: "درس ۱۷", topic: "ویژگی‌های شخصیتی", words: [
    {word:"patient",meaning:"صبور",example:"Be patient with yourself.",exampleFa:"با خودت صبور باش.",level:"A2"},
    {word:"confident",meaning:"بااعتمادبه‌نفس",example:"She feels confident before the interview.",exampleFa:"او پیش از مصاحبه اعتمادبه‌نفس دارد.",level:"B1"},
    {word:"generous",meaning:"بخشنده، دست‌ودل‌باز",example:"He is generous with his time.",exampleFa:"او در وقت‌گذاشتن برای دیگران دست‌ودل‌باز است.",level:"B1"},
    {word:"lazy",meaning:"تنبل",example:"I feel lazy on rainy days.",exampleFa:"روزهای بارانی احساس تنبلی می‌کنم.",level:"A2"},
    {word:"reliable",meaning:"قابل‌اعتماد",example:"She is a reliable friend.",exampleFa:"او دوست قابل‌اعتمادی است.",level:"B1"}
  ]},
  { id: 18, title: "درس ۱۸", topic: "رویدادها و تصمیم‌ها", words: [
    {word:"decide",meaning:"تصمیم‌گرفتن",example:"We decided to stay home.",exampleFa:"تصمیم گرفتیم در خانه بمانیم.",level:"A2"},
    {word:"plan",meaning:"برنامه‌ریزی‌کردن؛ برنامه",example:"I plan to study tonight.",exampleFa:"برنامه دارم امشب درس بخوانم.",level:"A1"},
    {word:"hope",meaning:"امیدواربودن؛ امید",example:"I hope you feel better soon.",exampleFa:"امیدوارم زودتر حالت بهتر شود.",level:"A1"},
    {word:"expect",meaning:"انتظارداشتن",example:"I expect the bus to arrive soon.",exampleFa:"انتظار دارم اتوبوس به‌زودی برسد.",level:"A2"},
    {word:"offer",meaning:"پیشنهاددادن؛ پیشنهاد",example:"They offered me a job.",exampleFa:"آن‌ها به من کاری پیشنهاد دادند.",level:"A2"}
  ]},
  { id: 19, title: "درس ۱۹", topic: "رسانه و سرگرمی", words: [
    {word:"episode",meaning:"قسمت (سریال)",example:"I watched the last episode.",exampleFa:"آخرین قسمت را تماشا کردم.",level:"A2"},
    {word:"audience",meaning:"تماشاگران؛ مخاطبان",example:"The audience enjoyed the show.",exampleFa:"تماشاگران از نمایش لذت بردند.",level:"B1"},
    {word:"boring",meaning:"خسته‌کننده",example:"The film was boring.",exampleFa:"فیلم خسته‌کننده بود.",level:"A1"},
    {word:"exciting",meaning:"هیجان‌انگیز",example:"It was an exciting match.",exampleFa:"مسابقهٔ هیجان‌انگیزی بود.",level:"A2"},
    {word:"recommend",meaning:"توصیه‌کردن",example:"Can you recommend a good book?",exampleFa:"می‌توانی کتاب خوبی پیشنهاد کنی؟",level:"A2"}
  ]},
  { id: 20, title: "درس ۲۰", topic: "هدف‌ها و پیشرفت", words: [
    {word:"goal",meaning:"هدف",example:"My goal is to speak English well.",exampleFa:"هدفم این است که انگلیسی را خوب صحبت کنم.",level:"A2"},
    {word:"achieve",meaning:"دستیابی به؛ به‌دست‌آوردن",example:"You can achieve your goals with practice.",exampleFa:"با تمرین می‌توانی به هدف‌هایت برسی.",level:"B1"},
    {word:"progress",meaning:"پیشرفت",example:"I can see real progress.",exampleFa:"می‌توانم پیشرفت واقعی را ببینم.",level:"A2"},
    {word:"continue",meaning:"ادامه‌دادن",example:"Continue learning a little every day.",exampleFa:"هر روز کمی به یادگیری ادامه بده.",level:"A2"},
    {word:"success",meaning:"موفقیت",example:"Success takes time and effort.",exampleFa:"موفقیت به زمان و تلاش نیاز دارد.",level:"A2"}
  ]}
];

const BANK_KEY = "lexora.words.v1";
const normalize = (s: string) => s.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");

export default function WordSkillsPage() {
  const [lessonId, setLessonId] = useState(1);
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const [bankWords, setBankWords] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const activeLesson = lessons.find(l => l.id === lessonId) ?? lessons[0];

  useMemo(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(BANK_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) setBankWords(parsed.map((w: {word?: string}) => normalize(w.word || "")));
      } catch {}
      setHydrated(true);
    }
  }, []);

  const visibleWords = activeLesson.words.filter(w => !query || [w.word, w.meaning, w.example].some(s => s.toLowerCase().includes(query.toLowerCase())));
  function addWord(item: LessonWord) {
    try {
      const raw = localStorage.getItem(BANK_KEY);
      const current = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(current)) throw new Error("bad bank");
      const key = normalize(item.word);
      if (current.some((w: {word?: string}) => normalize(w.word || "") === key)) {
        setBankWords(current.map((w: {word?: string}) => normalize(w.word || "")));
        setAdded(prev => prev.includes(key) ? prev : [...prev, key]);
        return;
      }
      const now = Date.now();
      const next = [{
        id: `word-skills-${key.replace(/[^a-z0-9]+/g, "-")}`,
        word: item.word, meaning: item.meaning, category: "Word Skills", level: item.level,
        definition: "", example: item.example, exampleFa: item.exampleFa, synonyms: "", antonyms: "",
        createdAt: now, correct: 0, reviews: 0
      }, ...current];
      localStorage.setItem(BANK_KEY, JSON.stringify(next));
      setBankWords(next.map((w: {word?: string}) => normalize(w.word || "")));
      setAdded(prev => [...prev, key]);
    } catch {
      window.alert("بانک لغات در دسترس نیست. ابتدا سایت اصلی را باز کن و دوباره تلاش کن.");
    }
  }
  const lessonAddedCount = activeLesson.words.filter(w => bankWords.includes(normalize(w.word))).length;

  return <main className="app-shell wordskills-page">
    <header className="topbar">
      <Link className="brand wordskills-brand" href="/LEXORA/"><div className="brand-mark"><BookOpen size={22}/></div><div><div className="brand-name">LEXORA</div><div className="brand-sub">WORD SKILLS · ELEMENTARY</div></div></Link>
      <div className="top-actions"><Link className="btn btn-small" href="/LEXORA/"><ArrowRight size={15}/> بازگشت به بانک</Link><Link className="btn btn-small coll-nav-link" href="/LEXORA/collocations/"><Layers3 size={15}/> کالوکیشن‌ها</Link></div>
    </header>
    <section className="panel wordskills-hero">
      <div className="eyebrow">LESSON-BY-LESSON VOCABULARY</div>
      <h1>Word Skills <span>Elementary</span></h1>
      <p>واژه‌ها را درس‌به‌درس بخوان، مثال را بررسی کن و فقط کلماتی را که می‌خواهی با یک کلیک به بانک شخصی LEXORA اضافه کن.</p>
      <div className="wordskills-notice">توجه: فهرست فعلی، واژگان نمونهٔ آموزشیِ تألیفی است و لزوماً با ترتیب یا فهرست دقیق کتاب یکی نیست. اگر صفحات درس‌ها یا فایل کتابی که در اختیار داری را بارگذاری کنی، می‌توانم فهرست‌ها را با همان نسخه تطبیق بدهم.</div>
      <div className="wordskills-stats"><div><strong>{lessons.length}</strong><span>درس نمونه</span></div><div><strong>{lessons.reduce((n,l)=>n+l.words.length,0)}</strong><span>واژهٔ نمونه</span></div><div><strong>{bankWords.length}</strong><span>واژه در بانک فعلی</span></div></div>
    </section>
    <section className="wordskills-layout">
      <aside className="panel wordskills-lessons">
        <div className="wordskills-section-title"><BookOpen size={17}/> فهرست درس‌ها</div>
        <div className="wordskills-lesson-list">{lessons.map(lesson => <button key={lesson.id} className={lesson.id===lessonId?"wordskills-lesson active":"wordskills-lesson"} onClick={()=>{setLessonId(lesson.id);setQuery("");}}><span><strong>{lesson.title}</strong><small>{lesson.topic}</small></span><span className="wordskills-count">{lesson.words.length}</span></button>)}</div>
      </aside>
      <section className="panel wordskills-list">
        <div className="wordskills-list-head"><div><div className="eyebrow">LESSON {activeLesson.id.toString().padStart(2,"0")}</div><h2>{activeLesson.title}: {activeLesson.topic}</h2><p>برای افزودن به بانک، روی دکمهٔ هر کلمه بزن.</p></div><div className="wordskills-progress">{lessonAddedCount} از {activeLesson.words.length}<small>در بانک تو</small></div></div>
        <label className="wordskills-search"><Search size={17}/><input className="field" value={query} onChange={e=>setQuery(e.target.value)} placeholder="جست‌وجوی واژه یا معنی…"/></label>
        <div className="wordskills-word-list">{visibleWords.map(item=>{const key=normalize(item.word);const isAdded=bankWords.includes(key);return <article className="wordskills-word" key={key}>
          <div className="wordskills-word-main"><div className="wordskills-word-heading"><h3 dir="ltr">{item.word}</h3><button className="icon-btn" title="شنیدن تلفظ" aria-label={"شنیدن "+item.word} onClick={()=>{if("speechSynthesis" in window){const u=new SpeechSynthesisUtterance(item.word);u.lang="en-US";window.speechSynthesis.speak(u);}}}><Volume2 size={16}/></button><span className="level">{item.level}</span></div><div className="wordskills-meaning">{item.meaning}</div><p className="wordskills-example" dir="ltr">{item.example}</p><p className="wordskills-example-fa">{item.exampleFa}</p></div>
          <button className={isAdded?"btn wordskills-added":"btn btn-primary wordskills-add"} onClick={()=>addWord(item)} disabled={isAdded}><span>{isAdded?<Check size={16}/>:<Plus size={16}/>}</span>{isAdded?"در بانک توست":"افزودن به بانک"}</button>
        </article>})}</div>
        {!visibleWords.length&&<div className="empty">کلمه‌ای با این جست‌وجو پیدا نشد.</div>}
      </section>
    </section>
    <footer className="footer"><span>LEXORA · WORD SKILLS STUDY COMPANION</span><span>واژه‌های اضافه‌شده در بانک اصلی قابل مرور و آزمون هستند.</span></footer>
  </main>;
}
