# Phase 4: AI Quick-Win Features - Handoff Document

**Status:** Ready for implementation
**Prerequisites:** Phase 1 complete (skills installed), OpenAI API key obtained
**Estimated Duration:** Days 9-11 (3 days)
**Primary Goal:** Implement 3 AI features that make the app sticky and differentiated

---

## Context

Family Nest has comprehensive features but lacks AI-powered enhancements that would:
- **Increase stickiness**: Voice transcription makes memos searchable forever
- **Reduce friction**: Recipe URL parsing saves 10 minutes per recipe entry
- **Encourage engagement**: Journal writing prompts eliminate blank-page anxiety

**Current state:**
- ✅ Voice memos work but have no transcripts (not searchable)
- ✅ Recipes work but require manual typing (time-consuming)
- ✅ Journals work but offer no writing help (intimidating for some users)

**AI Opportunities identified:** 12 features documented in `docs/AI_OPPORTUNITIES.md`
**Phase 4 scope:** Top 3 quick-wins with highest ROI

---

## Objectives

1. **Voice Memo Transcription** - Make voice memos searchable via Whisper API
2. **Recipe URL Parsing** - Auto-fill recipe forms from any recipe URL
3. **Journal Writing Prompts** - Suggest opening sentences based on metadata

**Expected adoption:**
- 30% of voice memos get transcribed
- 40% of new recipes use URL parsing
- 20% of new journal entries use writing prompts

**Cost target:** <$100 total AI API costs in first month

---

## AI Feature 1: Voice Memo Transcription (Whisper API)

### Goal
Automatically transcribe voice memos on upload to make them searchable and accessible.

### Implementation Tasks

#### Step 1: Install OpenAI SDK

```bash
cd C:\Users\keepi\OneDrive\Desktop\Coding\Thompsons\family-site
npm install openai
```

**Verify installation:**
```bash
npm list openai
# Should show: openai@4.x.x
```

#### Step 2: Add Environment Variables

**Add to `.env.local`:**
```
OPENAI_API_KEY=sk-proj-...
```

**Add to Vercel (Production):**
1. Go to Vercel dashboard → Project → Settings → Environment Variables
2. Add: `OPENAI_API_KEY` = `sk-proj-...`
3. Apply to: Production, Preview, Development

