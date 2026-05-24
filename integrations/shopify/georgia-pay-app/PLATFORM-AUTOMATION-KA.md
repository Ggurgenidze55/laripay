# LariPay — რა არის ავტომატური (100+ მერჩანტი)

## ერთხელ — შენ (პლატფორმა)

| რა | ხელით? | როგორ |
|----|--------|--------|
| Vercel env | ერთხელ | `node scripts/sync-vercel-env.mjs` (.env → Vercel) |
| Shopify Partners აპი | ერთხელ | LariPay აპი + redirect URL |
| `shopify app deploy` | ერთხელ / განახლებაზე | payment extension URL-ები |

**არ ამატებ თითო მერჩანტს Vercel-ში.**

## ავტომატური — თითო მერჩანტი

| მოქმედება | რა ხდება |
|-----------|----------|
| **რეგისტრაცია** `/laripay/ka/onboard` | user + merchant + `sk_test_` (ერთხელ ჩანს) |
| **Shopify ინსტალაცია** | `Shop` + `Merchant` slug=მაღაზია + API key + ინტეგრაცია `shopify` |
| **Checkout** | Shopify → `/api/payment_session` → ბანკი → `/api/return` |
| **ბანკი** | მერჩანტი თვითონ: dashboard **ბანკები** ან Shopify აპის **Settings** |
| **Webhooks** | dashboard ან პლაგინის auto-register |

## რა არ არის ავტომატური (და არ უნდა იყოს)

- **TBC/BOG credentials** — თითო მერჩანტის საკუთარი ხელშეკრულება ბანკთან
- **პირველი live გადახდა** — მათ sandbox/production keys-ის შემდეგ

## სწრაფი ბრძანებები

```bash
cd integrations/shopify/georgia-pay-app
cp .env.example .env   # თუ არ გაქვს
# შეავსე SHOPIFY_* და DATABASE_URL
node scripts/sync-vercel-env.mjs
npx vercel deploy --prod
```

მერჩანტებისთვის მხოლოდ მიეცი ლინკი: `https://laripay.vercel.app/laripay/ka/onboard`  
Shopify-ისთვის: დააინსტალირე ერთი LariPay აპი — ყოველი მაღაზია თავად უკავშირდება.
