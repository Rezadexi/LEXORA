# LEXORA

**Your personal vocabulary system** — English ↔ Persian, mobile-first, dark and premium.

## MVP features
- Personal vocabulary bank saved in the browser (`localStorage`)
- Add English words with Persian meaning, category, and CEFR level
- Search and filter saved words
- Vocabulary detail cards with pronunciation via browser speech synthesis when available
- Lightweight multiple-choice practice mode
- Responsive Persian RTL interface
- PWA manifest foundation

## Requirements
- Node.js 20.9+
- npm

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Publish to GitHub
1. Create a new empty repository named `lexora` on GitHub.
2. Unzip/copy these files into the repository.
3. In this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial LEXORA MVP"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/lexora.git
   git push -u origin main
   ```
4. Deploy on Vercel by importing the GitHub repository.

## Product and technical notes
- This first version is personal-first and stores data locally in the current browser. Clearing site data can remove saved words; use export/backup before relying on it.
- Google Translate is not wired in yet. Do not expose API keys in client-side code. Translation and dictionary enrichment should be added through a server-side route with appropriate API credentials, rate limits, and cost controls.
- CEFR levels, definitions, synonyms, antonyms, and examples are user-entered/demo content in this MVP. They are not represented as verified dictionary data.
- Browser speech synthesis availability and voice quality depend on the device/browser.
- Next steps: import/export JSON/CSV, dictionary provider integration, spaced repetition scheduling, quiz history, and optional Supabase sync.
