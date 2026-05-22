import type { Locale } from '@/lib/i18n/config';

const TOPIC_PATTERN =
  /laripay|payka|payment|checkout|webhook|refund|merchant|sandbox|dashboard|integrat|api\b|tbc|bog\b|gel|ლარი|გადახდ|ინტეგრ|მერჩანტ|კონსოლი|shopify|woo|wordpress|pricing|ფას|commission|subscription|demo|onboard|sign\s*up|register|გასაღებ|session|ბანკ|bank|console|დოკუმ|docs|security|status|contact|platform|პლატფორმ|fee|საკომისიო|billing|ბილინგ|endpoint|curl|fetch|redirect|shop\.ge/i;

const OFF_TOPIC_PATTERN =
  /weather|ამინდ|forecast|recipe|რეცეპტ|football|ფეხბურთ|movie|ფილმ|bitcoin|ethereum|dating|პოლიტიკ|election|ამორჩევ|homework|დავალებ|write\s+(me\s+)?a\s+(story|poem|essay)|გამომიგზავნე\s+კოდს\s+(python|java|react)(?!\s*laripay)/i;

const GREETING_PATTERN =
  /^(hi|hello|hey|გამარჯობა|სალამ|good\s+(morning|day)|thanks|thank\s+you|მადლობა)[\s!.?]*$/i;

const CAPABILITY_PATTERN =
  /what can you|რას შეგიძლ|რით დაგეხმარ|what do you (do|know)|რა უნდა გიპასუხ|how does (this|it|laripay) work|როგორ მუშაობს\s+(ეს|ლარიპე|laripay)/i;

export function isLikelyOnTopic(userMessage: string): boolean {
  const text = userMessage.trim();
  if (!text) return false;
  if (OFF_TOPIC_PATTERN.test(text)) return false;
  if (text.length < 80 && GREETING_PATTERN.test(text)) return true;
  if (CAPABILITY_PATTERN.test(text)) return true;
  if (TOPIC_PATTERN.test(text)) return true;
  // "how to" / "როგორ" only when clearly about building/connecting
  if (/how\s+to|როგორ\s+(გავ|დავ|შევ|ავაშენ|დავაკავშირ|ინტეგრ)/i.test(text)) return true;
  return false;
}

export function offTopicReply(locale: Locale): string {
  if (locale === 'ka') {
    return (
      'მე მხოლოდ **LariPay.ai** პროექტის შესახებ ვუპასუხებ: API ინტეგრაცია, TBC/BOG გადახდები, checkout, webhooks, ფასდადება, დემო, onboarding და ამ საიტის გვერდები. ' +
      'გთხოვთ, დასვათ კითხვა მაგალითად: „როგორ გავაკეთო ინტეგრაცია?“ ან „რა endpoints აქვს API-ს?“'
    );
  }
  return (
    'I only answer questions about the **LariPay.ai** project: API integration, TBC/BOG payments, checkout, webhooks, pricing, demo, onboarding, and pages on this site. ' +
    'Please ask something like “How do I integrate?” or “What API endpoints are available?”'
  );
}
