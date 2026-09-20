# Shop Frontend

A Next.js 15+ inventory management dashboard with real-time stock tracking, sales, and purchases.

## Features

- **Dashboard** — KpiCards with sales/purchases visualization
- **Inventory** — CRUD for Categories, Brands, Units, Products
- **Stock Management** — Add/remove stock, stocktake adjustments
- **Purchases** — Purchase orders with supplier tracking
- **Sales** — Sales orders with customer management
- **Expenses** — Expense tracking with categories
- **Users** — User management with roles
- **PWA** — Installable, offline-capable Progressive Web App

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** component library
- **TanStack Table** / **TanStack Query** for data management
- **react-hook-form** + **Zod** for forms
- **recharts** for charts
- **react-toastify** for notifications
- **lucide-react** for icons

## Directory Structure

```
frontend/src/
├── app/
│   ├── (dashboard)/     # Dashboard pages (protected routes)
│   │   ├── brands/      # Brands CRUD
│   │   ├── units/       # Units CRUD
│   │   ├── categories/  # Categories CRUD
│   │   ├── products/    # Products CRUD
│   │   └── ...
│   ├── offline/         # Offline fallback page
│   ├── layout.tsx       # Root layout with PWA provider
│   └── page.tsx         # Landing page
├── api/
│   ├── services/        # API service modules
│   └── axios.ts         # Configured axios client
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── resource-page.tsx # Generic CRUD page wrapper
│   ├── layout/          # Layout components (Header, Sidebar)
│   └── ...
├── lib/                 # Utilities (formatters, data helpers, fonts)
├── hooks/               # Custom React hooks
└── types/               # Shared TypeScript types
```

## Setup

### Prerequisites

- Node.js 20+ (or use `nvm`)
- pnpm (recommended) or npm

### Installation

```bash
cd frontend

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL and other settings

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Build production app |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Auto-fix ESLint issues |
| `pnpm typecheck` | TypeScript type checking |

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000/api` |

## PWA Support

This app is a Progressive Web App:
- Installable on desktop and mobile
- Offline support via service worker
- Update notifications for new versions

## Styling

Customize the app's appearance via CSS variables in `src/styles/globals.css`. The app uses Tailwind CSS with a custom color scheme.
