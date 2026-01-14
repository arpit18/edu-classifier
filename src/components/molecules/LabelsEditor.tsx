import { Chip } from '../../components/atoms/Chip'

type Props = {
	labels: string[]
	onRemove: (label: string) => void
	newLabel: string
	onNewLabelChange: (v: string) => void
	onAdd: () => void
	onReset: () => void
	classifying?: boolean
}

export function LabelsEditor({
	labels,
	onRemove,
	newLabel,
	onNewLabelChange,
	onAdd,
	onReset,
	classifying,
}: Props) {
	return (
		<div>
			<div className="section-title" style={{ fontWeight: 700, marginBottom: 8 }}>Labels</div>
			<div className="chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
				{labels.map((l) => (
					<Chip key={l} label={l} onRemove={() => onRemove(l)} />
				))}
			</div>
			<div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
				<input
					type="text"
					placeholder="Add your own label…"
					value={newLabel}
					onChange={(e) => onNewLabelChange(e.target.value)}
					onKeyDown={(e) => { if (e.key === 'Enter') onAdd() }}
					style={{ flex: 1, padding: 8, fontSize: 14, borderRadius: 8, border: '1px solid #ddd' }}
					disabled={classifying}
				/>
				<button type="button" onClick={onAdd} disabled={classifying || !newLabel.trim()} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', background: '#f6f6f6', cursor: 'pointer' }}>
					Add
				</button>
			</div>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
				<div className="muted" style={{ fontSize: 12, color: '#555' }}>
					Default: "educational", "not educational"
				</div>
				<button type="button" onClick={onReset} style={{ fontSize: 12, background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer' }}>
					Reset
				</button>
			</div>
		</div>
	)
}



