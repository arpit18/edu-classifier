type Props = { title: string }

export function TopBar({ title }: Props) {
	return (
		<div className="app-topbar" style={{ padding: '12px 16px', borderBottom: '1px solid #eee', marginBottom: 12, position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
			<h1 style={{ margin: 0, fontSize: 20 }}>{title}</h1>
		</div>
	)
}



