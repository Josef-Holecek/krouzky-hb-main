# Technická dokumentace – Kroužky Havlíčkův Brod

**Projekt:** Webový systém pro přehled kroužků a trenérů  
**Autor:** Josef Holeček  
**Verze dokumentu:** 1.0  
**Datum:** Březen 2026  
**Repozitář:** [github.com/Josef-Holecek/krouzky-hb-main](https://github.com/Josef-Holecek/krouzky-hb-main)

---

## 📖 Kompletní dokumentace

Celá technická dokumentace je obsažena v **jednom dokumentu**:

👉 **[TECHNICKA_DOKUMENTACE.md](./TECHNICKA_DOKUMENTACE.md)** ← Začněte zde

Tento dokument obsahuje:

1. **Přehled systému** – Co je Kroužky HB a jak funguje
2. **Technologický stack** – Next.js, Firebase, TypeScript
3. **Struktura repozitáře** – Jak je projekt organizován
4. **Instalace a spuštění** — Step-by-step návod
5. **Firestore schéma** — Collections, dokumenty, indexy
6. **Workflow stavů** — Jak se kroužky pohybují skrz stavy
7. **Autentizace a autorizace** — Role, Security Rules
8. **Routing** — Přehled všech tras
9. **Hlavní hooks a komponenty** — Klíčové součásti aplikace
10. **Upload a správa souborů** — Firebase Storage
11. **Firestore Security Rules** — Produkční bezpečnost
12. **Nasazení na produkci** — Vercel, Firebase Hosting
13. **Ručně přidaná data o kroužcích** — JSON import do Firestore
14. **Troubleshooting** — Řešení běžných problémů

---

## ⚡ Rychlý Start

```bash
# Instalace závislostí
npm install

# Spuštění vývojového serveru
npm run dev

# Build pro produkci
npm run build

# Spuštění produkčního serveru
npm start
```

Aplikace bude dostupná na `http://localhost:3000`

---

## 🏗️ Architektura na vysoké úrovni

```
┌─────────────────────────────────────┐
│     Frontend (Next.js + React)      │
│  (TypeScript, Tailwind CSS, Radix) │
└──────────────────┬──────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼────┐         ┌─────▼──────┐
   │ Firebase │         │  REST API  │
   │  (Auth)  │         │  (Next.js) │
   └────┬────┘         └─────┬──────┘
        │                     │
   ┌────▼──────────────────────▼────┐
   │     Firestore Database         │
   │   (Cloud Firestore/Realtime)   │
   └────────────────────────────────┘
```

---

## 👥 Uživatelské role

1. **Běžný návštěvník** — Vyhledávání a prohlížení kroužků
2. **Trenér/Organizátor** — Správa vlastních kroužků a profilu
3. **Administrátor** — Správa a schvalování obsahu

---

## 🗂️ Hlavní funkce

- ✅ Přehled kroužků podle kategorií
- ✅ Filtrování dle věku, typu aktivity, lokality, času
- ✅ Detail kroužku a trenéra
- ✅ Správa profilu pro trenéry
- ✅ Administrační rozhraní pro schvalování
- ✅ Responsivní design (mobil/desktop)

---

## 📞 Kontakt a podpora

Pro více informací se podívejte do jednotlivých kapitol dokumentace.
