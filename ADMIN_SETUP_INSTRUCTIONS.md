# Nastavení Admin přístupu

## Krok 1: Aktualizovat Firestore pravidla

V Firebase Console → Firestore Database → Rules nahraďte pravidla tímto:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Uživatelé mohou číst a zapisovat svůj vlastní profil
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Kroužky - VŠICHNI mohou číst (i nepřihlášení), jen přihlášení mohou vytvářet
    match /clubs/{document=**} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.createdBy
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Trenéři - VŠICHNI mohou číst (i nepřihlášení), jen přihlášení mohou vytvářet
    match /trainers/{document=**} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.createdBy
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

## Krok 2: Přidat isAdmin pole k vašemu existujícímu uživateli

V Firebase Console:
1. Jděte do **Firestore Database**
2. Otevřete kolekci **users**
3. Najděte váš dokument (hledejte email: holecekjosef1@gmail.com)
4. Klikněte na dokument
5. Klikněte **"Add field"** (Přidat pole)
6. Název pole: `isAdmin`
7. Typ: `boolean`
8. Hodnota: `true` (zaškrtnout checkbox)
9. Klikněte **Save**

## Krok 3: Znovu se přihlásit

1. Odhlaste se z aplikace
2. Znovu se přihlaste
3. Jděte na `/admin` - nyní byste měli mít oprávnění schvalovat kroužky a trenéry

## Poznámka

Noví uživatelé s emailem uvedeným v `.env.local` pod `NEXT_PUBLIC_ADMIN_EMAILS` budou mít automaticky `isAdmin: true` při registraci.
