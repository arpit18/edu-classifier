import { useEffect, useState } from 'react'
import './App.css'
import { pipeline } from '@huggingface/transformers'
import type { ZeroShotResult, ZeroShotClassifier } from './types'
import { LeftSidebar } from './components/organisms/LeftSidebar'
import { CenterPanel } from './components/organisms/CenterPanel'
import { RightSidebar } from './components/organisms/RightSidebar'

const anyPipeline = pipeline as unknown as (task: string, model: string) => Promise<unknown>

const SAMPLE_TEXTS: { id: string; label: string; text: string }[] = [
	{
		id: 'edu-1',
		label: 'Movement of Oceans',
		text:
			'Ocean water is dynamic. Its physical characteristics like temperature, salinity, density and the external forces like of the sun, moon and the winds influence the movement of ocean water. The horizontal and vertical motions are common in ocean water bodies.  '
	},
	{
		id: 'mixed-1',
		label: 'Terrorist encounter',
		text:
			'An encounter broke out between security forces and terrorists in a remote village in Kathua district of Jammu and Kashmir on Wednesday (January 7, 2026), officials said. The encounter started at Kahog village of Billawar this evening when security forces launched a search operation following information about presence of two to three terrorists, they said.'
	}
]

const MODEL_OPTIONS: { id: string; label: string }[] = [
	{ id: 'Xenova/distilbert-base-uncased-mnli', label: 'DistilBERT (uncased MNLI)' },
	{ id: 'Xenova/bart-large-mnli', label: 'BART Large MNLI' },
	{ id: 'Xenova/roberta-large-mnli', label: 'RoBERTa Large MNLI' },
	{ id: 'Xenova/mobilebert-uncased-mnli', label: 'MobileBERT (uncased MNLI)' },
	{ id: 'Xenova/nli-deberta-v3-small', label: 'DeBERTa v3 Small' },
	{ id: 'Xenova/nli-deberta-v3-base', label: 'DeBERTa v3 Base' },
]

const classifierCache = new Map<string, ZeroShotClassifier>()

async function ensureClassifier(modelId: string): Promise<ZeroShotClassifier> {
	const cached = classifierCache.get(modelId)
	if (cached) return cached
	const instance = await anyPipeline('zero-shot-classification', modelId) as ZeroShotClassifier
	classifierCache.set(modelId, instance)
	return instance
}

function App() {
	const [ready, setReady] = useState(false)
	const [input, setInput] = useState('')
	const [classifying, setClassifying] = useState(false)
	const [result, setResult] = useState<ZeroShotResult | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [modelId, setModelId] = useState<string>('Xenova/distilbert-base-uncased-mnli')
	const [multiLabel, setMultiLabel] = useState<boolean>(false)
	const [labels, setLabels] = useState<string[]>(['educational', 'not educational'])
	const [newLabel, setNewLabel] = useState<string>('')
	const [sampleId, setSampleId] = useState<string>('')

	useEffect(() => {
		setReady(false)
		setResult(null)
		let cancelled = false
		;(async () => {
			try {
				await ensureClassifier(modelId)
				if (!cancelled) setReady(true)
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err)
				if (!cancelled) setError(message)
			}
		})()
		return () => {
			cancelled = true
		}
	}, [modelId])

	const onClassify = () => {
		if (!input.trim()) return
		setError(null)
		setResult(null)
		setClassifying(true)
		;(async () => {
			try {
				const clf = await ensureClassifier(modelId)
				const output = await clf(
					input,
					labels,
					{ multi_label: multiLabel }
				)
				setResult(output)
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err)
				setError(message)
			} finally {
				setClassifying(false)
			}
		})()
	}

	const top = result?.labels?.[0]
		? { label: result.labels[0], score: result.scores[0] }
		: null

	const addLabel = () => {
		const value = newLabel.trim()
		if (!value) return
		const exists = labels.some((l) => l.toLowerCase() === value.toLowerCase())
		if (exists) {
			setNewLabel('')
			return
		}
		setLabels((prev) => [...prev, value])
		setNewLabel('')
	}

	const removeLabel = (l: string) => {
		setLabels((prev) => prev.filter((x) => x !== l))
	}

	const resetLabelsToDefault = () => {
		setLabels(['educational', 'not educational'])
	}

	return (
		<div className="app-shell" style={{ maxWidth: 1200, margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
			<div className="app-topbar" style={{ padding: '12px 16px', borderBottom: '1px solid #eee', marginBottom: 12, position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
				<h1 style={{ margin: 0, fontSize: 20 }}>Zero‑Shot Text Classifier</h1>
			</div>
			<div className="layout-3col" style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
				<LeftSidebar
					modelId={modelId}
					onModelChange={setModelId}
					modelOptions={MODEL_OPTIONS}
					multiLabel={multiLabel}
					onMultiLabelChange={setMultiLabel}
					labels={labels}
					onRemoveLabel={removeLabel}
					newLabel={newLabel}
					onNewLabelChange={setNewLabel}
					onAddLabel={addLabel}
					onResetLabels={resetLabelsToDefault}
					classifying={classifying}
				/>
				<CenterPanel
					ready={ready}
					classifying={classifying}
					input={input}
					setInput={setInput}
					onClassify={onClassify}
					error={error}
					sampleId={sampleId}
					onSampleChange={(id) => {
						setSampleId(id)
						const chosen = SAMPLE_TEXTS.find(s => s.id === id)
						if (chosen) setInput(chosen.text)
					}}
					onSampleClear={() => {
						setSampleId('')
						setInput('')
					}}
					sampleOptions={SAMPLE_TEXTS.map(({ id, label }) => ({ id, label }))}
				/>
				<RightSidebar result={result} top={top} />
			</div>
		</div>
	)
}

export default App
