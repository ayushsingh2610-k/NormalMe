# NormalMe 🍳

> **Given who I am, how I feel right now, and what food I have — what should I cook?**

NormalMe is an AI-powered meal planning application that transforms the ingredients in your pantry, your current energy level, dietary preferences, cooking ability, and personal constraints into practical meal recommendations and complete recipes.

Instead of searching through endless recipes, NormalMe starts with **you and what you already have.**

---

## ✨ Why NormalMe?

Meal planning usually requires answering several questions:

- What ingredients do I already have?
- What can I make with them?
- How much effort do I want to put in?
- Does the recipe fit my diet?
- Does it contain anything I'm allergic to?
- What ingredients do I need to buy?

NormalMe combines these constraints into a single personalized cooking experience.

**Pantry → Context → AI Recommendations → Recipe → Shopping List**

---

## 🚀 Features

| Feature | Status |
|---|---|
| 🔐 Google / Apple / Email Authentication | ✅ |
| 👤 Personalized Onboarding | ✅ |
| 🥗 Dietary Preference Management | ✅ |
| ⚠️ Allergen Management | ✅ |
| 🧑‍🍳 Cooking Skill & Equipment Setup | ✅ |
| 🥫 Pantry Management | ✅ |
| 📅 Expiry Date Tracking | ✅ |
| 🔔 Expiry / Use-Soon Alerts | ✅ |
| ⚡ Energy-Based Recommendations | ✅ |
| 🤖 AI-Powered Dish Recommendations | ✅ |
| 📖 Full Recipe Generation | ✅ |
| 🛒 Shopping List | ✅ |
| 📊 Insights & Analytics | ✅ |
| 👤 Profile & Account Settings | ✅ |
| 🧠 Interaction Tracking | ✅ |

---

## 🧠 How It Works

NormalMe combines structured user information with the current pantry state and cooking context.

```text
                  ┌─────────────────────┐
                  │    User Profile     │
                  │                     │
                  │ • Diet              │
                  │ • Allergens         │
                  │ • Skill Level       │
                  │ • Cuisine           │
                  │ • Equipment         │
                  └──────────┬──────────┘
                             │
                             ▼
┌─────────────────┐   ┌─────────────────────┐
│     Pantry      │──▶│ Recommendation      │
│                 │   │ Engine              │
│ • Ingredients   │   │                     │
│ • Quantities    │   │ Gemini + Rules      │
│ • Expiry Dates  │   └──────────┬──────────┘
└─────────────────┘              │
                                 ▼
                       ┌──────────────────┐
                       │ Dish Suggestions │
                       └────────┬─────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Full Recipe      │
                       │                  │
                       │ Ingredients      │
                       │ Instructions     │
                       │ Cooking Time     │
                       └────────┬─────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Shopping List    │
                       └──────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 |
| Language | TypeScript |
| Frontend | React |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL |
| Backend Services | Supabase |
| Authentication | Supabase Auth |
| AI | Google Gemini API |
| Hosting | Vercel |
| Version Control | Git / GitHub |

---

## 🏗️ Architecture

```text
Next.js Application
│
├── App Router
│   ├── Authentication
│   ├── Onboarding
│   └── Protected Application Routes
│
├── React Components
│   ├── Navigation
│   ├── Pantry
│   ├── Recipes
│   ├── Shopping List
│   └── Insights
│
├── Supabase
│   ├── PostgreSQL
│   ├── Authentication
│   └── Row Level Security
│
└── Gemini API
    ├── Dish Recommendations
    └── Recipe Generation
```

---

## 🔐 Security & Data Protection

Security was considered as part of the application architecture.

### Server-Side Gemini API Key

The Gemini API key is stored exclusively on the server:

```env
GEMINI_API_KEY=your-api-key
```

It intentionally does not use the `NEXT_PUBLIC_` prefix, preventing exposure to browser-side JavaScript.

### Row Level Security

Supabase Row Level Security ensures users can only access records belonging to their own account.

```sql
auth.uid() = user_id
```

This protection is applied to:

- User preferences
- Pantry items
- Shopping list items
- Saved recipes
- Interaction history

### Allergen Safety

Allergen filtering is handled by application logic rather than relying exclusively on the LLM.

The application validates recommendations against the user's allergen preferences before presenting them.

> **Note:** AI-generated recipes should still be independently checked by users, particularly for severe allergies or dietary restrictions.

---

## 🤖 AI Architecture

NormalMe uses Google Gemini for two primary AI workflows.

### 1. Dish Recommendations

The model receives structured context:

```text
User preferences
        +
