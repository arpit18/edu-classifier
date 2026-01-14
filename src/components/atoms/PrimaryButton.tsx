type Props = {
	disabled?: boolean
	onClick?: () => void
	children: string
}

export function PrimaryButton({ disabled, onClick, children }: Props) {
	return (
		<button
			disabled={disabled}
			onClick={onClick}
			style={{
				padding: '10px 14px',
				borderRadius: 10,
				border: '1px solid #3b82f6',
				background: disabled ? '#93c5fd' : '#60a5fa',
				color: '#fff',
				cursor: disabled ? 'not-allowed' : 'pointer',
			}}
		>
			{children}
		</button>
	)
}



