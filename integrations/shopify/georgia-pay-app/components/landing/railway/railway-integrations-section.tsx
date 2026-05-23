'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from '@/components/i18n/LocaleProvider';
import type { Locale } from '@/lib/i18n/config';
import { localePath } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

type Platform = {
  slug: string;
  name: string;
  desc: string;
  tag: string;
};

type Visual = {
  glyph: string;
  accent: string;
  glow: string;
  gradient: string;
  lines: readonly string[];
  metric: { label: string; value: string };
};

const PLATFORM_VISUAL: Record<string, Visual> = {
  shopify: {
    glyph: 'S',
    accent: '#34d399',
    glow: 'rgba(52,211,153,0.45)',
    gradient: 'from-emerald-500/25 via-[#8b5cf6]/12 to-[#0b0a10]',
    lines: ['Shopify Payments app · offsite checkout', 'Installment extension synced', 'Merchant auto-provisioned'],
    metric: { label: 'sync', value: '42ms' },
  },
  woocommerce: {
    glyph: 'W',
    accent: '#a78bfa',
    glow: 'rgba(139,92,246,0.5)',
    gradient: 'from-violet-500/25 via-[#6366f1]/12 to-[#0b0a10]',
    lines: ['WooCommerce gateway active', 'Delivery + warehouse plugins', 'Webhook payment.complete'],
    metric: { label: 'sync', value: '38ms' },
  },
  'commerce-php': {
    glyph: 'PHP',
    accent: '#818cf8',
    glow: 'rgba(99,102,241,0.45)',
    gradient: 'from-indigo-500/25 via-[#8b5cf6]/10 to-[#0b0a10]',
    lines: ['CS-Cart · OpenCart · PrestaShop', 'Signed checkout redirect', 'Module config verified'],
    metric: { label: 'sync', value: '51ms' },
  },
  delivery: {
    glyph: '↗',
    accent: '#22d3ee',
    glow: 'rgba(34,211,238,0.4)',
    gradient: 'from-cyan-500/20 via-[#8b5cf6]/10 to-[#0b0a10]',
    lines: ['12+ courier carriers connected', 'Rates · labels · tracking API', 'Shipment webhook queued'],
    metric: { label: 'carriers', value: '12+' },
  },
  warehouse: {
    glyph: '▣',
    accent: '#fbbf24',
    glow: 'rgba(251,191,36,0.35)',
    gradient: 'from-amber-500/20 via-[#8b5cf6]/10 to-[#0b0a10]',
    lines: ['Fina · Optimo · 1C · FMG Soft', 'Stock sync job running', 'Order export acknowledged'],
    metric: { label: 'ERP', value: '4' },
  },
  api: {
    glyph: '{ }',
    accent: '#c4b5fd',
    glow: 'rgba(167,139,250,0.5)',
    gradient: 'from-[#8b5cf6]/30 via-indigo-500/15 to-[#0b0a10]',
    lines: ['Bearer sk_live_… authenticated', 'POST /v1/checkout/sessions', 'Headless · mobile · custom stack'],
    metric: { label: 'API', value: 'REST' },
  },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#a78bfa]">{children}</p>
  );
}

type MeasuredRect = { left: number; top: number; width: number; height: number };
type Point = { x: number; y: number };
type LineEndpoints = { x1: number; y1: number; x2: number; y2: number };

