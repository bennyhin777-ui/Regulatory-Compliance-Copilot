import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, type Framework, type ComplianceTask, type RiskAssessment, type AuditLog } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { Shield, SquareCheck as CheckSquare, TriangleAlert as AlertTriangle, FileText, TrendingUp, Clock, ArrowUpRight, Activity } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { format, formatDistanceToNow } from 'date-fns'

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [tasks, setTasks] = useState<ComplianceTask[]>([])
  const [risks, setRisks] = useState<RiskAssessment[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])

  useEffect(() => {
    async function loadData() {
      const [fw, tk, rk, lg] = await Promise.all([
        supabase.from('frameworks').select('*').order('created_at', { ascending: false }),
        supabase.from('compliance_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('risk_assessments').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10),
      ])
      setFrameworks(fw.data ?? [])
      setTasks(tk.data ?? [])
      setRisks(rk.data ?? [])
      setLogs(lg.data ?? [])
      setLoading(false)
    }
    loadData()
  }, [])

  const activeFrameworks = frameworks.filter((f) => f.status === 'active').length
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length
  const overdueTasks = tasks.filter((t) => t.status === 'overdue').length
  const highRisks = risks.filter((r) => r.risk_level === 'high' || r.risk_level === 'critical').length
  const complianceScore = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  const taskStatusData = [
    { name: 'Completed', value: completedTasks, color: '#22c55e' },
    { name: 'In Progress', value: tasks.filter((t) => t.status === 'in_progress').length, color: '#3b82f6' },
    { name: 'Pending', value: tasks.filter((t) => t.status === 'pending').length, color: '#9ca3af' },
    { name: 'Overdue', value: overdueTasks, color: '#ef4444' },
  ].filter((d) => d.value > 0)

  const riskLevelData = [
    { name: 'Low', count: risks.filter((r) => r.risk_level === 'low').length },
    { name: 'Medium', count: risks.filter((r) => r.risk_level === 'medium').length },
    { name: 'High', count: risks.filter((r) => r.risk_level === 'high').length },
    { name: 'Critical', count: risks.filter((r) => r.risk_level === 'critical').length },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  const stats = [
    {
      label: 'Active Frameworks',
      value: activeFrameworks,
      icon: Shield,
      color: 'bg-primary-50 text-primary-600',
      link: '/frameworks',
    },
    {
      label: 'Total Tasks',
      value: tasks.length,
      sublabel: `${completedTasks} completed`,
      icon: CheckSquare,
      color: 'bg-accent-50 text-accent-600',
      link: '/tasks',
    },
    {
      label: 'High Risks',
      value: highRisks,
      sublabel: `${risks.length} total risks`,
      icon: AlertTriangle,
      color: 'bg-warning-50 text-warning-600',
      link: '/risks',
    },
    {
      label: 'Compliance Score',
      value: `${complianceScore}%`,
      icon: TrendingUp,
      color: 'bg-success-50 text-success-600',
      link: '/tasks',
    },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        description={`Welcome back${user?.email ? `, ${user.email}` : ''}`}
      />

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="card p-5 group animate-slide-up"
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            {stat.sublabel && <p className="text-xs text-gray-400 mt-1">{stat.sublabel}</p>}
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Task distribution pie */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Task Status Distribution</h3>
          <p className="text-sm text-gray-500 mb-4">Overview of compliance task progress</p>
          {taskStatusData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {taskStatusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No tasks yet
            </div>
          )}
        </div>

        {/* Risk level bar chart */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Risk Assessment Levels</h3>
          <p className="text-sm text-gray-500 mb-4">Distribution of identified risks by severity</p>
          {risks.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskLevelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskLevelData.map((entry, index) => {
                    const colors = ['#22c55e', '#f59e0b', '#f97316', '#ef4444']
                    return <Cell key={`bar-${index}`} fill={colors[index]} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No risk assessments yet
            </div>
          )}
        </div>
      </div>

      {/* Upcoming tasks + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming/overdue tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Priority Tasks</h3>
              <p className="text-sm text-gray-500">Tasks needing attention</p>
            </div>
            <Link to="/tasks" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks
                .filter((t) => t.status !== 'completed')
                .sort((a, b) => {
                  const order = { critical: 0, high: 1, medium: 2, low: 3 }
                  return order[a.priority] - order[b.priority]
                })
                .slice(0, 5)
                .map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`flex h-2 w-2 rounded-full flex-shrink-0 ${
                      task.priority === 'critical' ? 'bg-error-500' :
                      task.priority === 'high' ? 'bg-orange-500' :
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={task.status} />
                        {task.due_date && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            {format(new Date(task.due_date), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">No tasks yet</div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-500">Latest compliance actions</p>
            </div>
            <Link to="/audit" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          {logs.length > 0 ? (
            <div className="space-y-3">
              {logs.slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 flex-shrink-0">
                    <Activity className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{log.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">No activity yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
