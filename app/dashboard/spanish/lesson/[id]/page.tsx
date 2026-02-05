export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">
        Lesson 1: Greetings
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        Essential phrases for saying hello and goodbye.
      </p>

      <div className="mt-12 space-y-8">
        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--accent)]">
            Vocabulary
          </h2>
          <ul className="mt-4 space-y-2">
            <li className="flex justify-between rounded-lg bg-[var(--surface)] px-4 py-3">
              <span>Hola</span>
              <span className="text-[var(--muted)]">Hello</span>
            </li>
            <li className="flex justify-between rounded-lg bg-[var(--surface)] px-4 py-3">
              <span>Buenos días</span>
              <span className="text-[var(--muted)]">Good morning</span>
            </li>
            <li className="flex justify-between rounded-lg bg-[var(--surface)] px-4 py-3">
              <span>¿Cómo estás?</span>
              <span className="text-[var(--muted)]">How are you?</span>
            </li>
            <li className="flex justify-between rounded-lg bg-[var(--surface)] px-4 py-3">
              <span>Adiós</span>
              <span className="text-[var(--muted)]">Goodbye</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--accent)]">
            Practice
          </h2>
          <p className="mt-4 text-[var(--muted)]">
            Quiz and flashcard features coming soon. For now, study the list above!
          </p>
        </section>
      </div>
    </div>
  );
}
