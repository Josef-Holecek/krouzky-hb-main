# Firebase Setup Guide - Příručka nastavení Firebase

Tato aplikace nyní používá Firebase pro autentifikaci a ukládání dat uživatelů v Firestore databázi.

## Krok 1: Vytvoření Firebase projektu

1. Přejděte na [Firebase Console](https://console.firebase.google.com/)
2. Klikněte na "Add project" (Přidat projekt)
3. Zadejte název projektu (např. "krou-ky-hb")
4. Dokončete vytvoření projektu

## Krok 2: Aktivace Authentication (Autentifikace)

1. V levém menu klikněte na "Build" → "Authentication" (Autentifikace)
2. Klikněte na "Get started" (Začít)
3. Vyberte "Email/Password" jako metodu přihlášení
4. Povolte "Email/Password" toggle
5. Klikněte "Save" (Uložit)

## Krok 3: Vytvoření Firestore databáze

1. V levém menu klikněte na "Build" → "Firestore Database" (Databáze Firestore)
2. Klikněte na "Create database" (Vytvořit databázi)
3. Vyberte výchozí umístění (doporučeno pro EU: europe-west1)
4. Vyberte "Start in test mode" (Spustit v testovacím režimu)
   - ⚠️ Poznámka: Později si změňte zabezpečení na produkčníí pravidla!
5. Klikněte "Create" (Vytvořit)

## Krok 3b: Aktivace Firebase Storage (pro obrázky kroužků)

1. V levém menu klikněte na "Build" → "Storage"
2. Klikněte na "Get started" (Začít)
3. V dialogu s pravidly zabezpečení klikněte "Next" (Další)
4. Vyberte stejné umístění jako u Firestore (např. europe-west1)
5. Klikněte "Done" (Hotovo)
6. Přejděte na záložku "Rules" a nahraďte pravidla:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /clubs/{clubId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /trainers/{trainerId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

7. Klikněte "Publish" (Publikovat)

## Krok 4: Nastavení pravidel Firestore (bezpečnost)

V Firestore console přejděte do záložky "Rules" (Pravidla) a nahraďte obsah tímto kódem:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Uživatelé mohou číst a zapisovat svůj vlastní profil
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Kroužky - všichni mohou číst, jen přihlášení mohou vytvářet
    match /clubs/{document=**} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.createdBy;
    }
    
    match /trainers/{document=**} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.createdBy;
    }
  }
}
```

Klikněte "Publish" (Publikovat)

## Krok 5: Získání konfiguračních údajů

1. V levém menu klikněte na "Project Settings" (Nastavení projektu)
2. Klikněte na ikonu vašeho Web aplikace (pokud ji ještě nemáte, klikněte na "Add app" - Přidat aplikaci)
3. Zkopírujte Firebase config:

```javascript
{
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}
```

## Krok 6: Nastavení Environment Variables

1. Otevřete soubor `.env.local` v kořenovém adresáři projektu
2. Vyplňte konfiguračních údajů z kroku 5:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

3. Uložte soubor
4. Restartujte dev server: `npm run dev`

## Krok 7: Testování

1. Spusťte aplikaci: `npm run dev`
2. Přejděte na http://localhost:3000/prihlaseni
3. Klikněte na záložku "Registrace" (Registration)
4. Vyplňte formulář a klikněte "Vytvořit účet"
5. Nový uživatel by měl být vytvořen a přihlášen
6. Zkontrolujte v [Firebase Console → Firestore Database](https://console.firebase.google.com/) v kolekci "users" - měl by tam být váš nový uživatel

## Struktura databáze

Vaši uživatelé budou uloženi v Firestore takto:

```
Collection: users
  └─ Document: {uid}
      ├─ uid: "..."
      ├─ email: "user@example.com"
      ├─ name: "Jan Novák"
      ├─ createdAt: "2025-12-27T..."
      └─ updatedAt: "2025-12-27T..."
```

## Použité hook

V komponentách se používá hook `useAuth`:

```typescript
import { useAuth } from '@/hooks/useAuth';

export function MyComponent() {
  const { 
    user,           // Aktuální uživatel (Firebase User object)
    userProfile,    // Profil uživatele z Firestore
    login,          // async function(email, password)
    register,       // async function(email, password, name)
    logout,         // async function()
    isAuthenticated,// boolean
    loading,        // boolean - True během načítání
    error          // string | null
  } = useAuth();
  
  return (
    // váš obsah
  );
}
```

## Příklad použití

```typescript
'use client';
import { useAuth } from '@/hooks/useAuth';

export function UserProfile() {
  const { userProfile, logout, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <div>Přihlaste se</div>;
  
  return (
    <div>
      <p>Vítej, {userProfile?.name}!</p>
      <button onClick={logout}>Odhlásit se</button>
    </div>
  );
}
```

## Bezpečnostní poznámka

⚠️ Vaše Firebase konfigurace (v `.env.local`) obsahuje citlivé údaje. Ujistěte se, že:
- Soubor `.env.local` je v `.gitignore` a není pushnout do Git
- V produkci použijte správná Firestore pravidla (ne test mode)
- Aktivujte ověřování domény pro API klíč v Firebase Console

## Podpora

Pokud máte problémy:
1. Zkontrolujte, že všechny environment variables jsou správně nastaveny
2. Zkontrolujte chyby v konzoli dev nástroje (F12)
3. Podívejte se na [Firebase dokumentaci](https://firebase.google.com/docs)

## Řešení chyb (Troubleshooting)

### 400 u `identitytoolkit.googleapis.com/v1/accounts:signUp`

Pokud v konzoli vidíte chybu 400 při registraci (volání `accounts:signUp`), zkontrolujte následující:

- Email/Password povolen: V Firebase Console → Authentication → Sign-in method zapněte „Email/Password“.
- Heslo je dostatečně dlouhé: minimálně 6 znaků (jinak `auth/weak-password`).
- Správné env proměnné: soubor `.env.local` musí obsahovat hodnoty z Project Settings → Web App (API key apod.).
- API klíč není neplatný/restriktovaný: pokud máte restrikce na API klíč (HTTP referrers), povolte doménu, ze které aplikace běží (např. `http://localhost:3000`). Chyba může být `auth/invalid-api-key`.
- Autorizované domény: v Authentication → Settings → Authorized domains přidejte `localhost` (a produkční domény).

Typické chybové kódy:

- `auth/operation-not-allowed`: zapněte Email/Password metodu.
- `auth/invalid-api-key`: upravte `.env.local` a zkontrolujte restrikce klíče.
- `auth/weak-password`: použijte heslo se ≥ 6 znaky.
- `auth/invalid-email` / `auth/missing-email`: opravte vstupní email.

Po úpravách restartujte dev server:

```bash
npm run dev
```
