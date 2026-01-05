# Kroužky Vysočina - Next.js Aplikace

Moderní web aplikace pro správu kroužků a trénérů s Firebase autentifikací.

## 🚀 Rychlý start

### Předpoklady
- Node.js 18+
- npm nebo yarn
- Firebase projekt (viz [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))

### Instalace

1. Klonovat repozitář:
```bash
cd krou-ky-hb-main
```

2. Instalovat dependencies:
```bash
npm install
```

3. Nastavit Firebase ([detailní návod](./FIREBASE_SETUP.md)):
```bash
# Otevřete .env.local a vyplňte Firebase údaje
```

4. Spustit dev server:
```bash
npm run dev
```

Aplikace je nyní dostupná na **http://localhost:3000**

## 📋 Dostupné příkazy

```bash
# Development server
npm run dev

# Build pro produkci
npm run build

# Start produkčního serveru (po build)
npm start

# Linting
npm run lint
npm run lint:fix
```

## 🏗️ Struktura projektu

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── krouzky/           # Clubs
│   │   ├── page.tsx
│   │   └── [id]/          # Klub detail (dynamic)
│   ├── treneri/           # Trainers
│   ├── prihlaseni/        # Login
│   └── registrace/        # Registration
│
├── components/
│   ├── pages/             # Page components
│   ├── layout/            # Layout components (Header, Footer)
│   ├── home/              # Home page sections
│   ├── ui/                # shadcn/ui components
│   └── UserMenu.tsx       # Auth user menu
│
├── hooks/
│   └── useAuth.ts         # Firebase auth hook
│
└── lib/
    ├── firebase.ts        # Firebase config
    └── utils.ts           # Utility functions
```

## 🔐 Autentifikace (Firebase)

Aplikace používá **Firebase Authentication** s Email/Password metodou.

### Registrace nového uživatele
- Přejděte na `/registrace`
- Vyplňte jméno, email a heslo
- Nový uživatel je okamžitě přihlášen a uložen v Firestore

### Přihlášení
- Přejděte na `/prihlaseni`
- Zadejte email a heslo
- Po úspěšném přihlášení jste přesměrováni na home page

### Odhlášení
- Klikněte na tlačítko "Odhlásit" v header menu

### Použití autentifikace v komponentách

```typescript
import { useAuth } from '@/hooks/useAuth';

export function MyComponent() {
  const { user, userProfile, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) return <div>Přihlaste se</div>;
  
  return <div>Vítej, {userProfile?.name}!</div>;
}
```

## 🎨 Design

- **UI Framework**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS s custom brand colors
- **Icons**: Lucide React
- **Notifications**: Sonner (toast messages)

## 📚 Tech Stack

- **Framework**: Next.js 15.5.9
- **Runtime**: Node.js
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **Data Fetching**: TanStack React Query

## 🔗 Užitečné odkazy

- [Next.js dokumentace](https://nextjs.org/docs)
- [Firebase dokumentace](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

## 📝 Poznámky

- `.env.local` - Necommitujte tento soubor (je v .gitignore)
- Firebase config je veřejná (NEXT_PUBLIC_* proměnné), ale je zabezpečena Firestore pravidly
- Pro produkci aktualizujte Firestore bezpečnostní pravidla

## 🤝 Přispívání

Pull requesty jsou vítány!

## 📄 Licence

MIT
