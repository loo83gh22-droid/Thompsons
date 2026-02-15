'use server';

import OpenAI from 'openai';
import { createClient } from '@/src/lib/supabase/server';
import { requireRole } from '@/src/lib/requireRole';
import { checkRateLimit } from '@/src/lib/rateLimit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeVoiceMemo(voiceMemoId: string) {
  const supabase = await createClient();

  // Verify user has permission (owner, adult, or teen can transcribe)
  await requireRole(['owner', 'adult', 'teen'], supabase);

  try {
    // 1. Get voice memo storage URL and family_id
    const { data: memo, error: memoError } = await supabase
      .from('voice_memos')
      .select('storage_url, family_id')
      .eq('id', voiceMemoId)
      .single();

    if (memoError || !memo) {
      throw new Error('Voice memo not found');
    }

    // 2. Check rate limit
    const canProceed = await checkRateLimit(memo.family_id, 'transcribe');
    if (!canProceed) {
      return {
        success: false,
        error: 'Daily AI limit reached (10 per day). Try again tomorrow!'
      };
    }

    // 3. Update status to processing
    await supabase
      .from('voice_memos')
      .update({ transcription_status: 'processing' })
      .eq('id', voiceMemoId);

    // 4. Download audio file from Supabase Storage
    const { data: audioFile, error: downloadError } = await supabase
      .storage
      .from('voice-memos')
      .download(memo.storage_url);

    if (downloadError || !audioFile) {
      throw new Error('Failed to download audio file');
    }

    // 5. Convert Blob to File object for Whisper API
    const file = new File([audioFile], 'audio.webm', { type: 'audio/webm' });

    // 6. Call Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en', // Auto-detect if omitted; specify for better accuracy
      response_format: 'text', // Options: json, text, srt, verbose_json, vtt
    });

    // 7. Save transcript to database
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
