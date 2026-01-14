export type ZeroShotResult = {
	labels: string[]
	scores: number[]
	sequence: string
}

export type ZeroShotClassifier = (
	text: string,
	labels: string[],
	options?: { hypothesis_template?: string; multi_label?: boolean }
) => Promise<ZeroShotResult>



