type Props = {
	checked: boolean
	onChange: (v: boolean) => void
	disabled?: boolean
}

export function MultiLabelToggle({ checked, onChange, disabled }: Props) {
	return (
		<div style={{ marginBottom: 12 }}>
			<label style={{ display: 'flex', gap: 8 }}>
				<input
					type="checkbox"
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
					disabled={disabled}
				/>
				<span>Multi-label (If selected, scores are independent & don't sum to 1.)</span>
			</label>
		</div>
	)
}



