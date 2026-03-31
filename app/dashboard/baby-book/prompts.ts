/**
 * Baby Book monthly prompts.
 *
 * Each month entry shows two soft suggestions:
 *   milestone  — specific to the child's age that month (changes every 1-2 months)
 *   evergreen  — a gentler question that works at any age in the stage
 *
 * Tapping a prompt appends it to the story field as a starting line.
 */

export type MonthPrompt = {
  milestone: string;
  evergreen: string;
};

const PROMPTS: Record<number, MonthPrompt> = {
  0:  { milestone: "What was the moment you first held them?",           evergreen: "What surprised you most this first week?" },
  1:  { milestone: "What's their favourite position to sleep in?",       evergreen: "What surprised you most this month?" },
  2:  { milestone: "Are you starting to see their personality?",         evergreen: "What surprised you most this month?" },
  3:  { milestone: "Did you catch the first real smile?",                evergreen: "What surprised you most this month?" },
  4:  { milestone: "Any giggling yet?",                                  evergreen: "What surprised you most this month?" },
  5:  { milestone: "What are they reaching for?",                        evergreen: "What surprised you most this month?" },
  6:  { milestone: "Sitting up yet?",                                    evergreen: "What are they obsessed with right now?" },
  7:  { milestone: "What sounds are they making?",                       evergreen: "What are they obsessed with right now?" },
  8:  { milestone: "Are they on the move?",                              evergreen: "What are they obsessed with right now?" },
  9:  { milestone: "Any first words or sounds?",                         evergreen: "What are they obsessed with right now?" },
  10: { milestone: "What do they love to bang, shake, or throw?",        evergreen: "What are they obsessed with right now?" },
  11: { milestone: "What makes them light up?",                          evergreen: "What are they obsessed with right now?" },
  12: { milestone: "First steps — did it happen?",                       evergreen: "Something that made you laugh this month?" },
  13: { milestone: "What new words are they saying?",                    evergreen: "Something that made you laugh this month?" },
  14: { milestone: "What are they getting into?",                        evergreen: "Something that made you laugh this month?" },
  15: { milestone: "Any favourite books or songs?",                      evergreen: "Something that made you laugh this month?" },
  16: { milestone: "What does their personality feel like right now?",   evergreen: "Something that made you laugh this month?" },
  17: { milestone: "Any funny habits forming?",                          evergreen: "Something that made you laugh this month?" },
  18: { milestone: "What are they talking about?",                       evergreen: "What are they into this month?" },
  19: { milestone: "What do they insist on doing themselves?",           evergreen: "What are they into this month?" },
  20: { milestone: "What's their favourite toy or object right now?",    evergreen: "What are they into this month?" },
  21: { milestone: "Any imaginary play starting?",                       evergreen: "What are they into this month?" },
  22: { milestone: "What's a phrase they say all the time?",             evergreen: "What are they into this month?" },
  23: { milestone: "How are they sleeping these days?",                  evergreen: "What are they into this month?" },
  24: { milestone: "What did the 2nd birthday look like?",               evergreen: "What are they into this month?" },
  25: { milestone: "Funniest thing they said this month?",               evergreen: "What surprised you about them this month?" },
  26: { milestone: "What are they pretending to be?",                    evergreen: "What surprised you about them this month?" },
  27: { milestone: "Current obsession?",                                 evergreen: "What surprised you about them this month?" },
  28: { milestone: "What made you laugh out loud?",                      evergreen: "What surprised you about them this month?" },
  29: { milestone: "Any new friends?",                                   evergreen: "What surprised you about them this month?" },
  30: { milestone: "What's their favourite food right now?",             evergreen: "What surprised you about them this month?" },
  31: { milestone: "What are they scared of?",                           evergreen: "What surprised you about them this month?" },
  32: { milestone: "What are they proud of?",                            evergreen: "What surprised you about them this month?" },
  33: { milestone: "What songs do they know all the words to?",          evergreen: "What surprised you about them this month?" },
  34: { milestone: "How do they comfort themselves?",                    evergreen: "What surprised you about them this month?" },
  35: { milestone: "What questions are they asking lately?",             evergreen: "What surprised you about them this month?" },
  36: { milestone: "What did the 3rd birthday look like?",               evergreen: "What surprised you about them this month?" },
  37: { milestone: "What do they want to be when they grow up?",         evergreen: "What made you smile this month?" },
  38: { milestone: "Who are their best friends right now?",              evergreen: "What made you smile this month?" },
  39: { milestone: "Something they learned that surprised you?",         evergreen: "What made you smile this month?" },
  40: { milestone: "What's their favourite book or story?",              evergreen: "What made you smile this month?" },
  41: { milestone: "What makes them feel brave?",                        evergreen: "What made you smile this month?" },
  42: { milestone: "What game could they play all day?",                 evergreen: "What made you smile this month?" },
  43: { milestone: "What are they really good at?",                      evergreen: "What made you smile this month?" },
  44: { milestone: "What's the silliest thing they did this month?",     evergreen: "What made you smile this month?" },
  45: { milestone: "Who do they talk about the most?",                   evergreen: "What made you smile this month?" },
  46: { milestone: "What's their favourite thing to do with you?",       evergreen: "What made you smile this month?" },
  47: { milestone: "What are they excited about right now?",             evergreen: "What made you smile this month?" },
  48: { milestone: "What did the 4th birthday look like?",               evergreen: "What made you smile this month?" },
  49: { milestone: "What's their favourite story right now?",            evergreen: "What made you smile this month?" },
  50: { milestone: "What are they really proud of?",                     evergreen: "What made you smile this month?" },
  51: { milestone: "What makes them feel brave?",                        evergreen: "What made you smile this month?" },
  52: { milestone: "What do they say when they first wake up?",          evergreen: "What made you smile this month?" },
  53: { milestone: "What's the best thing about this age?",              evergreen: "What made you smile this month?" },
  54: { milestone: "What are they learning to do?",                      evergreen: "What made you smile this month?" },
  55: { milestone: "Who is their hero right now?",                       evergreen: "What made you smile this month?" },
  56: { milestone: "What are they most excited about?",                  evergreen: "What made you smile this month?" },
  57: { milestone: "What's their sense of humour like?",                 evergreen: "What made you smile this month?" },
  58: { milestone: "What do they think about every day?",                evergreen: "What made you smile this month?" },
  59: { milestone: "What are they looking forward to?",                  evergreen: "What made you smile this month?" },
  60: { milestone: "What did the 5th birthday look like?",               evergreen: "What made you smile this month?" },
  61: { milestone: "First day of school — how did it go?",               evergreen: "What made you proud this month?" },
  62: { milestone: "Who are they becoming friends with?",                evergreen: "What made you proud this month?" },
  63: { milestone: "What are they learning at school?",                  evergreen: "What made you proud this month?" },
  64: { milestone: "What do they love about school? What don't they?",   evergreen: "What made you proud this month?" },
  65: { milestone: "What are they excited to learn next?",               evergreen: "What made you proud this month?" },
  66: { milestone: "Favourite teacher or friend right now?",             evergreen: "What made you proud this month?" },
  67: { milestone: "What are they getting really good at?",              evergreen: "What made you proud this month?" },
  68: { milestone: "What's their after-school routine like?",            evergreen: "What made you proud this month?" },
  69: { milestone: "What do they come home talking about?",              evergreen: "What made you proud this month?" },
  70: { milestone: "What's changed about them since starting school?",   evergreen: "What made you proud this month?" },
  71: { milestone: "What are they really into this month?",              evergreen: "What made you proud this month?" },
  72: { milestone: "What did the 6th birthday look like?",               evergreen: "What made you proud this month?" },
  73: { milestone: "What are they really into right now?",               evergreen: "Something funny they said or did?" },
  74: { milestone: "What made them proud this month?",                   evergreen: "Something funny they said or did?" },
  75: { milestone: "Best thing about this age right now?",               evergreen: "Something funny they said or did?" },
  76: { milestone: "What's their friendship group like?",                evergreen: "Something funny they said or did?" },
  77: { milestone: "What sport or activity are they loving?",            evergreen: "Something funny they said or did?" },
  78: { milestone: "What are they reading?",                             evergreen: "Something funny they said or did?" },
  79: { milestone: "What question are they asking a lot lately?",        evergreen: "Something funny they said or did?" },
  80: { milestone: "What's their biggest win this month?",               evergreen: "Something funny they said or did?" },
  81: { milestone: "What are they really proud of?",                     evergreen: "Something funny they said or did?" },
  82: { milestone: "What makes them laugh the hardest?",                 evergreen: "Something funny they said or did?" },
  83: { milestone: "What's changed about them this month?",              evergreen: "Something funny they said or did?" },
  84: { milestone: "What did the 7th birthday look like?",               evergreen: "Something funny they said or did?" },
  85: { milestone: "What are they passionate about?",                    evergreen: "Something funny they said or did?" },
  86: { milestone: "How are friendships going?",                         evergreen: "Something funny they said or did?" },
  87: { milestone: "What surprised you about them this month?",          evergreen: "Something funny they said or did?" },
  88: { milestone: "What are they working on getting better at?",        evergreen: "Something funny they said or did?" },
  89: { milestone: "What's their sense of humour like right now?",       evergreen: "Something funny they said or did?" },
  90: { milestone: "What's their favourite thing to do after school?",   evergreen: "Something funny they said or did?" },
  91: { milestone: "What are they reading or watching?",                 evergreen: "Something funny they said or did?" },
  92: { milestone: "What made them laugh the hardest this month?",       evergreen: "Something funny they said or did?" },
  93: { milestone: "What are they learning that you didn't expect?",     evergreen: "Something funny they said or did?" },
  94: { milestone: "What's the thing they say most often?",              evergreen: "Something funny they said or did?" },
  95: { milestone: "What does a typical day look like for them?",        evergreen: "Something funny they said or did?" },
  96: { milestone: "What did the 8th birthday look like?",               evergreen: "Something funny they said or did?" },
};

