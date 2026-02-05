import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as {
      messages: { role: string; content: string }[];
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply:
          "The AI tutor is not configured yet. Add OPENAI_API_KEY to your .env.local file to enable it. In the meantime, try the flashcards and grammar quiz!",
      });
    }

    const systemPrompt = `You are a patient Spanish tutor for the Thompsons family. 
The user will ask grammar questions in English. Respond with clear explanations, often in Spanish when teaching vocabulary or grammar rules, with English clarifications when helpful.
Keep responses concise (2-4 sentences) and educational.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message || "OpenAI request failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "No response.";
    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
