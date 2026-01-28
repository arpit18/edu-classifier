import { Divider } from '../../components/atoms/Divider'
import { ModelSelect } from '../../components/molecules/ModelSelect'
import { MultiLabelToggle } from '../../components/molecules/MultiLabelToggle'
import { LabelsEditor } from '../../components/molecules/LabelsEditor'

type ModelOption = { id: string; label: string }

type Props = {
	modelId: string
	onModelChange: (v: string) => void
	modelOptions: ModelOption[]
	multiLabel: boolean
	onMultiLabelChange: (v: boolean) => void
	poolSize: number
	onPoolSizeChange: (v: number) => void
	labels: string[]
	onRemoveLabel: (label: string) => void
	newLabel: string
	onNewLabelChange: (v: string) => void
	onAddLabel: () => void
	onResetLabels: () => void
	classifying?: boolean
}

export function LeftSidebar({
	modelId,
	onModelChange,
	modelOptions,
	multiLabel,
	onMultiLabelChange,
	poolSize,
	onPoolSizeChange,
	labels,
	onRemoveLabel,
	newLabel,
	onNewLabelChange,
	onAddLabel,
	onResetLabels,
	classifying,
}: Props) {
	return (
		<aside className="sidebar left" style={{ width: 300, borderRight: '1px solid #eee', paddingRight: 12 }}>
			<ModelSelect value={modelId} onChange={onModelChange} options={modelOptions} disabled={classifying} />
			<Divider />
			<MultiLabelToggle checked={multiLabel} onChange={onMultiLabelChange} disabled={classifying} />
			<Divider />
			<div style={{ marginBottom: 12 }}>
				<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<span style={{ color: '#333' }}>Concurrency:</span>
					<select
						value={poolSize}
						onChange={(e) => onPoolSizeChange(Number(e.target.value))}
						disabled={classifying}
						style={{ padding: 6, borderRadius: 6, border: '1px solid #ddd' }}
					>
						<option value={1}>1</option>
						<option value={2}>2</option>
						<option value={3}>3</option>
						<option value={4}>4</option>
					</select>
				</label>
			</div>
			<Divider />
			<LabelsEditor
				labels={labels}
				onRemove={onRemoveLabel}
				newLabel={newLabel}
				onNewLabelChange={onNewLabelChange}
				onAdd={onAddLabel}
				onReset={onResetLabels}
				classifying={classifying}
			/>
		</aside>
	)
}



