'use client';

import { FadeIn } from '@/components/motion/fade-in';
import { useLocale } from '@/components/i18n/LocaleProvider';

export function CommerceIntegrationsPanel() {
  const { t } = useLocale();
  const c = t.pages.integrations.commerce;

  return (
    <div className="mt-16 space-y-14">
      {c.sections.map((section) => (
        <FadeIn key={section.id}>
          <section id={section.id} className="scroll-mt-28 space-y-4 border-t border-border pt-10">
            <h2 className="text-xl font-medium text-foreground">{section.title}</h2>
            <p className="max-w-3xl text-foreground/65">{section.intro}</p>
            {section.items ? (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-xl border border-border bg-canvas-elevated/40 px-4 py-3 text-sm text-foreground/75"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
            {section.steps ? (
              <ol className="list-decimal space-y-2 pl-5 text-foreground/65">
                {section.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : null}
            {section.note ? (
              <p className="rounded-xl border border-border bg-canvas-elevated/50 px-4 py-3 font-mono text-xs text-foreground-muted">
                {section.note}
              </p>
            ) : null}
          </section>
        </FadeIn>
      ))}
    </div>
  );
}
