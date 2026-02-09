export async function loadAssetsManifest(): Promise<string[]> {
	const base = (import.meta as unknown as { env: { BASE_URL?: string } }).env.BASE_URL || '/'
	const url = `${base}assets/manifest.json`
	const response = await fetch(url, { cache: 'no-cache' })
	if (!response.ok) {
		throw new Error(`Failed to load ${url} (${response.status})`)
	}
	const data = (await response.json()) as unknown
	if (!Array.isArray(data) || !data.every((p) => typeof p === 'string')) {
		throw new Error('Invalid manifest format. Expected an array of relative paths.')
	}
	return data
}

