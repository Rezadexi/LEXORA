"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check, FileImage, FileText, Plus, ScanText, Trash2, Upload, X } from "lucide-react";

const BANK_KEY = "lexora.words.v1";
const DRAFT_KEY = "lexora.study-workspace.draft.v1";
type BankWord = { id: string; word: string; meaning: string; category: string; level: string; definition: string; example: string; exampleFa: string; synonyms: string; antonyms: string; createdAt: number; correct: number; reviews: number; [key: string]: unknown };

function normalize(value: string) { return value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " "); }
function candidatesFromText(text: string) {
  const stop = new Set(("about above after again against almost along already also although always among another any anyone anything around because become before being between both came can could did does doing during each either enough every few first from further get give goes going good great had has have having here hers herself him himself his how however into itself just less many may might more most much must near neither never none nor not nothing once only other ought our ours ourselves over own same should since some someone something still such than that the their theirs them themselves then there these they this those through too under until very was were what whatever when where whether which while who whom whose why will with within without would your yours yourself yourselves".split(/\s+/)));
  const seen = new Set<string>();
  return text.match(/[A-Za-z][A-Za-z'-]{2,}(?:\s+[A-Za-z][A-Za-z'-]{2,}){0,2}/g)?.map(v => v.trim()).filter(v => {
    const key = normalize(v);
    if (stop.has(key) || seen.has(key) || key.length < 3) return false;
    seen.add(key); return true;
  }).slice(0, 150) ?? [];
}

