'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { detectMessageLocale } from '@/lib/ai/detect-locale';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { cn } from '@/lib/utils';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export function LariPayChat() {
  const { locale, t } = useLocale();
  const c = t.chat;
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevLocale = useRef(locale);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (prevLocale.current !== locale) {
      prevLocale.current = locale;
      setMessages([{ role: 'assistant', content: c.welcome }]);
      setError('');
    }
  }, [locale, c.welcome]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: c.welcome }]);
    }
  }, [open, messages.length, c.welcome]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, loading]);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(id);
    }
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setError('');
      const userMsg: ChatMessage = { role: 'user', content: trimmed };
      const next = [...messages, userMsg];
      setMessages(next);
      setInput('');
      setLoading(true);

      const replyLocale = detectMessageLocale(trimmed) ?? locale;

      try {
        const res = await fetch('/api/laripay/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale, replyLocale, messages: next }),
        });
        const data = (await res.json()) as { message?: string; error?: { message?: string } };

        if (!res.ok) {
          setError(data.error?.message || c.errorGeneric);
          return;
        }

        if (data.message) {
          setMessages((prev) => [...prev, { role: 'assistant', content: data.message! }]);
        }
      } catch {
        setError(c.errorGeneric);
      } finally {
        setLoading(false);
      }
    },
    [c.errorGeneric, loading, locale, messages],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send(input);
  }

  if (!mounted) return null;

  const ui = (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-20 right-4 z-[80] flex h-[min(520px,calc(100dvh-6rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border-strong bg-canvas/95 shadow-2xl backdrop-blur-xl sm:right-6"
            role="dialog"
            aria-label={c.title}
          >
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{c.title}</p>
                <p className="truncate text-xs text-foreground-muted">{c.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-lg leading-none text-foreground-muted transition-colors hover:bg-foreground/10 hover:text-foreground"
                aria-label={c.close}
              >
                ×
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={cn(
                    'max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'ml-auto bg-gradient-to-r from-accent-blue to-accent-violet text-white'
                      : 'mr-auto border border-border bg-canvas-elevated/80 text-foreground/85',
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
              {loading && (
                <div className="mr-auto flex gap-1 rounded-2xl border border-border bg-canvas-elevated/80 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-accent-cyan [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-accent-cyan [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-accent-cyan [animation-delay:240ms]" />
                </div>
              )}
            </div>

            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 border-t border-border/60 px-4 py-2">
                {c.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={loading}
                    onClick={() => void send(s)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-foreground-muted transition-colors hover:border-accent-cyan/40 hover:text-accent-cyan"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {error && <p className="px-4 pb-1 text-xs text-red-400">{error}</p>}

            <form onSubmit={onSubmit} className="border-t border-border p-3">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  rows={2}
                  placeholder={c.placeholder}
                  disabled={loading}
                  className="min-h-[44px] flex-1 resize-none rounded-xl border border-border-strong bg-canvas px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="shrink-0 self-end rounded-xl bg-gradient-to-r from-accent-blue to-accent-violet px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
                >
                  {c.send}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-foreground-muted/70">{c.disclaimer}</p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'fixed bottom-4 right-4 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-blue to-accent-violet text-white shadow-glow sm:right-6',
          open && 'ring-2 ring-accent-cyan/50',
        )}
        aria-expanded={open}
        aria-label={open ? c.close : c.open}
      >
        {open ? (
          <span className="text-xl">×</span>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 3c4.97 0 9 3.58 9 8s-4.03 8-9 8c-.9 0-1.76-.12-2.55-.34L5 21l2.34-3.45C6.56 16.18 6 15.14 6 14c0-4.42 4.03-8 9-8Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="11" r="1" fill="currentColor" />
            <circle cx="12" cy="11" r="1" fill="currentColor" />
            <circle cx="15" cy="11" r="1" fill="currentColor" />
          </svg>
        )}
      </motion.button>
    </>
  );

  return createPortal(ui, document.body);
}
