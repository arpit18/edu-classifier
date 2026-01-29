type Option = { id: string; label: string }

type Props = {
	value: string
	onChange: (value: string) => void
	onClear: () => void
	options: Option[]
	disabled?: boolean
	onUploadPdfClick?: () => void
}

export function SamplePicker({ value, onChange, onClear, options, disabled, onUploadPdfClick }: Props) {
	return (
		<div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
			<label htmlFor="sample" style={{ fontSize: 13, color: '#333' }}>Sample text</label>
			<select
				id="sample"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd', maxWidth: '100%' }}
			>
				<option value="">Choose a sample…</option>
				{options.map(s => (
					<option key={s.id} value={s.id}>{s.label}</option>
				))}
			</select>
			<button
				type="button"
				onClick={onClear}
				style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', background: '#f6f6f6', cursor: 'pointer' }}
			>
				Clear
			</button>
			{onUploadPdfClick && (
				<button
					type="button"
					onClick={onUploadPdfClick}
					style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', background: '#f6f6f6', cursor: 'pointer' }}
				>
					Upload PDF
				</button>
			)}
		</div>
	)
}



