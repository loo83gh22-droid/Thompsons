// Client-side parsers for import feature.
// No "use server" — these run in the browser.

export type ContentType = "journal_entries" | "stories" | "recipes" | "events";

export interface ParsedJournalEntry {
  title: string;
  content?: string;
  trip_date?: string;
  trip_date_end?: string;
  location?: string;
  author?: string;
}

export interface ParsedStory {
  title: string;
  content: string;
  category?: string;
  author?: string;
}

export interface ParsedRecipe {
  title: string;
  story?: string;
  ingredients?: string;
  instructions?: string;
  occasions?: string;
}

export interface ParsedEvent {
  title: string;
  event_date: string;
  description?: string;
  category?: string;
  recurring?: string;
}

export type ParsedRow =
  | ParsedJournalEntry
  | ParsedStory
  | ParsedRecipe
  | ParsedEvent;

export interface ParseResult {
  type: ContentType;
  rows: ParsedRow[];
  warnings: string[];
}

// ── JSON parser ──────────────────────────────────────────────────────────────

export function parseJson(text: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file — could not parse.");
  }

  // Accept { type, entries } envelope or a bare array
  let type: ContentType = "journal_entries";
  let rawEntries: unknown[];

  if (Array.isArray(parsed)) {
    rawEntries = parsed;
  } else if (
    typeof parsed === "object" &&
    parsed !== null &&
    "entries" in parsed &&
    Array.isArray((parsed as Record<string, unknown>).entries)
  ) {
    const envelope = parsed as Record<string, unknown>;
    if (
      typeof envelope.type === "string" &&
      ["journal_entries", "stories", "recipes", "events"].includes(
        envelope.type as string
      )
    ) {
      type = envelope.type as ContentType;
    }
    rawEntries = envelope.entries as unknown[];
  } else {
    throw new Error(
      'JSON must be an array or an object with { type, entries }.'
    );
  }

  const warnings: string[] = [];
  const rows: ParsedRow[] = [];

  rawEntries.forEach((raw, i) => {
    if (typeof raw !== "object" || raw === null) {
      warnings.push(`Row ${i + 1}: skipped (not an object)`);
      return;
    }
    const r = raw as Record<string, unknown>;

    if (type === "journal_entries") {
      if (!r.title || typeof r.title !== "string") {
        warnings.push(`Row ${i + 1}: skipped (missing title)`);
        return;
      }
      rows.push({
        title: r.title,
        content: typeof r.content === "string" ? r.content : undefined,
        trip_date: typeof r.trip_date === "string" ? r.trip_date : undefined,
        trip_date_end:
          typeof r.trip_date_end === "string" ? r.trip_date_end : undefined,
        location: typeof r.location === "string" ? r.location : undefined,
        author: typeof r.author === "string" ? r.author : undefined,
      } satisfies ParsedJournalEntry);
    } else if (type === "stories") {
      if (!r.title || typeof r.title !== "string") {
        warnings.push(`Row ${i + 1}: skipped (missing title)`);
        return;
      }
      rows.push({
        title: r.title,
        content: typeof r.content === "string" ? r.content : "",
        category: typeof r.category === "string" ? r.category : undefined,
        author: typeof r.author === "string" ? r.author : undefined,
      } satisfies ParsedStory);
    } else if (type === "recipes") {
      if (!r.title || typeof r.title !== "string") {
        warnings.push(`Row ${i + 1}: skipped (missing title)`);
        return;
      }
      rows.push({
        title: r.title,
        story: typeof r.story === "string" ? r.story : undefined,
        ingredients:
          typeof r.ingredients === "string" ? r.ingredients : undefined,
        instructions:
          typeof r.instructions === "string" ? r.instructions : undefined,
        occasions: typeof r.occasions === "string" ? r.occasions : undefined,
      } satisfies ParsedRecipe);
    } else if (type === "events") {
      if (!r.title || typeof r.title !== "string") {
        warnings.push(`Row ${i + 1}: skipped (missing title)`);
        return;
      }
      if (!r.event_date || typeof r.event_date !== "string") {
        warnings.push(`Row ${i + 1}: skipped (missing event_date)`);
        return;
      }
      rows.push({
        title: r.title,
        event_date: r.event_date,
        description:
          typeof r.description === "string" ? r.description : undefined,
        category: typeof r.category === "string" ? r.category : undefined,
        recurring: typeof r.recurring === "string" ? r.recurring : undefined,
      } satisfies ParsedEvent);
    }
  });

  return { type, rows, warnings };
}

// ── ZIP parser ────────────────────────────────────────────────────────────────
// Parses the ZIP format produced by the export feature.
// Returns one ParseResult per content type found in the archive.

