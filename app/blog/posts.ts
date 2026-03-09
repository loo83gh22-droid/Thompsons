export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "cta"; heading: string; body: string; buttonText: string; href: string };

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  category: string;
  readingTime: string;
  content: ContentBlock[];
}

export const posts: BlogPost[] = [
  {
    slug: "private-family-photo-sharing-app",
    title: "The Best Private Family Photo Sharing App in 2026",
    description:
      "Comparing private family photo sharing apps — what to look for, what to avoid, and how to find the one your whole family will actually use.",
    publishedAt: "2026-02-10",
    updatedAt: "2026-03-01",
    category: "Family Tech",
    readingTime: "7 min read",
    content: [
      {
        type: "p",
        text: "Family group chats are a mess. You share 40 photos from the beach trip, they get buried under memes and 'what time is dinner' messages, and six months later nobody can find them. Google Photos shows everyone else's suggestions. iCloud is private but barely interactive. Facebook albums require accounts nobody uses anymore.",
      },
      {
        type: "p",
        text: "What most families actually want is simple: a private place to share photos with the people who matter, where the memories don't get buried, and Grandma can actually find them. That's what a private family photo sharing app is supposed to be. Here's how to find the right one.",
      },
      {
        type: "h2",
        text: 'What "Private" Actually Means',
      },
      {
        type: "p",
        text: "Not all apps use the word 'private' the same way. Some mean 'we won't show your photos in public search results.' Others mean your data is encrypted and never used for advertising. The difference matters enormously when you're sharing photos of your kids.",
      },
      {
        type: "p",
        text: "When evaluating any family photo sharing app for privacy, look for:",
      },
      {
        type: "ul",
        items: [
          "No ads — if the app is free and serves ads, your family's photos are the product",
          "Encryption at rest and in transit — your photos should be unreadable to anyone but your family",
          "No facial recognition or 'memories' surfaced to other users",
          "No data sharing with third parties for 'personalization'",
          "Full data export — you should be able to get your photos back if you ever leave",
        ],
      },
      {
        type: "h2",
        text: "Why Group Chats and Cloud Storage Fall Short",
      },
      {
        type: "p",
        text: "Most families try three things before finding a real solution. Here's why each one eventually frustrates everyone.",
      },
      {
        type: "h3",
        text: "Group chats (WhatsApp, iMessage, GroupMe)",
      },
      {
        type: "p",
        text: "Great for quick sharing, terrible for preservation. Photos expire or get buried, there's no way to organize by event or year, and if Grandma gets a new phone, everything before the switch is gone. Group chats were designed for conversation, not memory-keeping.",
      },
      {
        type: "h3",
        text: "Google Photos and iCloud",
      },
      {
        type: "p",
        text: "Excellent for automatic backup, but neither was designed for family collaboration. Sharing an album requires managing access links, nothing is interactive, and there's no context — just photos floating without stories attached. And Google Photos' AI features mean your family's faces are being analyzed to improve Google's products.",
      },
      {
        type: "h3",
        text: "Facebook and Instagram",
      },
      {
        type: "p",
        text: "The obvious privacy issues aside, most families have mixed-age members. A 10-year-old shouldn't need a Facebook account to see family photos. And anything posted on social media is potentially visible far beyond your family — even with strict privacy settings.",
      },
      {
        type: "h2",
        text: "What to Look for in a Private Family Photo Sharing App",
      },
      {
        type: "h3",
        text: "Ease of use for all ages",
      },
      {
        type: "p",
        text: "Your family photo sharing app is only useful if everyone actually uses it. If Grandpa needs a 20-minute tutorial to post a photo, you'll be the only one contributing. Look for an app with minimal steps from 'take a photo' to 'shared with the family.' Bonus points if it works in a browser without requiring an app store download.",
      },
      {
        type: "h3",
        text: "Photos with context — not just storage",
      },
      {
        type: "p",
        text: "Photos without context are just hard drives. The best family photo apps let you add captions, dates, locations, and short stories — turning a photo into a memory. Even better if you can attach voice recordings. 'Huck's first catch, Costa Rica, February 2026 — he wouldn't stop talking about it for a week' is infinitely more valuable than IMG_4823.jpg.",
      },
      {
        type: "h3",
        text: "Roles and permissions for kids",
      },
      {
        type: "p",
        text: "A 7-year-old and a 45-year-old shouldn't have identical access in a family app. Look for platforms that support age-appropriate kid accounts — where children can contribute and view content without access to adult features or sensitive family information.",
      },
      {
        type: "h3",
        text: "Organization built for decades, not months",
      },
      {
        type: "p",
        text: "You're not building a folder on your desktop — you're building a family record that will be browsed in 20 years. Look for chronological journals, map views of places your family has been, and searchable content. The best private family photo apps are designed to be browsed by your grandchildren, not just your current self.",
      },
      {
        type: "h3",
        text: "Permanence and data ownership",
      },
      {
        type: "p",
        text: "Any app can disappear. The platform you choose should offer full data export so your memories are never held hostage. Lifetime plan options are a strong signal that a company is thinking about your family's long-term archive, not just monthly recurring revenue.",
      },
      {
        type: "h2",
        text: "Why FamilyNest Was Built for This",
      },
      {
        type: "p",
        text: "FamilyNest started as a dad project — one father wanted a private space for his family without ads, without strangers in the feed, and without photos getting buried under unrelated messages. It grew because a lot of families wanted the same thing.",
      },
      {
        type: "p",
        text: "What makes it different from the alternatives:",
      },
      {
        type: "ul",
        items: [
          "Journal entries with photos and short videos attached — photos with context, not just storage",
          "Family map that plots everywhere your family has been, from vacations to birthplaces",
          "Voice memos to capture Grandma's stories in her own voice",
          "Kid accounts with age-appropriate access — safe for children, useful for adults",
          "Time capsules that unlock on a future date — write a letter to your kids today, set it to open in 2040",
          "Works on any device with no app store required — add it to your home screen like an app",
          "No ads, no algorithm, no strangers in the feed",
        ],
      },
      {
        type: "p",
        text: "Every plan includes full data export. The Legacy plan is a one-time lifetime purchase — because memories shouldn't depend on a subscription.",
      },
      {
        type: "cta",
        heading: "Start your family's private space — free",
        body: "No credit card required. The free plan gets your whole family up and running, and you can upgrade whenever you're ready.",
        buttonText: "Start Your Family Nest",
        href: "/login?mode=signup",
      },
    ],
  },
  {
    slug: "how-to-preserve-family-memories-digitally",
    title: "How to Preserve Family Memories Digitally: A Complete Guide",
    description:
      "A practical guide to digitally preserving your family's photos, stories, recipes, and voices — so nothing important gets lost to time.",
    publishedAt: "2026-02-18",
    updatedAt: "2026-03-01",
    category: "Memory Keeping",
    readingTime: "8 min read",
    content: [
      {
        type: "p",
        text: "The average family takes over 1,000 photos per year. Most of them live on a phone until that phone breaks, gets upgraded, or is backed up to a cloud folder that nobody ever opens again. Grandma's recipe cards fade. Dad's fishing stories go untold. The videos from the beach trip five years ago are somewhere — probably.",
      },
      {
        type: "p",
        text: "Digital preservation isn't just about storage — it's about making memories findable, shareable, and meaningful decades from now. This guide covers what to preserve, how to organize it, and the systems that actually hold up over time.",
      },
      {
        type: "h2",
        text: "Why Digital Preservation Matters More Than You Think",
      },
      {
        type: "p",
        text: "Here's something counterintuitive: film photos from the 1970s often survive better than digital files from 2010. The reason is that digital files need specific software to open, storage media degrades faster than paper, and cloud services change their terms or shut down entirely.",
      },
      {
        type: "p",
        text: "More importantly — and this is the part most people miss — photos without context lose their meaning over time. A box of prints with handwriting on the back tells a story. A folder called 'IMG_20190824_153422.jpg' tells you absolutely nothing. The goal of digital preservation isn't just to save files. It's to save meaning.",
      },
      {
        type: "h2",
        text: "The 6 Types of Family Memories Worth Preserving",
      },
      {
        type: "h3",
        text: "1. Photos and videos — with context",
      },
      {
        type: "p",
        text: "The obvious one, but most families do it wrong. The goal isn't to keep everything — it's to curate the best and give each photo a caption, a date, and a story. 'First day of kindergarten, September 2023, Emma was terrified and thrilled in equal measure' will mean something in 30 years. The raw timestamp will not.",
      },
      {
        type: "p",
        text: "Short videos are especially worth preserving: a toddler laughing, a grandparent dancing at a wedding, a dog doing the thing it does. These capture movement and sound in a way photos can't. Keep them short, label them well.",
      },
      {
        type: "h3",
        text: "2. Stories and written journals",
      },
      {
        type: "p",
        text: "Every family has stories that only get told at holidays. Write them down. A journal entry from Mom describing what daily life was like in 2025 — what she worried about, what made her laugh, what the kids were obsessed with — will be extraordinary reading for your grandchildren. You don't need to write a memoir. A few paragraphs a month is enough.",
      },
      {
        type: "h3",
        text: "3. Voices and audio recordings",
      },
      {
        type: "p",
        text: "Grandma's voice reading a bedtime story. A toddler's first words. Dad's laugh at the thing nobody else finds funny. These are irreplaceable, and they're the most emotionally powerful memories you can preserve — and the most commonly lost. Your phone can record them in seconds. Most families don't, and regret it later.",
      },
      {
        type: "h3",
        text: "4. Recipes and traditions",
      },
      {
        type: "p",
        text: "Grandma's banana bread recipe exists in three places: her memory, a faded notecard, and scattered attempts to recreate it from memory after the notecard got lost. Documenting family recipes — with the actual story behind them, not just the ingredients — preserves something that simply cannot be Googled. Same goes for traditions: why does your family do that thing at Christmas? Preserve the origin story before it becomes 'we've always done it this way.'",
      },
      {
        type: "h3",
        text: "5. Milestones and achievements",
      },
      {
        type: "p",
        text: "First steps, first catch, first car, first job, first home. These are the chapter headings of a family's life. Capturing them consistently — even briefly — creates a timeline your family will return to again and again. Don't wait for the perfect photo or the perfect words. A short note the day it happens is worth more than a polished entry a year later.",
      },
      {
        type: "h3",
        text: "6. Letters and meaningful messages",
      },
      {
        type: "p",
        text: "A letter written today to your child's future self is one of the most meaningful things you can give them. 'Dear Emma, you're five years old today and you've just learned to ride your bike without training wheels...' Preserving meaningful messages — even birthday cards, even texts that capture a moment — creates a record of your family's emotional life that photos alone can't provide.",
      },
      {
        type: "h2",
        text: "The Biggest Mistakes Families Make",
      },
      {
        type: "ul",
        items: [
          "Relying on one platform: If Google Photos disappears or changes its terms, what happens to 12 years of family photos? Redundancy matters — at minimum, have a second backup.",
          "Not adding context: A photo album without captions is just a pile of faces in a decade. Every preserved memory should answer: who, what, when, where, and why it mattered.",
          "Waiting for the 'right time': The right time to start was 10 years ago. The second best time is now. Memories become harder to document the further you are from them.",
          "Keeping it one person's job: If only Mom is doing the documenting, the record reflects only one perspective. The richest family archives have contributions from everyone — including the kids.",
          "Confusing backup with preservation: Having files on a hard drive is not the same as having a living, searchable, shareable family archive. Files need organization and context to be meaningful.",
        ],
      },
      {
        type: "h2",
        text: "Building a System That Actually Sticks",
      },
      {
        type: "p",
        text: "Three principles separate families who successfully preserve their memories from the ones who keep meaning to:",
      },
      {
        type: "ul",
        items: [
          "Make contribution effortless — the tool should take less time than texting a photo to a group chat",
          "Make it cross-generational — if Grandma can't use it comfortably, you've lost her perspective, which is often the most valuable",
          "Make it permanent — your archive should outlast any single platform, device, or subscription",
        ],
      },
      {
        type: "p",
        text: "The families who succeed at digital preservation aren't doing anything complicated. They check in weekly, keep entries short, and let everyone contribute their own perspective. The goal isn't a perfect archive. It's a living one.",
      },
      {
        type: "h2",
        text: "Choosing the Right Tool",
      },
      {
        type: "p",
        text: "The tool that works for your family is the one your whole family will actually use. That means it needs to work for the 75-year-old who's not comfortable with apps and the 12-year-old who's never used anything that isn't on a phone. It needs to be private, so family members feel comfortable sharing honestly. And it needs to be designed for the long term — not just for sharing moments, but for preserving them.",
      },
      {
        type: "p",
        text: "FamilyNest was built specifically for this: a private, permanent family archive where every generation contributes. Journals with photos, voice memos, a family map, recipes, time capsules, and traditions — all in one place, accessible on any device, with no ads and no algorithm deciding what gets seen.",
      },
      {
        type: "p",
        text: "Every plan includes full data export, so your family's memories are always yours — not held hostage by a subscription.",
      },
      {
        type: "cta",
        heading: "Start preserving your family's memories",
        body: "Free to get started. Invite your parents, grandparents, and kids — everyone contributes their own memories, and nothing gets buried.",
        buttonText: "Start Your Family Nest",
        href: "/login?mode=signup",
      },
    ],
  },
  {
    slug: "family-time-capsule-ideas",
    title: "15 Family Time Capsule Ideas to Open Years From Now",
    description:
      "Fun, meaningful, and deeply personal time capsule ideas for families — from letters to your kids to predictions about the future.",
    publishedAt: "2026-02-28",
    updatedAt: "2026-03-01",
    category: "Family Activities",
    readingTime: "6 min read",
    content: [
      {
        type: "p",
        text: "A time capsule is one of the oldest ways humans have preserved meaning across time — the idea that something you create today will matter deeply to someone in the future. For families, time capsules have a special power: they let you speak directly to your future selves, your children, or grandchildren you haven't met yet.",
      },
      {
        type: "p",
        text: "Here are 15 family time capsule ideas — from sentimental letters to surprisingly moving everyday details — plus how to actually set one up so it gets opened on the right day.",
      },
      {
        type: "h2",
        text: "What Makes a Great Family Time Capsule",
      },
      {
        type: "p",
        text: "The best time capsules are specific, personal, and have a clear opening date. 'Grandma's thoughts on the world in 2025' is far more interesting than 'a collection of newspaper clippings.' The goal is to capture the texture of right now — the things that feel ordinary today but will feel extraordinary in 20 years.",
      },
      {
        type: "p",
        text: "Specificity is everything. The price of a gallon of milk. The song playing on repeat in your house. What your 8-year-old is obsessed with. What you're worried about. These ordinary details are what future readers will find most fascinating.",
      },
      {
        type: "h2",
        text: "15 Family Time Capsule Ideas",
      },
      {
        type: "h3",
        text: "1. A letter to your child on a future milestone",
      },
      {
        type: "p",
        text: "Write it when they're young. Describe who they are right now — what makes them laugh, what they're afraid of, what they want to be when they grow up. Set it to open on their 18th birthday, their graduation, or their wedding day. This is one of the most meaningful things a parent can give a child.",
      },
      {
        type: "h3",
        text: "2. A letter to your future self",
      },
      {
        type: "p",
        text: "What does your life look like right now? What do you hope changes in 10 years? What do you want to stay the same? Writing honestly to your future self is a strange, powerful exercise. The version of you that reads it will be grateful you did.",
      },
      {
        type: "h3",
        text: "3. Family predictions",
      },
      {
        type: "p",
        text: "Where will each family member live in 10 years? What will the kids do for work? Who will be married? Who will surprise everyone? Seal the predictions and revisit them at a family gathering. Predictions are wrong in the best possible ways.",
      },
      {
        type: "h3",
        text: "4. 'What I'm obsessed with right now'",
      },
      {
        type: "p",
        text: "Each family member writes or records what they're into: a TV show, a song, a food, a hobby, a friend group. In 10 years, it's a window into exactly who everyone was at this particular moment. The 8-year-old's dinosaur phase. The teenager's musical obsession. Dad's sourdough bread era.",
      },
      {
        type: "h3",
        text: "5. This year's family favorites",
      },
      {
        type: "p",
        text: "Favorite meal. Favorite vacation. Favorite movie. Funniest thing that happened. The inside joke nobody outside the family would understand. Preserve the texture of one ordinary year — future readers will treasure it.",
      },
      {
        type: "h3",
        text: "6. A voice message from a grandparent",
      },
      {
        type: "p",
        text: "Record Grandma or Grandpa telling a story, giving advice, or simply saying hello to a grandchild who hasn't been born yet. A voice recording from a grandparent is one of the most emotionally powerful things a family can preserve. Do this while you can.",
      },
      {
        type: "h3",
        text: "7. Current prices of everyday things",
      },
      {
        type: "p",
        text: "Gas. Groceries. A house in your neighborhood. A movie ticket. Coffee. Future readers — especially your grandchildren — will be stunned. This one sounds mundane and turns out to be one of the most fascinating documents in any time capsule.",
      },
      {
        type: "h3",
        text: "8. A message to the next generation",
      },
      {
        type: "p",
        text: "What do you want your grandchildren to know about who you are, what you value, and what this era felt like to live through? Not headlines — your experience. What were the conversations at your dinner table? What did you worry about? What gave you hope?",
      },
      {
        type: "h3",
        text: "9. Hopes and fears",
      },
      {
        type: "p",
        text: "An honest record of what you're worried about and what you're looking forward to. The emotional truth of right now — not the highlight reel. This is the most vulnerable capsule to create and often the most meaningful to read.",
      },
      {
        type: "h3",
        text: "10. The origin story of your family traditions",
      },
      {
        type: "p",
        text: "Why does your family do that thing at Christmas? Where did the phrase everyone uses come from? What's the story behind the tradition that everyone participates in but nobody can fully explain? Preserve the origin stories before they become 'we've always done it this way.'",
      },
      {
        type: "h3",
        text: "11. A photo with a full story",
      },
      {
        type: "p",
        text: "Not just a photo — a journal entry describing exactly what was happening: who said what, how it felt, what happened right before and after the shutter clicked. The photo shows the moment. The story makes it a memory.",
      },
      {
        type: "h3",
        text: "12. A recipe with the real story",
      },
      {
        type: "p",
        text: "Not just the ingredients and steps — the memory. Who taught it to you. What occasions it belongs to. The one thing you always forget to add until halfway through. The version your grandmother made versus the version you make. Recipes with stories are a form of inheritance.",
      },
      {
        type: "h3",
        text: "13. A parent's letter for a specific milestone",
      },
      {
        type: "p",
        text: "Write the letter you'd want your child to read on their wedding day, their first day as a parent, or when they're struggling with something hard. You don't know exactly when they'll need it — but writing it now means it exists when they do.",
      },
      {
        type: "h3",
        text: "14. What's happening in the world — through your eyes",
      },
      {
        type: "p",
        text: "Not a news summary. Your experience of this moment. What are the conversations your family is having? What feels uncertain? What feels hopeful? A first-person account of living through any era is infinitely more interesting than a historical summary written later.",
      },
      {
        type: "h3",
        text: "15. Something completely ordinary",
      },
      {
        type: "p",
        text: "A receipt. A grocery list. A screenshot of what your phone's home screen looked like. A doodle. A playlist. What you had for dinner on a random Tuesday. Ordinary artifacts become extraordinary documents over time. Future readers will find the mundane details just as fascinating as the meaningful ones — sometimes more.",
      },
      {
        type: "h2",
        text: "Physical vs. Digital Time Capsules",
      },
      {
        type: "p",
        text: "Physical time capsules are tactile and romantic, but they have real problems: they get lost, damaged by water or pests, forgotten, or opened early. Paper is more fragile than it seems.",
      },
      {
        type: "p",
        text: "Digital time capsules solve the durability problem but create new ones: the service might disappear, file formats change, and there's no physical object to 'find.' The best approach is redundancy — but if you're choosing one format, a well-maintained digital archive on a platform designed for permanence is more reliable than a box in the attic.",
      },
      {
        type: "h2",
        text: "How to Set Up a Family Time Capsule That Actually Gets Opened",
      },
      {
        type: "p",
        text: "The most important thing about a time capsule is that it gets opened on the intended date. This requires three things: a clear unlock date, a place that will still exist on that date, and someone who will remember.",
      },
      {
        type: "p",
        text: "FamilyNest has a built-in time capsule feature. You write a letter or record a voice memo, set an unlock date, and it stays sealed until that day arrives. Family members can each contribute their own capsules — and the whole family gets notified when one unlocks. No managing files, no hoping the service is still around, no box in the attic that gets moved in the next renovation.",
      },
      {
        type: "p",
        text: "Private, permanent, and designed to be passed down.",
      },
      {
        type: "cta",
        heading: "Create your first family time capsule",
        body: "Free to start. Write a letter, record a voice memo, or seal a memory for a future date. Your family will be glad you did.",
        buttonText: "Start Your Family Nest",
        href: "/login?mode=signup",
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
