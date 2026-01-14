type Props = {
	label: string
	onRemove?: () => void
	removable?: boolean
}

export function Chip({ label, onRemove, removable = true }: Props) {
	return (
		<span
			className="chip"
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 6,
				background: '#f3f4f6',
				border: '1px solid #e5e7eb',
				borderRadius: 999,
				padding: '4px 8px',
				fontSize: 13,
			}}
		>
			{label}
			{removable && (
				<button
					type="button"
					onClick={onRemove}
					title="Remove label"
					style={{ fontSize: 12, background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}
				>
					×
				</button>
			)}
		</span>
	)
}



