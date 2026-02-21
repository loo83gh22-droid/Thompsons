'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "Is my family's data private?",
    answer:
      "Absolutely. Your Family Nest is completely private by default. Only family members you invite can see your content. We use bank-level encryption, and your data is stored on secure US-based servers. Unlike social media, we never sell your data or show ads.",
  },
  {
    question: "Can I be in more than one family?",
    answer:
      "Yes! This is one of the most popular features for grandparents and extended family. If your son starts a Nest and your daughter starts a different one, you can be a member of both. You'll see all your families when you log in and can switch between them with one click. You only need one account — no matter how many families you belong to.",
  },
  {
    question: "What happens if I stop paying?",
    answer:
      "You can downgrade to the Free plan anytime and keep your first 10 journal entries and 500 MB of photos forever. No data is ever deleted when you downgrade. If you choose the Legacy plan, you own it for life—no recurring payments, ever.",
  },
  {
    question: "I'm a grandparent — is this easy enough for me?",
    answer:
      "Absolutely. We designed Our Family Nest with grandparents in mind from day one. Big buttons, clear labels, and no confusing settings. If you can check email, you can use the Nest. Many grandparents tell us it's the first thing they open with their morning coffee.",
  },
  {
    question: "How is this different from Google Photos or iCloud?",
    answer:
      "Google Photos and iCloud store photos, but Our Family Nest preserves your family's story. You get journals, voice memos, recipes, traditions, family trees, and a timeline—all in one place. Plus, it's designed for sharing across generations, not just storing files.",
  },
  {
    question: "Who pays — me or the person who starts the Nest?",
    answer:
      "Only the Nest creator picks a plan. Everyone else joins for free. So if your daughter starts a Nest and invites you, you don't pay anything. If you want to start your own Nest too, that one would have its own plan (the free tier is a great starting point).",
  },
  {
    question: "Can I give this as a gift?",
    answer:
      "Absolutely — and it makes an incredible one. Start a Nest, upload some family photos to get it going, then invite the family. Many people wrap the login details on a card for Christmas or Mother\u2019s Day. The Legacy plan is especially popular as a gift since it\u2019s a one-time purchase that lasts forever.",
  },
  {
    question: "Will my family actually use this?",
    answer:
      "That\u2019s the number one concern we hear \u2014 and the answer is yes. The Nest is designed so everyone can contribute on their own terms. Dad posts a fishing photo, Grandma shares a recipe, the kids add a silly video. You don\u2019t have to be the family archivist. Once one person starts, others jump in naturally.",
  },
  {
    question: "Can I import my existing photos?",
    answer:
      "Yes! You can bulk upload photos from your phone, computer, Google Photos, or iCloud. We support all common formats (JPG, PNG, HEIC) and organize them automatically by date and family member.",
  },
];

export function HomepageFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Questions? We&apos;ve got answers.
          </h2>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <span
                  className="font-display text-lg font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  style={{ color: "var(--muted)" }}
                />
              </button>
              {openIndex === index && (
                <div className="border-t px-6 pb-6 pt-4" style={{ borderColor: "var(--border)" }}>
                  <p className="leading-relaxed" style={{ color: "var(--muted)" }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