Dietary restrictions
        +
Allergens
        +
Cooking skill
        +
Available equipment
        +
Pantry ingredients
        +
Current energy level
```

The result is a set of structured meal recommendations.

### 2. Recipe Generation

When the user selects a dish, NormalMe generates a complete recipe containing:

- Ingredients
- Quantities
- Preparation steps
- Cooking instructions
- Estimated cooking time
- Relevant cooking guidance

AI responses are requested in structured JSON format so the application can reliably consume the generated data.

---

## 💡 Key Engineering Decisions

### Structured AI Responses

AI output is requested using structured JSON rather than relying on free-form text.

```text
Gemini
   ↓
Structured JSON
   ↓
Validation / Parsing
   ↓
Application
   ↓
UI
```

Malformed or unexpected responses are handled defensively rather than being allowed to crash the application.

### Server-Side AI Requests

AI requests are performed server-side so sensitive API credentials are never shipped to the client.

### Interaction Tracking

NormalMe records user interactions such as:

```text
view
click
cook
skip
rate
```

along with relevant contextual information.

This creates a foundation for future recommendation improvements and personalized ranking.

### Supabase Row-Level Security

Database access is protected using PostgreSQL Row Level Security rather than relying only on frontend checks.

---

## 📊 Database Design

The application uses PostgreSQL through Supabase.

### Core Tables

```text
user_preferences
        │
        ├── diet
        ├── allergens
        ├── skill level
        ├── cuisine preferences
        └── equipment

pantry_items
        │
        ├── ingredient
        ├── quantity
        ├── unit
        └── expiry date

interactions
        │
        ├── recipe snapshot
        ├── user action
        └── context snapshot

shopping_list_items
        │
        ├── ingredient
        ├── quantity
        └── completion status

saved_recipes
        │
        ├── recipe data
        ├── rating
        └── cooked timestamp
```

---

## 📂 Project Structure

```text
src/
│
├── app/
│   ├── (app)/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── pantry/
│   │   ├── recipe/
│   │   ├── shopping/
│   │   ├── insights/
│   │   └── profile/
│   │
│   ├── auth/
│   ├── login/
│   ├── signup/
│   └── onboarding/
│
├── components/
│   ├── BottomNav.tsx
│   └── ExpiryBanner.tsx
│
└── lib/
    ├── gemini.ts
    │
    └── supabase/
        ├── client.ts
        └── server.ts
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project
- A Google Gemini API key

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd NormalMe
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

GEMINI_API_KEY=<your-gemini-api-key>
```

### 4. Configure Supabase

Enable the authentication providers you want to use:

- Email
- Google
- Apple

Configure the appropriate OAuth credentials and redirect URLs.

Local callback:

```text
http://localhost:3000/auth/callback
```

Production callback:

```text
https://<your-production-domain>/auth/callback
```

### 5. Run the Application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🌐 Deployment

NormalMe can be deployed using Vercel.

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Configure the environment variables.
4. Add the production callback URL to Supabase.
5. Deploy.

---

## 🗺️ Roadmap

### Input & Accessibility

- [ ] Barcode-based pantry input
- [ ] OCR-based ingredient recognition
- [ ] Voice-based pantry entry

### Personalization

- [ ] Personalized recipe ranking
- [ ] Learning from user interactions
- [ ] Preference-aware recommendation scoring

### Notifications

- [ ] Push notifications
- [ ] Expiry reminders
- [ ] Smart "use soon" recommendations

### Collaboration

- [ ] Household accounts
- [ ] Shared pantry
- [ ] Collaborative shopping lists

---

## 🎯 Future Vision

NormalMe is designed to evolve beyond a simple recipe generator.

The long-term goal is to build a **personal cooking intelligence layer** that understands:

```text
Who you are
      +
What you have
      +
How you feel
      +
What you can cook
      +
What you prefer
      +
What you need to use soon
      ↓
What you should cook right now
```

---

## 👨‍💻 Author

**Ayush Singh**

Computer Science student at IIIT Kota.
