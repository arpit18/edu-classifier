import { useCallback, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { classifyEducationalDocument, getDefaultClassifierOptions, type PdfMetadata } from './educationalClassifier'
import './pdfClassifier.css'

const DEFAULT_OPTIONS = getDefaultClassifierOptions()

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

type PdfJsMetadata = {
  info?: {
    Title?: unknown
    Author?: unknown
    Subject?: unknown
  }
}

async function extractPdfText(
  file: File,
  pagesToAnalyze: number,
): Promise<{ text: string; metadata: PdfMetadata; totalPages: number }> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pages = Math.min(pagesToAnalyze, pdf.numPages)
  let fullText = ''

  for (let pageNum = 1; pageNum <= pages; pageNum += 1) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const pageText = (content.items as Array<{ str?: string }>).map((item) => item.str ?? '').join(' ')
    fullText += `${pageText} `
  }

  // PDF.js v4 returns getMetadata() possibly undefined parts
  const meta = (await pdf.getMetadata().catch(() => undefined)) as PdfJsMetadata | undefined
  const info = meta?.info
  const metadata: PdfMetadata = {
    title: typeof info?.Title === 'string' ? info.Title : '',
    author: typeof info?.Author === 'string' ? info.Author : '',
    subject: typeof info?.Subject === 'string' ? info.Subject : '',
  }

  return {
    text: fullText,
    metadata,
    totalPages: pdf.numPages,
  }
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export default function PDFEducationalClassifier() {
  const [result, setResult] = useState<null | ReturnType<typeof classifyEducationalDocument> & { metadata: PdfMetadata; totalPages: number }>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.')
      setResult(null)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setFileName(file.name)

    try {
      const { text, metadata, totalPages } = await extractPdfText(file, DEFAULT_OPTIONS.pagesToAnalyze)

      const classification = classifyEducationalDocument(text, metadata, {
        maxTextLength: DEFAULT_OPTIONS.maxTextLength,
        confidenceThreshold: DEFAULT_OPTIONS.confidenceThreshold,
      })

      setResult({
        ...classification,
        metadata,
        totalPages,
      })
    } catch {
      setError('Failed to analyze PDF. Please try another file.')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="pdf-classifier-container">
      <h2>Educational PDF Classifier</h2>
      <p className="subtitle">Quick local classification using rule-based signals + document structure.</p>

      <div className="upload-section">
        <label htmlFor="pdf-upload" className="upload-label">
          {loading ? 'Analyzing...' : 'Choose PDF'}
        </label>
        <input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileUpload} disabled={loading} />
        {fileName && <div className="file-name">{fileName}</div>}
      </div>

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className={`result-card ${result.classification}`}>
          <div className="result-header">
            <span className="result-icon">{result.classification === 'educational' ? '🎓' : '📄'}</span>
            <div>
              <h3 className="result-title">{result.classification}</h3>
              <p className="result-subtitle">Confidence: {formatPercent(result.confidence)}</p>
            </div>
          </div>

          <div className="score-grid">
            <div>
              <span>Keyword score</span>
              <strong>{formatPercent(result.scores.keywords)}</strong>
            </div>
            <div>
              <span>Pattern score</span>
              <strong>{formatPercent(result.scores.patterns)}</strong>
            </div>
            <div>
              <span>Structure score</span>
              <strong>{formatPercent(result.scores.structure)}</strong>
            </div>
            <div>
              <span>Metadata score</span>
              <strong>{formatPercent(result.scores.metadata)}</strong>
            </div>
          </div>

          <div className="meta-section">
            <div>
              <strong>Pages analyzed:</strong> {Math.min(DEFAULT_OPTIONS.pagesToAnalyze, result.totalPages)} / {result.totalPages}
            </div>
            {result.details.foundKeywords.length > 0 && (
              <div>
                <strong>Keywords found:</strong> {result.details.foundKeywords.join(', ')}
              </div>
            )}
            {result.details.foundNonEduKeywords.length > 0 && (
              <div>
                <strong>Non-edu signals:</strong> {result.details.foundNonEduKeywords.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

