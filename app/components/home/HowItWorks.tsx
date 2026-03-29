import { UserPlus, Send, Heart } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "1",
    title: "Create your Nest",
    description:
      "Takes 30 seconds. Name it, pick how it looks, and you're in. No credit card required to start.",
  },
  {
    icon: Send,
    number: "2",
    title: "Add the people in your home",
    description:
      "Your partner, your kids. That's your nest. Extended family can get updates without needing an account — more on that in a second.",
  },
  {
    icon: Heart,
    number: "3",
    title: "Start writing. Seriously, just start.",
    description:
      "One journal entry. One voice memo. One sentence. Future you will be embarrassingly grateful.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: "var(--card)" }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p
            className="mb-3 text-sm font-medium uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            How it works
          </p>
          <h2
            className="mb-4 text-3xl md:text-4xl"
            style={{
              fontFamily: "var(--font-display-serif)",
              color: "var(--foreground)",
              textWrap: "balance",
            }}
          >
            Up and running before your coffee gets cold
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: "rgba(61,107,94,0.1)" }}
                >
                  <step.icon className="h-6 w-6" style={{ color: "var(--primary)" }} />
                </div>
                <span
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                >
                  {step.number}
                </span>
              </div>
              <h3
                className="text-lg font-semibold"
                style={{
                  fontFamily: "var(--font-display-serif)",
                  color: "var(--foreground)",
                }}
              >
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm" style={{ color: "var(--muted)" }}>
          Start with your household. Expand if you want. Keep it yours either way.
        </p>
      </div>
    </section>
  );
}
