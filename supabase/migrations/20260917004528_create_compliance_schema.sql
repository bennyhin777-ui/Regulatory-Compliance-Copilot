/*
# Create Regulatory Compliance Copilot Schema

## Overview
This migration creates the complete database schema for the Regulatory Compliance Copilot,
a multi-user application where organizations can manage their compliance frameworks,
track compliance tasks, conduct risk assessments, maintain audit trails, and manage
compliance documents/reports.

## New Tables

1. `frameworks` — Regulatory compliance frameworks (e.g., GDPR, HIPAA, SOC 2, ISO 27001)
   - id (uuid, PK)
   - name (text, not null)
   - description (text)
   - category (text) — e.g., "Privacy", "Security", "Financial"
   - jurisdiction (text) — e.g., "EU", "US", "Global"
   - status (text) — 'active' | 'archived'
   - user_id (uuid, FK to auth.users, owner)
   - created_at (timestamptz)

2. `compliance_tasks` — Individual compliance requirements/checklist items
   - id (uuid, PK)
   - framework_id (uuid, FK to frameworks)
   - title (text, not null)
   - description (text)
   - status (text) — 'pending' | 'in_progress' | 'completed' | 'overdue'
   - priority (text) — 'low' | 'medium' | 'high' | 'critical'
   - due_date (date)
   - assigned_to (text)
   - completion_percentage (integer, default 0)
   - user_id (uuid, FK to auth.users, owner)
   - created_at (timestamptz)
   - updated_at (timestamptz)

3. `risk_assessments` — Risk assessment records
   - id (uuid, PK)
   - title (text, not null)
   - description (text)
   - risk_level (text) — 'low' | 'medium' | 'high' | 'critical'
   - likelihood (integer, 1-5)
   - impact (integer, 1-5)
   - mitigation_plan (text)
   - status (text) — 'identified' | 'assessed' | 'mitigated' | 'accepted'
   - user_id (uuid, FK to auth.users, owner)
   - created_at (timestamptz)
   - updated_at (timestamptz)

4. `audit_logs` — Audit trail entries for compliance activities
   - id (uuid, PK)
   - action (text) — e.g., "created", "updated", "deleted", "completed"
   - entity_type (text) — e.g., "task", "framework", "risk"
   - entity_id (uuid)
   - description (text)
   - user_id (uuid, FK to auth.users, owner)
   - created_at (timestamptz)

5. `documents` — Compliance documents and reports
   - id (uuid, PK)
   - title (text, not null)
   - type (text) — 'policy' | 'report' | 'evidence' | 'certificate' | 'other'
   - description (text)
   - status (text) — 'draft' | 'under_review' | 'approved' | 'expired'
   - file_url (text)
   - user_id (uuid, FK to auth.users, owner)
   - created_at (timestamptz)
   - updated_at (timestamptz)

## Security
- RLS enabled on ALL tables.
- All tables are owner-scoped: each authenticated user can only access rows they own.
- Owner columns default to auth.uid() so inserts work even when the client omits user_id.
- Four separate policies (SELECT, INSERT, UPDATE, DELETE) per table, scoped TO authenticated.
- Cascade deletes: deleting a framework deletes its tasks; deleting a user deletes all their data.
*/

-- Frameworks table
CREATE TABLE IF NOT EXISTS frameworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text DEFAULT 'General',
  jurisdiction text DEFAULT 'Global',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_frameworks" ON frameworks;
CREATE POLICY "select_own_frameworks" ON frameworks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_frameworks" ON frameworks;
CREATE POLICY "insert_own_frameworks" ON frameworks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_frameworks" ON frameworks;
CREATE POLICY "update_own_frameworks" ON frameworks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_frameworks" ON frameworks;
CREATE POLICY "delete_own_frameworks" ON frameworks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Compliance tasks table
CREATE TABLE IF NOT EXISTS compliance_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id uuid REFERENCES frameworks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  due_date date,
  assigned_to text,
  completion_percentage integer NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE compliance_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tasks" ON compliance_tasks;
CREATE POLICY "select_own_tasks" ON compliance_tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON compliance_tasks;
CREATE POLICY "insert_own_tasks" ON compliance_tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON compliance_tasks;
CREATE POLICY "update_own_tasks" ON compliance_tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON compliance_tasks;
CREATE POLICY "delete_own_tasks" ON compliance_tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Risk assessments table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  risk_level text NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  likelihood integer NOT NULL DEFAULT 3 CHECK (likelihood >= 1 AND likelihood <= 5),
  impact integer NOT NULL DEFAULT 3 CHECK (impact >= 1 AND impact <= 5),
  mitigation_plan text,
  status text NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'assessed', 'mitigated', 'accepted')),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_risks" ON risk_assessments;
CREATE POLICY "select_own_risks" ON risk_assessments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_risks" ON risk_assessments;
CREATE POLICY "insert_own_risks" ON risk_assessments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_risks" ON risk_assessments;
CREATE POLICY "update_own_risks" ON risk_assessments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_risks" ON risk_assessments;
CREATE POLICY "delete_own_risks" ON risk_assessments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  description text,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_audit_logs" ON audit_logs;
CREATE POLICY "select_own_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_audit_logs" ON audit_logs;
CREATE POLICY "insert_own_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_audit_logs" ON audit_logs;
CREATE POLICY "update_own_audit_logs" ON audit_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_audit_logs" ON audit_logs;
CREATE POLICY "delete_own_audit_logs" ON audit_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'policy' CHECK (type IN ('policy', 'report', 'evidence', 'certificate', 'other')),
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'expired')),
  file_url text,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_frameworks_user_id ON frameworks(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tasks_user_id ON compliance_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tasks_framework_id ON compliance_tasks(framework_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tasks_status ON compliance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_user_id ON risk_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- Trigger to auto-update updated_at on compliance_tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_compliance_tasks_updated_at ON compliance_tasks;
CREATE TRIGGER update_compliance_tasks_updated_at
  BEFORE UPDATE ON compliance_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_risk_assessments_updated_at ON risk_assessments;
CREATE TRIGGER update_risk_assessments_updated_at
  BEFORE UPDATE ON risk_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
