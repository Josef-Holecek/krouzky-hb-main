# Technická dokumentace – Kroužky Havlíčkův Brod

**Projekt:** Webový systém pro přehled kroužků a trenérů  
**Autor:** Josef Holeček  
**Verze dokumentu:** 1.0  
**Datum:** Březen 2026  
**Repozitář:** [github.com/Josef-Holecek/krouzky-hb-main](https://github.com/Josef-Holecek/krouzky-hb-main)

---

## Obsah

1. [Přehled systému](#1-přehled-systému)
2. [Technologický stack](#2-technologický-stack)
3. [Struktura repozitáře](#3-struktura-repozitáře)
4. [Instalace a spuštění](#4-instalace-a-spuštění)
5. [Databázové schéma (Firestore)](#5-databázové-schéma-firestore)
6. [Workflow stavů](#6-workflow-stavů)
7. [Autentizace a autorizace](#7-autentizace-a-autorizace)
8. [Routing – přehled tras](#8-routing--přehled-tras)
9. [Hlavní hooks a komponenty](#9-hlavní-hooks-a-komponenty)
10. [Upload a správa souborů](#10-upload-a-správa-souborů)
11. [Firestore Security Rules](#11-firestore-security-rules)
12. [Nasazení na produkci](#12-nasazení-na-produkci)
13. [Ručně přidaná data o kroužcích](#13-ručně-přidaná-data-o-kroužcích)
14. [Troubleshooting](#14-troubleshooting)
15. [Uživatelská příručka (trenéři a administrátoři)](#15-uživatelská-příručka-trenéři-a-administrátoři)
16. [Dokumentace uživatelského rozhraní a návrhy obrazovek](#16-dokumentace-uživatelského-rozhraní-a-návrhy-obrazovek)

---

## 1. Přehled systému

Kroužky Havlíčkův Brod je webová aplikace určená pro centralizovaný přehled volnočasových aktivit (kroužků) a jejich trenérů ve městě. Cílem je poskytnout jedno místo, kde si rodiče, děti a zájemci mohou snadno najít informace o dostupných aktivitách – od filtrování podle věku a typu aktivity až po detailní informace o trenérech.

Systém umožňuje trenérům spravovat své kroužky, administrátoři schvalovat nové záznam a běžnému návštěvníkovi bez registrace procházet seznam publikovaných kroužků.

### Architektura

```
Webový prohlížeč
    │  HTTP/HTTPS
    ▼
Next.js Frontend (React + TypeScript)
    ├── Static HTML + CSR (Client-Side Rendering)
    ├── React Query pro state management
    └── Tailwind CSS + Radix UI komponenty
        │
    ┌───┴────────────────────┐
    │                        │
    ▼                        ▼
Firebase Auth           Firebase Firestore
    │                        │
    ├─── OAuth2 (Google)     ├─── Collections (clubs, trainers, categories, users)
    ├─── Email/Password      ├─── Real-time listeners
    └─── Session            └─── Security Rules
```

Aplikace je **frontend-centric SPA** (Single Page Application). Veškerá serverová logika je delegována na Firebase. Nasazení probíhá přes Vercel Hosting.

#### Architektura komponent

- **Prezentační vrstva (`src/components`)**
  - `components/pages/*`: stránky a jejich sekce (např. seznamy, detaily, formuláře)
  - `components/layout/*`: globální layout (hlavička, patička, obal stránky)
  - `components/ui/*`: znovupoužitelné atomické komponenty (button, card, dialog, form prvky)
- **Aplikační vrstva (`src/hooks`)**
  - custom hooks zapouzdřují načítání dat, cachování a mutace (např. `useClubs`, `useTrainers`)
- **Integrační vrstva (`src/lib`)**
  - Firebase klient/admin konfigurace, helpery a utility funkce
- **Routovací vrstva (`src/app`)**
  - URL struktura a page entry pointy podle Next.js App Routeru

---

## 2. Technologický stack

| Vrstva | Technologie | Verze |
|---|---|---|
| Frontend framework | Next.js | ^15.0.0 |
| UI knihovna | React | ^18.3.1 |
| DOM renderer | React DOM | ^18.3.1 |
| Jazyk | TypeScript | ^5.8.3 |
| Styling | Tailwind CSS | ^3.4.17 |
| PostCSS | PostCSS | ^8.5.6 |
| Autoprefixer | Autoprefixer | ^10.4.21 |
| UI komponenty | Radix UI | 1.x (napr. @radix-ui/react-dialog ^1.1.14) |
| State management / data fetching | @tanstack/react-query | ^5.83.0 |
| Formuláře | react-hook-form | ^7.61.1 |
| Validace schémat | zod | ^3.25.76 |
| Firebase klient | firebase | ^12.7.0 |
| Firebase admin | firebase-admin | ^13.5.0 |
| Databáze | Cloud Firestore | přes Firebase SDK |
| Autentizace | Firebase Authentication | přes Firebase SDK |
| Úložiště souborů | Firebase Storage | přes Firebase SDK |
| Grafy | recharts | ^2.15.4 |
| Datumové utility | date-fns | ^3.6.0 |
| Ikony | lucide-react | ^0.462.0 |
| Linting | eslint | ^9.32.0 |
| TS linting | typescript-eslint | ^8.38.0 |
| Package manager | npm | podle runtime prostředí |

---

## 3. Struktura repozitáře

```text
krouzky-hb-main/
├── src/                     # Hlavní zdrojový kód aplikace (to nejdůležitější)
│   ├── app/                 # Stránky a routy (Next.js App Router)
│   ├── components/          # Znovupoužitelné UI komponenty
│   ├── hooks/               # Custom hooks (logika práce s daty)
│   └── lib/                 # Firebase a pomocné utility
├── public/                  # Statické soubory (obrázky, robots.txt)
├── data-krouzky.json/       # JSON informace o ručně přidaných kroužcích
├── scripts/                 # Jednorázové skripty (importy, aktualizace)
├── docs/                    # Technická dokumentace projektu
├── package.json             # Skripty projektu a závislosti
├── tsconfig.json            # Nastavení TypeScriptu
├── next.config.js           # Nastavení Next.js
├── tailwind.config.ts       # Nastavení Tailwind CSS
├── firestore.rules          # Pravidla přístupu pro Firestore
└── storage.rules            # Pravidla přístupu pro Firebase Storage
```

### Jak se v projektu rychle zorientovat

1. Začněte ve složce `src/app`.
Obsahuje stránky aplikace podle URL (např. kroužky, trenéři, přihlášení).

2. Pokračujte do `src/components`.
Tady jsou vizuální části stránek (karty, formuláře, sekce).

3. Logiku dat hledejte v `src/hooks` a `src/lib`.
`hooks` řeší načítání dat a stav, `lib` obsahuje integrace (Firebase) a utility.

4. Obrázky a veřejné soubory jsou v `public`.
Co je v `public`, je dostupné přímo přes URL.

5. Ručně připravená data kroužků jsou v `data-krouzky.json`.
Jeden JSON soubor = jeden ručně přidaný kroužek.

### Co běžně upravovat a co nechat být

- Běžně upravujete: `src`, `docs`, `data-krouzky.json`, `public`.
- Občas upravíte: `package.json`, `firestore.rules`, `storage.rules`.
- Obvykle neupravujete ručně: `.next`, `node_modules`, `package-lock.json`.

---

## 4. Instalace a spuštění

### 4.1 Požadavky

- Node.js ≥ 18.17 nebo 19.8+
- npm ≥ 10 (nebo yarn)
- Git
- Aktivní Firebase projekt
- VS Code (doporučeno)

### 4.2 Rychlé spuštění (lokalně)

```bash
# 1. Klonování repozitáře
git clone https://github.com/Josef-Holecek/krouzky-hb-main.git
cd krouzky-hb-main

# 2. Instalace závislostí
npm install

# 3. Příprava env souboru
# vytvořte/otevřete .env.local a doplňte hodnoty podle sekce 4.3
```

Editujte `.env.local` a doplňte Firebase credentials (viz sekce 4.3).

```bash
# 4. Spuštění dev serveru
npm run dev

# Aplikace bude dostupná na http://localhost:3000
```

### 4.3 Firebase konfigurace

V [Firebase Console](https://console.firebase.google.com/):

1. **Vytvořit webovou aplikaci** → zkopírovat `firebaseConfig`
2. **Firestore Database** → Vytvořit databázi (Production mode)
3. **Authentication** → Povolit Email/Password a Google OAuth2
4. **Storage** → Aktivovat Firebase Storage
5. **Service Account** → Stáhnout private key (pro admin SDK)

Vyplňte `.env.local`:

```env
# Firebase Web Config (PUBLIC - bezpečný pro frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=krouzky-hb.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=krouzky-hb
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=krouzky-hb.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc...

# Firebase Admin SDK (PRIVATE - server-side only)
FIREBASE_ADMIN_PROJECT_ID=krouzky-hb
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@krouzky-hb.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4.4 Spuštění produkčního buildu

```bash
# Build
npm run build

# Spuštění lokálně
npm start

# Lint
npm run lint
npm run lint:fix
```

### 4.5 Proměnné prostředí

| Proměnná | Typ | Popis |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Public | Frontend - bezpečné (exponovat lze) |
| `FIREBASE_ADMIN_PROJECT_ID` | Private | Firebase Admin: ID projektu |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Private | Firebase Admin: service account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Private | Firebase Admin: privátní klíč |
| `NODE_ENV` | Public | `development` nebo `production` |

> Soubor `.env.local` se **nikdy** necommituje do Gitu (viz `.gitignore`). Produkční proměnné se nastavují v Vercel/Firebase Settings.

---

## 5. Databázové schéma (Firestore)

### 5.1 Collections a dokumenty

Firestore je NoSQL databáze se schématem bez fixních sloupců. Struktura je definována v Doctrine-like TypeScript typech v `lib/firebase.ts`.

```
firestore/
├── clubs/                   # Kroužky
│   └── {clubId}            # Dokument
│       ├── name: string
│       ├── description: string
│       ├── categoryId: string
│       ├── trainerId: string
│       ├── status: "pending" | "approved" | "rejected"
│       ├── schedule: Array<{day, startTime, endTime}>
│       ├── price: number
│       ├── capacity: number
│       ├── enrolledCount: number
│       ├── createdAt: timestamp
│       └── ... (metadata fields)
│
├── trainers/                # Trenéři
│   └── {trainerId}         # UID Firebase Auth
│       ├── firstName: string
│       ├── lastName: string
│       ├── email: string
│       ├── bio: string
│       ├── avatar: string (Storage URL)
│       ├── status: "active" | "inactive"
│       ├── numberOfClubs: number
│       └── createdAt: timestamp
│
├── categories/              # Kategorie kroužků
│   └── {categoryId}
│       ├── name: string (např. "Sport - Bojové umění")
│       ├── icon: string (emoji)
│       ├── color: string (hex)
│       └── order: number
│
├── users/                   # Rozšířené user data
│   └── {userId}            # Firebase Auth UID
│       ├── role: "user" | "trainer" | "admin"
│       ├── favoriteClubs: [string]
│       ├── createdAt: timestamp
│       └── lastLogin: timestamp
│
└── messages/ (volitelné)    # Zprávy
    └── {messageId}
        ├── senderId: string
        ├── recipientId: string
        ├── subject: string
        ├── message: string
        ├── isRead: boolean
        └── createdAt: timestamp
```

### 5.2 Klíčové atributy

#### clubs (Kroužek)
```typescript
interface Club {
  id: string                          // Auto-generované Firebase ID
  name: string                        // Název kroužku
  description: string                 // Popis
  image?: string                      // URL na obrázek (GCS)
  categoryId: string                  // Reference na kategorii
  trainerId: string                   // UID trenéra (author)
  trainerName: string                 // Denormalizované (pro seznam)
  trainerEmail: string                // Email trenéra
  ageFrom: number                     // Věkové rozpětí
  ageTo: number
  location: string                    // Místo konání
  schedule: Array<{                   // Časy konání
    day: string                       // "Monday", "Tuesday"...
    startTime: string                 // "15:00"
    endTime: string                   // "16:00"
  }>
  price: number                       // Cena v Kč/měsíc
  capacity: number                    // Max kapacita
  enrolledCount: number               // Aktuálně přihlášeno
  status: "pending" | "approved" | "rejected"
  createdAt: Timestamp
  updatedAt: Timestamp
  approvedBy?: string                 // UID admina (kdo schválil)
  approvedAt?: Timestamp
}
```

#### trainers (Trenér)
```typescript
interface Trainer {
  id: string                          // = Firebase Auth UID
  firstName: string
  lastName: string
  email: string                       // Email z Auth
  bio?: string                        // "O mně"
  avatar?: string                     // GCS URL
  qualifications?: string             // Vzdělání
  experience?: string                 // Pracovní zkušenosti
  status: "active" | "inactive"
  isVerified: boolean                 // Email ověřen?
  numberOfClubs: number
  createdAt: Timestamp
  updatedAt: Timestamp
  lastLogin?: Timestamp
}
```

### 5.3 Indexy a dotazy

Doporučené Firestore indexy:

```
clubs:
  - (status) ASC
  - (categoryId) ASC, (status) ASC
  - (trainerId) ASC, (status) ASC
  - (status) ASC, (createdAt) DESC

trainers:
  - (status) ASC, (createdAt) DESC
```

---

## 6. Workflow stavů

### 6.1 Stav kroužku (`clubs.status`)

```
Čekající na schválení (pending)
    │ Admin posuzuje
  ├─► Schváleno (approved)       ✓ Kroužek je schválený
    │
  └─► Zamítnuto (rejected)       ✗ Čeká na úpravu trenérem
```

| Stav | Kód | Viditelnost |
|---|---|---|
| Čekající schválení | `pending` | Admin + trenér |
| Schváleno | `approved` | Veřejně zobrazené v aplikaci |
| Zamítnuto | `rejected` | Trenér + admin |

### 6.2 Stav trenéra (`trainers.status`)

```
Aktivní (active)  ──► Neaktivní (inactive)
```

Trenér s výběrem "neaktivní" skryje svoje profily a kroužky z veřejného výpisu.

### 6.3 Celkový workflow kroužku

```
[Trenér se registruje]
    │
    ▼
[Trenér vytvoří kroužek]
    │ status: "pending"
    ▼
[Admin schvaluje v /admin panel]
    │
  ├─► Schválí
  │   │ status: "approved"
    │   ▼
    │   [Kroužek se zobrazí na /krouzky]
    │
    └─► Odmítá
        │ status: "rejected"
        ▼
        [Trenér vidí důvod a může upravit]
```

---

## 7. Autentizace a autorizace

### 7.1 Firebase Authentication

Aplikace využívá **Firebase Authentication** pro přihlášení a registraci:

- **Email/Password** – tradiční registrace
- **Google OAuth 2.0** – přihlášení přes Google účet
- **Session persistence** – Firebase automaticky udržuje session

Po přihlášení se Firebase Auth UID mapuje na Firestore `users/{uid}` dokument s profilem.

### 7.2 Role a oprávnění

V aktuální implementaci se admin přístup ověřuje přes:

- `userProfile.isAdmin` v dokumentu `users/{uid}`
- e-mail v `NEXT_PUBLIC_ADMIN_EMAILS`

| Role | Popis | Oprávnění |
|---|---|---|
| Běžný uživatel | Návštěvník/trenér bez admin flagu | Standardní uživatelské akce |
| Admin | Uživatel s `isAdmin=true` nebo e-mailem v `NEXT_PUBLIC_ADMIN_EMAILS` | Admin sekce a schvalování |

Admin flag lze nastavit ručně v Firestore nebo přes Admin SDK.

### 7.3 Firestore Security Rules

Security Rules řídí přístup na úrovni databáze. V tomto projektu berte jako zdroj pravdy vždy aktuální soubor `firestore.rules` v kořeni repozitáře.

---

## 8. Routing – přehled tras

### Veřejné trasy (bez přihlášení)

| Cesta | Komponenta | Popis |
|---|---|---|
| `/` | `page.tsx` | Domovská stránka |
| `/krouzky` | `krouzky/page.tsx` | Seznam kroužků (veřejné) |
| `/krouzky/[id]` | `krouzky/[id]/page.tsx` | Detail kroužku |
| `/treneri` | `treneri/page.tsx` | Seznam trenérů |
| `/treneri/[id]` | `treneri/[id]/page.tsx` | Detail trenéra |
| `/prihlaseni` | `prihlaseni/page.tsx` | Přihlášení |
| `/registrace` | `registrace/page.tsx` | Registrace |
| `/zapomenute-heslo` | `zapomenute-heslo/page.tsx` | Reset hesla |
| `/o-nas` | `o-nas/page.tsx` | O projektu |

### Chráněné trasy (vyžadují přihlášení)

#### Sekce kroužků (vyžadují přihlášení podle akce)

| Cesta | Popis |
|---|---|
| `/krouzky/moje` | Přehled vlastních kroužků |
| `/krouzky/nova` | Formulář na nový kroužek |
| `/krouzky/ulozene` | Klíčové/oblíbené kroužky |
| `/krouzky/[id]/upravit` | Editace kroužku |

#### Admin (`/admin/*`) – role: `admin`

| Cesta | Popis |
|---|---|
| `/admin` | Admin dashboard (schvalování, statistiky) |
| `/admin/import` | Nástroje pro import a synchronizaci dat |

#### Pro všechny přihlášené (`/zpravy`, apod.)

| Cesta | Popis |
|---|---|
| `/zpravy` | Inbox zpráv |

---

## 9. Hlavní hooks a komponenty

### 9.1 Custom hooks

#### `useAuth()` (`hooks/useAuth.ts`)

Spravuje Firebase autentifikaci a aktuální uživatele.

```typescript
const { user, role, isLoading, logout } = useAuth();

// Vlastnosti:
// - user: Firebase User | null
// - userProfile: profil z users/{uid}
// - loading: boolean
// logout(): Promise<void>
```

#### `useClubs()` (`hooks/useClubs.ts`)

Načítání, filtrování a správa kroužků.

```typescript
const { clubs, isLoading, createClub, updateClub, deleteClub } = useClubs({
  filter: "approved",  // nebo "myClubs", "pending"
});
```

#### `useTrainers()` (`hooks/useTrainers.ts`)

Správa trenérských profilů.

```typescript
const { trainers, isLoading, updateTrainer } = useTrainers();
```

#### `useClaims()` (`hooks/useClaims.ts`)

Správa žádostí o převzetí kroužků (`claimRequests`).

```typescript
const { submitClaim, fetchClaims, resolveClaim } = useClaims();
```

### 9.2 Klíčové komponenty

#### `RootLayout` (`app/layout.tsx`)
Obsahuje Header, Footer, providers a hlavní obsah.

#### `ClubsPage` (`components/pages/ClubsPage.tsx`)
Přehled kroužků s filtry (věk, kategorie, čas, cena).

#### `ClubDetailPage` (`components/pages/ClubDetailPage.tsx`)
Detail kroužku + profil trenéra + "kontaktuj" formulář.

#### `AdminPage` (`components/pages/AdminPage.tsx`)
Dashboard admin panelu – schvalování, statistiky, seznam čekajících.

#### `CreateClubPage` (`components/pages/CreateClubPage.tsx`)
Formulář pro trenéra na vytvoření kroužku.

#### `UserMenu` (`components/UserMenu.tsx`)
Přihlášeno/odhlášeno menu s linky na profil.

---

## 10. Upload a správa souborů

### 10.1 Obrázky kroužků a profilů

Obrázky jsou ukládány do **Firebase Storage**:

```
gs://krouzky-hb.appspot.com/
├── clubs/
│   └── {clubId}.jpg
└── avatars/
    └── {trainerId}.jpg
```

Upload je řešen přímo v aplikační logice (např. v hooks/stránkách), ne přes samostatnou utility funkci `uploadImage`.

### 10.2 Bezpečnost

- Soubory jsou chráněny Storage Security Rules
- Trenér může uploadovat jen do svého klubu / svého avataru
- Admin má plný přístup

---

## 11. Firestore Security Rules

Aktuální pravidla v repozitáři jsou ve `firestore.rules` a jsou nastavená spíše pro vývoj.
Nejdůležitější body aktuálního stavu:

- `users/{userId}`: čtení/zápis jen vlastního profilu.
- `clubs/{clubId}`: čtení pro všechny, zápis je dočasně otevřený (`allow create, update, delete: if true`).
- `trainers/{trainerId}`: čtení pro všechny, zápis pro přihlášené uživatele.
- `messages/{messageId}`: omezeno na odesílatele/příjemce.

Ukázka (zkrácená):

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    match /clubs/{clubId} {
      allow read: if true;
      allow create, update, delete: if true; // TEMPORARY pro import a vývoj
    }
    
    match /trainers/{trainerId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
    
    // ======== USERS ========
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /messages/{messageId} {
      allow read: if request.auth != null &&
        (resource.data.toUserId == request.auth.uid || resource.data.fromUserId == request.auth.uid);
      allow create: if request.auth != null && request.resource.data.fromUserId == request.auth.uid;
    }
  }
}
```

Deploy do Firestore:

```bash
# Pokud máte Firebase CLI
firebase deploy --only firestore:rules
```

---

## 12. Nasazení na produkci

### 12.1 Vercel (doporučeno)

**Výhody**: SSR, serverless functions, best practice pro Next.js

Postup:

```bash
# 1. Push na GitHub
git push origin main

# 2. V Vercel: Import Project z GitHubu
# https://vercel.com/new

# 3. Nastavení Environment Variables v Vercel Settings:
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... (všechny NEXT_PUBLIC_* + FIREBASE_ADMIN_PROJECT_ID + FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY)

# 4. Deploy – automaticky!
```

### 12.2 Firebase Hosting

```bash
# 1. Instalace Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Init
firebase init hosting

# 4. Build
npm run build

# 5. Deploy
firebase deploy --only hosting
```

Aplikace poběží na: `https://krouzky-hb.firebaseapp.com`

### 12.3 Produkční kontroly

```bash
# Linting
npm run lint

# Build kontrola
npm run build

# SSR test (lokálně)
npm start

# Ověřit env proměnné v produkcích
echo $NEXT_PUBLIC_FIREBASE_PROJECT_ID
```

---

## 13. Ručně přidaná data o kroužcích

### 13.1 JSON informace o ručně přidaných kroužcích

V projektu jsou soubory v `data-krouzky.json/`.
Každý JSON představuje informace o jednom ručně přidaném kroužku.

```bash
node scripts/run-import.mjs
```

Skript načte tyto ručně připravené záznamy a uloží je do Firestore.

### 13.2 Testovací účty

| E-mail | Oprávnění |
|---|---|
| `admin@test.cz` | admin (pokud je v `NEXT_PUBLIC_ADMIN_EMAILS` nebo má `isAdmin=true`) |
| `trenuj@test.cz` | standardní uživatel/trenér |
| `uzivatel@test.cz` | standardní uživatel |

Hesla do dokumentace nepatří. Nastavte je přímo ve Firebase Authentication.

---

## 14. Troubleshooting

### 14.1 Aplikace neběží po `npm run dev`

**Symptom:** port 3000 neodpovídá, výstup obsahuje chyby.

**Kontrola:**

```bash
# Ověřit Node verzi
node --version  # Musí být ≥ 18.17

# Reinstalace dependencies
rm -rf node_modules package-lock.json
npm install

# Zkontrolovat env
cat .env.local  # Jsou vyplněny NEXT_PUBLIC_* proměnné?
```

### 14.2 Firebase Credentials nejsou načteny

**Symptom:** chyba "Firebase config is missing" nebo "Uncaught Error: app/invalid-api-key"

**Kontrola:**

```bash
# Ověřit .env.local existuje
ls -la .env.local

# Ověřit, že hodnoty nejsou prázdné
grep NEXT_PUBLIC_FIREBASE .env.local

# Restartovat dev server
npm run dev
```

> Pozor: Browser cache! Použijte Ctrl+Shift+Delete nebo Private browsing.

### 14.3 Firestore Security Rules blokují čtení

**Symptom:** v konzoli: "Missing or insufficient permissions"

**Nejčastěji:**
- Uživatel není přihlášen (rule vyžaduje `isAuthenticated()`)
- V `users/{uid}` chybí profil uživatele nebo `isAdmin` flag (pro admin akce)
- Security Rule se neshoduje s operací (CREATE vs UPDATE)

**Kontrola:**

```bash
# V Firestore Emulator (lokálně):
firebase emulators:start

# V konzoli prohlížeče:
console.log(auth.currentUser);  // Existuje?
console.log(userProfile);  // Načetl se profil z users/{uid}?
```

### 14.4 Upload obrázku selže

**Symptom:** "Upload failed" při uploadování obraz do klubu/profilu

**Kontrola:**

1. Jsou Storage Security Rules správně nastaveny?
   ```bash
   firebase deploy --only storage:rules
   ```

2. Je Firebase Storage bucket aktivní v Console?

3. Má uživatel správný profil v `users/{uid}` a je přihlášen?
   ```javascript
  console.log(auth.currentUser?.uid);
  // admin přístup je v aplikaci řízen přes isAdmin / NEXT_PUBLIC_ADMIN_EMAILS
   ```

### 14.5 Přihlášení nedělá

**Symptom:** Po vyplnění e-mailu a hesla se nic neděje.

**Kontrola:**

```javascript
// V konzoli:
firebase.auth().onAuthStateChanged(user => console.log(user));

// Ověřit Firebase Auth je povolena
// Firebase Console > Authentication > Sign-in method
```

Postupy:
- Zkontrolovat, že třídy `LoginPage` volají správně `signInWithEmailAndPassword`
- I když e-mail není v Auth, měla by být chyba "user-not-found"

### 14.6 Po deployu vrací 404

**Symptom:** Vercel / Firebase Hosting vrací "This page could not be found"

**Příčina:** Next.js build fallbacky nejsou nakonfigurované.

**Kontrola:**

```bash
# Lokálně
npm run build

# Zkontrolovat, byla vytvořena `.next/` složka?
ls -la .next/

# V Vercel: Zkontrolovat Build Output
# Settings > Build Command: npm run build
```

### 14.7 Chyby při deployment

**Pro Vercel:**
```bash
vercel logs  # Live logy produktu
```

**Pro Firebase Hosting:**
```bash
firebase deploy --debug
```

### 14.8 Performance problémy

**Symptom:** Aplikace je pomalá, seznam kroužků se načítá dlouho.

**Checklist:**

1. Firestore indexy – jsou vytvořené?
   ```bash
   firebase firestore:indexes
   ```

2. React Query cache – je nakonfigurován?
   ```typescript
   // queryClient.setDefaultOptions({ queries: { staleTime: 5 * 60 * 1000 } })
   ```

3. Network – jak dlouhé jsou API requesty?
   - Chrome DevTools > Network tab
   - Firestore console > Monitoring

4. Image optimization
   - Používat `next/image` místo `<img />`

### 14.9 Užitečné diagnostické příkazy

```bash
# Zkontrolovat Firebase projekt
firebase projects:list

# Ověřit Firestore collections
firebase firestore:extract --auto-uid

# Logs z Vercel
vercel logs --follow

# npm linting
npm run lint -- --debug
```

---

*Dokument odpovídá stavu repozitáře v březnu 2026.*

---

## 15. Uživatelská příručka (trenéři a administrátoři)

Tato sekce popisuje praktické použití systému podle role.

### 15.1 Příručka pro trenéry

#### Přihlášení a profil

1. Otevřete `/prihlaseni` a přihlaste se přes e-mail/heslo nebo Google.
2. Po prvním přihlášení zkontrolujte profil trenéra (`/treneri/moje`) a doplňte bio, fotku a kvalifikaci.
3. Uložte změny a ověřte, že se profil zobrazuje ve veřejném seznamu trenérů.

#### Vytvoření kroužku

1. Otevřete `/krouzky/nova`.
2. Vyplňte název, popis, kategorii, věk, lokaci, harmonogram, kapacitu a cenu.
3. Odešlete formulář. Nový kroužek dostane stav `pending`.
4. Po schválení administrátorem se stav změní na `approved` a kroužek je veřejně viditelný.

#### Správa vlastních kroužků

1. Otevřete `/krouzky/moje`.
2. U každého kroužku lze upravit detaily, fotku a harmonogram.
3. Pokud je kroužek zamítnut (`rejected`), opravte požadované údaje a znovu odešlete ke schválení.

#### Komunikace

1. Zprávy jsou dostupné v `/zpravy`.
2. Trenér vidí příchozí i odchozí komunikaci a může reagovat přímo z inboxu.

### 15.2 Příručka pro administrátory

#### Přístup do administrace

1. Přihlaste se účtem s `isAdmin=true` nebo e-mailem uvedeným v `NEXT_PUBLIC_ADMIN_EMAILS`.
2. Otevřete `/admin`.

#### Schvalování kroužků

1. V admin dashboardu otevřete seznam čekajících kroužků (`pending`).
2. Zkontrolujte úplnost údajů (věk, čas, místo, kapacita, popis).
3. Nastavte výsledek:
  - `approved`: kroužek je publikován.
  - `rejected`: kroužek se vrací trenérovi k doplnění.

#### Správa dat a importů

1. Otevřete `/admin/import`.
2. Spusťte import dat (skripty ve složce `scripts/`).
3. Po importu ověřte konzistenci dat v kolekcích `clubs`, `trainers`, `categories`.

#### Provozní checklist administrátora

- Denně: kontrola nových kroužků a zpráv.
- Týdně: kontrola neaktivních trenérů a duplicit.
- Před release: lint, build, kontrola env proměnných a Security Rules.

---

## 16. Dokumentace uživatelského rozhraní a návrhy obrazovek

### 16.1 Design systém a UI principy

- UI je postaveno na kombinaci `Tailwind CSS` a komponent v `src/components/ui`.
- Vizuální jazyk: karty, formulářové sekce, badge stavy (`pending`, `approved`, `rejected`), tabulky a dialogy.
- Responsivita: primárně mobile-first, breakpointy řízené Tailwind utility třídami.
- Přístupnost: komponenty Radix UI poskytují základ pro focus management, klávesnici a ARIA atributy.

### 16.2 Mapa hlavních obrazovek

| Obrazovka | URL | Primární akce | Cílová role |
|---|---|---|---|
| Domovská stránka | `/` | Prohlížení kategorií a navigace | Veřejnost |
| Seznam kroužků | `/krouzky` | Filtrování a otevření detailu | Veřejnost |
| Detail kroužku | `/krouzky/[id]` | Čtení detailu, kontakt trenéra | Veřejnost / přihlášený |
| Moje kroužky | `/krouzky/moje` | Editace vlastních kroužků | Trenér |
| Nový kroužek | `/krouzky/nova` | Vytvoření kroužku | Trenér |
| Seznam trenérů | `/treneri` | Vyhledání trenéra | Veřejnost |
| Detail trenéra | `/treneri/[id]` | Čtení profilu trenéra | Veřejnost |
| Admin dashboard | `/admin` | Schválení/odmítnutí kroužků | Administrátor |
| Import dat | `/admin/import` | Import/synchronizace dat | Administrátor |

### 16.3 Návrhy obrazovek (wireframe)

#### A) Seznam kroužků (`/krouzky`)

```text
┌──────────────────────────────────────────────────────────────┐
│ Header: logo | navigace | přihlášení                        │
├──────────────────────────────────────────────────────────────┤
│ Filtry: [Kategorie] [Věk] [Den] [Cena] [Hledat...]          │
├──────────────────────────────────────────────────────────────┤
│ [Card kroužek] [Card kroužek] [Card kroužek]                │
│ název, věk, místo, čas, trenér, badge stavu                 │
├──────────────────────────────────────────────────────────────┤
│ Paginace / lazy load                                         │
└──────────────────────────────────────────────────────────────┘
```

#### B) Formulář nového kroužku (`/krouzky/nova`)

```text
┌──────────────────────────────────────────────────────────────┐
│ Název kroužku [____________________________]                 │
│ Kategorie     [____________]  Věk od-do [__] - [__]         │
│ Místo         [____________________________]                 │
│ Harmonogram   [+ Přidat termín]                             │
│ Popis         [textarea____________________]                │
│ Kapacita [__] Cena [____]                                   │
│ Obrázek       [Upload]                                      │
│                                      [Uložit jako pending]  │
└──────────────────────────────────────────────────────────────┘
```

#### C) Admin dashboard (`/admin`)

```text
┌──────────────────────────────────────────────────────────────┐
│ KPI: čekající | schválené | zamítnuté                        │
├──────────────────────────────────────────────────────────────┤
│ Tabulka čekajících kroužků                                   │
│ Název | Trenér | Kategorie | Vytvořeno | Akce                │
│                                       [Schválit] [Zamítnout] │
└──────────────────────────────────────────────────────────────┘
```

### 16.4 UX scénáře (ověření návrhů)

1. **Trenér vytvoří nový kroužek do 3 minut** bez externí asistence.
2. **Administrátor schválí kroužek do 30 sekund** ze seznamu čekajících.
3. **Návštěvník najde vhodný kroužek do 5 kliknutí** přes filtraci a detail.

### 16.5 Doporučení pro další iteraci UI

- Doplnit high-fidelity návrhy ve Figmě podle wireframů výše.
- Zavést design tokeny (barvy, typografie, spacing) jako centralizovaný zdroj.
- Přidat komponentové screenshot testy pro klíčové stránky (`/krouzky`, `/krouzky/nova`, `/admin`).

**Další zdroje:**
- [Firebase dokumentace](https://firebase.google.com/docs)
- [Next.js dokumentace](https://nextjs.org/docs)
- [React dokumentace](https://react.dev)
- [Tailwind CSS dokumentace](https://tailwindcss.com/docs)
