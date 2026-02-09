import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
// Vite: use ?url to resolve to a URL string the browser can load
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite's ?url return type is string at runtime
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url'

GlobalWorkerOptions.workerSrc = workerSrc

export async function extractTextFromPdf(file: File): Promise<string> {
	const buffer = await file.arrayBuffer()
	const task = getDocument({ data: buffer })
	const pdf = await task.promise
	let combined = ''
	for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
		const page = await pdf.getPage(pageNum)
		const content = await page.getTextContent()
		const pageText = content.items
			.map((item: unknown) => {
				const it = item as { str?: string }
				return typeof it.str === 'string' ? it.str : ''
			})
			.join(' ')
			.replace(/\s+\n\s+/g, '\n')
		combined += (pageNum > 1 ? '\n\n' : '') + pageText
	}
	return combined.trim()
}

export async function extractTextFromPdfUrl(
	url: string,
	pagesToAnalyze: number,
): Promise<{
	text: string
	metadata: { title?: string; author?: string; subject?: string }
	totalPages: number
}> {
	const task = getDocument(url)
	const pdf = await task.promise

	const pages = Math.min(pagesToAnalyze, pdf.numPages)
	let combined = ''
	for (let pageNum = 1; pageNum <= pages; pageNum += 1) {
		const page = await pdf.getPage(pageNum)
		const content = await page.getTextContent()
		const pageText = (content.items as Array<{ str?: string }>)
			.map((item) => (typeof item.str === 'string' ? item.str : ''))
			.join(' ')
		combined += (pageNum > 1 ? ' ' : '') + pageText
	}

	// PDF.js v4 getMetadata can be partially undefined
	let info: { Title?: unknown; Author?: unknown; Subject?: unknown } | undefined
	try {
		const meta = (await pdf.getMetadata().catch(() => undefined)) as
			| { info?: { Title?: unknown; Author?: unknown; Subject?: unknown } }
			| undefined
		info = meta?.info
	} catch {
		// ignore metadata errors
	}

	const metadata = {
		title: typeof info?.Title === 'string' ? info.Title : '',
		author: typeof info?.Author === 'string' ? info.Author : '',
		subject: typeof info?.Subject === 'string' ? info.Subject : '',
	}

	return {
		text: combined,
		metadata,
		totalPages: pdf.numPages,
	}
}

