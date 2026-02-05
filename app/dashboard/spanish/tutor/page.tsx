"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are a patient Spanish tutor for the Thompsons family. 
The user will ask grammar questions in English. Respond with clear explanations, often in Spanish when teaching vocabulary or grammar rules, with English clarifications when helpful.
Keep responses concise (2-4 sentences) and educational.`;

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/spanish-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: text }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get response");
      }

      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Could not reach the AI tutor. Add OPENAI_API_KEY to .env.local to enable it.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        AI Tutor
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Ask grammar questions in English. Get explanations in Spanish.
      </p>

      <div className="mt-6 flex flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center text-[var(--muted)]">
              <MessageCircle className="h-12 w-12" />
              <p>Ask a grammar question in English.</p>
              <p className="text-sm">e.g. &quot;When do I use ser vs estar?&quot;</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-[var(--accent)]/20 text-[var(--foreground)]"
                    : "bg-[var(--surface-hover)] text-[var(--muted)]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-[var(--surface-hover)] px-4 py-2 text-[var(--muted)]">
                Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="border-t border-[var(--border)] px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex gap-2 border-t border-[var(--border)] p-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a grammar question..."
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-[var(--accent)] p-3 text-[var(--background)] hover:bg-[var(--accent-muted)] disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>

      <p className="mt-2 text-xs text-[var(--muted)]">
        Powered by OpenAI. Add OPENAI_API_KEY to .env.local to enable.
      </p>
    </div>
  );
}
