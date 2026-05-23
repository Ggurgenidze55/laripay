'use client';

import { motion } from 'framer-motion';
import { FadeIn } from '@/components/motion/fade-in';
import { AnimatedListItem } from '@/components/motion/interactive';
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
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(wide ? 'max-w-5xl' : 'max-w-3xl')}
    >
      {eyebrow ? <p className="landing-section-label">{eyebrow}</p> : null}
      <h1 className="text-section text-tx-primary dark:text-zinc-50">{title}</h1>
      {description ? (
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-tx-body dark:text-zinc-300">{description}</p>
      ) : null}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
        }}
        className="prose-laripay marketing-page-body mt-10"
      >
        {children}
      </motion.div>
    </motion.article>
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
    <FadeIn>
      <section className="marketing-section-card">
        <h2 className="text-card-h text-tx-primary dark:text-zinc-50">{title}</h2>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-4 space-y-3 text-tx-body dark:text-zinc-300"
        >
          {children}
        </motion.div>
      </section>
    </FadeIn>
  );
}

export function MarketingList({ items }: { items: readonly string[] }) {
  return (
    <motion.ul
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-30px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      className="list-disc space-y-2 pl-5 marker:text-accent"
    >
      {items.map((item) => (
        <AnimatedListItem key={item}>{item}</AnimatedListItem>
      ))}
    </motion.ul>
  );
}

export function MarketingLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <motion.span whileHover={{ x: 3 }} className="inline-block">
      <a href={href} className="font-medium text-accent hover:underline dark:text-indigo-400">
        {children}
      </a>
    </motion.span>
  );
}
