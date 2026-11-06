"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Check, Plus, Search, Volume2, Layers3 } from "lucide-react";

type LessonWord = { word: string; meaning: string; example: string; exampleFa: string; level: string };
const lessons: { id: number; title: string; topic: string; words: LessonWord[] }[] = [
  { id: 1, title: "درس 1", topic: "Classroom vocabulary — واژگان کلاس درس", words: [
    {word:"whiteboard",meaning:"تختهٔ وایت‌برد",example:"The teacher writes on the whiteboard.",exampleFa:"معلم روی تختهٔ وایت‌برد می‌نویسد.",level:"A1"},
    {word:"board pen",meaning:"ماژیک وایت‌برد",example:"Please use a board pen.",exampleFa:"لطفاً از ماژیک وایت‌برد استفاده کن.",level:"A1"},
    {word:"noticeboard",meaning:"تابلوی اعلانات",example:"The notice is on the noticeboard.",exampleFa:"اطلاعیه روی تابلوی اعلانات است.",level:"A2"},
    {word:"notice",meaning:"اطلاعیه؛ اعلان",example:"I read the notice carefully.",exampleFa:"اطلاعیه را با دقت خواندم.",level:"A2"},
    {word:"desk",meaning:"میز تحریر؛ میز کار",example:"My desk is near the window.",exampleFa:"میزم نزدیک پنجره است.",level:"A1"},
    {word:"chair",meaning:"صندلی",example:"Please sit on this chair.",exampleFa:"لطفاً روی این صندلی بنشین.",level:"A1"},
    {word:"bag",meaning:"کیف؛ کوله‌پشتی",example:"My books are in my bag.",exampleFa:"کتاب‌هایم داخل کیفم هستند.",level:"A1"},
    {word:"pen",meaning:"خودکار",example:"I write with a blue pen.",exampleFa:"با خودکار آبی می‌نویسم.",level:"A1"},
    {word:"coursebook",meaning:"کتاب درسی دوره",example:"Open your coursebook to page ten.",exampleFa:"کتاب درسی‌ات را در صفحهٔ ده باز کن.",level:"A1"},
    {word:"pencil",meaning:"مداد",example:"I need a pencil to draw a line.",exampleFa:"برای کشیدن یک خط به مداد نیاز دارم.",level:"A1"},
    {word:"table",meaning:"میز",example:"The dictionary is on the table.",exampleFa:"فرهنگ لغت روی میز است.",level:"A1"},
    {word:"dictionary",meaning:"فرهنگ لغت؛ واژه‌نامه",example:"Look up the word in a dictionary.",exampleFa:"کلمه را در یک فرهنگ لغت جست‌وجو کن.",level:"A1"},
    {word:"CD",meaning:"لوح فشرده",example:"The course includes a CD.",exampleFa:"این دوره شامل یک لوح فشرده است.",level:"A1"},
    {word:"CD player",meaning:"دستگاه پخش سی‌دی",example:"The CD player is on the desk.",exampleFa:"دستگاه پخش سی‌دی روی میز است.",level:"A1"},
    {word:"piece of paper",meaning:"یک برگ کاغذ؛ تکه‌ای کاغذ",example:"Write your name on a piece of paper.",exampleFa:"نامت را روی یک برگ کاغذ بنویس.",level:"A1"},
    {word:"exercise book / notebook",meaning:"دفتر تمرین؛ دفتر یادداشت",example:"Write the answers in your exercise book.",exampleFa:"پاسخ‌ها را در دفتر تمرینت بنویس.",level:"A1"}
  ]},
  { id: 2, title: "درس 2", topic: "Grammar words — واژه‌های دستوری", words: [
    {word:"noun",meaning:"اسم",example:"Teacher is a noun.",exampleFa:"Teacher اسم است.",level:"A2"},
{word:"verb",meaning:"فعل",example:"Learn is a verb.",exampleFa:"Learn فعل است.",level:"A2"},
{word:"adjective",meaning:"صفت",example:"Quiet is an adjective.",exampleFa:"Quiet صفت است.",level:"A2"},
{word:"adverb",meaning:"قید",example:"Slowly is an adverb.",exampleFa:"Slowly قید است.",level:"A2"}
  ]},
  { id: 3, title: "درس 3", topic: "Using this book — روش استفاده از کتاب", words: [
    {word:"unit",meaning:"درس",example:"Read this unit first.",exampleFa:"اول این درس را بخوان.",level:"A1"},
{word:"exercise",meaning:"تمرین",example:"Finish the exercise.",exampleFa:"تمرین را تمام کن.",level:"A1"},
{word:"example",meaning:"مثال",example:"Read the example.",exampleFa:"مثال را بخوان.",level:"A1"},
{word:"answer key",meaning:"پاسخ‌نامه",example:"Check the answer key.",exampleFa:"پاسخ‌نامه را بررسی کن.",level:"A2"}
  ]},
  { id: 4, title: "درس 4", topic: "Learning new words — یادگیری واژه‌های جدید", words: [
    {word:"meaning",meaning:"معنی",example:"What is the meaning of this word?",exampleFa:"معنی این کلمه چیست؟",level:"A1"},
{word:"pronunciation",meaning:"تلفظ",example:"Listen to the pronunciation.",exampleFa:"به تلفظ گوش بده.",level:"A2"},
{word:"spell",meaning:"هجی کردن",example:"Can you spell your name?",exampleFa:"می‌توانی اسمت را هجی کنی؟",level:"A1"},
{word:"review",meaning:"مرور کردن",example:"Review the words daily.",exampleFa:"هر روز واژه‌ها را مرور کن.",level:"A2"}
  ]},
  { id: 5, title: "درس 5", topic: "Classroom activities — فعالیت‌های کلاسی", words: [
    {word:"repeat",meaning:"تکرار کردن",example:"Repeat after me.",exampleFa:"بعد از من تکرار کن.",level:"A1"},
{word:"compare",meaning:"مقایسه کردن",example:"Compare your answers.",exampleFa:"پاسخ‌هایت را مقایسه کن.",level:"A2"},
{word:"guess",meaning:"حدس زدن",example:"Guess the meaning.",exampleFa:"معنی را حدس بزن.",level:"A1"},
{word:"instructions",meaning:"دستورالعمل‌ها",example:"Read the instructions.",exampleFa:"دستورالعمل‌ها را بخوان.",level:"A2"}
  ]},
  { id: 6, title: "درس 6", topic: "Numbers — اعداد", words: [
    {word:"zero",meaning:"صفر",example:"The answer is zero.",exampleFa:"پاسخ صفر است.",level:"A1"},
{word:"hundred",meaning:"صد",example:"There are a hundred pages.",exampleFa:"صد صفحه وجود دارد.",level:"A1"},
{word:"thousand",meaning:"هزار",example:"A thousand people live here.",exampleFa:"هزار نفر اینجا زندگی می‌کنند.",level:"A1"},
{word:"half",meaning:"نصف",example:"I ate half the cake.",exampleFa:"نصف کیک را خوردم.",level:"A1"}
  ]},
  { id: 7, title: "درس 7", topic: "Telling the time — گفتن ساعت", words: [
    {word:"o’clock",meaning:"ساعت دقیق",example:"It’s three o’clock.",exampleFa:"ساعت سه است.",level:"A1"},
{word:"quarter past",meaning:"یک ربع گذشته",example:"It’s quarter past six.",exampleFa:"شش و ربع است.",level:"A1"},
{word:"half past",meaning:"نیم ساعت گذشته",example:"It’s half past eight.",exampleFa:"هشت و نیم است.",level:"A1"},
{word:"noon",meaning:"ظهر",example:"We eat at noon.",exampleFa:"ظهر غذا می‌خوریم.",level:"A1"}
  ]},
  { id: 8, title: "درس 8", topic: "Days, seasons and dates — روزها، فصل‌ها و تاریخ‌ها", words: [
    {word:"weekday",meaning:"روز کاری",example:"Monday is a weekday.",exampleFa:"دوشنبه روز کاری است.",level:"A1"},
{word:"weekend",meaning:"آخر هفته",example:"I rest at the weekend.",exampleFa:"آخر هفته استراحت می‌کنم.",level:"A1"},
{word:"spring",meaning:"بهار",example:"Flowers grow in spring.",exampleFa:"گل‌ها در بهار رشد می‌کنند.",level:"A1"},
{word:"date",meaning:"تاریخ",example:"What is today’s date?",exampleFa:"امروز چندم است؟",level:"A1"}
  ]},
  { id: 9, title: "درس 9", topic: "Time words and phrases — واژه‌ها و عبارت‌های زمان", words: [
    {word:"yesterday",meaning:"دیروز",example:"I called yesterday.",exampleFa:"دیروز تماس گرفتم.",level:"A1"},
{word:"tomorrow",meaning:"فردا",example:"We leave tomorrow.",exampleFa:"فردا می‌رویم.",level:"A1"},
{word:"ago",meaning:"پیش",example:"I came here a year ago.",exampleFa:"یک سال پیش به اینجا آمدم.",level:"A1"},
{word:"recently",meaning:"اخیراً",example:"I recently moved.",exampleFa:"اخیراً نقل مکان کردم.",level:"A2"}
  ]},
  { id: 10, title: "درس 10", topic: "Parts of the body — اعضای بدن", words: [
    {word:"shoulder",meaning:"شانه",example:"My bag is on my shoulder.",exampleFa:"کیفم روی شانه‌ام است.",level:"A1"},
{word:"elbow",meaning:"آرنج",example:"He hurt his elbow.",exampleFa:"آرنجش آسیب دید.",level:"A2"},
{word:"knee",meaning:"زانو",example:"My knee hurts.",exampleFa:"زانوم درد می‌کند.",level:"A1"},
{word:"thumb",meaning:"شست",example:"She raised her thumb.",exampleFa:"او شستش را بالا برد.",level:"A2"}
  ]},
  { id: 11, title: "درس 11", topic: "Describing people — توصیف افراد", words: [
    {word:"tall",meaning:"قدبلند",example:"My brother is tall.",exampleFa:"برادرم قدبلند است.",level:"A1"},
{word:"curly",meaning:"فرفری",example:"She has curly hair.",exampleFa:"او موهای فرفری دارد.",level:"A1"},
{word:"bald",meaning:"طاس",example:"The man is bald.",exampleFa:"آن مرد طاس است.",level:"A2"},
{word:"middle-aged",meaning:"میانسال",example:"A middle-aged man arrived.",exampleFa:"مردی میانسال رسید.",level:"B1"}
  ]},
  { id: 12, title: "درس 12", topic: "Physical actions — حرکات بدنی", words: [
    {word:"bend",meaning:"خم کردن",example:"Bend your knees.",exampleFa:"زانوهایت را خم کن.",level:"A2"},
{word:"shake",meaning:"تکان دادن",example:"Shake the bottle.",exampleFa:"بطری را تکان بده.",level:"A2"},
{word:"stretch",meaning:"کش دادن",example:"Stretch your arms.",exampleFa:"دست‌هایت را بکش.",level:"A2"},
{word:"point",meaning:"اشاره کردن",example:"Point at the map.",exampleFa:"به نقشه اشاره کن.",level:"A1"}
  ]},
  { id: 13, title: "درس 13", topic: "Personal information — اطلاعات شخصی", words: [
    {word:"surname",meaning:"نام خانوادگی",example:"Write your surname here.",exampleFa:"نام خانوادگی‌ات را اینجا بنویس.",level:"A1"},
{word:"address",meaning:"نشانی",example:"What is your address?",exampleFa:"نشانی‌ات چیست؟",level:"A1"},
{word:"nationality",meaning:"ملیت",example:"What is your nationality?",exampleFa:"ملیتت چیست؟",level:"A2"},
{word:"date of birth",meaning:"تاریخ تولد",example:"Enter your date of birth.",exampleFa:"تاریخ تولدت را وارد کن.",level:"A2"}
  ]},
  { id: 14, title: "درس 14", topic: "Family — خانواده", words: [
    {word:"relative",meaning:"خویشاوند",example:"A relative is visiting us.",exampleFa:"خویشاوندی به دیدنمان می‌آید.",level:"A2"},
{word:"cousin",meaning:"پسرعمو/دخترعمو و مانند آن",example:"My cousin lives nearby.",exampleFa:"خویشاوندم همین نزدیکی زندگی می‌کند.",level:"A1"},
{word:"nephew",meaning:"خواهرزاده/برادرزادهٔ پسر",example:"My nephew starts school.",exampleFa:"خواهرزاده‌ام مدرسه را شروع می‌کند.",level:"B1"},
{word:"niece",meaning:"خواهرزاده/برادرزادهٔ دختر",example:"My niece likes drawing.",exampleFa:"خواهرزاده‌ام نقاشی را دوست دارد.",level:"B1"}
  ]},
  { id: 15, title: "درس 15", topic: "Personality — شخصیت", words: [
    {word:"patient",meaning:"صبور",example:"Our teacher is patient.",exampleFa:"معلم ما صبور است.",level:"A2"},
{word:"generous",meaning:"بخشنده",example:"She is very generous.",exampleFa:"او بسیار بخشنده است.",level:"B1"},
{word:"reliable",meaning:"قابل‌اعتماد",example:"He is a reliable friend.",exampleFa:"او دوست قابل‌اعتمادی است.",level:"B1"},
{word:"selfish",meaning:"خودخواه",example:"That was selfish.",exampleFa:"آن کار خودخواهانه بود.",level:"B1"}
  ]},
  { id: 16, title: "درس 16", topic: "Relationships — روابط", words: [
    {word:"get on with",meaning:"رابطهٔ خوبی داشتن با",example:"I get on with my colleagues.",exampleFa:"با همکارانم رابطهٔ خوبی دارم.",level:"B1"},
{word:"argue",meaning:"بحث کردن",example:"They argue sometimes.",exampleFa:"آن‌ها گاهی بحث می‌کنند.",level:"A2"},
{word:"trust",meaning:"اعتماد کردن",example:"Friends trust each other.",exampleFa:"دوستان به هم اعتماد دارند.",level:"A2"},
{word:"introduce",meaning:"معرفی کردن",example:"Let me introduce my sister.",exampleFa:"اجازه بده خواهرم را معرفی کنم.",level:"A1"}
  ]},
  { id: 17, title: "درس 17", topic: "Feelings — احساسات", words: [
    {word:"upset",meaning:"ناراحت",example:"He was upset about the result.",exampleFa:"از نتیجه ناراحت بود.",level:"A2"},
{word:"nervous",meaning:"مضطرب",example:"I feel nervous before exams.",exampleFa:"قبل از امتحان مضطرب می‌شوم.",level:"A2"},
{word:"delighted",meaning:"بسیار خوشحال",example:"We were delighted.",exampleFa:"بسیار خوشحال شدیم.",level:"B1"},
{word:"lonely",meaning:"تنها و دلگیر",example:"He felt lonely.",exampleFa:"او احساس تنهایی کرد.",level:"A2"}
  ]},
  { id: 18, title: "درس 18", topic: "Prepositions: time — حروف اضافهٔ زمان", words: [
    {word:"at night",meaning:"شب‌ها",example:"I read at night.",exampleFa:"شب‌ها مطالعه می‌کنم.",level:"A1"},
{word:"on Monday",meaning:"روز دوشنبه",example:"The class is on Monday.",exampleFa:"کلاس دوشنبه است.",level:"A1"},
{word:"in July",meaning:"در ماه ژوئیه",example:"We travel in July.",exampleFa:"در ژوئیه سفر می‌کنیم.",level:"A1"},
{word:"since",meaning:"از زمانی تا حال",example:"I have lived here since 2020.",exampleFa:"از ۲۰۲۰ اینجا زندگی کرده‌ام.",level:"B1"}
  ]},
  { id: 19, title: "درس 19", topic: "Prepositions: direction — حروف اضافهٔ جهت", words: [
    {word:"across",meaning:"از عرض",example:"Walk across the bridge.",exampleFa:"از پل عبور کن.",level:"A2"},
{word:"through",meaning:"از میان",example:"The path goes through the forest.",exampleFa:"مسیر از جنگل می‌گذرد.",level:"A2"},
{word:"towards",meaning:"به سمت",example:"Walk towards the door.",exampleFa:"به سمت در برو.",level:"A2"},
{word:"along",meaning:"در امتداد",example:"We walked along the river.",exampleFa:"در امتداد رودخانه راه رفتیم.",level:"A2"}
  ]},
  { id: 20, title: "درس 20", topic: "Prepositions: place — حروف اضافهٔ مکان", words: [
    {word:"above",meaning:"بالای",example:"The lamp is above the table.",exampleFa:"چراغ بالای میز است.",level:"A2"},
{word:"below",meaning:"پایین‌تر از",example:"It is below zero.",exampleFa:"زیر صفر است.",level:"A2"},
{word:"between",meaning:"بین",example:"It is between the shops.",exampleFa:"بین مغازه‌هاست.",level:"A1"},
{word:"opposite",meaning:"روبروی",example:"The hotel is opposite the station.",exampleFa:"هتل روبروی ایستگاه است.",level:"A2"}
  ]},
  { id: 21, title: "درس 21", topic: "Prepositions: phrases — عبارت‌های حرف اضافه‌ای", words: [
    {word:"in a hurry",meaning:"با عجله",example:"I left in a hurry.",exampleFa:"با عجله رفتم.",level:"A2"},
{word:"on time",meaning:"به‌موقع",example:"The train arrived on time.",exampleFa:"قطار به‌موقع رسید.",level:"A2"},
{word:"by mistake",meaning:"اشتباهی",example:"I sent it by mistake.",exampleFa:"آن را اشتباهی فرستادم.",level:"A2"},
{word:"at first",meaning:"در ابتدا",example:"At first it was difficult.",exampleFa:"در ابتدا سخت بود.",level:"A2"}
  ]},
  { id: 22, title: "درس 22", topic: "Word + preposition — کلمه به‌همراه حرف اضافه", words: [
    {word:"interested in",meaning:"علاقه‌مند به",example:"I am interested in science.",exampleFa:"به علم علاقه‌مندم.",level:"A2"},
{word:"good at",meaning:"در چیزی خوب بودن",example:"She is good at languages.",exampleFa:"او در زبان‌ها خوب است.",level:"A2"},
{word:"afraid of",meaning:"ترسیدن از",example:"He is afraid of spiders.",exampleFa:"او از عنکبوت می‌ترسد.",level:"A2"},
{word:"depend on",meaning:"بستگی داشتن به",example:"It depends on the weather.",exampleFa:"به آب‌وهوا بستگی دارد.",level:"B1"}
  ]},
  { id: 23, title: "درس 23", topic: "Routines — کارهای روزمره", words: [
    {word:"get up",meaning:"از خواب بلند شدن",example:"I get up at seven.",exampleFa:"ساعت هفت بیدار می‌شوم.",level:"A1"},
{word:"get dressed",meaning:"لباس پوشیدن",example:"He gets dressed quickly.",exampleFa:"او سریع لباس می‌پوشد.",level:"A1"},
{word:"commute",meaning:"رفت‌وآمد روزانه",example:"She commutes by train.",exampleFa:"او با قطار رفت‌وآمد می‌کند.",level:"B1"},
{word:"go to bed",meaning:"به رختخواب رفتن",example:"I go to bed early.",exampleFa:"زود به رختخواب می‌روم.",level:"A1"}
  ]},
  { id: 24, title: "درس 24", topic: "Clothes — لباس‌ها", words: [
    {word:"trousers",meaning:"شلوار",example:"These trousers are long.",exampleFa:"این شلوار بلند است.",level:"A1"},
{word:"skirt",meaning:"دامن",example:"She wore a skirt.",exampleFa:"او دامن پوشید.",level:"A1"},
{word:"sleeve",meaning:"آستین",example:"The sleeves are short.",exampleFa:"آستین‌ها کوتاه‌اند.",level:"A2"},
{word:"fit",meaning:"اندازه بودن",example:"These shoes fit me.",exampleFa:"این کفش‌ها اندازه‌ام هستند.",level:"A2"}
  ]},
  { id: 25, title: "درس 25", topic: "Accessories — اکسسوری‌ها", words: [
    {word:"belt",meaning:"کمربند",example:"He needs a belt.",exampleFa:"او کمربند لازم دارد.",level:"A1"},
{word:"wallet",meaning:"کیف پول",example:"My wallet is in my bag.",exampleFa:"کیف پولم در کیفم است.",level:"A2"},
{word:"necklace",meaning:"گردنبند",example:"The necklace is a gift.",exampleFa:"گردنبند هدیه است.",level:"A2"},
{word:"gloves",meaning:"دستکش",example:"Wear gloves in winter.",exampleFa:"زمستان دستکش بپوش.",level:"A1"}
  ]},
  { id: 26, title: "درس 26", topic: "Colours, size and appearance — رنگ، اندازه و ظاهر", words: [
    {word:"striped",meaning:"راه‌راه",example:"He has a striped shirt.",exampleFa:"او پیراهن راه‌راه دارد.",level:"A2"},
{word:"plain",meaning:"ساده و بدون طرح",example:"I prefer a plain T-shirt.",exampleFa:"تی‌شرت ساده را ترجیح می‌دهم.",level:"A2"},
{word:"loose",meaning:"گشاد",example:"This jacket is loose.",exampleFa:"این کت گشاد است.",level:"A2"},
{word:"tight",meaning:"تنگ",example:"These shoes are tight.",exampleFa:"این کفش‌ها تنگ‌اند.",level:"A2"}
  ]},
  { id: 27, title: "درس 27", topic: "Money — پول", words: [
    {word:"cash",meaning:"پول نقد",example:"Can I pay in cash?",exampleFa:"می‌توانم نقدی پرداخت کنم؟",level:"A1"},
{word:"change",meaning:"باقی‌پول",example:"Here is your change.",exampleFa:"این هم باقی‌پولت.",level:"A1"},
{word:"coin",meaning:"سکه",example:"I found a coin.",exampleFa:"یک سکه پیدا کردم.",level:"A1"},
{word:"afford",meaning:"از عهدهٔ هزینه برآمدن",example:"I can't afford it.",exampleFa:"از عهدهٔ هزینه‌اش برنمی‌آیم.",level:"B1"}
  ]},
  { id: 28, title: "درس 28", topic: "Shopping — خرید کردن", words: [
    {word:"receipt",meaning:"رسید",example:"Keep the receipt.",exampleFa:"رسید را نگه دار.",level:"A2"},
{word:"refund",meaning:"پس گرفتن پول",example:"Can I get a refund?",exampleFa:"می‌توانم پولم را پس بگیرم؟",level:"B1"},
{word:"discount",meaning:"تخفیف",example:"There is a discount today.",exampleFa:"امروز تخفیف وجود دارد.",level:"A2"},
{word:"try on",meaning:"پرو کردن",example:"Can I try on this coat?",exampleFa:"می‌توانم این پالتو را پرو کنم؟",level:"A2"}
  ]},
  { id: 29, title: "درس 29", topic: "Possessions — وسایل و دارایی‌ها", words: [
    {word:"belong to",meaning:"متعلق بودن به",example:"This bag belongs to me.",exampleFa:"این کیف متعلق به من است.",level:"A2"},
{word:"own",meaning:"مالک بودن",example:"They own a small house.",exampleFa:"آن‌ها خانه‌ای کوچک دارند.",level:"A2"},
{word:"valuable",meaning:"ارزشمند",example:"Keep valuable items safe.",exampleFa:"وسایل ارزشمند را امن نگه دار.",level:"A2"},
{word:"device",meaning:"دستگاه",example:"This device measures temperature.",exampleFa:"این دستگاه دما را اندازه می‌گیرد.",level:"B1"}
  ]},
  { id: 30, title: "درس 30", topic: "Crime — جرم و جنایت", words: [
    {word:"thief",meaning:"دزد",example:"The thief was caught.",exampleFa:"دزد دستگیر شد.",level:"A2"},
{word:"steal",meaning:"دزدیدن",example:"Someone tried to steal my bike.",exampleFa:"کسی سعی کرد دوچرخه‌ام را بدزدد.",level:"A2"},
{word:"rob",meaning:"سرقت کردن از مکان/شخص",example:"They robbed a shop.",exampleFa:"آن‌ها از مغازه‌ای سرقت کردند.",level:"B1"},
{word:"witness",meaning:"شاهد",example:"A witness spoke to police.",exampleFa:"شاهد با پلیس صحبت کرد.",level:"B1"}
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

  useEffect(() => {
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
      <div className="wordskills-notice">این صفحه با فهرست واقعی ویرایش دوم کتاب هماهنگ شده است. مثال‌ها و ترجمه‌ها برای تمرین، تازه و تألیفی هستند.</div>
      <div className="wordskills-stats"><div><strong>{lessons.length}</strong><span>درس مطابق فهرست کتاب</span></div><div><strong>{lessons.reduce((n,l)=>n+l.words.length,0)}</strong><span>واژهٔ آموزشی</span></div><div><strong>{bankWords.length}</strong><span>واژه در بانک فعلی</span></div></div>
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
