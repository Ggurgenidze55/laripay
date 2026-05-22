'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion/fade-in';
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className={cn(wide ? 'max-w-5xl' : 'max-w-3xl')}
    >
      <Stagger className="space-y-0">
        {eyebrow ? (
          <StaggerItem>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Badge variant="accent" className="mb-4">
                {eyebrow}
              </Badge>
            </motion.div>
          </StaggerItem>
        ) : null}
        <StaggerItem>
          <motion.h1
            className="text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl"
            whileHover={{ letterSpacing: '-0.03em' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {title}
          </motion.h1>
        </StaggerItem>
        {description ? (
          <StaggerItem>
            <p className="mt-5 text-lg leading-relaxed text-foreground-muted">{description}</p>
          </StaggerItem>
        ) : null}
      </Stagger>
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
        }}
        className="prose-laripay mt-10 space-y-6 text-[15px] leading-relaxed text-foreground/65"
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
      <motion.section
        whileHover={{ borderColor: 'rgba(56, 189, 248, 0.25)' }}
        className="space-y-3 rounded-xl border border-transparent border-t-border pt-8 transition-colors first:border-0 first:pt-0"
      >
        <motion.h2
          className="text-xl font-medium text-foreground"
          whileHover={{ x: 4, color: 'var(--accent-cyan)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
          {title}
        </motion.h2>
        <div className="space-y-3 text-foreground/60">{children}</div>
      </motion.section>
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
      className="list-disc space-y-2 pl-5 marker:text-accent-cyan/80"
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
      <a href={href} className="text-accent-cyan hover:underline">
        {children}
      </a>
    </motion.span>
  );
}
