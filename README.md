# Educational Text Classifier (Zero-Shot, On-Device)

A small React (Vite + TypeScript) app that performs zero‑shot text classification fully in the browser using Transformers.js. The UI lets you:
- Pick among multiple NLI models (speed/accuracy trade‑offs)
- Toggle multi‑label scoring
- Add/remove your own labels (defaults: "educational", "not educational")
- Try sample texts and view per‑label confidence bars
- Upload a PDF to extract its text on-device and classify it
	- Long-text support: optional chunking + score aggregation for reliable results on large PDFs

## Live demo
- [arpit18.github.io/edu-classifier](https://arpit18.github.io/edu-classifier/)

Default model reference: https://huggingface.co/Xenova/distilbert-base-uncased-mnli

## Getting started

```bash
npm i
npm run dev
```

Open the printed localhost URL. The first load may take a bit while model files download and are cached by the browser.

## How it works
- Uses Transformers.js `pipeline('zero-shot-classification', <modelId>)`.
- Runs entirely in the browser; no server inference calls. Models are cached by the browser after first load.
- The model now loads on the main thread with lightweight UI state to show loading/progress; no Web Worker is used.
- Labels are editable from the left sidebar; classification uses the current list.
- Multi‑label mode scores each label independently (scores do not sum to 1).
- PDF text extraction is done in-browser using `pdfjs-dist`; no file contents leave your device.
	- A “Clean extracted text” option can normalize whitespace, remove hyphenated line breaks, and drop common page markers before placing the text into the editor.
	- “Chunk long texts” splits long inputs (with overlap) and averages label scores across chunks.

### Key files
- `src/App.tsx`: application state and wiring (model load, classify, layout)
- `src/types.ts`: shared types
- `src/components/atoms|molecules|organisms/*`: atomic UI components
- `src/utils/pdf.ts`: PDF text extraction via `pdfjs-dist`

### Uploading a PDF
- Click “Upload PDF” above the text area.
- The PDF’s text is extracted locally in your browser and placed into the textarea.
- You can edit the extracted text before running classification.
 - Optionally enable “Clean extracted text” to auto‑tidy content (recommended).
 - Enable “Chunk long texts” for better accuracy on long documents. The app splits the text into overlapping chunks and averages the scores across chunks.

## Offline / local model hosting (optional)
By default, model files are downloaded from Hugging Face on first use. To ensure zero network usage at runtime:

1. Download model assets
   - From the model page, download the repo files (especially the `onnx/` folder, tokenizer and config files).
   - Place them under `public/models/Xenova/distilbert-base-uncased-mnli/` so they’re served at `/models/...`.

2. Point Transformers.js to your local URL
   - Update the model identifier used by the app. The quickest way is to edit the `MODEL_OPTIONS` list in `src/App.tsx` and set the ID to your local path:

   ```ts
   const MODEL_OPTIONS = [
     { id: '/models/Xenova/distilbert-base-uncased-mnli', label: 'Local DistilBERT (MNLI)' },
     // ...other remote models
   ]
   ```

   Make sure your directory mirrors the Hugging Face repo structure (notably the `onnx` subfolder).

3. (Optional) Add PWA precaching for `public/models/**`.

## Notes
- Default labels: `['educational', 'not educational']`. You can add or remove labels from the left sidebar.
- Multi‑label mode can be toggled in the sidebar.
- You can extend `MODEL_OPTIONS` in `src/App.tsx` to quickly benchmark additional models (e.g., RoBERTa, DeBERTa, XLM‑R variants by `Xenova`).
- For production, consider a confidence threshold, input validation, loading skeletons, and persisting settings (model/labels/mode) to localStorage.
 - If you need PDF processing in environments with strict CSP, ensure the worker URL from `pdfjs-dist` is allowed to load.