**Get API key:**
1. Visit https://platform.openai.com/api-keys
2. Create new secret key
3. Copy immediately (won't show again)
4. Set billing limits: $50/month soft limit, $100/month hard limit

#### Step 3: Create Database Migration

**File:** `supabase/migrations/056_add_voice_memo_transcripts.sql`

```sql
-- Add transcript columns to voice_memos table
ALTER TABLE voice_memos
ADD COLUMN transcript TEXT,
ADD COLUMN transcription_status TEXT DEFAULT 'pending'
  CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN transcribed_at TIMESTAMPTZ;

-- Add index for full-text search on transcripts
CREATE INDEX idx_voice_memos_transcript
  ON voice_memos
  USING gin(to_tsvector('english', transcript));

-- Add comment for documentation
COMMENT ON COLUMN voice_memos.transcript IS 'Auto-generated transcript from Whisper API';
COMMENT ON COLUMN voice_memos.transcription_status IS 'Status: pending, processing, completed, failed';
```

**Apply migration using Supabase MCP:**
```typescript
// Use the Supabase MCP tool:
mcp__f2bd0ecb-6aa3-4107-b078-5b1a8e20d045__apply_migration({
  project_id: "tstbngohenxrbqroejth",
  name: "056_add_voice_memo_transcripts",
  query: [paste SQL above]
})
```

**Verify migration:**
```sql
-- Check columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'voice_memos'
  AND column_name IN ('transcript', 'transcription_status', 'transcribed_at');
```

#### Step 4: Create Transcription Server Action

**File:** `app/dashboard/voice-memos/transcribe.ts` (new file)

```typescript
'use server';

import OpenAI from 'openai';
import { createClient } from '@/src/lib/supabase/server';
import { requireRole } from '@/src/lib/requireRole';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeVoiceMemo(voiceMemoId: string) {
  const supabase = await createClient();

  // Verify user has permission (owner, adult, or teen can transcribe)
  await requireRole(['owner', 'adult', 'teen'], supabase);

  try {
    // 1. Update status to processing
    await supabase
      .from('voice_memos')
      .update({ transcription_status: 'processing' })
      .eq('id', voiceMemoId);

    // 2. Get voice memo storage URL
    const { data: memo, error: memoError } = await supabase
      .from('voice_memos')
      .select('storage_url, family_id')
      .eq('id', voiceMemoId)
      .single();

    if (memoError || !memo) {
      throw new Error('Voice memo not found');
    }

    // 3. Download audio file from Supabase Storage
    const { data: audioFile, error: downloadError } = await supabase
      .storage
      .from('voice-memos') // Verify bucket name matches your setup
      .download(memo.storage_url);

    if (downloadError || !audioFile) {
      throw new Error('Failed to download audio file');
    }

    // 4. Convert Blob to File object for Whisper API
    const file = new File([audioFile], 'audio.webm', { type: 'audio/webm' });

    // 5. Call Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en', // Auto-detect if omitted; specify for better accuracy
      response_format: 'text', // Options: json, text, srt, verbose_json, vtt
    });

    // 6. Save transcript to database
    const { error: updateError } = await supabase
      .from('voice_memos')
      .update({
        transcript: transcription,
        transcription_status: 'completed',
        transcribed_at: new Date().toISOString(),
      })
      .eq('id', voiceMemoId);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Transcribed voice memo ${voiceMemoId}: ${transcription.length} chars`);

    return { success: true, transcript: transcription };

  } catch (error: any) {
    console.error('Transcription error:', error);

    // Mark as failed in database
    await supabase
      .from('voice_memos')
      .update({ transcription_status: 'failed' })
      .eq('id', voiceMemoId);

    return {
      success: false,
      error: error.message || 'Transcription failed'
    };
  }
}
```

**Important notes:**
- Whisper supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
- Max file size: 25 MB
- Cost: $0.006 per minute of audio
- Processing time: ~10-30 seconds per minute of audio

#### Step 5: Trigger Transcription on Upload

**File:** `app/dashboard/voice-memos/actions.ts`

Find the `insertVoiceMemo` or upload action and add:

```typescript
// After successful voice memo upload
const { data: newMemo, error } = await supabase
  .from('voice_memos')
  .insert({ /* memo data */ })
  .select()
  .single();

if (newMemo && !error) {
  // Trigger transcription asynchronously (don't block UI)
  transcribeVoiceMemo(newMemo.id).catch((err) => {
    console.error('Background transcription failed:', err);
    // Don't throw - let user continue even if transcription fails
  });
}
```

#### Step 6: Update UI to Display Transcripts

**File:** `app/dashboard/voice-memos/page.tsx`

Add transcript display below audio player:

```tsx
{/* Show transcript if available */}
{memo.transcript && (
  <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
    <div className="flex justify-between items-center mb-2">
      <h4 className="font-medium text-sm">Transcript</h4>
      <button
        onClick={() => {
          navigator.clipboard.writeText(memo.transcript);
          // Optional: show toast "Copied to clipboard"
        }}
        className="text-sm text-primary hover:underline"
      >
        Copy
      </button>
    </div>
    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
      {memo.transcript}
    </p>
    <p className="text-xs text-muted-foreground mt-2">
      Transcribed on {new Date(memo.transcribed_at).toLocaleDateString()}
    </p>
  </div>
)}

{/* Show loading state */}
{memo.transcription_status === 'processing' && (
  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
    <span className="animate-spin">⏳</span> Transcribing audio...
  </p>
)}

