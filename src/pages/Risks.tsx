import { useEffect, useState, type FormEvent } from 'react'
import { supabase, type RiskAssessment } from '../lib/supabase'
import { logAudit } from '../lib/audit'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { TriangleAlert as AlertTriangle, Plus, Trash2, CreditCard as Edit3, Search, TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'

const riskScoreColor = (score: number) => {
  if (score >= 20) return 'bg-error-500 text-white'
  if (score >= 12) return 'bg-orange-500 text-white'
  if (score >= 6) return 'bg-yellow-500 text-white'
  return 'bg-success-500 text-white'
}

const riskLevelFromScore = (likelihood: number, impact: number): RiskAssessment['risk_level'] => {
  const score = likelihood * impact
  if (score >= 20) return 'critical'
  if (score >= 12) return 'high'
  if (score >= 6) return 'medium'
  return 'low'
}

export default function Risks() {
  const [risks, setRisks] = useState<RiskAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RiskAssessment | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    likelihood: 3,
    impact: 3,
    mitigation_plan: '',
    status: 'identified' as RiskAssessment['status'],
  })

  async function loadRisks() {
    setLoading(true)
    const { data } = await supabase.from('risk_assessments').select('*').order('created_at', { ascending: false })
    setRisks(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadRisks() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', description: '', likelihood: 3, impact: 3, mitigation_plan: '', status: 'identified' })
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (risk: RiskAssessment) => {
    setEditing(risk)
    setForm({ title: risk.title, description: risk.description ?? '', likelihood: risk.likelihood, impact: risk.impact, mitigation_plan: risk.mitigation_plan ?? '', status: risk.status })
    setError(null)
    setModalOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    if (!form.title.trim()) { setError('Title is required'); setSaving(false); return }
    const riskLevel = riskLevelFromScore(form.likelihood, form.impact)
    const payload = {
      title: form.title,
      description: form.description,
      likelihood: form.likelihood,
      impact: form.impact,
      risk_level: riskLevel,
      mitigation_plan: form.mitigation_plan,
      status: form.status,
    }
    if (editing) {
      const { error } = await supabase.from('risk_assessments').update(payload).eq('id', editing.id)
      if (error) { setError(error.message); setSaving(false); return }
      await logAudit('updated', 'risk', editing.id, `Updated risk: ${form.title}`)
    } else {
      const { data, error } = await supabase.from('risk_assessments').insert(payload).select().single()
      if (error) { setError(error.message); setSaving(false); return }
      await logAudit('created', 'risk', data.id, `Created risk: ${form.title}`)
    }
    setSaving(false)
    setModalOpen(false)
    loadRisks()
  }

  const handleDelete = async (risk: RiskAssessment) => {
    if (!confirm(`Delete "${risk.title}"?`)) return
    await supabase.from('risk_assessments').delete().eq('id', risk.id)
    await logAudit('deleted', 'risk', risk.id, `Deleted risk: ${risk.title}`)
    loadRisks()
  }

  const filtered = risks.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) || (r.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  const avgScore = risks.length > 0 ? Math.round((risks.reduce((sum, r) => sum + r.likelihood * r.impact, 0) / risks.length) * 10) / 10 : 0
  const mitigatedCount = risks.filter((r) => r.status === 'mitigated').length

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Risk Assessments"
        description="Identify, assess, and mitigate compliance risks"
        action={<button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add Risk</button>}
      />

      {/* Summary cards */}
      {risks.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-sm text-gray-500">Total Risks</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{risks.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Avg Risk Score</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{avgScore}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Mitigated</p>
            <p className="text-2xl font-bold text-success-600 mt-1">{mitigatedCount}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500">Critical/High</p>
            <p className="text-2xl font-bold text-error-600 mt-1">{risks.filter((r) => r.risk_level === 'critical' || r.risk_level === 'high').length}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" placeholder="Search risks..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-11" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={AlertTriangle}
            title="No risk assessments yet"
            description="Identify your first compliance risk to start building your risk register."
            action={<button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add Risk</button>}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((risk) => {
            const score = risk.likelihood * risk.impact
            return (
              <div key={risk.id} className="card p-5 group animate-slide-up">
                <div className="flex items-start gap-4">
                  {/* Risk score */}
                  <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl ${riskScoreColor(score)} flex-shrink-0`}>
                    <span className="text-lg font-bold leading-none">{score}</span>
                    <span className="text-[10px] opacity-90 mt-0.5">score</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900">{risk.title}</h3>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={risk.risk_level} />
                        <StatusBadge status={risk.status} />
                      </div>
                    </div>
                    {risk.description && <p className="text-sm text-gray-500 mt-1">{risk.description}</p>}

                    {/* L/I indicators */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">Likelihood:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} className={`h-1.5 w-4 rounded-sm ${n <= risk.likelihood ? 'bg-primary-500' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">Impact:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} className={`h-1.5 w-4 rounded-sm ${n <= risk.impact ? 'bg-error-500' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {risk.mitigation_plan && (
                      <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-1">Mitigation Plan</p>
                        <p className="text-sm text-gray-700">{risk.mitigation_plan}</p>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-2">Created {format(new Date(risk.created_at), 'MMM d, yyyy')}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => openEdit(risk)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(risk)} className="p-2 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Risk' : 'Add Risk'} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-error-50 border border-error-100 px-4 py-3 text-sm text-error-700">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g., Data breach exposure" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field min-h-[70px] resize-y" placeholder="Risk description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Likelihood (1-5): {form.likelihood}</label>
              <input type="range" min="1" max="5" value={form.likelihood} onChange={(e) => setForm({ ...form, likelihood: parseInt(e.target.value) })} className="w-full accent-primary-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Rare</span><span>Almost Certain</span></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Impact (1-5): {form.impact}</label>
              <input type="range" min="1" max="5" value={form.impact} onChange={(e) => setForm({ ...form, impact: parseInt(e.target.value) })} className="w-full accent-error-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Minimal</span><span>Catastrophic</span></div>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-600">Risk Score: <strong>{form.likelihood * form.impact}</strong> — Level: <StatusBadge status={riskLevelFromScore(form.likelihood, form.impact)} /></span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mitigation Plan</label>
            <textarea value={form.mitigation_plan} onChange={(e) => setForm({ ...form, mitigation_plan: e.target.value })} className="input-field min-h-[70px] resize-y" placeholder="Steps to mitigate this risk" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RiskAssessment['status'] })} className="input-field">
              <option value="identified">Identified</option>
              <option value="assessed">Assessed</option>
              <option value="mitigated">Mitigated</option>
              <option value="accepted">Accepted</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Risk'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
