# LariPay.ai — გაშვება

დომენი: **https://laripay.ai**

## ერთი ბრძანება

```bash
cd "/Users/giorgigurgenidze/Desktop/Fintech Pay"
npm start
```

გაიხსნება:

- **Local:** http://localhost:3000
- **Public:** ngrok URL (იხილე ტერმინალში ან http://127.0.0.1:4040)
- **LariPay.ai UI:** `/laripay`, `/laripay/dashboard`
- **Demo:** `/demo`
- **API setup:** `/api/laripay/setup`
- **Webhook:** `/api/webhook`

URL-ების განახლება: `npm run sync:ngrok`

## `.env` (ერთხელ)

`integrations/shopify/georgia-pay-app/.env`:

```env
HOST=https://your-subdomain.ngrok-free.dev
LARIPAY_ADMIN_SECRET=your-secret
LARIPAY_DEMO_API_KEY=sk_test_...   # /api/laripay/setup-დან

TBC_CLIENT_ID=...
TBC_CLIENT_SECRET=...
BOG_PUBLIC_KEY=...
BOG_SECRET_KEY=...
```

## Shopify (არ არის სავალდებულო demo-სთვის)

```bash
cd integrations/shopify/georgia-pay-app
npx shopify auth login
npm run shopify:link
npm run shopify:dev
```

## სასარგებლო

| ბრძანება | აღწერა |
|----------|--------|
| `npm start` | Next + ngrok + sync |
| `npm run health` | HTTP შემოწმება |
| `npm run sync:ngrok` | მხოლოდ URL sync |
| `npm run docker:up` | Docker stack (LariPay.ai) |

API დოკუმენტაცია: [LARIPAY-API.md](./LARIPAY-API.md)
