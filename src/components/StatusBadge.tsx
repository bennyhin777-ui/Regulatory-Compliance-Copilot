type Props = {
  status: string
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  // Task statuses
  pending: { label: 'Pending', classes: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', classes: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', classes: 'bg-success-100 text-success-700' },
  overdue: { label: 'Overdue', classes: 'bg-error-100 text-error-700' },
  // Priority
  low: { label: 'Low', classes: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', classes: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High', classes: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', classes: 'bg-error-100 text-error-700' },
  // Risk levels
  // Framework status
  active: { label: 'Active', classes: 'bg-success-100 text-success-700' },
  archived: { label: 'Archived', classes: 'bg-gray-100 text-gray-500' },
  // Risk assessment statuses
  identified: { label: 'Identified', classes: 'bg-blue-100 text-blue-700' },
  assessed: { label: 'Assessed', classes: 'bg-yellow-100 text-yellow-700' },
  mitigated: { label: 'Mitigated', classes: 'bg-success-100 text-success-700' },
  accepted: { label: 'Accepted', classes: 'bg-gray-100 text-gray-600' },
  // Document statuses
  draft: { label: 'Draft', classes: 'bg-gray-100 text-gray-600' },
  under_review: { label: 'Under Review', classes: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', classes: 'bg-success-100 text-success-700' },
  expired: { label: 'Expired', classes: 'bg-error-100 text-error-700' },
}

export default function StatusBadge({ status }: Props) {
  const config = statusConfig[status] ?? { label: status, classes: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`badge ${config.classes}`}>
      {config.label}
    </span>
  )
}
