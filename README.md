# CareLink

CareLink is a companionship and assistance platform that connects people who need help with trusted local helpers.
It connects individuals seeking companionship or everyday assistance with verified helpers in their community.

The platform supports:
- Companionship services
- Daily assistance and errands
- Social support
- Care assistance

---

# 🚀 Features

## � User Features
- User authentication
- User profile creation
- Browse local helpers
- Send connection requests
- Track request status
- View connections in dashboard

## 🤝 Helper Features
- Helper authentication
- Profile management
- Receive connection requests
- Manage availability
- Track connections through dashboard

## 🔐 Authentication
- Supabase Authentication
- Email/password login & signup
- Role-based access control
- Protected routes

---

# 🛠 Tech Stack

## Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Backend
- Supabase
  - PostgreSQL Database
  - Authentication
  - Row Level Security (RLS)

---

# 📂 Project Structure

```bash
src/
│
├── app/
│   ├── dashboard/
│   ├── jobs/
│   ├── login/
│   ├── post-job/
│   ├── signup/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│
├── contexts/
│
├── lib/
│   └── supabase.ts
│
└── styles/
