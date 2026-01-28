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
		// eslint-disable-next-line no-await-in-loop
		const page = await pdf.getPage(pageNum)
		// eslint-disable-next-line no-await-in-loop
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

