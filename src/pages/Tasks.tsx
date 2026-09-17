import { useEffect, useState, type FormEvent } from 'react'
import { supabase, type ComplianceTask, type Framework } from '../lib/supabase'
import { logAudit } from '../lib/audit'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { SquareCheck as CheckSquare, Plus, Trash2, CreditCard as Edit3, Search, Clock, Filter } from 'lucide-react'
import { format } from 'date-fns'

export default function Tasks() {
  const [tasks, setTasks] = useState<ComplianceTask[]>([])
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ComplianceTask | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    framework_id: '',
    status: 'pending' as ComplianceTask['status'],
    priority: 'medium' as ComplianceTask['priority'],
    due_date: '',
    assigned_to: '',
    completion_percentage: 0,
  })

  async function loadData() {
    setLoading(true)
    const [tk, fw] = await Promise.all([
      supabase.from('compliance_tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('frameworks').select('*'),
    ])
    setTasks(tk.data ?? [])
    setFrameworks(fw.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const frameworkName = (id: string | null) => {
    if (!id) return 'Unassigned'
    return frameworks.find((f) => f.id === id)?.name ?? 'Unknown'
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', description: '', framework_id: '', status: 'pending', priority: 'medium', due_date: '', assigned_to: '', completion_percentage: 0 })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (task: ComplianceTask) => {
    setEditing(task)
    setForm({
      title: task.title,
      description: task.description ?? '',
      framework_id: task.framework_id ?? '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ?? '',
      assigned_to: task.assigned_to ?? '',
      completion_percentage: task.completion_percentage,
    })
    setError(null)
    setModalOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    if (!form.title.trim()) { setError('Title is required'); setSaving(false); return }
    const payload = {
      title: form.title,
      description: form.description,
      framework_id: form.framework_id || null,
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null,
      assigned_to: form.assigned_to || null,
      completion_percentage: form.completion_percentage,
    }
    if (editing) {
      const { error } = await supabase.from('compliance_tasks').update(payload).eq('id', editing.id)
      if (error) { setError(error.message); setSaving(false); return }
      await logAudit('updated', 'task', editing.id, `Updated task: ${form.title}`)
    } else {
      const { data, error } = await supabase.from('compliance_tasks').insert(payload).select().single()
      if (error) { setError(error.message); setSaving(false); return }
      await logAudit('created', 'task', data.id, `Created task: ${form.title}`)
    }
    setSaving(false)
    setModalOpen(false)
    loadData()
  }

  const handleDelete = async (task: ComplianceTask) => {
    if (!confirm(`Delete "${task.title}"?`)) return
    await supabase.from('compliance_tasks').delete().eq('id', task.id)
    await logAudit('deleted', 'task', task.id, `Deleted task: ${task.title}`)
    loadData()
  }

  const toggleComplete = async (task: ComplianceTask) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const newPct = newStatus === 'completed' ? 100 : 0
    await supabase.from('compliance_tasks').update({ status: newStatus, completion_percentage: newPct }).eq('id', task.id)
    await logAudit(newStatus === 'completed' ? 'completed' : 'updated', 'task', task.id, `${newStatus === 'completed' ? 'Completed' : 'Reopened'} task: ${task.title}`)
    loadData()
  }

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || (t.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter
    return matchSearch && matchStatus && matchPriority
  })

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Compliance Tasks"
        description="Track and manage your compliance requirements"
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Task
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-11"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field pl-11 pr-8 appearance-none">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input-field pl-11 pr-8 appearance-none">
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CheckSquare}
            title="No tasks found"
            description={tasks.length === 0 ? "Create your first compliance task to start tracking requirements." : "No tasks match your current filters."}
            action={tasks.length === 0 ? <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add Task</button> : undefined}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <div key={task.id} className="card p-4 group animate-slide-up flex items-center gap-4">
              {/* Checkbox */}
              <button
                onClick={() => toggleComplete(task)}
                className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all flex-shrink-0 ${
                  task.status === 'completed'
                    ? 'bg-success-500 border-success-500 text-white'
                    : 'border-gray-300 hover:border-primary-500'
                }`}
              >
                {task.status === 'completed' && <CheckSquare className="h-4 w-4" />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <h3 className={`text-sm font-semibold ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  <StatusBadge status={task.priority} />
                </div>
                {task.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-xs text-gray-400">{frameworkName(task.framework_id)}</span>
                  <StatusBadge status={task.status} />
                  {task.due_date && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" /> {format(new Date(task.due_date), 'MMM d, yyyy')}
                    </span>
                  )}
                  {task.assigned_to && (
                    <span className="text-xs text-gray-400">Assigned: {task.assigned_to}</span>
                  )}
                  {task.completion_percentage > 0 && task.completion_percentage < 100 && (
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${task.completion_percentage}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{task.completion_percentage}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => openEdit(task)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(task)} className="p-2 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Task' : 'Add Task'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-error-50 border border-error-100 px-4 py-3 text-sm text-error-700">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g., Implement data retention policy" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field min-h-[70px] resize-y" placeholder="Task details" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Framework</label>
            <select value={form.framework_id} onChange={(e) => setForm({ ...form, framework_id: e.target.value })} className="input-field">
              <option value="">Unassigned</option>
              {frameworks.map((fw) => <option key={fw.id} value={fw.id}>{fw.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ComplianceTask['status'] })} className="input-field">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as ComplianceTask['priority'] })} className="input-field">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned To</label>
              <input type="text" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="input-field" placeholder="Name or team" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Completion: {form.completion_percentage}%</label>
            <input type="range" min="0" max="100" step="5" value={form.completion_percentage} onChange={(e) => setForm({ ...form, completion_percentage: parseInt(e.target.value) })} className="w-full accent-primary-600" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
