type Props = { variant: 'success' | 'warning'; children: string }

export function Badge({ variant, children }: Props) {
	const styles =
		variant === 'success'
			? { color: '#256c2c', background: '#e9f6ec' }
			: { color: '#7a5c00', background: '#fff6de' }
	return (
		<span style={{ fontSize: 13, padding: '6px 10px', borderRadius: 999, ...styles }}>
			{children}
		</span>
	)
}



