/* eslint-disable no-restricted-globals */
import { pipeline } from '@huggingface/transformers'
import type { ZeroShotResult, ZeroShotClassifier } from '../types'

type RequestMessage =
	| { id: number; type: 'init'; modelId: string }
	| { id: number; type: 'classify'; modelId: string; text: string; labels: string[]; options?: { hypothesis_template?: string; multi_label?: boolean } }

type ResponseMessage =
	| { id: number; ok: true; type: 'init'; ready: boolean }
	| { id: number; ok: true; type: 'classify'; result: ZeroShotResult }
	| { id: number; ok: false; error: string }

const anyPipeline = pipeline as unknown as (task: string, model: string) => Promise<unknown>
const cache = new Map<string, ZeroShotClassifier>()

async function ensureClassifier(modelId: string): Promise<ZeroShotClassifier> {
	const cached = cache.get(modelId)
	if (cached) return cached
	const clf = await anyPipeline('zero-shot-classification', modelId) as ZeroShotClassifier
	cache.set(modelId, clf)
	return clf
}

self.onmessage = async (evt: MessageEvent<RequestMessage>) => {
	const msg = evt.data
	const { id } = msg
	try {
		if (msg.type === 'init') {
			await ensureClassifier(msg.modelId)
			const resp: ResponseMessage = { id, ok: true, type: 'init', ready: true }
			self.postMessage(resp)
			return
		}
		if (msg.type === 'classify') {
			const clf = await ensureClassifier(msg.modelId)
			const result = await clf(msg.text, msg.labels, msg.options)
			const resp: ResponseMessage = { id, ok: true, type: 'classify', result }
			self.postMessage(resp)
			return
		}
		throw new Error('Unknown message type')
	} catch (err: unknown) {
		const error = err instanceof Error ? err.message : String(err)
		const resp: ResponseMessage = { id, ok: false, error }
		self.postMessage(resp)
	}
}

