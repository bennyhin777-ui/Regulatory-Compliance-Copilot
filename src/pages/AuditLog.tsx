import { useEffect, useState } from 'react'
import { supabase, type AuditLog } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { ScrollText, Search, Activity, Plus, CreditCard as Edit3, Trash2, SquareCheck as CheckSquare } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

const actionIcons: Record<string, typeof Activity> = {
  created: Plus,
  updated: Edit3,
  deleted: Trash2,
  completed: CheckSquare,
}

const actionColors: Record<string, string> = {
  created: 'bg-success-50 text-success-600',
  updated: 'bg-primary-50 text-primary-600',
  deleted: 'bg-error-50 text-error-600',
  completed: 'bg-accent-50 text-accent-600',
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')

  useEffect(() => {
    async function loadLogs() {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200)
      setLogs(data ?? [])
      setLoading(false)
    }
    loadLogs()
  }, [])

  const entityTypes = ['all', ...new Set(logs.map((l) => l.entity_type))]

  const filtered = logs.filter((l) => {
    const matchSearch = (l.description?.toLowerCase().includes(search.toLowerCase()) ?? false) || l.action.toLowerCase().includes(search.toLowerCase())
    const matchEntity = entityFilter === 'all' || l.entity_type === entityFilter
    return matchSearch && matchEntity
  })

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader title="Audit Trail" description="Complete log of all compliance activities" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search audit logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-11" />
        </div>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="input-field max-w-[180px]">
          {entityTypes.map((t) => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={ScrollText} title="No audit entries yet" description="Actions you take across the app — creating, updating, or deleting items — will be recorded here automatically." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Timeline */}
          <div className="divide-y divide-gray-100">
            {filtered.map((log) => {
              const Icon = actionIcons[log.action] ?? Activity
              const colorClass = actionColors[log.action] ?? 'bg-gray-50 text-gray-500'
              return (
                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors animate-slide-in">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{log.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge bg-gray-100 text-gray-500 capitalize">{log.action}</span>
                      <span className="badge bg-gray-100 text-gray-500 capitalize">{log.entity_type}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</p>
                    <p className="text-xs text-gray-300 mt-0.5">{format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
