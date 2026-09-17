import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export type Framework = {
  id: string
  name: string
  description: string | null
  category: string
  jurisdiction: string
  status: 'active' | 'archived'
  user_id: string
  created_at: string
}

export type ComplianceTask = {
  id: string
  framework_id: string | null
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high' | 'critical'
  due_date: string | null
  assigned_to: string | null
  completion_percentage: number
  user_id: string
  created_at: string
  updated_at: string
}

export type RiskAssessment = {
  id: string
  title: string
  description: string | null
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  likelihood: number
  impact: number
  mitigation_plan: string | null
  status: 'identified' | 'assessed' | 'mitigated' | 'accepted'
  user_id: string
  created_at: string
  updated_at: string
}

export type AuditLog = {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  description: string | null
  user_id: string
  created_at: string
}

export type Document = {
  id: string
  title: string
  type: 'policy' | 'report' | 'evidence' | 'certificate' | 'other'
  description: string | null
  status: 'draft' | 'under_review' | 'approved' | 'expired'
  file_url: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export type FrameworkWithTaskCount = Framework & {
  task_count?: number
  completed_count?: number
}
