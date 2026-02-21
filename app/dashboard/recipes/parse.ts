'use server';

import OpenAI from 'openai';
import { createClient } from '@/src/lib/supabase/server';
import { requireRole } from '@/src/lib/requireRole';
import { checkRateLimit } from '@/src/lib/rateLimit';
import { getActiveFamilyId } from '@/src/lib/family';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseRecipeUrl(url: string) {
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
  const canProceed = await checkRateLimit(activeFamilyId, 'parse_recipe');
  if (!canProceed) {
    return {
      success: false,
      error: 'Daily AI limit reached (10 per day). Try again tomorrow!'
    };
  }

  try {
    // 1. Fetch the recipe webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OurFamilyNest/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recipe URL');
    }

    const html = await response.text();

    // 2. Use GPT-4o-mini to extract recipe data
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a recipe parser. Extract recipe data from HTML and return valid JSON with this exact structure:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "servings": "4 servings",
  "prepTime": "15 minutes",
  "cookTime": "30 minutes"
}

Only return the JSON, no explanation.`,
        },
        {
          role: 'user',
          content: `Extract recipe from this HTML:\n\n${html.slice(0, 8000)}`, // Limit to 8k chars
        },
      ],
      temperature: 0.1, // Low temperature for consistent parsing
      max_tokens: 1500,
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');

    // recipe parsed successfully

    return {
      success: true,
      recipe: {
        title: parsed.title || 'Untitled Recipe',
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
        servings: parsed.servings || '',
        prepTime: parsed.prepTime || '',
        cookTime: parsed.cookTime || '',
      },
    };

  } catch (error: any) {
    console.error('Recipe parsing error:', error);
    return {
      success: false,
      error: error.message || 'Failed to parse recipe',
    };
  }
}
