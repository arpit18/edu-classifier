# Educational Classifiers — On‑Device

A Vite + TypeScript React app with two pages:
- Zero-shot Classifier: zero‑shot classification using Transformers.js (runs fully in the browser).
- Heuristics‑based PDF Classifier: fast local classification using rule‑based signals + document structure.

Both pages run on‑device. No server calls are made.

## Live demo
- App home (HashRouter): `https://arpit18.github.io/edu-classifier/`
  - Zero-shot: `https://arpit18.github.io/edu-classifier/#/text`
  - Heuristics : `https://arpit18.github.io/edu-classifier/#/pdf`

Default model reference (Zero-Shot): https://huggingface.co/Xenova/distilbert-base-uncased-mnli

## Getting started

```bash
npm i
npm run dev
```

Open the printed localhost URL. First load may take a bit while model assets are cached by the browser.

## Navigation
- The top navigation uses tab‑style links to switch between the two pages.
- HashRouter is used so the app works on GitHub Pages (no server rewrites needed).

## Pages

### Zero‑shot Text Classifier
- Pick among multiple NLI models (speed/accuracy trade‑offs).
- Toggle multi‑label scoring.
- Add/remove your own labels (defaults: "educational", "not educational").
- Try sample texts and view per‑label confidence bars.
- Upload a PDF to extract its text locally and classify it.
- Long‑text support: optional chunking + score aggregation for reliable results on large inputs.

How it works
- Uses Transformers.js `pipeline('zero-shot-classification', <modelId>)`.
- Runs in Web Workers via a small worker pool for parallelism.
- Entirely client‑side; model weights are cached by the browser after first load.

Key files
- `src/App.tsx` — app state and wiring (model init, classify, layout)
- `src/service/ClassifierWorker.ts` and `src/workers/classifierWorker.ts` — worker pool and worker implementation
- `src/utils/pdf.ts` — PDF text extraction used to prefill the textarea
- `src/components/**` — UI components

### Heuristics‑based Classifier
- Choose a PDF file; text is extracted locally using `pdfjs-dist`.
- Rule‑based signals compute an "educational vs non‑educational" classification with confidence and sub‑scores.
- Shows found keywords and other signals for transparency.

Key files
- `src/pdf/PDFEducationalClassifier.tsx` — UI page
- `src/pdf/educationalClassifier.ts` — scoring logic (keywords, patterns, structure, metadata)
- `src/pdf/pdfClassifier.css` — styles for the PDF classifier card

## ESLint

```bash
npm run lint
npm run lint:fix
```

Config: `eslint.config.js` (flat config). TypeScript/React rules and react-refresh are enabled.

## Offline / local model hosting (optional)
By default, model files are downloaded from Hugging Face on first use. To ensure zero network usage at runtime:

1. Download model assets  
   From the model page, download the repo files (especially the `onnx/` folder, tokenizer and config files) and place them under:
   `public/models/Xenova/distilbert-base-uncased-mnli/`

2. Point Transformers.js to your local URL  
   Update the model identifier used by the app (edit `MODEL_OPTIONS` in `src/App.tsx`):

   ```ts
   const MODEL_OPTIONS = [
     { id: '/models/Xenova/distilbert-base-uncased-mnli', label: 'Local DistilBERT (MNLI)' },
     // ...other remote models
   ]
   ```

   Ensure the directory mirrors the Hugging Face repo structure (notably the `onnx` subfolder).

3. (Optional) Add PWA precaching for `public/models/**`.

## Notes
- Default labels: `['educational', 'not educational']`. You can add or remove labels on the Text page.
- Multi‑label mode scores each label independently (scores do not sum to 1).
- You can extend `MODEL_OPTIONS` in `src/App.tsx` to benchmark additional models (e.g. RoBERTa, DeBERTa, XLM‑R by `Xenova`).
- For production, consider confidence thresholds, input validation, loading skeletons, and persisting settings (model/labels/mode) to localStorage.
- The PDF worker is loaded via `pdfjs-dist` with Vite’s `?url` import. Ensure your CSP allows loading that worker file if deploying under strict CSP.
