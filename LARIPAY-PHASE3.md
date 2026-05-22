# LariPay.ai — ფაზა 3 (Production)

ფაზა 3 = cloud სერვერი + PostgreSQL + HTTPS + live მოდი (ბიზნესი/KYC ცალკე).

## რა უკვე დაყენდა კოდში

| კომპონენტი | ფაილი |
|-----------|------|
| Docker image | `deploy/Dockerfile` |
| PostgreSQL + app | `deploy/docker-compose.yml` |
| Production env template | `deploy/.env.production.example` |
| HTTPS (Caddy) | `deploy/Caddyfile` |
| Health check | `GET /api/health` |
| Dev/Docker ports | `deploy/docker-compose.override.yml` → app **3001**, Postgres **5433** |
| PostgreSQL migrations | `prisma/migrations/` + `schema.postgresql.prisma` |
| Merchant portal login | `POST /api/laripay/portal/login` + `/laripay/dashboard` |

## სწრაფი სტარტი (ლოკალური production stack)

```bash
cd "/Users/giorgigurgenidze/Desktop/Fintech Pay"
cp deploy/.env.production.example deploy/.env.production
# დაარედაქტირე deploy/.env.production (HOST, secrets, TBC...)

docker compose -f deploy/docker-compose.yml up -d --build
```

შემოწმება:

- http://localhost:3002/api/health (Docker; dev `npm run dev` uses :3000)
- http://localhost:3002/laripay
- `npm run test:docker`
- `docker compose -f deploy/docker-compose.yml logs -f laripay`

## Cloud VPS-ზე გაშვება (Hetzner / DigitalOcean)

### 1) სერვერი

- Ubuntu 22.04+, 2GB+ RAM
- Docker + Docker Compose დაინსტალირება

### 2) DNS

- `laripay.ai` → A record → VPS IP

### 3) Deploy

```bash
git clone <your-repo> /opt/laripay
cd /opt/laripay
cp deploy/.env.production.example deploy/.env.production
nano deploy/.env.production
```

ჩაწერე:

```env
HOST=https://laripay.ai
LARIPAY_RETURN_URL=https://laripay.ai/payment/return
LARIPAY_WEBHOOK_URL=https://laripay.ai/api/webhook
DATABASE_URL=postgresql://laripay:PASSWORD@postgres:5432/laripay
LARIPAY_ALLOW_SIGNUP=0
```

### 4) Caddy HTTPS

`deploy/Caddyfile`-ში შეცვალე დომენი, გააქტიურე `caddy` სერვისი `docker-compose.yml`-ში.

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

### 5) ბანკის URLs

იგივე `HOST` — return + `/api/webhook`.

## ფაზა 3 — ბიზნესი (შენ)

- [ ] TBC/BOG production merchant + live keys
- [ ] იურიდიული / NBG კონსულტაცია
- [ ] KYC onboarding პროცესი
- [ ] Settlement (ფური მერჩანტის ანგარიშზე)
- [ ] `LARIPAY_ALLOW_SIGNUP=0` production-ში (მხოლოდ admin-ით merchant)

## ფაზა 1 vs 3

| | ფაზა 1 | ფაზა 3 |
|--|--------|--------|
| DB | SQLite | PostgreSQL |
| URL | ngrok | დომენი + SSL |
| Host | შენი Mac | Cloud VPS |
| Signup | ღია (dev) | დახურული |

ფაზა 1-ის დასრულება (TBC sandbox) პარალელურად შეიძლება — ngrok-ით.

## სკრიპტები

```bash
npm run docker:up      # production stack local
npm run docker:down
npm run test:phase1    # ფაზა 1 ტესტი (ngrok/dev)
```
