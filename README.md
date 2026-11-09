# LEXORA

**Your personal vocabulary system** — English–Persian vocabulary learning, designed for mobile and hosted on GitHub Pages.

## Current features
- Personal vocabulary bank saved in this browser's local storage
- Add, edit, search, filter, and group words by category
- English definitions, Persian meanings, examples, translations, synonyms, and antonyms
- Browser-based pronunciation where supported
- Podcast Studio connected to the local vocabulary bank: AI-written episode scripts via Gemini, contextual vocabulary teaching, an original story and dialogue, American-English browser speech, playback speed/segment controls, listening practice, and a local episode archive
- Bulk vocabulary import from alternating English/Persian lines or `word | معنی` records
- Text candidate extraction and a separate study workspace for pasted text, images, and PDFs
- Image OCR in the browser (requires internet for the OCR library/model to load)
- Multiple-choice quizzes, reverse questions, cloze practice, wrong-answer review, and due review
- Daily active-recall learning with spaced-review scheduling
- Separate Collocations / Idioms library and Word Skills lesson area
- Vocabulary-only export and full JSON backup/restore

## Deployment
- Repository: https://github.com/Rezadexi/LEXORA
- Live site: https://rezadexi.github.io/LEXORA/
- GitHub Pages static export uses the `/LEXORA` base path.
- GitHub Actions builds and deploys changes pushed to `main`.

## Run locally
Requirements: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000. To check production compilation, run `npm run build`.

## Important data and privacy notes
- The vocabulary bank and learning progress are stored in the current browser/device. They do not automatically sync to another device or browser.
- Clearing browser site data can remove locally stored words and progress. Export a full backup regularly and keep a copy somewhere safe.
- The full backup includes the vocabulary bank, wrong-answer list, enrichment/translation caches, and supported Collocations progress. Restore offers a replace or merge path; read the confirmation prompts carefully.
- Translation, dictionary lookups, and speech synthesis depend on public services and browser/device support. They may be unavailable, rate-limited, or incomplete. Verify automatically generated meanings and CEFR levels before relying on them.
- Podcast script generation requires a Gemini API key entered in Podcast Studio. The key is stored in local browser storage and sent from the browser to Google Gemini; selected vocabulary details are included in the prompt. Use a key restricted to the Gemini API and your site's HTTP referrer, set a usage quota, and do not share the key. Audio is still spoken by the browser's speech engine; the app does not create downloadable studio-quality MP3 files.
- OCR suggests text candidates; it does not reliably identify bold/highlighted book vocabulary or preserve text formatting. Review candidates before adding them.
- The study workspace's selected source file is temporary and must be selected again after a page refresh; pasted text and candidate drafts are saved locally on that device.

## Development checks
- `npm run build` — production/static build
- `npm run lint` — ESLint (may report existing issues separately from build failures)