const LATE_MILESTONES = [
  "What are they passionate about?",
  "How are friendships going?",
  "Something that surprised you about them?",
  "What are they working toward?",
  "What are they really good at?",
  "What do they love about their life right now?",
  "What matters most to them right now?",
  "What are they proud of this month?",
  "What's changed about them lately?",
  "What's their sense of humour like?",
  "What are they excited about?",
  "What made them laugh the hardest?",
];

export function getPromptsForAgeMonths(ageMonths: number): MonthPrompt {
  if (ageMonths < 0) {
    return { milestone: "What was this month like?", evergreen: "What do you want to remember?" };
  }
  const found = PROMPTS[ageMonths];
  if (found) return found;
  // 97+ : cycle through late-stage milestones
  const idx = (ageMonths - 97) % LATE_MILESTONES.length;
  return { milestone: LATE_MILESTONES[idx], evergreen: "What made you proud this month?" };
}

/** Format a JS Date (or YYYY-MM-DD string) as "March 2024" */
export function formatEntryMonth(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d + "T12:00:00") : d;
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** First day of a given year/month as a YYYY-MM-DD string (for DB storage) */
export function toEntryMonthString(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

/** Age in months given a birth date and a target date */
export function ageInMonths(birthDate: string, targetDate: Date): number {
  const birth = new Date(birthDate + "T12:00:00");
  const diff =
    (targetDate.getFullYear() - birth.getFullYear()) * 12 +
    (targetDate.getMonth() - birth.getMonth());
  return Math.max(0, diff);
}
