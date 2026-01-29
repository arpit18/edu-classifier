import type { ZeroShotResult } from '../../types'
import { ResultsList } from '../../components/molecules/ResultsList'

type Props = {
	result: ZeroShotResult | null
	top: { label: string; score: number } | null
}

export function RightSidebar({ result, top }: Props) {
	return (
		<aside className="sidebar right" style={{ flex: '1 1 0', minWidth: 0, borderLeft: '1px solid #eee', paddingLeft: 12 }}>
			<ResultsList result={result} top={top} />
		</aside>
	)
}



