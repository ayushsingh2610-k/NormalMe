# NormalMe 🍳

> **"Given who I am, how I feel right now, and what food I have — what should I cook?"**

NormalMe is a smart, AI-powered meal planning app that turns your pantry, energy level, and personal preferences into personalised dish recommendations and instant full recipes.

---

## ✨ Features

| Feature | Status |
|---|---|
| Auth (Google, Apple, Email/Password) | ✅ |
| Onboarding (skills, allergens, diet) | ✅ |
| Pantry management (add, edit, delete, expiry) | ✅ |
| Expiry notifications & "use soon" banner | ✅ |
| Home screen — energy selector + AI dish recommendations | ✅ |
| Full recipe generation (click-to-expand) | ✅ |
| Pantry / groceries edit screen | ✅ |
| Shopping list | ✅ |
| Insights & analytics | ✅ |
| Profile / account settings | ✅ |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, TypeScript) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Database & Auth | [Supabase](https://supabase.com/) (Postgres + GoTrue) |
| AI / LLM | [Google Gemini API](https://ai.google.dev/) |
| Hosting | [Vercel](https://vercel.com/) + Supabase |

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js** ≥ 18 (LTS recommended)
- **npm** ≥ 9
- A **Supabase** project
- A **Google Gemini** API key

### 2. Clone & Install

```bash
git clone <your-repo-url>
cd NormalMe
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the project root (it is git-ignored by default):

```bash
cp .env.local.example .env.local   # if the example file exists, otherwise create manually
```

Fill in the following values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Google Gemini
GEMINI_API_KEY=<your-gemini-api-key>
```

> **Where to find these values:**
> - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase Dashboard → Project Settings → API
> - `GEMINI_API_KEY` — [Google AI Studio](https://aistudio.google.com/app/apikey)

### 4. Set Up Supabase

#### 4a. Enable Auth Providers

In your Supabase Dashboard → **Authentication → Providers**, enable:

- **Email** (enabled by default)
- **Google** — add your Google OAuth Client ID & Secret from [Google Cloud Console](https://console.cloud.google.com/)
- **Apple** (optional) — requires an Apple Developer account

Add the following to your provider's **redirect URL allowlist**:

```
http://localhost:3000/auth/callback
https://<your-vercel-domain>/auth/callback
```

#### 4b. Create Database Tables

Run the following SQL in **Supabase SQL Editor** (Dashboard → SQL Editor → New Query):

```sql
-- Users profile preferences
create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  diet_type text,
  allergens text[] default '{}',
  skill_level text,
  cuisine_prefs text[] default '{}',
  equipment text[] default '{}',
  household_size int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Pantry items
create table public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text,          -- produce | protein | pantry | frozen
  quantity numeric,
  unit text,
  expiry_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Interaction log (future ML training data)
create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_snapshot jsonb,
  action text,            -- view | click | cook | skip | rate
  context_snapshot jsonb,
  created_at timestamptz default now()
);

-- Shopping list
create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  quantity numeric,
  unit text,
  is_checked boolean default false,
  created_at timestamptz default now()
);

-- Saved recipes & ratings
create table public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_data jsonb not null,
  rating int,             -- 1–5
  cooked_at timestamptz,
  created_at timestamptz default now()
);
```

#### 4c. Enable Row Level Security (RLS)

Run the following to lock down each table to its owner:

```sql
-- Enable RLS
alter table public.user_preferences enable row level security;
alter table public.pantry_items enable row level security;
alter table public.interactions enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.saved_recipes enable row level security;

-- Policies: users can only access their own rows
create policy "Own preferences" on public.user_preferences
  for all using (auth.uid() = user_id);

create policy "Own pantry items" on public.pantry_items
  for all using (auth.uid() = user_id);

create policy "Own interactions" on public.interactions
  for all using (auth.uid() = user_id);

create policy "Own shopping list" on public.shopping_list_items
  for all using (auth.uid() = user_id);

create policy "Own saved recipes" on public.saved_recipes
  for all using (auth.uid() = user_id);
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
src/
├── app/
│   ├── (app)/             # Authenticated route group
│   │   ├── page.tsx       # Home — energy selector + recommendations
│   │   ├── layout.tsx     # App shell with bottom navigation
│   │   ├── pantry/        # Pantry management
│   │   ├── recipe/        # Full recipe view
│   │   ├── shopping/      # Shopping list
│   │   ├── insights/      # Analytics & trends
│   │   └── profile/       # Account settings
│   ├── auth/              # Auth callback + server actions
│   ├── login/             # Login page
│   ├── signup/            # Sign-up page
│   └── onboarding/        # First-run onboarding flow
├── components/
│   ├── BottomNav.tsx      # Mobile bottom navigation bar
│   └── ExpiryBanner.tsx   # Expiring-soon pantry alert
└── lib/
    ├── gemini.ts          # Gemini API wrappers (recommendations + recipes)
    └── supabase/
        ├── client.ts      # Browser Supabase client
        └── server.ts      # Server-side Supabase client (SSR)
```

---

## 🔑 Key Design Decisions

- **Allergen filtering is enforced in code**, not delegated to the LLM. The app filters results before and after every AI call.
- **All LLM responses are structured JSON** (`responseSchema` / JSON mode). Output is defensively parsed — the app never crashes on malformed AI responses.
- **Every user action is logged** to the `interactions` table from day one, even though recommendations aren't personalised yet. This is the future ML training dataset.
- **Gemini API key is server-side only** (`GEMINI_API_KEY`, no `NEXT_PUBLIC_` prefix). It is never exposed to the browser.

---

## 🌐 Deploying to Vercel

1. Push your repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add the three environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`) in **Vercel → Project Settings → Environment Variables**.
4. Add your Vercel deployment URL to the Supabase Auth redirect allowlist.
5. Deploy — Vercel auto-detects Next.js and handles everything else.

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🗺 Roadmap

- [ ] Barcode / OCR pantry input
- [ ] Voice entry for pantry items
- [ ] Personalised ranking (using logged interaction data)
- [ ] Push notifications for expiring items
- [ ] Household sharing / multi-user pantry
