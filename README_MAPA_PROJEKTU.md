# Mapa projektu `krouzky-hb-main`

Tento dokument obsahuje přesnou mapu složek/souborů v repozitáři a stručné vysvětlení, co je kde a jak spolu části aplikace souvisí.

## 1) Rychlý přehled, jak to celé funguje

- Framework: Next.js (App Router) + React + TypeScript.
- Stylování/UI: Tailwind CSS + sada UI komponent (Radix/shadcn styl) ve `src/components/ui`.
- Data a backend služby: Firebase (`Auth`, `Firestore`, `Storage`) přes `src/lib/firebase.ts`.
- Stránky: routy jsou v `src/app/**/page.tsx`.
- Logika práce s daty: custom hooky v `src/hooks/*` (např. `useClubs.ts`, `useTrainers.ts`).
- Sdílené/prezentační komponenty: `src/components/**`.
- Import dat: skripty v `scripts/*` + vstupní JSON data v `data-krouzky.json/*`.
- Konfigurace projektu: root soubory (`package.json`, `tsconfig.json`, `tailwind.config.ts`, atd.).

## 2) Přesná mapa složek a souborů

```text
krouzky-hb-main/
├── .gitignore
├── ADMIN_SETUP_INSTRUCTIONS.md
├── FIREBASE_SETUP.md
├── README.md
├── README_CZ.md
├── README_MAPA_PROJEKTU.md
├── eslint.config.mjs
├── firestore.rules
├── next-env.d.ts
├── next.config.js
├── package-lock.json
├── package.json
├── postcss.config.js
├── storage.rules
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── data-krouzky.json/
│   ├── active-training-fitness-cirkus.json
│   ├── aerobic-a-posilovani.json
│   ├── aikido-pokrocili.json
│   ├── aikido-zacatecnici.json
│   ├── dinosauri.json
│   ├── divadelni-pruprava-pro-nejmensi.json
│   ├── divadelni-pruprava.json
│   ├── elektrotechnicky1.json
│   ├── elektrotechnickyIV.json
│   ├── fletna-pro-mirne-pokrocile.json
│   ├── fletna-pro-zacatecniky.json
│   ├── floorball-pripravka.json
│   ├── fotografovani.json
│   └── hrava-anglictina-pro-nejmensi.json
├── docs/
│   ├── README.md
│   └── TECHNICKA_DOKUMENTACE.md
├── public/
│   ├── placeholder.svg
│   ├── robots.txt
│   └── images/
│       ├── active-training.jpg
│       ├── aerobic.jpg
│       ├── aikido-pokrocili.jpg
│       ├── aikido-zacatecnici.jpg
│       ├── btech-1.jpg
│       ├── btech-4.jpg
│       ├── dinosauri.jpg
│       ├── divadelni-pruprava-pro-nejmensi.png
│       ├── divadelni-pruprava.png
│       ├── fletna-pro-mirne-pokrocile.png
│       ├── fletna-pro-zacatecniky.png
│       ├── floorball-pripravka.png
│       ├── fotografovani.png
│       ├── hrava-anglictina-pro-nejmensi.png
│       └── clubs/
│           └── README.md
├── scripts/
│   ├── import-clubs.mjs
│   ├── run-import.mjs
│   └── update-club-images.mjs
└── src/
    ├── index.css
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── providers.tsx
    │   ├── admin/
    │   │   ├── page.tsx
    │   │   └── import/
    │   │       └── page.tsx
    │   ├── api/
    │   │   └── auth/
    │   │       └── reset-password/
    │   │           └── route.ts
    │   ├── krouzky/
    │   │   ├── page.tsx
    │   │   ├── moje/
    │   │   │   └── page.tsx
    │   │   ├── nova/
    │   │   │   └── page.tsx
    │   │   ├── ulozene/
    │   │   │   └── page.tsx
    │   │   └── [id]/
    │   │       ├── page.tsx
    │   │       └── upravit/
    │   │           └── page.tsx
    │   ├── o-nas/
    │   │   └── page.tsx
    │   ├── prihlaseni/
    │   │   └── page.tsx
    │   ├── registrace/
    │   │   └── page.tsx
    │   ├── treneri/
    │   │   ├── page.tsx
    │   │   ├── moje/
    │   │   │   └── page.tsx
    │   │   ├── novy/
    │   │   │   └── page.tsx
    │   │   └── [id]/
    │   │       ├── page.tsx
    │   │       └── upravit/
    │   │           └── page.tsx
    │   ├── zapomenute-heslo/
    │   │   └── page.tsx
    │   └── zpravy/
    │       └── page.tsx
    ├── components/
    │   ├── UserMenu.tsx
    │   ├── home/
    │   │   ├── CategoriesSection.tsx
    │   │   ├── FeaturesSection.tsx
    │   │   └── HeroSection.tsx
    │   ├── layout/
    │   │   ├── Footer.tsx
    │   │   ├── Header.tsx
    │   │   └── Layout.tsx
    │   ├── pages/
    │   │   ├── AdminPage.tsx
    │   │   ├── AuthPage.tsx
    │   │   ├── ClubDetailPage.tsx
    │   │   ├── ClubsPage.tsx
    │   │   ├── CreateClubPage.tsx
    │   │   ├── CreateTrainerPage.tsx
    │   │   ├── ForgotPasswordPage.tsx
    │   │   ├── Index.tsx
    │   │   ├── MessagesPage.tsx
    │   │   ├── MyClubsPage.tsx
    │   │   ├── MyTrainersPage.tsx
    │   │   ├── NotFound.tsx
    │   │   ├── SavedClubsPage.tsx
    │   │   ├── TrainerDetailPage.tsx
    │   │   └── TrainersPage.tsx
    │   └── ui/
    │       ├── accordion.tsx
    │       ├── alert-dialog.tsx
    │       ├── alert.tsx
    │       ├── aspect-ratio.tsx
    │       ├── avatar.tsx
    │       ├── badge.tsx
    │       ├── breadcrumb.tsx
    │       ├── button.tsx
    │       ├── calendar.tsx
    │       ├── card.tsx
    │       ├── carousel.tsx
    │       ├── chart.tsx
    │       ├── checkbox.tsx
    │       ├── collapsible.tsx
    │       ├── command.tsx
    │       ├── context-menu.tsx
    │       ├── dialog.tsx
    │       ├── drawer.tsx
    │       ├── dropdown-menu.tsx
    │       ├── form.tsx
    │       ├── hover-card.tsx
    │       ├── input-otp.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── menubar.tsx
    │       ├── navigation-menu.tsx
    │       ├── pagination.tsx
    │       ├── popover.tsx
    │       ├── progress.tsx
    │       ├── radio-group.tsx
    │       ├── resizable.tsx
    │       ├── scroll-area.tsx
    │       ├── select.tsx
    │       ├── separator.tsx
    │       ├── sheet.tsx
    │       ├── sidebar.tsx
    │       ├── skeleton.tsx
    │       ├── slider.tsx
    │       ├── sonner.tsx
    │       ├── switch.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       ├── textarea.tsx
    │       ├── toast.tsx
    │       ├── toaster.tsx
    │       ├── toggle-group.tsx
    │       ├── toggle.tsx
    │       ├── tooltip.tsx
    │       └── use-toast.ts
    ├── hooks/
    │   ├── use-mobile.tsx
    │   ├── use-toast.ts
    │   ├── useAuth.ts
    │   ├── useClaims.ts
    │   ├── useClubs.ts
    │   ├── useMessages.ts
    │   └── useTrainers.ts
    └── lib/
        ├── firebase.ts
        ├── firebaseAdmin.ts
        └── utils.ts
```

