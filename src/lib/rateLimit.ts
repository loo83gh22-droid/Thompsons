import { createClient } from '@/src/lib/supabase/server';

const DAILY_LIMIT = 10; // AI calls per family per day

export async function checkRateLimit(familyId: string, action: string): Promise<boolean> {
  const supabase = await createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Count AI calls today
  const { count } = await supabase
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('family_id', familyId)
    .gte('created_at', startOfDay.toISOString());

  if ((count || 0) >= DAILY_LIMIT) {
    return false; // Rate limit exceeded
  }

  // Log this usage
  await supabase
    .from('ai_usage_log')
    .insert({
      family_id: familyId,
      action, // 'transcribe', 'parse_recipe', 'journal_prompt'
    });

  return true; // Within limit
}