{/* Show error state */}
{memo.transcription_status === 'failed' && (
  <p className="text-sm text-destructive mt-2">
    Transcription failed. You can still listen to the recording.
  </p>
)}
```

#### Step 7: Add to Global Search

**File:** `app/api/search/route.ts`

Update search query to include voice memo transcripts:

```sql
-- Add this UNION to existing search query
UNION ALL
SELECT
  'voice_memo' as type,
  id,
  title,
  transcript as content,
  created_at,
  family_id
FROM voice_memos
WHERE family_id = $1
  AND transcript IS NOT NULL
  AND to_tsvector('english', title || ' ' || transcript)
      @@ plainto_tsquery('english', $2)
ORDER BY created_at DESC
LIMIT 20;
```

### Verification Checklist

- [ ] OpenAI SDK installed (`npm list openai`)
- [ ] Environment variables set (local + Vercel)
- [ ] Migration applied (check voice_memos table columns)
- [ ] Upload test voice memo (30-60 sec)
- [ ] Wait 10-30 seconds, refresh page
- [ ] Transcript appears below audio player
- [ ] "Copy" button works
- [ ] Global search finds voice memo by transcript content
- [ ] Test with 5+ minute audio (should still work)
- [ ] Test with corrupted file (should show "failed" status gracefully)
- [ ] Check OpenAI usage dashboard (verify cost ~$0.006/min)

---

## AI Feature 2: Recipe URL Parsing (GPT-4o-mini)

### Goal
Auto-fill recipe forms by pasting a URL from any recipe website.

### Implementation Tasks

#### Step 1: Create Recipe Parser Server Action

**File:** `app/dashboard/recipes/parse.ts` (new file)

```typescript
'use server';

