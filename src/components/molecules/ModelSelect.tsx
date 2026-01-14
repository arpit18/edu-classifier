type Option = { id: string; label: string }

type Props = {
	value: string
	onChange: (value: string) => void
	options: Option[]
	disabled?: boolean
}

export function ModelSelect({ value, onChange, options, disabled }: Props) {
	return (
		<div style={{ marginBottom: 8 }}>
			<label htmlFor="model" style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#333' }}>Model</label>
			<select
				id="model"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ddd' }}
			>
				{options.map((m) => (
					<option key={m.id} value={m.id}>{m.label}</option>
				))}
			</select>
			<div className="muted" style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
				Larger models are slower but usually more accurate.
			</div>
		</div>
	)
}



