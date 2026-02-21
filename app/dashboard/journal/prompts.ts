'use server';

import OpenAI from 'openai';
import { createClient } from '@/src/lib/supabase/server';
import { requireRole } from '@/src/lib/requireRole';
import { checkRateLimit } from '@/src/lib/rateLimit';
import { getActiveFamilyId } from '@/src/lib/family';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PromptContext {
  location?: string;
  date?: string;
  members?: string[];
  bulletPoints?: string;
}

export async function generateJournalPrompts(context: PromptContext) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { activeFamilyId } = await getActiveFamilyId(supabase);
  if (!activeFamilyId) {
    return {
      success: false,
      error: 'No active family found'
    };
  }

  // Check role permission
  await requireRole(supabase, user.id, ['owner', 'adult', 'teen']);

  // Check rate limit
  const canProceed = await checkRateLimit(activeFamilyId, 'journal_prompt');
  if (!canProceed) {
    return {
      success: false,
      error: 'Daily AI limit reached (10 per day). Try again tomorrow!'
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a family journal writing assistant. Generate 3 opening sentences for a family journal entry. Make them:
- Personal and warm
- Specific to the context provided
- Varied in style (descriptive, reflective, narrative)
- 15-25 words each

Return only the 3 sentences, separated by newlines. No numbering, no explanations.`,
        },
        {
          role: 'user',
          content: `Context:
Location: ${context.location || 'not specified'}
Date: ${context.date || 'not specified'}
Family members: ${context.members?.join(', ') || 'not specified'}
Notes: ${context.bulletPoints || 'none'}

Generate 3 opening sentences for this family memory.`,
        },
      ],
      temperature: 0.8, // Higher creativity for varied suggestions
      max_tokens: 200,
    });

    const prompts = completion.choices[0].message.content
      ?.split('\n')
      .filter((line) => line.trim().length > 0)
      .slice(0, 3) || [];

    // prompts generated successfully

    return {
      success: true,
      prompts,
    };

  } catch (error: any) {
    console.error('Writing prompts error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate prompts',
    };
  }
}
