# SmenaYKT

Local gig app for Yakutsk — **one app + partner web, one database**.

## Architecture

| URL | Who |
|-----|-----|
| `/` | Mobile app — post help (TaskRabbit) + browse all tasks |
| `/partner` | Store dashboard — post shifts (invite-only) |

Both read/write the **same SQLite DB** via `/api/*` (swap to Postgres in production).

## Setup

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

- App: http://localhost:3000  
- Partner login: http://localhost:3000/partner/login  
- Demo partner code: **YKT-DEMO-1**

## Try the flow

1. Open `/partner/login` → enter `YKT-DEMO-1` → post a shift  
2. Open `/` or `/tasks` → see it with badge **Предприятие**  
3. Open `/post` → publish a home task → appears with **От человека**

## Stack

Next.js 15 · Prisma · SQLite (dev) · TypeScript · Tailwind

## Production

Set `DATABASE_URL` to PostgreSQL (Timeweb, Supabase, etc.) — same schema, no code change.

See `PROJECT_CONTEXT.txt` for full product notes.
