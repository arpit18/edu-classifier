export function cleanExtractedText(raw: string): string {
	let text = raw
		.replace(/\r\n?/g, '\n')
		.replace(/(\w)-\n(\w)/g, '$1$2') // join hyphenated line breaks
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n[ \t]+/g, '\n')
		.replace(/[ \t]{2,}/g, ' ')

	// remove common page markers like "Page 3" or "Pg. 2"
	text = text.replace(/^\s*(?:Page|Pg\.?|P\.)\s*\d+\s*$/gim, '')

	// trim each line and collapse excessive blank lines
	text = text
		.split('\n')
		.map((line) => line.trim())
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim()

	return text
}

export function chunkText(text: string, chunkSize: number, overlap: number): string[] {
	const length = text.length
	if (length === 0) return []
	const safeChunkSize = Math.max(1, chunkSize)
	const safeOverlap = Math.max(0, Math.min(overlap, Math.floor(safeChunkSize / 2)))
	const chunks: string[] = []
	let start = 0
	while (start < length) {
		let end = Math.min(start + safeChunkSize, length)
		// try to end at a whitespace boundary within the window
		const window = text.slice(start, end)
		let lastWhitespaceIndex = -1
		for (let i = window.length - 1; i >= 0; i -= 1) {
			if (/\s/.test(window[i])) {
				lastWhitespaceIndex = i
				break
			}
		}
		if (lastWhitespaceIndex > 0 && end !== length) {
			end = start + lastWhitespaceIndex
		}
		const piece = text.slice(start, end).trim()
		if (piece) chunks.push(piece)
		if (end >= length) break
		start = Math.min(end, length - 1) - safeOverlap
		if (start < 0) start = 0
	}
	return chunks
}

