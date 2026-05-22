import { NextRequest, NextResponse } from 'next/server';
import { detectMessageLocale } from '@/lib/ai/detect-locale';
import { buildSystemPrompt } from '@/lib/ai/site-knowledge';
import { isLikelyOnTopic, offTopicReply } from '@/lib/ai/topic-guard';
import { isLocale, type Locale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_MESSAGES = 24;
const MAX_CONTENT_LEN = 4000;
const MAX_OUTPUT_TOKENS = 900;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function parseBody(
  body: unknown,
): { locale: Locale; replyLocale: Locale; messages: ChatMessage[] } | null {
  if (!body || typeof body !== 'object') return null;
  const { locale, replyLocale, messages } = body as {
    locale?: string;
    replyLocale?: string;
    messages?: unknown;
  };
  if (!locale || !isLocale(locale)) return null;
  const resolvedReply =
    replyLocale && isLocale(replyLocale) ? replyLocale : locale;
  if (!Array.isArray(messages) || messages.length === 0) return null;

  const trimmed = messages.slice(-MAX_MESSAGES).flatMap((m) => {
    if (!m || typeof m !== 'object') return [];
    const { role, content } = m as { role?: string; content?: string };
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return [];
    const text = content.trim().slice(0, MAX_CONTENT_LEN);
    if (!text) return [];
    return [{ role, content: text }] as ChatMessage[];
  });

  if (trimmed.length === 0 || trimmed[trimmed.length - 1]?.role !== 'user') return null;
  return { locale, replyLocale: resolvedReply, messages: trimmed };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: { message: 'AI assistant is not configured. Set OPENAI_API_KEY.' } },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { message: 'Invalid JSON body' } }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (!parsed) {
    return NextResponse.json({ error: { message: 'Invalid locale or messages' } }, { status: 400 });
  }

  const lastUser = [...parsed.messages].reverse().find((m) => m.role === 'user');
  if (lastUser && !isLikelyOnTopic(lastUser.content)) {
    const replyLocale = detectMessageLocale(lastUser.content) ?? parsed.locale;
    return NextResponse.json({ message: offTopicReply(replyLocale) });
  }

  const replyLocale =
    (lastUser ? detectMessageLocale(lastUser.content) : null) ?? parsed.replyLocale;

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  const openaiMessages = [
    { role: 'system' as const, content: buildSystemPrompt(parsed.locale, replyLocale) },
    ...parsed.messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        temperature: 0.2,
        max_tokens: MAX_OUTPUT_TOKENS,
      }),
    });

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };

    if (!res.ok) {
      const msg = data.error?.message || `OpenAI error (${res.status})`;
      return NextResponse.json({ error: { message: msg } }, { status: 502 });
    }

    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: { message: 'Empty model response' } }, { status: 502 });
    }

    return NextResponse.json({ message: reply });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Chat request failed';
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
