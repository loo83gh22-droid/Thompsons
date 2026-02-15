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
    question: "What happens if I stop paying?",
    answer:
      "You can downgrade to the Free plan anytime and keep your first 10 journal entries and 500 MB of photos forever. No data is ever deleted when you downgrade. If you choose the Legacy plan, you own it for life—no recurring payments, ever.",
  },
  {
    question: "Can my 80-year-old grandma actually use this?",
    answer:
      "Yes! We designed Our Family Nest to be simple enough for grandparents who struggle with tech. Big buttons, clear labels, and no confusing settings. Many families tell us their grandparents check the Nest daily—it's that easy.",
  },
  {
    question: "How is this different from Google Photos or iCloud?",
    answer:
      "Google Photos and iCloud store photos, but Our Family Nest preserves your family's story. You get journals, voice memos, recipes, traditions, family trees, and a timeline—all in one place. Plus, it's designed for sharing across generations, not just storing files.",
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
            Questions? We've got answers.
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
