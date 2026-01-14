type Props = {
	checked: boolean
	onChange: (v: boolean) => void
	disabled?: boolean
}

export function MultiLabelToggle({ checked, onChange, disabled }: Props) {
	return (
		<div style={{ marginBottom: 12 }}>
			<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
				<input
					type="checkbox"
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
					disabled={disabled}
				/>
				<span>Multi-label (treat labels independently)</span>
			</label>
			<div className="muted" style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
				If selected, scores are independent & don't sum to 1.
			</div>
		</div>
	)
}