## 3) Co kde najít (prakticky)

- Routing a stránky: `src/app`
- Sdílený layout celé aplikace: `src/app/layout.tsx`
- Napojení providerů (např. React Query): `src/app/providers.tsx`
- API endpointy na serveru: `src/app/api/**/route.ts`
- Datová logika kroužků/trenérů/zpráv: `src/hooks`
- Firebase inicializace klienta: `src/lib/firebase.ts`
- Firebase admin přístup (server): `src/lib/firebaseAdmin.ts`
- UI stavebnice (tlačítka, dialogy, inputy...): `src/components/ui`
- Hotové stránky/sekce: `src/components/pages`, `src/components/home`, `src/components/layout`
- Statické obrázky a veřejné assety: `public`
- Jednorázové importy a maintenance skripty: `scripts`
- Zdrojová importní data kroužků: `data-krouzky.json`
- Dokumentace a provozní poznámky: `docs`, `FIREBASE_SETUP.md`, `ADMIN_SETUP_INSTRUCTIONS.md`

## 4) Tok dat v aplikaci

1. Uživatel otevře route z `src/app/**`.
2. Route renderuje stránkové komponenty z `src/components/**`.
3. Komponenty volají custom hooky (`useClubs`, `useTrainers`, `useMessages`, ...).
4. Hooky komunikují s Firebase (`Firestore`, `Auth`, `Storage`) přes `src/lib/firebase.ts`.
5. Výsledky se vrací do UI, které je složené hlavně z komponent ze `src/components/ui`.

## 5) Poznámka k údržbě mapy

Pokud přidáš nové soubory/složky, aktualizuj tento dokument, aby mapa zůstala přesná.
