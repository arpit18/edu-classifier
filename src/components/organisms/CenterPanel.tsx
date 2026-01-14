import { Badge } from '../../components/atoms/Badge'
import { SamplePicker } from '../../components/molecules/SamplePicker'
import { ErrorAlert } from '../../components/molecules/ErrorAlert'
import { PrimaryButton } from '../../components/atoms/PrimaryButton'

type SampleOption = { id: string; label: string }

type Props = {
	ready: boolean
	classifying: boolean
	input: string
	setInput: (v: string) => void
	onClassify: () => void
	error: string | null
	sampleId: string
	onSampleChange: (id: string) => void
	onSampleClear: () => void
	sampleOptions: SampleOption[]
}

export function CenterPanel({
	ready,
	classifying,
	input,
	setInput,
	onClassify,
	error,
	sampleId,
	onSampleChange,
	onSampleClear,
	sampleOptions,
}: Props) {
	return (
		<main style={{ flex: 1 }}>
			<div style={{ marginBottom: 10 }}>
				{ready ? (
					<Badge variant="success">● Model ready</Badge>
				) : (
					<Badge variant="warning">● Loading model… first load may take a bit</Badge>
				)}
			</div>
			<SamplePicker
				value={sampleId}
				onChange={onSampleChange}
				onClear={onSampleClear}
				options={sampleOptions}
				disabled={classifying}
			/>
			<textarea
				placeholder="Paste text here..."
				value={input}
				onChange={(e) => setInput(e.target.value)}
				rows={12}
				style={{ width: '100%', padding: 12, fontSize: 14, borderRadius: 12, border: '1px solid #ddd', boxShadow: '0 1px 0 rgba(0,0,0,0.03)' }}
			/>
			<div style={{ marginTop: 12 }}>
				<PrimaryButton disabled={!ready || classifying || !input.trim()} onClick={onClassify}>
					{classifying ? 'Classifying…' : 'Run classification'}
				</PrimaryButton>
				<span style={{ marginLeft: 10, fontSize: 12, color: '#666' }}>
					Paste any text above, then run the classifier.
				</span>
			</div>
			{error && <ErrorAlert message={error} />}
		</main>
	)
}



