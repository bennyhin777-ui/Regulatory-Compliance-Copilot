import { useEffect, useState, type FormEvent } from 'react'
import { supabase, type Framework } from '../lib/supabase'
import { logAudit } from '../lib/audit'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { Shield, Plus, Globe, Trash2, CreditCard as Edit3, Search } from 'lucide-react'
import { format } from 'date-fns'

export default function Frameworks() {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Framework | null>(null)
  const [form, setForm] = useState({ name: '', description: '', category: 'General', jurisdiction: 'Global' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadFrameworks() {
    setLoading(true)
    const { data } = await supabase.from('frameworks').select('*').order('created_at', { ascending: false })
    setFrameworks(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadFrameworks()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', category: 'General', jurisdiction: 'Global' })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (fw: Framework) => {
    setEditing(fw)
    setForm({ name: fw.name, description: fw.description ?? '', category: fw.category, jurisdiction: fw.jurisdiction })
    setError(null)
    setModalOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    if (!form.name.trim()) {
      setError('Name is required')
      setSaving(false)
      return
    }
    if (editing) {
      const { error } = await supabase
        .from('frameworks')
        .update({ name: form.name, description: form.description, category: form.category, jurisdiction: form.jurisdiction })
        .eq('id', editing.id)
      if (error) { setError(error.message); setSaving(false); return }
      await logAudit('updated', 'framework', editing.id, `Updated framework: ${form.name}`)
    } else {
      const { data, error } = await supabase
        .from('frameworks')
        .insert({ name: form.name, description: form.description, category: form.category, jurisdiction: form.jurisdiction })
        .select()
        .single()
      if (error) { setError(error.message); setSaving(false); return }
      await logAudit('created', 'framework', data.id, `Created framework: ${form.name}`)
    }
    setSaving(false)
    setModalOpen(false)
    loadFrameworks()
  }

  const handleDelete = async (fw: Framework) => {
    if (!confirm(`Delete "${fw.name}"? This will also delete all related compliance tasks.`)) return
    await supabase.from('frameworks').delete().eq('id', fw.id)
    await logAudit('deleted', 'framework', fw.id, `Deleted framework: ${fw.name}`)
    loadFrameworks()
  }

  const filtered = frameworks.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.category.toLowerCase().includes(search.toLowerCase()) ||
    f.jurisdiction.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Frameworks"
        description="Manage your regulatory compliance frameworks"
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> Add Framework
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search frameworks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-11"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Shield}
            title="No frameworks yet"
            description="Add your first compliance framework to start tracking regulations like GDPR, HIPAA, or SOC 2."
            action={
              <button onClick={openCreate} className="btn-primary">
                <Plus className="h-4 w-4" /> Add Framework
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((fw) => (
            <div key={fw.id} className="card p-5 group animate-slide-up">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
                  <Shield className="h-6 w-6 text-primary-600" />
                </div>
                <StatusBadge status={fw.status} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">{fw.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{fw.description || 'No description'}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge bg-gray-100 text-gray-600">{fw.category}</span>
                <span className="badge bg-gray-100 text-gray-600 flex items-center gap-1">
                  <Globe className="h-3 w-3" /> {fw.jurisdiction}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">Added {format(new Date(fw.created_at), 'MMM d, yyyy')}</p>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(fw)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  <Edit3 className="h-4 w-4" /> Edit
                </button>
                <span className="text-gray-300">|</span>
                <button onClick={() => handleDelete(fw)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-error-600 transition-colors">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Framework' : 'Add Framework'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-error-50 border border-error-100 px-4 py-3 text-sm text-error-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="e.g., GDPR, HIPAA, SOC 2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field min-h-[80px] resize-y"
              placeholder="Brief description of the framework"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                <option>General</option>
                <option>Privacy</option>
                <option>Security</option>
                <option>Financial</option>
                <option>Healthcare</option>
                <option>Environmental</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jurisdiction</label>
              <select value={form.jurisdiction} onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })} className="input-field">
                <option>Global</option>
                <option>EU</option>
                <option>US</option>
                <option>UK</option>
                <option>APAC</option>
                <option>Canada</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Framework'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
