import { supabase } from './supabase'

export async function logAudit(
  action: string,
  entityType: string,
  entityId: string | null,
  description: string
) {
  await supabase.from('audit_logs').insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    description,
  })
}