export default function StudyWorkspacePage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [manualWord, setManualWord] = useState("");
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const isPdf = file?.type === "application/pdf" || file?.name.toLowerCase().endsWith(".pdf");
  const isImage = !!file && file.type.startsWith("image/");
  const uniqueCandidates = useMemo(() => {
    const seen = new Set<string>();
    return candidates.filter(word => { const key = normalize(word); if (!key || seen.has(key)) return false; seen.add(key); return true; });
  }, [candidates]);

  useEffect(() => {
    if (!file) { setFileUrl(""); return; }
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
      if (typeof draft.sourceText === "string") setSourceText(draft.sourceText);
      if (Array.isArray(draft.candidates)) {
        const words = draft.candidates.filter((v: unknown): v is string => typeof v === "string");
        setCandidates(words);
        setSelected(words);
      }
    } catch { /* Ignore a damaged draft; the main vocabulary bank is separate. */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ sourceText, candidates: uniqueCandidates, updatedAt: Date.now() })); } catch { /* Draft saving is best effort. */ }
  }, [sourceText, uniqueCandidates]);

  function addManualWord() {
    const word = manualWord.trim();
    if (!word) return;
    setCandidates(current => [...current, word]);
    setSelected(current => current.includes(word) ? current : [...current, word]);
    setManualWord("");
    setMessage("واژه به فهرست موقت اضافه شد.");
  }

  async function pasteClipboardText() {
    if (!navigator.clipboard?.readText) {
      setMessage("خواندن مستقیم کلیپ‌بورد در این مرورگر در دسترس نیست؛ متن را در کادر زیر به‌صورت دستی جای‌گذاری کن.");
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) { setMessage("متن انگلیسی در کلیپ‌بورد پیدا نشد. ابتدا از PDF یا ابزار تشخیص متن عکس، متن را کپی کن."); return; }
      setSourceText(current => current.trim() ? current + "\n" + text.trim() : text.trim());
      setMessage("متن کلیپ‌بورد به کادر اضافه شد؛ حالا می‌توانی نامزدهای واژگان را استخراج کنی.");
    } catch {
      setMessage("دسترسی به کلیپ‌بورد رد شد. متن را کپی کن و داخل کادر نگه‌دار و Paste را بزن.");
    }
  }

  async function runImageOcr() {
    if (!file || !isImage) {
      setMessage("برای OCR مستقیم، ابتدا یک عکس از صفحهٔ کتاب انتخاب کن. برای PDF اسکن‌شده فعلاً از صفحه اسکرین‌شات بگیر و آن عکس را انتخاب کن.");
      return;
    }
    setOcrBusy(true);
    setOcrStatus("آماده‌سازی موتور OCR…");
    setMessage("");
    let worker: { recognize: (image: File) => Promise<{ data: { text: string } }>; terminate: () => Promise<void> } | null = null;
    try {
      const w = window as Window & { Tesseract?: { createWorker: (lang: string, oem?: number, options?: { logger?: (info: { status?: string; progress?: number }) => void }) => Promise<{ recognize: (image: File) => Promise<{ data: { text: string } }>; terminate: () => Promise<void> }> } };
      if (!w.Tesseract) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector<HTMLScriptElement>('script[data-lexora-tesseract="true"]');
          if (existing) {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error("بارگذاری OCR ناموفق بود.")), { once: true });
            if (w.Tesseract) resolve();
            return;
          }
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
          script.async = true;
          script.dataset.lexoraTesseract = "true";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("کتابخانهٔ OCR بارگذاری نشد؛ اتصال اینترنت را بررسی کن."));
          document.head.appendChild(script);
        });
      }
      if (!w.Tesseract) throw new Error("موتور OCR در دسترس قرار نگرفت.");
      worker = await w.Tesseract.createWorker("eng", 1, {
        logger: info => {
          const percent = typeof info.progress === "number" ? ` ${Math.round(info.progress * 100)}٪` : "";
          setOcrStatus(`${info.status || "در حال پردازش"}${percent}`);
        }
      });
      const result = await worker.recognize(file);
      const recognized = result.data.text.trim();
      if (!recognized) {
        setMessage("متنی از این عکس تشخیص داده نشد. عکس واضح‌تر و با نور بهتر انتخاب کن.");
        setOcrStatus("OCR تمام شد؛ متنی پیدا نشد.");
        return;
      }
      setSourceText(current => current.trim() ? current + "\\n" + recognized : recognized);
      setMessage("متن عکس با OCR استخراج شد. حالا «استخراج نامزدها از متن» را بزن و فهرست را بررسی کن.");
      setOcrStatus("استخراج متن کامل شد.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "اجرای OCR ناموفق بود. متن را با Samsung Gallery یا Google Lens کپی کن.");
      setOcrStatus("OCR ناموفق بود.");
    } finally {
      if (worker) await worker.terminate().catch(() => undefined);
      setOcrBusy(false);
    }
  }

  function extractCandidates() {
    if (!sourceText.trim()) { setMessage("ابتدا متن قابل انتخاب PDF یا متن استخراج‌شده از OCR را در کادر متن قرار بده."); return; }
    let bankKeys = new Set<string>();
    try {
      const saved = JSON.parse(localStorage.getItem(BANK_KEY) || "[]");
      if (Array.isArray(saved)) bankKeys = new Set(saved.map((w: {word?: string}) => normalize(w?.word || "")).filter(Boolean));
    } catch { /* Keep extraction available if the bank cannot be read. */ }
    const extracted = candidatesFromText(sourceText).filter(word => !bankKeys.has(normalize(word)));
    setCandidates(current => {
      const known = new Set(current.map(normalize));
      return [...current, ...extracted.filter(word => !known.has(normalize(word)))];
    });
    setSelected(current => [...new Set([...current, ...extracted])]);
    setMessage(`${extracted.length} نامزد جدید پیدا شد. فهرست را بررسی کن؛ این مرحله تشخیص قطعی واژه‌های هایلایت‌شده نیست.`);
  }

  function importSelected() {
    const words = uniqueCandidates.filter(word => selected.some(item => normalize(item) === normalize(word)));
    if (!words.length) { setMessage("حداقل یک واژه را انتخاب کن."); return; }
    try {
      const parsed = JSON.parse(localStorage.getItem(BANK_KEY) || "[]");
      const bank: BankWord[] = Array.isArray(parsed) ? parsed : [];
      const existing = new Set(bank.map(item => normalize(item.word || "")));
      const now = Date.now();
      const fresh = words.filter(word => !existing.has(normalize(word))).map((word, index) => ({
        id: `study-${now}-${index}-${Math.random().toString(36).slice(2, 7)}`,
        word, meaning: "", category: "Academic", level: "نامشخص", definition: "", example: "", exampleFa: "", synonyms: "", antonyms: "", createdAt: now, correct: 0, reviews: 0
      }));
      localStorage.setItem(BANK_KEY, JSON.stringify([...bank, ...fresh]));
      setSavedCount(fresh.length);
      setMessage(fresh.length ? `${fresh.length} واژه به بانک همین مرورگر اضافه شد. معنی و اطلاعات تکمیلی را بعداً کامل کن.` : "همهٔ واژه‌های انتخاب‌شده از قبل در بانک وجود داشتند؛ مورد تکراری اضافه نشد.");
    } catch {
      setMessage("بانک لغات خوانده نشد. صفحهٔ اصلی را باز کن و مطمئن شو بانک لغات روی همین مرورگر در دسترس است.");
    }
  }

  function removeCandidate(word: string) {
    setCandidates(current => current.filter(item => normalize(item) !== normalize(word)));
    setSelected(current => current.filter(item => normalize(item) !== normalize(word)));
  }

  return (
    <main className="app-shell" style={{minHeight:"100vh"}}>
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><BookOpen size={22}/></div><div><div className="brand-name">LEXORA</div><div className="brand-sub">STUDY WORKSPACE</div></div></div>
        <div className="top-actions">
          <Link className="btn btn-small" href="/"><ArrowLeft size={15}/> بازگشت به بانک لغات</Link>
        </div>
      </header>
      <section style={{maxWidth:1180, margin:"0 auto", padding:"24px 16px 48px"}}>
        <div style={{marginBottom:22}}>
          <p className="muted" style={{marginBottom:6}}>محیط مطالعهٔ مستقل</p>
          <h1 style={{fontSize:"clamp(26px,4vw,38px)", fontWeight:800, margin:"0 0 10px"}}>کتاب‌خوان و جمع‌آوری واژگان</h1>
          <p className="muted" style={{lineHeight:1.9, maxWidth:800}}>PDF یا عکس صفحه را باز کن، متن را انتخاب یا از OCR کپی کن، سپس فهرست واژه‌ها را بررسی و به بانک اصلی اضافه کن. فایل انتخاب‌شده فقط در همین نشست مرورگر نمایش داده می‌شود.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,340px),1fr))",gap:18,alignItems:"start"}}>
          <section className="panel" style={{padding:18,borderRadius:18,minWidth:0}}>
            <h2 style={{fontSize:19,fontWeight:750,margin:"0 0 12px"}}>۱. باز کردن فایل</h2>
            <input ref={fileInput} type="file" accept="application/pdf,.pdf,image/*" style={{display:"none"}} onChange={e=>{setFile(e.target.files?.[0] || null);setMessage("");}}/>
            <button className="btn" onClick={()=>fileInput.current?.click()} style={{display:"inline-flex",alignItems:"center",gap:8}}><Upload size={16}/> انتخاب PDF یا عکس</button>
            {file && <div style={{display:"flex",alignItems:"center",gap:8,marginTop:12,flexWrap:"wrap"}}><span className="muted" style={{overflowWrap:"anywhere"}}>{file.name}</span><button className="icon-btn" aria-label="بستن فایل" onClick={()=>setFile(null)}><X size={16}/></button></div>}
            <div style={{marginTop:16,minHeight:280,border:"1px solid var(--border, #30323c)",borderRadius:12,overflow:"hidden",background:"rgba(0,0,0,.14)"}}>
              {!file && <div style={{minHeight:280,display:"grid",placeItems:"center",textAlign:"center",padding:24}}><div><FileText size={34}/><p className="muted">PDF یا تصویر صفحه را انتخاب کن.</p><p className="muted" style={{fontSize:12}}>در گوشی می‌توانی فایل را از My Files یا گالری انتخاب کنی.</p></div></div>}
              {isPdf && fileUrl && <iframe title="پیش‌نمایش PDF" src={fileUrl} style={{width:"100%",height:"min(72vh,850px)",minHeight:420,border:0,background:"#fff"}}/>}
              {isImage && fileUrl && <div style={{maxHeight:"75vh",overflow:"auto",touchAction:"pan-x pan-y"}}><img src={fileUrl} alt="صفحهٔ کتاب انتخاب‌شده" style={{display:"block",width:"100%",height:"auto",objectFit:"contain",userSelect:"none"}}/></div>}
              {file && !isPdf && !isImage && <p className="muted" style={{padding:18}}>این نوع فایل پشتیبانی نمی‌شود. یک PDF یا عکس انتخاب کن.</p>}
            </div>
            <p className="muted" style={{fontSize:12,lineHeight:1.8,marginTop:12}}>نکته: برای عکس، دکمهٔ «تشخیص متن از عکس» OCR انگلیسی را در مرورگر اجرا می‌کند؛ بار اول به اینترنت برای دریافت کتابخانه و مدل زبان نیاز دارد. عکس برای پردازش OCR به سرور LEXORA فرستاده نمی‌شود. PDF اسکن‌شده را فعلاً به‌صورت اسکرین‌شات ذخیره کن و همان عکس را انتخاب کن. انتخاب خودکار واژه‌های هایلایت‌شده هنوز پشتیبانی نمی‌شود.</p>
          </section>
          <section className="panel" style={{padding:18,borderRadius:18,minWidth:0}}>
            <h2 style={{fontSize:19,fontWeight:750,margin:"0 0 12px"}}>۲. استخراج و بررسی کلمات</h2>
            <label className="form-field" style={{display:"block"}}><span>متن کپی‌شده از PDF یا خروجی OCR</span><textarea className="field" value={sourceText} onChange={e=>setSourceText(e.target.value)} rows={7} placeholder="متن انگلیسی را اینجا جای‌گذاری کن..." style={{width:"100%",marginTop:8,resize:"vertical"}}/></label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}><button className="btn" onClick={pasteClipboardText} style={{display:"inline-flex",alignItems:"center",gap:8}}><FileText size={16}/> چسباندن متن کپی‌شده</button><button className="btn" onClick={extractCandidates} style={{display:"inline-flex",alignItems:"center",gap:8}}><FileImage size={16}/> استخراج نامزدها از متن</button>{isImage && <button className="btn" onClick={runImageOcr} disabled={ocrBusy} style={{display:"inline-flex",alignItems:"center",gap:8,opacity:ocrBusy?.65:1}}><ScanText size={16}/>{ocrBusy ? "در حال OCR…" : "تشخیص متن از عکس"}</button>}</div>
            {ocrStatus && <p className="muted" role="status" style={{fontSize:12,marginTop:8}}>{ocrStatus}</p>}
            <div style={{display:"flex",gap:8,marginTop:18,alignItems:"center"}}><input className="field" value={manualWord} onChange={e=>setManualWord(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addManualWord();}}} placeholder="یا یک واژه را دستی وارد کن" style={{minWidth:0,flex:1}}/><button className="btn" onClick={addManualWord}><Plus size={16}/> افزودن</button></div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginTop:22,marginBottom:10,flexWrap:"wrap"}}><h3 style={{fontWeight:750,margin:0}}>۳. فهرست موقت ({uniqueCandidates.length})</h3><div style={{display:"flex",gap:8}}><button className="btn btn-small" onClick={()=>setSelected(uniqueCandidates)}>انتخاب همه</button><button className="btn btn-small" onClick={()=>setSelected([])}>لغو انتخاب</button></div></div>
            <div style={{display:"grid",gap:7,maxHeight:380,overflowY:"auto"}}>
              {uniqueCandidates.map(word=><div key={normalize(word)} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 10px",border:"1px solid var(--border, #30323c)",borderRadius:10}}>
                <input type="checkbox" checked={selected.some(item=>normalize(item)===normalize(word))} onChange={e=>setSelected(current=>e.target.checked?[...current,word]:current.filter(item=>normalize(item)!==normalize(word)))} aria-label={`انتخاب ${word}`}/>
                <span dir="ltr" style={{flex:1,overflowWrap:"anywhere"}}>{word}</span>
                <button className="icon-btn" onClick={()=>removeCandidate(word)} aria-label={`حذف ${word}`}><Trash2 size={15}/></button>
              </div>)}
              {!uniqueCandidates.length && <p className="muted" style={{padding:16,textAlign:"center"}}>هنوز واژه‌ای در فهرست نیست.</p>}
            </div>
            <button className="btn" onClick={importSelected} style={{marginTop:14,width:"100%",display:"inline-flex",justifyContent:"center",alignItems:"center",gap:8}}><Check size={16}/> افزودن واژه‌های انتخاب‌شده به بانک</button>
            {message && <p role="status" className="muted" style={{lineHeight:1.8,marginTop:12}}>{message}</p>}
            {savedCount>0 && <p className="muted" style={{fontSize:12}}>واژه‌ها در حافظهٔ همین مرورگر ذخیره شدند؛ برای دیدنشان به بانک لغات برگرد و صفحه را تازه‌سازی کن.</p>}
          </section>
        </div>
        <p className="muted" style={{fontSize:12,lineHeight:1.8,marginTop:18}}>محدودیت فعلی: بانک لغات LEXORA در حافظهٔ محلی همان مرورگر نگهداری می‌شود؛ این صفحه و صفحهٔ اصلی باید در همان مرورگر و آدرس سایت استفاده شوند. فهرست موقت ذخیره می‌شود، اما فایل PDF/عکس برای حفظ حریم خصوصی به سرور ارسال نمی‌شود و با تازه‌سازی باید دوباره انتخابش کنی.</p>
      </section>
    </main>
  );
}
