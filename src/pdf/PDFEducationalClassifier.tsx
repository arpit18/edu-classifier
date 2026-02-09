import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { classifyEducationalDocument, getDefaultClassifierOptions, type PdfMetadata } from './educationalClassifier'
import { writeExcelFromRows } from '../utils/xlsx.ts'
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

async function extractTextFromPdfUrl(
  url: string,
  pagesToAnalyze: number,
): Promise<{ text: string; metadata: PdfMetadata; totalPages: number }> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${url} (${response.status})`)
  }
  const blob = await response.blob()
  const name = url.split('/').pop() || 'document.pdf'
  const file = new File([blob], name, { type: 'application/pdf' })
  return extractPdfText(file, pagesToAnalyze)
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export default function PDFEducationalClassifier() {
  const [result, setResult] = useState<null | ReturnType<typeof classifyEducationalDocument> & { metadata: PdfMetadata; totalPages: number }>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchStatus, setBatchStatus] = useState('')
  const dirInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (dirInputRef.current) {
      dirInputRef.current.setAttribute('webkitdirectory', 'true')
      dirInputRef.current.setAttribute('directory', 'true')
      dirInputRef.current.multiple = true
      dirInputRef.current.accept = '.pdf'
    }
  }, [])

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

  const runBatchOnAssets = useCallback(async () => {
    setBatchLoading(true)
    setError('')
    try {
      const base = (import.meta as unknown as { env: { BASE_URL?: string } }).env.BASE_URL || '/'
      const resp = await fetch(`${base}assets/manifest.json`, { cache: 'no-cache' })
      if (!resp.ok) throw new Error(`Failed to load ${base}assets/manifest.json`)
      const manifestPaths = (await resp.json()) as string[]
      const header = [
        'PDF Name',
        'Actual Type',
        'Identified Type',
        'Confidence Score',
        'Edu Signals',
        'Non Edu Signals',
        'Comments',
      ]
      const rows: Array<Array<string | number>> = [header]

      const total = manifestPaths.length
      for (let i = 0; i < manifestPaths.length; i += 1) {
        const relPath = manifestPaths[i]
        const encoded = relPath.split('/').map((s) => encodeURIComponent(s)).join('/')
        const url = `${base}assets/${encoded}`
        const lowerPath = `/assets/${relPath.toLowerCase()}`
        const actualType = lowerPath.includes('/assets/edu/') ? 'educational' : lowerPath.includes('/assets/non edu/') ? 'non-educational' : ''
        const fname = relPath.split('/').pop() ?? 'unknown.pdf'

        setBatchStatus(`Processing (${i + 1}/${total}): ${fname}`)
        console.log(`Processing (${i + 1}/${total}): ${relPath}`)

        const { text, metadata } = await extractTextFromPdfUrl(url, DEFAULT_OPTIONS.pagesToAnalyze)
        const classification = classifyEducationalDocument(text, metadata, {
          maxTextLength: DEFAULT_OPTIONS.maxTextLength,
          confidenceThreshold: DEFAULT_OPTIONS.confidenceThreshold,
        })

        rows.push([
          fname,
          actualType,
          classification.classification,
          Number((classification.confidence * 100).toFixed(1)),
          classification.details.foundKeywords.join(', '),
          classification.details.foundNonEduKeywords.join(', '),
          '',
        ])

        setBatchStatus(`Processed (${i + 1}/${total}): ${fname}`)
        console.log(
          `Processed (${i + 1}/${total}): ${relPath} -> ${classification.classification} (${(
            classification.confidence * 100
          ).toFixed(1)}%)`,
        )
      }

      const sortedRows = [header, ...rows.slice(1).sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { sensitivity: 'base' }))] as Array<Array<string | number>>
      await writeExcelFromRows(sortedRows, 'Results', 'classification_results.xlsx', [
        { wch: 32 },
        { wch: 16 },
        { wch: 18 },
        { wch: 16 },
        { wch: 40 },
        { wch: 40 },
        { wch: 24 },
      ])
    } catch (e) {
      console.error('Asset batch error', e)
      setError('Asset batch run failed. Please try again.')
    } finally {
      setBatchLoading(false)
      setBatchStatus('')
    }
  }, [])

  const runBatchOnFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBatchLoading(true)
    setError('')
    try {
      const header = [
        'PDF Name',
        'Actual Type',
        'Identified Type',
        'Confidence Score',
        'Edu Signals',
        'Non Edu Signals',
        'Comments',
      ]
      const rows: Array<Array<string | number>> = [header]
      const list = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.pdf'))
      const total = list.length

      for (let i = 0; i < list.length; i += 1) {
        const file = list[i]
        const relPath: string =
          ((file as unknown as { webkitRelativePath?: string }).webkitRelativePath as string | undefined) || file.name
        const fname = file.name
        const lowerRel = relPath.toLowerCase()
        const actualType =
          lowerRel.includes('/edu/') || lowerRel.startsWith('edu/')
            ? 'educational'
            : lowerRel.includes('/non edu/') || lowerRel.startsWith('non edu/')
            ? 'non-educational'
            : ''

        setBatchStatus(`Processing (${i + 1}/${total}): ${fname}`)
        console.log(`Processing (${i + 1}/${total}): ${relPath}`)

        const { text, metadata } = await extractPdfText(file, DEFAULT_OPTIONS.pagesToAnalyze)
        const classification = classifyEducationalDocument(text, metadata, {
          maxTextLength: DEFAULT_OPTIONS.maxTextLength,
          confidenceThreshold: DEFAULT_OPTIONS.confidenceThreshold,
        })

        rows.push([
          fname,
          actualType,
          classification.classification,
          Number((classification.confidence * 100).toFixed(1)),
          classification.details.foundKeywords.join(', '),
          classification.details.foundNonEduKeywords.join(', '),
          '',
        ])

        setBatchStatus(`Processed (${i + 1}/${total}): ${fname}`)
        console.log(
          `Processed (${i + 1}/${total}): ${relPath} -> ${classification.classification} (${(
            classification.confidence * 100
          ).toFixed(1)}%)`,
        )
      }

      const sortedRows = [header, ...rows.slice(1).sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { sensitivity: 'base' }))] as Array<Array<string | number>>
      await writeExcelFromRows(sortedRows, 'Results', 'classification_results.xlsx', [
        { wch: 32 },
        { wch: 16 },
        { wch: 18 },
        { wch: 16 },
        { wch: 40 },
        { wch: 40 },
        { wch: 24 },
      ])
    } catch (e) {
      console.error('System batch error', e)
      setError('Batch run failed. Please try again.')
    } finally {
      setBatchLoading(false)
      setBatchStatus('')
      if (dirInputRef.current) dirInputRef.current.value = ''
    }
  }, [])

  const handleBatchClick = useCallback(() => {
    dirInputRef.current?.click()
  }, [])

  const handleDirChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    await runBatchOnFiles(files)
  }, [runBatchOnFiles])

  return (
    <div className="pdf-classifier-container">
      <h2>Educational PDF Classifier</h2>
      <p className="subtitle">Quick local classification using rule-based signals + document structure.</p>

      <div className="upload-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={runBatchOnAssets} disabled={loading || batchLoading} className="upload-label">
            {batchLoading ? 'Running on assets…' : 'Batch run on existing PDFs'}
          </button>
          <button onClick={handleBatchClick} disabled={loading || batchLoading} className="upload-label">
            {batchLoading ? 'Running from system…' : 'Run files from System'}
          </button>
          <label htmlFor="pdf-upload" className="upload-label">
            {loading ? 'Analyzing...' : 'Choose PDF'}
          </label>
          <input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileUpload} disabled={loading} />
          <input
            ref={dirInputRef}
            id="pdf-dir"
            type="file"
            style={{ display: 'none' }}
            onChange={handleDirChange}
          />
        </div>
        {fileName && <div className="file-name">{fileName}</div>}
        {batchStatus && <div className="file-name">{batchStatus}</div>}
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

