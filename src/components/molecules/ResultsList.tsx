import type { ZeroShotResult } from '../../types'

type Props = {
	result: ZeroShotResult | null
	top: { label: string; score: number } | null
}

export function ResultsList({ result, top }: Props) {
	return (
		<div>
			<div style={{ fontWeight: 700, marginBottom: 8 }}>Results</div>
			{result ? (
				<div>
					<div style={{ marginBottom: 8 }}>
						<strong>Predicted:</strong> {top?.label} ({(top?.score ?? 0).toFixed(3)})
					</div>
					<div style={{ display: 'grid', gap: 10 }}>
						{result.labels.map((l, i) => {
							const score = result.scores[i]
							return (
								<div key={l}>
									<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
										<span>{l}</span>
										<span>{score.toFixed(3)}</span>
									</div>
									<div style={{ height: 8, background: '#f0f0f0', borderRadius: 999 }}>
										<div style={{ width: `${Math.round(score * 100)}%`, height: '100%', background: '#3b82f6', borderRadius: 999 }} />
									</div>
								</div>
							)
						})}
					</div>
				</div>
			) : (
				<div style={{ color: '#666' }}>
					No results yet. Paste some text and click “Run classification”.
				</div>
			)}
		</div>
	)
}



