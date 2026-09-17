import { type ReactNode } from 'react'

type Props = {
  title: string
  description: string
  action?: ReactNode
}

export default function PageHeader({ title, description, action }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      {action}
    </div>
  )
}