function rectCenter(r: MeasuredRect): Point {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function rectBorderToward(rect: MeasuredRect, target: Point): Point {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = target.x - cx;
  const dy = target.y - cy;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return { x: cx, y: cy };
  const hw = rect.width / 2;
  const hh = rect.height / 2;
  const scale = Math.min(Math.abs(hw / dx), Math.abs(hh / dy));
  return { x: cx + dx * scale, y: cy + dy * scale };
}

function connectorEndpoints(from: MeasuredRect, to: MeasuredRect): LineEndpoints {
  const toCenter = rectCenter(to);
  const fromCenter = rectCenter(from);
  const start = rectBorderToward(from, toCenter);
  const end = rectBorderToward(to, fromCenter);
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}

function lineLength(line: LineEndpoints) {
  return Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
}

function IntegrationHub({
  platforms,
  activeIndex,
  onSelect,
}: {
  platforms: Platform[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [lines, setLines] = useState<Record<number, LineEndpoints>>({});
  const [size, setSize] = useState({ w: 0, h: 0 });

  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    const hub = hubRef.current;
    if (!canvas || !hub) return;

    const canvasRect = canvas.getBoundingClientRect();
    setSize({ w: canvasRect.width, h: canvasRect.height });

    const hubRect = hub.getBoundingClientRect();
    const hubMeasured: MeasuredRect = {
      left: hubRect.left - canvasRect.left,
      top: hubRect.top - canvasRect.top,
      width: hubRect.width,
      height: hubRect.height,
    };

    const next: Record<number, LineEndpoints> = {};
    nodeRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nodeMeasured: MeasuredRect = {
        left: r.left - canvasRect.left,
        top: r.top - canvasRect.top,
        width: r.width,
        height: r.height,
      };
      next[i] = connectorEndpoints(hubMeasured, nodeMeasured);
    });
    setLines(next);
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (canvasRef.current) ro.observe(canvasRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, platforms.length, activeIndex]);

  const active = platforms[activeIndex];
  const activeVisual = PLATFORM_VISUAL[active?.slug ?? 'api'] ?? PLATFORM_VISUAL.api;

  return (
    <div
      ref={canvasRef}
      className="relative mx-auto aspect-[4/3] w-full max-w-[520px] sm:aspect-[5/4] lg:max-w-none lg:aspect-auto lg:min-h-[340px]"
    >
      {size.w > 0 && size.h > 0 ? (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="hub-line-idle" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(139,92,246,0.08)" />
              <stop offset="100%" stopColor="rgba(139,92,246,0.2)" />
            </linearGradient>
            <linearGradient id="hub-line-active" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={activeVisual.accent} stopOpacity={0.9} />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          {platforms.map((_, i) => {
            const line = lines[i];
            if (!line) return null;
            const len = lineLength(line);
            const isActive = i === activeIndex;
            return (
              <g key={i}>
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={isActive ? 'url(#hub-line-active)' : 'url(#hub-line-idle)'}
                  strokeWidth={isActive ? 2 : 1}
                  strokeLinecap="round"
                />
                {isActive ? (
                  <motion.line
                    key={activeIndex}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={activeVisual.accent}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeDasharray={`${len}`}
                    initial={{ strokeDashoffset: len }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 0.7, ease: EASE }}
                    opacity={0.85}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>
      ) : null}

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="h-[55%] w-[55%] rounded-full opacity-40 blur-3xl transition-colors duration-700"
          style={{ backgroundColor: activeVisual.glow }}
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={hubRef}
          className="relative z-10 flex h-[72px] w-[72px] flex-col items-center justify-center rounded-2xl border border-[#8b5cf6]/40 bg-[#13111a] shadow-[0_0_60px_-8px_rgba(139,92,246,0.65),inset_0_1px_0_rgba(255,255,255,0.1)] sm:h-20 sm:w-20"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a78bfa]">LP</span>
          <span className="mt-0.5 font-mono text-[9px] text-[#71717a]">hub</span>
          <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#4ade80] ring-4 ring-[#4ade80]/20" />
        </div>
      </div>

      {platforms.map((p, i) => {
        const visual = PLATFORM_VISUAL[p.slug] ?? PLATFORM_VISUAL.api;
        const isActive = i === activeIndex;
        const angle = (i / platforms.length) * Math.PI * 2 - Math.PI / 2;
        const radiusPct = 42;
        const left = 50 + Math.cos(angle) * radiusPct;
        const top = 50 + Math.sin(angle) * radiusPct;

        return (
          <button
            key={p.slug}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            type="button"
            onClick={() => onSelect(i)}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 outline-none"
            style={{ left: `${left}%`, top: `${top}%` }}
            aria-pressed={isActive}
            aria-label={p.name}
          >
            <motion.div
              animate={isActive ? { scale: 1.08 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className={cn(
                'relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2 transition-colors sm:px-3',
                isActive
                  ? 'border-white/20 bg-[#1a1724] shadow-[0_0_32px_-6px_var(--node-glow)]'
                  : 'border-white/[0.08] bg-[#13111a]/90 hover:border-white/15 hover:bg-[#16141f]',
              )}
              style={{ '--node-glow': visual.glow } as React.CSSProperties}
            >
              {isActive ? (
                <motion.span
                  layoutId="hub-node-ring"
                  className="pointer-events-none absolute -inset-px rounded-xl ring-1 ring-[#8b5cf6]/70"
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                />
              ) : null}
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/50 font-mono text-[10px] font-bold text-white sm:h-10 sm:w-10 sm:text-xs"
                style={{ color: isActive ? visual.accent : undefined }}
              >
                {visual.glyph}
              </span>
              <span
                className={cn(
                  'max-w-[72px] truncate text-center text-[9px] font-semibold sm:max-w-[88px] sm:text-[10px]',
                  isActive ? 'text-white' : 'text-[#71717a]',
                )}
              >
                {p.name.split(' ')[0]}
              </span>
            </motion.div>
          </button>
        );
      })}
    </div>
  );
}

function IntegrationStage({
  platform,
  index,
  locale,
  learnMore,
}: {
  platform: Platform;
  index: number;
  locale: Locale;
  learnMore: string;
}) {
  const visual = PLATFORM_VISUAL[platform.slug] ?? PLATFORM_VISUAL.api;
  const lineCount = visual.lines.length;
  const [lineIndex, setLineIndex] = useState(lineCount - 1);
  const [step, setStep] = useState(2);

  useEffect(() => {
    setLineIndex(0);
    setStep(0);

    const timeouts: number[] = [];
    timeouts.push(window.setTimeout(() => setStep(1), 400));
    timeouts.push(window.setTimeout(() => setStep(2), 900));

    for (let i = 0; i < lineCount; i++) {
      timeouts.push(window.setTimeout(() => setLineIndex(i), 1400 + i * 650));
    }

    return () => timeouts.forEach((t) => window.clearTimeout(t));
  }, [platform.slug, lineCount]);

  const flowSteps =
    locale === 'ka'
      ? ['მაღაზია', 'LariPay', 'ბანკი']
      : ['Store', 'LariPay', 'Bank'];

  return (
    <motion.div
      key={platform.slug}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={cn(
        'relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br p-6 sm:p-8',
        visual.gradient,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      />
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl"
        style={{ backgroundColor: visual.glow }}
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#c4b5fd]">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: visual.accent }} />
            {platform.tag}
          </span>
          <h3 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">{platform.name}</h3>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#c4b5fd]/85">{platform.desc}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-black/40 font-mono text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            style={{ color: visual.accent }}
          >
            {visual.glyph}
          </div>
          <span className="rounded-lg border border-white/[0.08] bg-black/30 px-2 py-1 font-mono text-[10px] text-[#a1a1aa]">
            {visual.metric.label} · {visual.metric.value}
          </span>
        </div>
      </div>

      <div className="relative mt-6 flex items-center justify-center gap-2 sm:gap-3">
        {flowSteps.map((label, i) => (
          <div key={label} className="flex items-center gap-2 sm:gap-3">
            <motion.div
              animate={{
                borderColor: step >= i ? visual.accent : 'rgba(255,255,255,0.1)',
                backgroundColor: step >= i ? `${visual.accent}18` : 'rgba(0,0,0,0.35)',
              }}
              className="rounded-lg border px-3 py-2 text-center text-[10px] font-semibold text-white sm:px-4 sm:text-xs"
            >
              {label}
            </motion.div>
            {i < flowSteps.length - 1 ? (
              <motion.span
                animate={{ opacity: step > i ? 1 : 0.25 }}
                className="text-[#8b5cf6]"
              >
                →
              </motion.span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="relative mt-6 grid flex-1 gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a090f]/80 backdrop-blur-md">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-[#ef4444]/80" />
            <span className="h-2 w-2 rounded-full bg-[#eab308]/80" />
            <span className="h-2 w-2 rounded-full bg-[#22c55e]/80" />
            <span className="ml-1 font-mono text-[10px] text-[#71717a]">
              channel · {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          <div className="space-y-2 p-3 font-mono text-[11px]">
            <p className="text-[#bbf7d0]">→ {visual.lines[lineIndex]}</p>
            <p className="text-[#4ade80]">✓ handshake complete</p>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#0a090f]/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#52525b]">
            {locale === 'ka' ? 'სინქრონიზაცია' : 'Live sync'}
          </p>
          <ul className="mt-3 space-y-2">
            {visual.lines.map((line, i) => (
              <li key={line} className="flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px]',
                    i <= lineIndex
                      ? 'border-[#4ade80]/40 bg-[#4ade80]/15 text-[#4ade80]'
                      : 'border-white/10 bg-white/[0.03] text-[#52525b]',
                  )}
                >
                  {i <= lineIndex ? '✓' : '·'}
                </span>
                <span className={i === lineIndex ? 'text-[#e4e4e7]' : 'text-[#71717a]'}>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Link
        href={localePath(locale, `integrations/${platform.slug}`)}
        className="relative mt-6 inline-flex w-fit items-center gap-2 rounded-lg border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-4 py-2.5 text-sm font-semibold text-[#e9d5ff] transition-colors hover:border-[#8b5cf6]/50 hover:bg-[#8b5cf6]/20"
      >
        {learnMore}
        <span aria-hidden>→</span>
      </Link>
    </motion.div>
  );
}

function PlatformRail({
  platforms,
  activeIndex,
  onSelect,
  locale,
  learnMore,
}: {
  platforms: Platform[];
  activeIndex: number;
  onSelect: (index: number) => void;
  locale: Locale;
  learnMore: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {platforms.map((p, i) => {
        const visual = PLATFORM_VISUAL[p.slug] ?? PLATFORM_VISUAL.api;
        const isActive = i === activeIndex;
        return (
          <Link
            key={p.slug}
            href={localePath(locale, `integrations/${p.slug}`)}
            onMouseEnter={() => onSelect(i)}
            onFocus={() => onSelect(i)}
            className={cn(
              'group relative flex min-w-[140px] shrink-0 flex-col rounded-xl border p-3 transition-all duration-300 sm:min-w-[160px]',
              isActive
                ? 'border-[#8b5cf6]/45 bg-[#1a1724] shadow-[0_0_28px_-8px_rgba(139,92,246,0.5)]'
                : 'border-white/[0.08] bg-[#13111a]/80 hover:border-white/12',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/40 font-mono text-[10px] font-bold"
                style={{ color: isActive ? visual.accent : '#a1a1aa' }}
              >
                {visual.glyph}
              </span>
              {isActive ? (
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: visual.accent }} />
              ) : null}
            </div>
            <p className="mt-2 truncate text-sm font-semibold text-white">{p.name}</p>
            <p className="mt-0.5 text-[10px] text-[#71717a] group-hover:text-[#a78bfa]">{learnMore} →</p>
          </Link>
        );
      })}
    </div>
  );
}

export function RailwayIntegrationsSection() {
  const { locale, t } = useLocale();
  const s = t.landing.integrationsSection;
  const platforms = s.platforms as Platform[];

  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const active = platforms[activeIndex] ?? platforms[0];
  const connectedLabel = locale === 'ka' ? 'არხები აქტიურია' : 'channels live';

  return (
    <section ref={sectionRef} className="relative border-t border-white/[0.06] bg-[#08070c] px-6 py-20 md:py-28">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 60% 45% at 15% 0%, rgba(139,92,246,0.2), transparent 55%),
            radial-gradient(ellipse 50% 35% at 95% 100%, rgba(99,102,241,0.14), transparent 50%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent)',
        }}
      />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <SectionLabel>{s.eyebrow}</SectionLabel>
            <h2 className="mt-4 text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-[-0.03em] text-white">
              {s.title}
            </h2>
            <p className="mt-4 text-[#a1a1aa]">{s.description}</p>
          </div>
          <Link
            href={localePath(locale, 'integrations')}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[#c4b5fd] transition-colors hover:border-[#8b5cf6]/40 hover:bg-[#8b5cf6]/10 hover:text-[#e9d5ff]"
          >
            {s.viewAll} →
          </Link>
        </div>

        <div className="mt-12 overflow-hidden rounded-[1.35rem] border border-white/[0.1] bg-[#0b0a10]/95 shadow-[0_0_140px_-50px_rgba(139,92,246,0.65),inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-[#13111a]/60 px-5 py-3.5 backdrop-blur-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#71717a]">
              {locale === 'ka' ? 'ინტეგრაციის ჰაბი' : 'integration hub'}
            </span>
            <span className="flex items-center gap-2 font-mono text-[10px] text-[#4ade80]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
              {platforms.length}/{platforms.length} {connectedLabel} · {active.name}
            </span>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div className="border-b border-white/[0.06] p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#52525b] lg:text-left">
                {locale === 'ka' ? 'აირჩიე არხი' : 'Select channel'}
              </p>
              <IntegrationHub
                platforms={platforms}
                activeIndex={activeIndex}
                onSelect={setActiveIndex}
              />
            </div>

            <div className="p-5 sm:p-6">
              <AnimatePresence mode="wait">
                <IntegrationStage
                  key={active.slug}
                  platform={active}
                  index={activeIndex}
                  locale={locale}
                  learnMore={s.learnMore}
                />
              </AnimatePresence>
            </div>
          </div>

          <div className="border-t border-white/[0.06] bg-[#0d0c12]/80 px-5 py-4 sm:px-6">
            <PlatformRail
              platforms={platforms}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
              locale={locale}
              learnMore={s.learnMore}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