export async function parseZip(
  file: File
): Promise<{ results: ParseResult[]; warnings: string[] }> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  const allWarnings: string[] = [];
  const results: ParseResult[] = [];

  // ── journals/ ──
  const journalFiles = Object.keys(zip.files).filter(
    (n) => n.startsWith("journals/") && n.endsWith(".md") && !zip.files[n].dir
  );
  if (journalFiles.length > 0) {
    const rows: ParsedJournalEntry[] = [];
    for (const path of journalFiles) {
      const text = await zip.files[path].async("string");
      const entry = parseMdJournalEntry(text);
      if (entry) rows.push(entry);
      else allWarnings.push(`${path}: could not parse`);
    }
    if (rows.length > 0)
      results.push({ type: "journal_entries", rows, warnings: [] });
  }

  // ── stories/ ──
  const storyFiles = Object.keys(zip.files).filter(
    (n) => n.startsWith("stories/") && n.endsWith(".md") && !zip.files[n].dir
  );
  if (storyFiles.length > 0) {
    const rows: ParsedStory[] = [];
    for (const path of storyFiles) {
      const text = await zip.files[path].async("string");
      const entry = parseMdStory(text);
      if (entry) rows.push(entry);
      else allWarnings.push(`${path}: could not parse`);
    }
    if (rows.length > 0) results.push({ type: "stories", rows, warnings: [] });
  }

  // ── recipes/ ──
  const recipeFiles = Object.keys(zip.files).filter(
    (n) => n.startsWith("recipes/") && n.endsWith(".md") && !zip.files[n].dir
  );
  if (recipeFiles.length > 0) {
    const rows: ParsedRecipe[] = [];
    for (const path of recipeFiles) {
      const text = await zip.files[path].async("string");
      const entry = parseMdRecipe(text);
      if (entry) rows.push(entry);
      else allWarnings.push(`${path}: could not parse`);
    }
    if (rows.length > 0) results.push({ type: "recipes", rows, warnings: [] });
  }

  if (results.length === 0) {
    throw new Error(
      "No importable content found in ZIP. Expected journals/, stories/, or recipes/ folders."
    );
  }

  return { results, warnings: allWarnings };
}

// ── Markdown helpers ──────────────────────────────────────────────────────────

function extractMdTitle(text: string): string | null {
  const m = text.match(/^#\s+(.+)/m);
  return m ? m[1].trim() : null;
}

function extractMdField(text: string, field: string): string | null {
  const re = new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`, "i");
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

function extractMdBody(text: string): string {
  // Content between the first --- separator and the next ## heading or end
  const parts = text.split(/^---$/m);
  if (parts.length >= 2) {
    const body = parts.slice(1).join("---").split(/^## /m)[0].trim();
    return body;
  }
  // Fallback: strip heading + frontmatter lines
  return text
    .replace(/^#\s+.+$/m, "")
    .replace(/^\*\*[^*]+:\*\*.*$/gm, "")
    .replace(/^---$/gm, "")
    .trim();
}

function parseMdJournalEntry(text: string): ParsedJournalEntry | null {
  const title = extractMdTitle(text);
  if (!title) return null;
  const author = extractMdField(text, "Author");
  const dateRaw = extractMdField(text, "Date");
  const location = extractMdField(text, "Location");
  const content = extractMdBody(text);

  // Date can be "June 15, 2024" or "June 15, 2024 — June 20, 2024"
  let trip_date: string | undefined;
  let trip_date_end: string | undefined;
  if (dateRaw) {
    const parts = dateRaw.split(/\s*[—–-]+\s*/);
    trip_date = parseDateToIso(parts[0]) ?? undefined;
    if (parts[1]) trip_date_end = parseDateToIso(parts[1]) ?? undefined;
  }

  return { title, content: content || undefined, trip_date, trip_date_end, location: location ?? undefined, author: author ?? undefined };
}

function parseMdStory(text: string): ParsedStory | null {
  const title = extractMdTitle(text);
  if (!title) return null;
  const author = extractMdField(text, "Author");
  const content = extractMdBody(text);
  return { title, content: content || "", author: author ?? undefined };
}

function parseMdRecipe(text: string): ParsedRecipe | null {
  const title = extractMdTitle(text);
  if (!title) return null;

  // Recipes have ## Story, ## Ingredients, ## Instructions sections
  const sections: Record<string, string> = {};
  const sectionRe = /^## (.+)$/gm;
  let match: RegExpExecArray | null;
  const sectionStarts: Array<{ name: string; index: number }> = [];

  while ((match = sectionRe.exec(text)) !== null) {
    sectionStarts.push({ name: match[1].trim(), index: match.index });
  }

  for (let i = 0; i < sectionStarts.length; i++) {
    const start = sectionStarts[i].index + sectionStarts[i].name.length + 4;
    const end =
      i + 1 < sectionStarts.length ? sectionStarts[i + 1].index : text.length;
    sections[sectionStarts[i].name.toLowerCase()] = text.slice(start, end).trim();
  }

  return {
    title,
    story: sections["story"] || undefined,
    ingredients: sections["ingredients"] || undefined,
    instructions: sections["instructions"] || undefined,
  };
}

function parseDateToIso(dateStr: string): string | null {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}
