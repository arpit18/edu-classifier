import { useEffect, useState } from 'react'
import './App.css'
import type { ZeroShotResult } from './types'
import { LeftSidebar } from './components/organisms/LeftSidebar'
import { CenterPanel } from './components/organisms/CenterPanel'
import { RightSidebar } from './components/organisms/RightSidebar'
import { chunkText } from './utils/text'
import { ClassifierWorkerPool } from './service/ClassifierWorker'
import { useRef } from 'react'


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
	const [chunkingEnabled, setChunkingEnabled] = useState<boolean>(true)
	const [chunkProgress, setChunkProgress] = useState<{ done: number; total: number } | null>(null)
	const hc = typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 0
	const defaultPool = Math.max(1, Math.min(4, hc > 0 ? hc - 1 : 2))
	const [poolSize, setPoolSize] = useState<number>(defaultPool)
	const poolRef = useRef<ClassifierWorkerPool | null>(null)
	const [perfSummary, setPerfSummary] = useState<{
		totalMs: number
		numChunks: number
		avgChunkMs: number
		perChunkMs: number[]
	} | null>(null)

	const CHUNK_SIZE = 2000
	const CHUNK_OVERLAP = 200

	useEffect(() => {
		setReady(false)
		setResult(null)
		let cancelled = false
		;(async () => {
			try {
				// (re)create pool on model/pool size change
				const pool = new ClassifierWorkerPool(poolSize)
				poolRef.current = pool
				await pool.init(modelId)
				if (!cancelled) setReady(true)
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err)
				if (!cancelled) setError(message)
			}
		})()
		return () => {
			cancelled = true
		}
	}, [modelId, poolSize])

	const onClassify = () => {
		if (!input.trim()) return
		setError(null)
		setResult(null)
		setClassifying(true)
		setChunkProgress(null)
		setPerfSummary(null)
		;(async () => {
			try {
				const t0 = performance.now()
				const texts = chunkingEnabled ? (input.length > CHUNK_SIZE ? chunkText(input, CHUNK_SIZE, CHUNK_OVERLAP) : [input]) : [input]
				if (texts.length === 1) {
					const { results, durationsMs } = await poolRef.current!.classifyParallel(texts, labels, { multi_label: multiLabel })
					const output = results[0]
					setResult(output)
					const totalMs = performance.now() - t0
					const avg = durationsMs[0] ?? totalMs
					setPerfSummary({ totalMs, numChunks: 1, avgChunkMs: avg, perChunkMs: durationsMs })
					console.log('Classification performance:', { totalMs, numChunks: 1, perChunkMs: durationsMs, avgChunkMs: avg })
				} else {
					setChunkProgress({ done: 0, total: texts.length })
					const sums = Object.fromEntries(labels.map((l) => [l, 0])) as Record<string, number>
					const onDone = () => setChunkProgress((prev) => prev ? { done: Math.min(prev.done + 1, prev.total), total: prev.total } : null)
					const { results, durationsMs } = await poolRef.current!.classifyParallel(texts, labels, { multi_label: multiLabel }, onDone)
					results.forEach((out: ZeroShotResult) => {
						out.labels.forEach((l: string, i: number) => {
							const s = out.scores[i] ?? 0
							if (Number.isFinite(s)) sums[l] = (sums[l] ?? 0) + s
						})
					})
					const avgPairs = labels.map((l) => ({ label: l, score: (sums[l] ?? 0) / texts.length }))
					avgPairs.sort((a, b) => b.score - a.score)
					const aggregated: ZeroShotResult = {
						labels: avgPairs.map((p) => p.label),
						scores: avgPairs.map((p) => p.score),
						sequence: input,
					}
					setResult(aggregated)
					const totalMs = performance.now() - t0
					const avg = durationsMs.length ? (durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length) : totalMs
					setPerfSummary({ totalMs, numChunks: texts.length, avgChunkMs: avg, perChunkMs: durationsMs })
					try {
						console.table(durationsMs.map((ms, i) => ({ chunk: i + 1, ms })))
					} catch {
						// ignore
					}
					console.log('Classification performance:', { totalMs, numChunks: texts.length, avgChunkMs: avg })
				}
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
		<div className="app-shell" style={{ width: '100%', maxWidth: 1200, margin: '40px auto', padding: '0 16px', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
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
					poolSize={poolSize}
					onPoolSizeChange={setPoolSize}
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
					chunkingEnabled={chunkingEnabled}
					onChunkingChange={setChunkingEnabled}
					chunkProgress={chunkProgress}
					perfSummary={perfSummary}
				/>
				<RightSidebar result={result} top={top} />
			</div>
		</div>
	)
}

export default App
