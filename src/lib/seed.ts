import { supabase } from './supabase'
import { logAudit } from './audit'

export async function seedInitialDataIfNeeded(userId: string) {
  const { data: existing } = await supabase
    .from('frameworks')
    .select('id')
    .limit(1)

  if (existing && existing.length > 0) return false

  const frameworks = [
    { name: 'GDPR', description: 'General Data Protection Regulation — EU privacy and data protection law governing how personal data is collected, processed, and stored.', category: 'Privacy', jurisdiction: 'EU', status: 'active' as const },
    { name: 'HIPAA', description: 'Health Insurance Portability and Accountability Act — US healthcare data protection standards for safeguarding medical information.', category: 'Healthcare', jurisdiction: 'US', status: 'active' as const },
    { name: 'SOC 2', description: 'Service Organization Control 2 — auditing framework for service providers handling customer data, focused on security, availability, and confidentiality.', category: 'Security', jurisdiction: 'Global', status: 'active' as const },
    { name: 'ISO 27001', description: 'International standard for information security management systems (ISMS). Provides a systematic approach to managing sensitive company information.', category: 'Security', jurisdiction: 'Global', status: 'active' as const },
    { name: 'PCI DSS', description: 'Payment Card Industry Data Security Standard — requirements for organizations that handle credit card data to reduce fraud.', category: 'Financial', jurisdiction: 'Global', status: 'active' as const },
  ]

  const createdFrameworks: { id: string; name: string }[] = []

  for (const fw of frameworks) {
    const { data, error } = await supabase
      .from('frameworks')
      .insert(fw)
      .select('id, name')
      .single()
    if (!error && data) {
      createdFrameworks.push(data)
      await logAudit('created', 'framework', data.id, `Seeded framework: ${data.name}`)
    }
  }

  if (createdFrameworks.length === 0) return false

  const gdprId = createdFrameworks.find((f) => f.name === 'GDPR')?.id
  const hipaaId = createdFrameworks.find((f) => f.name === 'HIPAA')?.id
  const soc2Id = createdFrameworks.find((f) => f.name === 'SOC 2')?.id
  const isoId = createdFrameworks.find((f) => f.name === 'ISO 27001')?.id
  const pciId = createdFrameworks.find((f) => f.name === 'PCI DSS')?.id

  type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'
  type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

  const tasks: Array<{
    framework_id: string | undefined
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    due_date: string
    assigned_to: string
    completion_percentage: number
  }> = [
    { framework_id: gdprId, title: 'Conduct GDPR data mapping audit', description: 'Map all personal data flows across systems and identify processing activities.', status: 'in_progress', priority: 'high', due_date: getFutureDate(14), assigned_to: 'Legal Team', completion_percentage: 45 },
    { framework_id: gdprId, title: 'Update privacy policy for website', description: 'Revise privacy policy to reflect current data collection and processing practices.', status: 'completed', priority: 'medium', due_date: getPastDate(7), assigned_to: 'Marketing', completion_percentage: 100 },
    { framework_id: gdprId, title: 'Implement right to erasure process', description: 'Build and document the process for handling user data deletion requests within 30 days.', status: 'pending', priority: 'critical', due_date: getFutureDate(30), assigned_to: 'Engineering', completion_percentage: 0 },
    { framework_id: gdprId, title: 'Appoint a Data Protection Officer (DPO)', description: 'Designate a DPO and document their responsibilities per Article 37 of GDPR.', status: 'completed', priority: 'high', due_date: getPastDate(30), assigned_to: 'HR', completion_percentage: 100 },
    { framework_id: hipaaId, title: 'Complete HIPAA security risk assessment', description: 'Conduct annual risk assessment of ePHI systems and document findings.', status: 'in_progress', priority: 'critical', due_date: getFutureDate(10), assigned_to: 'Security Team', completion_percentage: 60 },
    { framework_id: hipaaId, title: 'Train staff on HIPAA privacy rules', description: 'Deliver mandatory HIPAA training to all workforce members handling PHI.', status: 'pending', priority: 'high', due_date: getFutureDate(21), assigned_to: 'HR', completion_percentage: 0 },
    { framework_id: hipaaId, title: 'Review Business Associate Agreements (BAAs)', description: 'Ensure all third-party vendors with PHI access have signed BAAs.', status: 'completed', priority: 'medium', due_date: getPastDate(14), assigned_to: 'Legal Team', completion_percentage: 100 },
    { framework_id: soc2Id, title: 'Implement access control monitoring', description: 'Set up logging and monitoring for all access to sensitive customer data systems.', status: 'in_progress', priority: 'high', due_date: getFutureDate(7), assigned_to: 'Engineering', completion_percentage: 70 },
    { framework_id: soc2Id, title: 'Document incident response procedures', description: 'Create and test incident response runbooks for security events.', status: 'pending', priority: 'high', due_date: getFutureDate(45), assigned_to: 'Security Team', completion_percentage: 15 },
    { framework_id: soc2Id, title: 'Conduct SOC 2 Type II audit preparation', description: 'Gather evidence and prepare for external SOC 2 Type II audit.', status: 'overdue', priority: 'critical', due_date: getPastDate(5), assigned_to: 'Compliance Team', completion_percentage: 80 },
    { framework_id: isoId, title: 'Establish ISMS scope document', description: 'Define the scope of the Information Security Management System per ISO 27001 requirements.', status: 'completed', priority: 'medium', due_date: getPastDate(20), assigned_to: 'Security Team', completion_percentage: 100 },
    { framework_id: isoId, title: 'Conduct internal ISMS audit', description: 'Perform internal audit of ISMS implementation and identify gaps.', status: 'pending', priority: 'medium', due_date: getFutureDate(60), assigned_to: 'Compliance Team', completion_percentage: 0 },
    { framework_id: pciId, title: 'Segment cardholder data network', description: 'Isolate the cardholder data environment from the corporate network.', status: 'in_progress', priority: 'critical', due_date: getFutureDate(12), assigned_to: 'Engineering', completion_percentage: 50 },
    { framework_id: pciId, title: 'Implement quarterly vulnerability scans', description: 'Set up automated quarterly vulnerability scanning of all in-scope systems.', status: 'completed', priority: 'high', due_date: getPastDate(3), assigned_to: 'Security Team', completion_percentage: 100 },
  ]

  for (const task of tasks) {
    const { data, error } = await supabase.from('compliance_tasks').insert(task).select('id, title').single()
    if (!error && data) {
      await logAudit('created', 'task', data.id, `Seeded task: ${data.title}`)
    }
  }

  type RiskStatus = 'identified' | 'assessed' | 'mitigated' | 'accepted'

  const risks: Array<{
    title: string
    description: string
    likelihood: number
    impact: number
    mitigation_plan: string
    status: RiskStatus
  }> = [
    { title: 'Unencrypted data at rest in cloud storage', description: 'Several cloud storage buckets containing PII were found without encryption enabled.', likelihood: 4, impact: 5, mitigation_plan: 'Enable server-side encryption on all cloud storage buckets. Migrate existing data with zero-downtime encryption rollout.', status: 'mitigated' },
    { title: 'Insufficient access logging on production databases', description: 'Production database access is not being logged, making it difficult to audit who accessed sensitive data.', likelihood: 3, impact: 4, mitigation_plan: 'Deploy database activity monitoring tool and enable query logging for all production databases.', status: 'assessed' },
    { title: 'Lack of multi-factor authentication for admin accounts', description: 'Administrator accounts only use password authentication without MFA, increasing risk of credential compromise.', likelihood: 3, impact: 5, mitigation_plan: 'Enforce MFA for all admin and privileged accounts using authenticator app or hardware key.', status: 'mitigated' },
    { title: 'Outdated encryption protocols in legacy systems', description: 'Legacy internal applications still use TLS 1.0 which has known vulnerabilities.', likelihood: 2, impact: 4, mitigation_plan: 'Upgrade all legacy systems to TLS 1.2+. Decommission systems that cannot be upgraded.', status: 'identified' },
    { title: 'Third-party vendor data sharing without DPA', description: 'Two vendors processing EU personal data do not have signed Data Processing Agreements in place.', likelihood: 4, impact: 3, mitigation_plan: 'Pause data sharing with non-compliant vendors. Execute DPAs before resuming data flows.', status: 'assessed' },
    { title: 'No formal data retention policy enforcement', description: 'Personal data is retained indefinitely with no automated deletion process.', likelihood: 3, impact: 3, mitigation_plan: 'Define retention periods per data category. Implement automated deletion based on retention schedule.', status: 'identified' },
  ]

  for (const risk of risks) {
    const score = risk.likelihood * risk.impact
    const riskLevel = score >= 20 ? 'critical' : score >= 12 ? 'high' : score >= 6 ? 'medium' : 'low'
    const { data, error } = await supabase
      .from('risk_assessments')
      .insert({ ...risk, risk_level: riskLevel as 'low' | 'medium' | 'high' | 'critical' })
      .select('id, title')
      .single()
    if (!error && data) {
      await logAudit('created', 'risk', data.id, `Seeded risk: ${data.title}`)
    }
  }

  type DocType = 'policy' | 'report' | 'evidence' | 'certificate' | 'other'
  type DocStatus = 'draft' | 'under_review' | 'approved' | 'expired'

  const documents: Array<{
    title: string
    type: DocType
    description: string
    status: DocStatus
    file_url: string
  }> = [
    { title: 'Data Protection Policy v3.2', type: 'policy', description: 'Comprehensive data protection policy covering collection, processing, retention, and deletion of personal data.', status: 'approved', file_url: '' },
    { title: 'Information Security Policy', type: 'policy', description: 'Core information security policy governing access control, encryption, and incident response.', status: 'approved', file_url: '' },
    { title: 'SOC 2 Audit Report 2025', type: 'report', description: 'Type II SOC 2 audit report covering the period January 2025 to June 2025.', status: 'approved', file_url: '' },
    { title: 'GDPR Compliance Assessment', type: 'report', description: 'Internal GDPR compliance assessment with gap analysis and remediation recommendations.', status: 'under_review', file_url: '' },
    { title: 'HIPAA Risk Assessment 2025', type: 'report', description: 'Annual HIPAA security risk assessment documenting threats, vulnerabilities, and risk scores.', status: 'approved', file_url: '' },
    { title: 'ISO 27001 Certificate', type: 'certificate', description: 'ISO 27001:2022 certification certificate valid through December 2026.', status: 'approved', file_url: '' },
    { title: 'PCI DSS Attestation of Compliance', type: 'certificate', description: 'AOC confirming PCI DSS v4.0 compliance for the cardholder data environment.', status: 'approved', file_url: '' },
    { title: 'Employee Security Training Records', type: 'evidence', description: 'Records of completed security awareness training for all employees in 2025.', status: 'approved', file_url: '' },
    { title: 'Incident Response Plan Draft', type: 'policy', description: 'Updated incident response plan with escalation procedures and communication templates.', status: 'draft', file_url: '' },
    { title: 'Vendor Security Assessment Template', type: 'policy', description: 'Standardized questionnaire for assessing third-party vendor security posture.', status: 'draft', file_url: '' },
  ]

  for (const doc of documents) {
    const { data, error } = await supabase
      .from('documents')
      .insert(doc)
      .select('id, title')
      .single()
    if (!error && data) {
      await logAudit('created', 'document', data.id, `Seeded document: ${data.title}`)
    }
  }

  await logAudit('seeded', 'system', null, 'Initial compliance data seeded for new account')

  return true
}

function getFutureDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function getPastDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}
