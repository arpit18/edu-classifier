type Props = { message: string }

export function ErrorAlert({ message }: Props) {
	return (
		<div style={{ color: '#a40000', background: '#ffecec', border: '1px solid #ffd2d2', padding: '8px 10px', borderRadius: 8, marginTop: 12 }}>
			<strong>Something went wrong:</strong> {message}
		</div>
	)
}



