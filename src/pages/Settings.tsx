import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import { User, Mail, Shield, Bell, Database, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader title="Settings" description="Manage your account and application preferences" />

      <div className="space-y-6">
        {/* Account */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Account</h3>
              <p className="text-sm text-gray-500">Your account information</p>
            </div>
          </div>
          <div className="space-y-3 ml-1">
            <div className="flex items-center gap-3 py-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500 w-20">Email</span>
              <span className="text-sm font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 py-2">
              <Shield className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500 w-20">Role</span>
              <span className="text-sm font-medium text-gray-900">Compliance Officer</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50">
              <Bell className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-500">Compliance alert preferences</p>
            </div>
          </div>
          <div className="space-y-3 ml-1">
            {[
              { label: 'Overdue task alerts', desc: 'Get notified when tasks are overdue', on: true },
              { label: 'High risk warnings', desc: 'Alerts for new high-risk items', on: true },
              { label: 'Document expiry reminders', desc: 'Reminders before certificates expire', on: false },
              { label: 'Weekly summary report', desc: 'Email digest of compliance activity', on: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <button
                  className={`relative h-6 w-11 rounded-full transition-colors ${item.on ? 'bg-primary-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${item.on ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Data */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <Database className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Data & Storage</h3>
              <p className="text-sm text-gray-500">Your compliance data is stored securely</p>
            </div>
          </div>
          <div className="ml-1 space-y-2">
            <p className="text-sm text-gray-500">All data is encrypted at rest and in transit. Your compliance data is private to your account and protected by row-level security policies.</p>
          </div>
        </div>

        {/* Sign out */}
        <div className="card p-6 border-error-200">
          <button onClick={handleSignOut} className="flex items-center gap-3 text-error-600 hover:text-error-700 transition-colors">
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-semibold">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
