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
			<div className="section-title" style={{ fontWeight: 700, marginBottom: 8 }}>Settings</div>
			<ModelSelect value={modelId} onChange={onModelChange} options={modelOptions} disabled={classifying} />
			<Divider />
			<MultiLabelToggle checked={multiLabel} onChange={onMultiLabelChange} disabled={classifying} />
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



