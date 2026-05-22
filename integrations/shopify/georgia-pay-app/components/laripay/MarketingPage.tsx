import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type MarketingPageProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
};

export function MarketingPage({
  eyebrow,
  title,
  description,
  children,
  wide = false,
}: MarketingPageProps) {
  return (
    <article className={cn(wide ? 'max-w-5xl' : 'max-w-3xl')}>
      {eyebrow ? (
        <Badge variant="accent" className="mb-4">
          {eyebrow}
        </Badge>
      ) : null}
      <h1 className="text-4xl font-semibold tracking-[-0.02em] text-white sm:text-5xl">{title}</h1>
      {description ? (
        <p className="mt-5 text-lg leading-relaxed text-white/50">{description}</p>
      ) : null}
      <div className="prose-laripay mt-10 space-y-6 text-[15px] leading-relaxed text-white/65">
        {children}
      </div>
    </article>
  );
}

export function MarketingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-white/[0.06] pt-8 first:border-0 first:pt-0">
      <h2 className="text-xl font-medium text-white/90">{title}</h2>
      <div className="space-y-3 text-white/60">{children}</div>
    </section>
  );
}

export function MarketingList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-accent-cyan/80">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
