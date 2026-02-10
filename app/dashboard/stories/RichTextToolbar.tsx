"use client";

import type { RefObject } from "react";

type ToolbarProps = {
  value: string;
  onChange: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

export function RichTextToolbar({ value, onChange, textareaRef }: ToolbarProps) {
  function getTextarea() {
    return textareaRef.current ?? null;
  }

  function wrapSelection(prefix: string, suffix: string = prefix) {
    const ta = getTextarea();
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const newValue = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    onChange(newValue);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, end + prefix.length);
    });
  }

  function insertAtCursor(before: string, after: string = "") {
    const ta = getTextarea();
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newValue = value.slice(0, start) + before + (value.slice(start, end) || "") + after + value.slice(end);
    onChange(newValue);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + before.length + (end - start) + after.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function insertLinePrefix(prefix: string) {
    const ta = getTextarea();
    if (!ta) return;
    const start = ta.selectionStart;
    const lines = value.split("\n");
    let count = 0;
    let idx = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i].length + (i < lines.length - 1 ? 1 : 0);
      if (count + lineLen > start) {
        idx = i;
        break;
      }
      count += lineLen;
    }
    const lineStart = count;
    lines[idx] = prefix + lines[idx];
    const newValue = lines.join("\n");
    onChange(newValue);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-[var(--border)] bg-[var(--surface-hover)] p-1.5">
      <button
        type="button"
        onClick={() => wrapSelection("**")}
        className="rounded p-1.5 text-sm font-bold hover:bg-[var(--surface)]"
        title="Bold"
        aria-label="Bold"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => wrapSelection("_")}
        className="rounded p-1.5 text-sm italic hover:bg-[var(--surface)]"
        title="Italic"
        aria-label="Italic"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => insertLinePrefix("## ")}
        className="rounded p-1.5 text-sm hover:bg-[var(--surface)]"
        title="Heading 2"
        aria-label="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => insertLinePrefix("### ")}
        className="rounded p-1.5 text-sm hover:bg-[var(--surface)]"
        title="Heading 3"
        aria-label="Heading 3"
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => insertLinePrefix("- ")}
        className="rounded p-1.5 text-sm hover:bg-[var(--surface)]"
        title="Bullet list"
        aria-label="Bullet list"
      >
        •
      </button>
      <button
        type="button"
        onClick={() => insertLinePrefix("1. ")}
        className="rounded p-1.5 text-sm hover:bg-[var(--surface)]"
        title="Numbered list"
        aria-label="Numbered list"
      >
        1.
      </button>
      <button
        type="button"
        onClick={() => insertAtCursor("[", "](url)")}
        className="rounded p-1.5 text-sm hover:bg-[var(--surface)]"
        title="Link"
        aria-label="Link"
      >
        Link
      </button>
    </div>
  );
}
