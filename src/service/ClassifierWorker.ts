import type { ZeroShotResult } from '../types'

type WorkerInitReq = { id: number; type: 'init'; modelId: string }
type WorkerClassifyReq = {
	id: number
	type: 'classify'
	modelId: string
	text: string
	labels: string[]
	options?: { hypothesis_template?: string; multi_label?: boolean }
}
type WorkerReq = WorkerInitReq | WorkerClassifyReq

type WorkerResp =
	| { id: number; ok: true; type: 'init'; ready: boolean }
	| { id: number; ok: true; type: 'classify'; result: ZeroShotResult }
	| { id: number; ok: false; error: string }

export class ClassifierWorkerManager {
	private worker: Worker | null = null
	private nextId = 1
	private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>()
	private currentModelId: string | null = null

	private ensureWorker(): Worker {
		if (!this.worker) {
			this.worker = new Worker(new URL('../workers/classifierWorker.ts', import.meta.url), { type: 'module' })
			this.worker.onmessage = (evt: MessageEvent<WorkerResp>) => {
				const msg = evt.data
				const p = this.pending.get(msg.id)
				if (!p) return
				this.pending.delete(msg.id)
				if (msg.ok) {
					p.resolve(msg)
				} else {
					p.reject(new Error(msg.error))
				}
			}
		}
		return this.worker
	}

	private request<T = unknown>(payload: WorkerReq): Promise<T> {
		const w = this.ensureWorker()
		return new Promise<T>((resolve, reject) => {
			this.pending.set(payload.id, {
				resolve: (v: unknown) => resolve(v as T),
				reject,
			})
			w.postMessage(payload)
		})
	}

	async init(modelId: string): Promise<void> {
		this.currentModelId = modelId
		const id = this.nextId++
		await this.request<{ type: 'init'; ready: boolean }>({ id, type: 'init', modelId })
	}

	async classify(text: string, labels: string[], options?: { hypothesis_template?: string; multi_label?: boolean }): Promise<ZeroShotResult> {
		if (!this.currentModelId) throw new Error('Worker not initialized with a model')
		const id = this.nextId++
		const resp = await this.request<{ type: 'classify'; result: ZeroShotResult }>({
			id,
			type: 'classify',
			modelId: this.currentModelId,
			text,
			labels,
			options,
		})
		return resp.result
	}
}

export const classifierWorker = new ClassifierWorkerManager()

export class ClassifierWorkerPool {
	private managers: ClassifierWorkerManager[]
	private size: number

	constructor(size: number) {
		this.size = Math.max(1, size)
		this.managers = Array.from({ length: this.size }, () => new ClassifierWorkerManager())
	}

	async init(modelId: string): Promise<void> {
		await Promise.all(this.managers.map((m) => m.init(modelId)))
	}

	// Parallel classify across the pool, preserving original order.
	// onChunkDone is called after each chunk completes (for progress updates).
	async classifyParallel(
		texts: string[],
		labels: string[],
		options: { hypothesis_template?: string; multi_label?: boolean } | undefined,
		onChunkDone?: () => void
	): Promise<{ results: ZeroShotResult[]; durationsMs: number[] }> {
		const results: ZeroShotResult[] = new Array(texts.length)
		const durationsMs: number[] = new Array(texts.length).fill(0)
		let next = 0

		const workerRun = async (manager: ClassifierWorkerManager) => {
			for (;;) {
				const idx = next
				if (idx >= texts.length) return
				next += 1
				const start = performance.now()
				const out = await manager.classify(texts[idx], labels, options)
				durationsMs[idx] = performance.now() - start
				results[idx] = out
				if (onChunkDone) onChunkDone()
			}
		}

		const runners = this.managers.map((m) => workerRun(m))
		await Promise.all(runners)
		return { results, durationsMs }
	}
}