import OpenAI from 'openai';
import { createClient } from '@/src/lib/supabase/server';
import { requireRole } from '@/src/lib/requireRole';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseRecipeUrl(url: string) {
  const supabase = await createClient();
  await requireRole(['owner', 'adult', 'teen'], supabase);

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

    console.log(`✅ Parsed recipe from ${url}:`, parsed.title);

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
```

**Cost:** ~$0.01 per recipe parse (GPT-4o-mini is very cheap)

#### Step 2: Add UI for URL Import

**File:** `app/dashboard/recipes/page.tsx` (or new recipe form component)

Add "Import from URL" functionality:

```tsx
'use client';

import { useState } from 'react';
import { parseRecipeUrl } from './parse';

export function RecipeForm() {
  const [recipeUrl, setRecipeUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    ingredients: [] as string[],
    instructions: [] as string[],
    servings: '',
    prepTime: '',
    cookTime: '',
  });

  async function handleImportFromUrl() {
    if (!recipeUrl) return;

    setIsParsing(true);
    const result = await parseRecipeUrl(recipeUrl);
    setIsParsing(false);

    if (result.success && result.recipe) {
      // Pre-fill form with parsed data
      setFormData(result.recipe);
      // Optional: show success toast
    } else {
      // Show error toast
      alert(result.error || 'Failed to parse recipe');
    }
  }

  return (
    <div>
      {/* URL Import Section */}
      <div className="mb-6 p-4 bg-muted rounded-lg">
        <label className="block text-sm font-medium mb-2">
          Import from URL (optional)
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://www.example.com/recipe"
            value={recipeUrl}
            onChange={(e) => setRecipeUrl(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={handleImportFromUrl}
            disabled={isParsing || !recipeUrl}
            className="btn-primary"
          >
            {isParsing ? 'Parsing...' : 'Import'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Paste a recipe URL to auto-fill this form
        </p>
      </div>

      {/* Rest of recipe form (title, ingredients, etc.) */}
      {/* ... */}
    </div>
  );
}
```

### Verification Checklist

- [ ] Test with NYT Cooking recipe URL
- [ ] Test with AllRecipes URL
- [ ] Test with Food Network URL
- [ ] Test with personal blog recipe
- [ ] Verify all fields pre-fill correctly
- [ ] User can edit parsed data before saving
- [ ] Test with invalid URL (shows error gracefully)
- [ ] Check OpenAI usage dashboard (verify cost ~$0.01 per parse)

---

## AI Feature 3: Journal Writing Prompts (GPT-4o-mini)

### Goal
Suggest 3 opening sentences for journal entries based on location, date, and participants.

### Implementation Tasks

#### Step 1: Create Writing Prompts Server Action

**File:** `app/dashboard/journal/prompts.ts` (new file)

```typescript
'use server';

import OpenAI from 'openai';
import { createClient } from '@/src/lib/supabase/server';
import { requireRole } from '@/src/lib/requireRole';

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
  await requireRole(['owner', 'adult', 'teen'], supabase);

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

    console.log(`✅ Generated ${prompts.length} writing prompts`);

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
```

**Cost:** ~$0.002 per prompt generation (very cheap)

#### Step 2: Add UI for Writing Prompts

**File:** `app/dashboard/journal/new/page.tsx` (or journal editor component)

```tsx
'use client';

import { useState } from 'react';
import { generateJournalPrompts } from '../prompts';

export function JournalEditor() {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [showPrompts, setShowPrompts] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGetWritingIdeas() {
    setIsGenerating(true);
    const result = await generateJournalPrompts({
      location,
      date,
      members,
    });
    setIsGenerating(false);

    if (result.success && result.prompts) {
      setPrompts(result.prompts);
      setShowPrompts(true);
    } else {
      alert(result.error || 'Failed to generate prompts');
    }
  }

  function insertPrompt(prompt: string) {
    setContent(prompt + ' ');
    setShowPrompts(false);
    // Focus textarea
    document.querySelector<HTMLTextAreaElement>('textarea')?.focus();
  }

  return (
    <div>
      {/* Metadata fields */}
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      {/* Family member selector */}

      {/* Content editor with AI button */}
      <div className="relative">
        <button
          onClick={handleGetWritingIdeas}
          disabled={isGenerating}
          className="btn-secondary mb-2"
        >
          ✨ {isGenerating ? 'Generating...' : 'Get Writing Ideas'}
        </button>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your family memory here..."
          className="w-full min-h-[300px] p-4 border rounded"
        />
      </div>

      {/* Prompts modal */}
      {showPrompts && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-3">Click to use:</h4>
          {prompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => insertPrompt(prompt)}
              className="block w-full text-left p-3 mb-2 bg-background hover:bg-accent rounded border"
            >
              {prompt}
            </button>
          ))}
          <button
            onClick={() => setShowPrompts(false)}
            className="text-sm text-muted-foreground mt-2"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
```

### Verification Checklist

- [ ] Fill in location, date, members
- [ ] Click "Get Writing Ideas"
- [ ] 3 prompts appear
- [ ] Click prompt → inserts into editor
- [ ] Can edit inserted text
- [ ] Works with minimal context (just location)
- [ ] Works with full context (location + date + members)
- [ ] Test rate limiting (10 calls per family per day)

---

## Rate Limiting Implementation

**Goal:** Prevent API cost abuse on Free tier.

**File:** `app/api/rate-limit.ts` (new utility)

```typescript
import { createClient } from '@/src/lib/supabase/server';

const DAILY_LIMIT = 10; // AI calls per family per day

export async function checkRateLimit(familyId: string, action: string): Promise<boolean> {
  const supabase = await createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Count AI calls today
  const { count } = await supabase
    .from('ai_usage_log') // Create this table in migration
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
```

**Migration for tracking:**
```sql
CREATE TABLE ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_family_date ON ai_usage_log(family_id, created_at);
```

**Usage in server actions:**
```typescript
// In transcribe.ts, parse.ts, prompts.ts
const canProceed = await checkRateLimit(familyId, 'transcribe');
if (!canProceed) {
  return {
    success: false,
    error: 'Daily AI limit reached (10 per day). Try again tomorrow!'
  };
}
```

---

## Cost Monitoring

**OpenAI Dashboard Setup:**
1. Go to https://platform.openai.com/usage
2. Set usage alerts:
   - Soft limit: $50/month (email notification)
   - Hard limit: $100/month (stop requests)
3. Monitor daily:
   - Transcription: $0.006/minute
   - Recipe parsing: ~$0.01/request
   - Journal prompts: ~$0.002/request

**Expected costs (100 active families):**
- 50 voice memos/month × 2 min avg × $0.006 = $0.60
- 30 recipes parsed/month × $0.01 = $0.30
- 100 journal prompts/month × $0.002 = $0.20
- **Total: ~$1.10/month**

Scale to 1000 families = ~$11/month (very manageable)

---

## Success Metrics (End of Phase 4)

**Adoption:**
- ✅ 30% of voice memos get transcribed
- ✅ 40% of new recipes use URL parsing
- ✅ 20% of new journal entries use writing prompts

**Technical:**
- ✅ <100ms latency for recipe parse (GPT-4o-mini is fast)
- ✅ <30 seconds for voice transcription (Whisper average)
- ✅ <2 seconds for journal prompts
- ✅ 0 failed transcriptions due to API errors
- ✅ Rate limiting prevents cost overruns

**Cost:**
- ✅ <$100 total AI costs in first month
- ✅ <$10/month per 100 active families at steady state

---

## Testing Checklist

**Voice Transcription:**
- [ ] Upload 30-second voice memo → transcript appears in <30 sec
- [ ] Upload 5-minute voice memo → transcript still works
- [ ] Search for word in transcript → voice memo appears in results
- [ ] Click "Copy" button → clipboard has transcript
- [ ] Test with background noise → transcript still accurate
- [ ] Test with non-English → verify Whisper handles it

**Recipe Parsing:**
- [ ] Paste NYT Cooking URL → form pre-fills
- [ ] Paste AllRecipes URL → form pre-fills
- [ ] Edit parsed data → saves correctly
- [ ] Invalid URL → shows error gracefully
- [ ] URL with no recipe → shows error

**Journal Prompts:**
- [ ] Enter location "Paris" → get 3 relevant prompts
- [ ] Enter date + location → prompts reference timing
- [ ] Enter members + location → prompts mention people
- [ ] Click prompt → inserts into editor
- [ ] Generate 10 times → rate limit blocks 11th

**Rate Limiting:**
- [ ] Make 10 AI calls → all succeed
- [ ] Make 11th call → error message shown
- [ ] Wait 24 hours → limit resets

---

## Rollback Plan

If AI features cause issues:
1. **Voice transcription:** Set `OPENAI_API_KEY` to empty string in Vercel → transcription stops, voice memos still work
2. **Recipe parsing:** Hide "Import from URL" button → users can still manually enter recipes
3. **Journal prompts:** Hide "Get Writing Ideas" button → users can still write normally

**Database rollback:**
```sql
-- Remove transcript columns if needed
ALTER TABLE voice_memos DROP COLUMN transcript;
ALTER TABLE voice_memos DROP COLUMN transcription_status;
ALTER TABLE voice_memos DROP COLUMN transcribed_at;
```

---

## Next Steps After Phase 4

1. **Monitor adoption metrics** for 1 week
2. **Collect user feedback** on AI features
3. **Consider Phase 2 AI features** (photo captions, smart search) if adoption >30%
4. **Move to Phase 5:** Testing & QA (integration tests, manual testing)

---

## Questions for Implementation

- Do you want to enable transcription for all languages or English-only?
- Should recipe parsing work for any URL or whitelist specific domains?
- What should the rate limit be? (currently 10 AI calls per family per day)
- Do you want usage analytics dashboard for AI features?

---

**Handoff prepared by:** Claude (Phase 1-2 complete)
**Date:** 2026-02-14
**Plan reference:** `C:\Users\keepi\.claude\plans\witty-greeting-lerdorf.md`
**OpenAI docs:** https://platform.openai.com/docs/guides/speech-to-text
