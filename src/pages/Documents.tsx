import { useEffect, useState, type FormEvent } from 'react'
import { supabase, type Document } from '../lib/supabase'
import { logAudit } from '../lib/audit'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { FileText, Plus, Trash2, CreditCard as Edit3, Search, FileCheck, FileBadge, FileSearch, File } from 'lucide-react'
import { format } from 'date-fns'

const docTypeIcons: Record<string, typeof FileText> = {
  policy: FileText,
  report: FileCheck,
  evidence: FileSearch,
  certificate: FileBadge,
  other: File,
}

export default function Documents() {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Document | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    type: 'policy' as Document['type'],
    description: '',
    status: 'draft' as Document['status'],
    file_url: '',
  })

  async function loadDocs() {
    setLoading(true)
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
    setDocs(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadDocs() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', type: 'policy', description: '', status: 'draft', file_url: '' })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (doc: Document) => {
    setEditing(doc)
    setForm({ title: doc.title, type: doc.type, description: doc.description ?? '', status: doc.status, file_url: doc.file_url ?? '' })
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
      type: form.type,
      description: form.description,
      status: form.status,
      file_url: form.file_url || null,
    }
    if (editing) {
      const { error } = await supabase.from('documents').update(payload).eq('id', editing.id)
      if (error) { setError(error.message); setSaving(false); return }
      await logAudit('updated', 'document', editing.id, `Updated document: ${form.title}`)
    } else {
      const { data, error } = await supabase.from('documents').insert(payload).select().single()
      if (error) { setError(error.message); setSaving(false); return }
      await logAudit('created', 'document', data.id, `Created document: ${form.title}`)
    }
    setSaving(false)
    setModalOpen(false)
    loadDocs()
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.title}"?`)) return
    await supabase.from('documents').delete().eq('id', doc.id)
    await logAudit('deleted', 'document', doc.id, `Deleted document: ${doc.title}`)
    loadDocs()
  }

  const filtered = docs.filter((d) => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) || (d.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchType = typeFilter === 'all' || d.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Documents"
        description="Manage compliance policies, reports, certificates, and evidence"
        action={<button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add Document</button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-11" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field max-w-[180px]">
          <option value="all">All Types</option>
          <option value="policy">Policy</option>
          <option value="report">Report</option>
          <option value="evidence">Evidence</option>
          <option value="certificate">Certificate</option>
          <option value="other">Other</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Add your compliance policies, audit reports, certificates, and evidence documents."
            action={<button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add Document</button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const Icon = docTypeIcons[doc.type] ?? FileText
            return (
              <div key={doc.id} className="card p-5 group animate-slide-up">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{doc.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{doc.description || 'No description'}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge bg-gray-100 text-gray-600 capitalize">{doc.type}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">{format(new Date(doc.created_at), 'MMM d, yyyy')}</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:text-primary-700">View</a>
                    )}
                    <button onClick={() => openEdit(doc)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(doc)} className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Document' : 'Add Document'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-error-50 border border-error-100 px-4 py-3 text-sm text-error-700">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g., Data Protection Policy v2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field min-h-[70px] resize-y" placeholder="Document description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Document['type'] })} className="input-field">
                <option value="policy">Policy</option>
                <option value="report">Report</option>
                <option value="evidence">Evidence</option>
                <option value="certificate">Certificate</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Document['status'] })} className="input-field">
                <option value="draft">Draft</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">File URL (optional)</label>
            <input type="text" value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} className="input-field" placeholder="https://..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Document'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
