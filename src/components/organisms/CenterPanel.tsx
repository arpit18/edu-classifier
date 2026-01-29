import { Badge } from '../../components/atoms/Badge'
import { SamplePicker } from '../../components/molecules/SamplePicker'
import { ErrorAlert } from '../../components/molecules/ErrorAlert'
import { PrimaryButton } from '../../components/atoms/PrimaryButton'
import { useRef, useState } from 'react'
import { extractTextFromPdf } from '../../utils/pdf'
import { cleanExtractedText } from '../../utils/text'

type SampleOption = { id: string; label: string }

type Props = {
	ready: boolean
	classifying: boolean
	input: string
	setInput: (v: string) => void
	onClassify: () => void
	error: string | null
	sampleId: string
	onSampleChange: (id: string) => void
	onSampleClear: () => void
	sampleOptions: SampleOption[]
	chunkingEnabled: boolean
	onChunkingChange: (v: boolean) => void
	chunkProgress: { done: number; total: number } | null
	perfSummary: { totalMs: number; numChunks: number; avgChunkMs: number; perChunkMs: number[] } | null
}

export function CenterPanel({
	ready,
	classifying,
	input,
	setInput,
	onClassify,
	error,
	sampleId,
	onSampleChange,
	onSampleClear,
	sampleOptions,
	chunkingEnabled,
	onChunkingChange,
	chunkProgress,
	perfSummary,
}: Props) {
	const [extracting, setExtracting] = useState(false)
	const [importError, setImportError] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement | null>(null)

	const onChoosePdf = () => {
		if (fileInputRef.current) fileInputRef.current.click()
	}

	const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
		const file = e.target.files?.[0]
		if (!file) return
		setImportError(null)
		setExtracting(true)
		try {
			const text = await extractTextFromPdf(file)
			setInput(cleanExtractedText(text))
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err)
			setImportError(message)
		} finally {
			setExtracting(false)
			// reset input so selecting the same file triggers change again
			e.target.value = ''
		}
	}

	return (
		<main style={{ flex: '1 1 0', width: '100%', minWidth: 0 }}>
			<div style={{ marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
				{ready ? (
					<Badge variant="success">● Model ready</Badge>
				) : (
					<Badge variant="warning">● Loading model… first load may take a bit</Badge>
				)}
				{chunkProgress && (
					chunkProgress.done < chunkProgress.total ? (
						<Badge variant="warning">{`● Processing chunks: ${chunkProgress.done}/${chunkProgress.total}`}</Badge>
					) : (
						<Badge variant="success">
							{`● Processed chunks: ${chunkProgress.total}/${chunkProgress.total}${
								perfSummary
									? ` — ${Math.round(perfSummary.totalMs)} ms`
									: ''
							}`}
						</Badge>
					)
				)}
			</div>
			<SamplePicker
				value={sampleId}
				onChange={onSampleChange}
				onClear={onSampleClear}
				options={sampleOptions}
				disabled={classifying}
				onUploadPdfClick={onChoosePdf}
			/>
			<input
				ref={fileInputRef}
				type="file"
				accept="application/pdf"
				onChange={onFileChange}
				style={{ display: 'none' }}
			/>
			<div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 12px', flexWrap: 'wrap' }}>
				{extracting && (
					<span style={{ fontSize: 12, color: '#666' }}>
						Extracting PDF…
					</span>
				)}
				<label style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginLeft: 'auto', fontSize: 12, color: '#333', flexWrap: 'wrap', maxWidth: '100%', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
					<input
						type="checkbox"
						checked={chunkingEnabled}
						onChange={(e) => onChunkingChange(e.target.checked)}
						disabled={classifying}
					/>
					Chunk long texts (Splits into ~2000‑char chunks (200 overlap) and averages scores for more stable results.)
				</label>
			</div>
			<textarea
				placeholder="Paste text here..."
				value={input}
				onChange={(e) => setInput(e.target.value)}
				rows={12}
				disabled={classifying}
				style={{ width: '100%', padding: 12, fontSize: 14, borderRadius: 12, border: '1px solid #ddd', boxShadow: '0 1px 0 rgba(0,0,0,0.03)', boxSizing: 'border-box' }}
			/>
			<div style={{ marginTop: 12 }}>
				<PrimaryButton disabled={!ready || classifying || !input.trim()} onClick={onClassify}>
					{classifying ? 'Classifying…' : 'Run classification'}
				</PrimaryButton>
				<span style={{ marginLeft: 10, fontSize: 12, color: '#666' }}>
					Paste any text above, then run the classifier.
				</span>
			</div>
			{(error || importError) && <ErrorAlert message={error ?? importError!} />}
		</main>
	)
}



