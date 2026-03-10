'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Data extracted from the JSON files in data-krouzky.json/
const clubsToImport = [
  {
    name: 'B:TECH - Elektrotechnický I.',
    category: 'Technické',
    description: 'Základy elektrotechnické teorie, fyzikální pokusy, práce s nářadím, nácvik montážních prací. Zapojování součástek, návrh DPS a pájení. Základy programování průmyslových počítačů a robotů. Tento zájmový útvar je jako jediný z elektrotechnických kroužků určen pro ty, kteří v minulosti do tohoto kroužku nechodili.\n\nSoučástí ceny je volný vstup do Dračí herny AZ CENTRA (PO, ÚT, ST - 15:00 - 18:00).',
    address: 'Laboratoř firmy B:TECH',
    dayTime: 'PO 16:00-17:30',
    trainerName: 'Petr Dobrovolný',
    trainerEmail: '',
    trainerPhone: '',
    web: 'https://www.azcentrumhb.cz/krouzky/krouzek/151006-b-tech-elektrotechnicky-i',
    ageFrom: 12,
    ageTo: 18,
    level: 'all',
    capacity: 20,
    price: 1500,
    pricePeriod: 'rok',
    image: '',
  },
  {
    name: 'B:TECH - Elektrotechnický IV.',
    category: 'Technické',
    description: 'Tento zájmový útvar je určen pouze pro ty, kteří jej již v minulosti navštěvovali. Práce s nářadím a nácvik montážních činností pro začátečníky. Rozšířené základy programování průmyslových počítačů a robotů.\n\nSoučástí ceny je volný vstup do Dračí herny AZ CENTRA (PO, ÚT, ST - 15:00 - 18:00).',
    address: 'Laboratoř firmy B:TECH',
    dayTime: 'ČT 17:30-19:00',
    trainerName: 'Petr Dobrovolný',
    trainerEmail: '',
    trainerPhone: '',
    web: 'https://www.azcentrumhb.cz/krouzky/krouzek/151009-b-tech-elektrotechnicky-iv',
    ageFrom: 12,
    ageTo: 20,
    level: 'all',
    capacity: 20,
    price: 1500,
    pricePeriod: 'rok',
    image: '',
  },
  {
    name: 'Dinosauři',
    category: 'Přírodovědné',
    description: 'Kroužek pro malé paleontology a milovníky pravěku zaměřený na svět dinosaurů. Podporuje zájem o historii Země a rozvoj vědeckého myšlení.\n\nAktivity: Modelování dinosaurů, hledání fosilií, tvorba pravěké krajiny, základní informace o období druhohor.\n\nSoučástí ceny je volný vstup do Dračí herny (PO, ÚT, ST - 15:00 - 18:00).',
    address: 'AZ CENTRUM',
    dayTime: 'PO 16:30-17:30',
    trainerName: 'Petra Müllerová',
    trainerEmail: '',
    trainerPhone: '608171677',
    web: 'https://www.azcentrumhb.cz/krouzky/krouzek/151507-dinosauri',
    ageFrom: 6,
    ageTo: 12,
    level: 'all',
    capacity: 20,
    price: 1800,
    pricePeriod: 'rok',
    image: '',
  },
  {
    name: 'Aerobic a posilování',
    category: 'Sport',
    description: 'Aerobik jako kondiční cvičení podporuje oběhovou soustavu, zvyšuje fyzickou výkonnost a cílí na svalovou vytrvalost. Aerobní pohyb je prevencí před smutkem a je také tzv. přírodním antidepresivem. Posílíme a protáhneme celé tělo. Upozornění pro všechny: aerobik je silně návykový. Na všechny se budeme těšit.\n\nSoučástí ceny je volný vstup do Dračí herny (PO, ÚT, ST - 15:00 - 18:00).',
    address: 'AZ CENTRUM',
    dayTime: 'ÚT 18:30-19:30',
    trainerName: 'Miloslava Čápová',
    trainerEmail: '',
    trainerPhone: '604532778',
    web: 'https://www.azcentrumhb.cz/krouzky/krouzek/153508-aerobic-a-posilovani',
    ageFrom: 18,
    ageTo: 99,
    level: 'all',
    capacity: 20,
    price: 1900,
    pricePeriod: 'rok',
    image: '',
  },
  {
    name: 'Active training / fitness cirkus',
    category: 'Sport',
    description: 'Zábavné lekce pro dospěláky od 18 let do 99 let\n\nStředa od 18:30 – 19:30 hod. v tělocvičně\n\n1. Blok Kardio cvičení (jumpink na trampolíně, aerobik nebo dance aerobik)\n2. Blok Bodyformu (jóga, pilates, bosu, švihadla, gumy, činky, overball)\n3. Blok Strečink\n\nSoučástí ceny je volný vstup do Dračí herny (PO, ÚT, ST - 15:00 - 18:00).',
    address: 'AZ CENTRUM',
    dayTime: 'ST 18:30-19:30',
    trainerName: 'Markéta Pecka Merunková',
    trainerEmail: '',
    trainerPhone: '',
    web: 'https://www.azcentrumhb.cz/krouzky/krouzek/153511-active-training-fitness-cirkus',
    ageFrom: 18,
    ageTo: 99,
    level: 'all',
    capacity: 20,
    price: 1900,
    pricePeriod: 'rok',
    image: '',
  },
  {
    name: 'Aikido - začátečníci',
    category: 'Sport',
    description: 'AZ CENTRUM ve spolupráci s klubem Aikido HB otevírá kroužek pro úplné začátečníky, kde se v přátelské atmosféře naučíte základní páky, hody i pádové techniky na tatami, posílíte koordinaci a sebevědomí a osvojíte si respekt k partnerovi. Aby mohli cvičenci aikido skládat mezinárodně uznávané zkoušky na technické stupně, musí být členy spolku Aikido HB – tento klub je členem zastřešující organizace Aikido ČR, v jejímž rámci se zkoušky konají. Přihlášku jednoduše vyřídíte s trenérem přímo na tréninku; poplatek za členství je už zahrnutý v běžném "kroužkovném".\n\nSoučástí ceny je volný vstup do Dračí herny (PO, ÚT, ST - 15:00 - 18:00).',
    address: 'AZ CENTRUM',
    dayTime: 'PO 16:00-18:00, ÚT 17:30-19:30',
    trainerName: 'Jan Vydrář',
    trainerEmail: '',
    trainerPhone: '',
    web: 'https://www.azcentrumhb.cz/krouzky/krouzek/153527-aikido-zacatecnici',
    ageFrom: 8,
    ageTo: 12,
    level: 'beginner',
    capacity: 20,
    price: 5500,
    pricePeriod: 'rok',
    image: '',
  },
  {
    name: 'Aikido - pokročilí',
    category: 'Sport',
    description: 'Kurz pro pokročilé je určen cvičencům s předchozí zkušeností s aikidem, kteří chtějí prohloubit plynulé kombinace hodů a pák, vylepšit dynamiku pohybu, práci s rovnováhou a rychlé přechody mezi technikami. Tréninky posilují reakční rychlost, preciznost a vnitřní stabilitu, přičemž bezpečnost a vzájemný respekt zůstávají prioritou. Stejně jako u začátečníků je pro složení mezinárodně uznávané zkoušky nutné členství ve spolku Aikido HB (člen Aikido ČR); přihlášku s vámi trenér vyplní na tréninku, poplatek je zahrnutý už v ceně kroužku.\n\nSoučástí ceny je volný vstup do Dračí herny (PO, ÚT, ST - 15:00 - 18:00).',
    address: 'AZ CENTRUM',
    dayTime: 'PO 16:00-18:00, ČT 17:00-19:00',
    trainerName: 'Jan Vydrář',
    trainerEmail: '',
    trainerPhone: '',
    web: 'https://www.azcentrumhb.cz/krouzky/krouzek/153528-aikido-pokrocili',
    ageFrom: 12,
    ageTo: 26,
    level: 'advanced',
    capacity: 20,
    price: 5500,
    pricePeriod: 'rok',
    image: '',
  },
];

export default function ImportPage() {
  const { user, userProfile } = useAuth();
  const [results, setResults] = useState<{ name: string; success: boolean; id?: string; error?: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  const isAdmin =
    user && userProfile?.email && adminEmails.includes(userProfile.email.toLowerCase());

  // Debug
  console.log('ImportPage - user:', user?.email);
  console.log('ImportPage - userProfile:', userProfile?.email);
  console.log('ImportPage - isAdmin:', isAdmin);
  console.log('ImportPage - adminEmails:', adminEmails);

  if (!user) {
    return (
      <section className="py-12">
        <div className="container max-w-2xl">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p>Přihlaste se jako administrátor.</p>
              <p className="text-xs text-muted-foreground">
                DEBUG: user={user ? 'ok' : 'null'}, userProfile={userProfile?.email || 'null'}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="py-12">
        <div className="container max-w-2xl">
          <Card className="bg-rose-50 border-rose-200">
            <CardContent className="pt-6 space-y-4">
              <p>Přístup zamítnut – nemáte administrátorská oprávnění.</p>
              <div className="text-xs text-rose-700 space-y-1">
                <p>Přihlášený email: {user?.email}</p>
                <p>Profile email: {userProfile?.email}</p>
                <p>Expected emails: {adminEmails.join(', ')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const handleImport = async () => {
    if (!db || !user) return;
    setImporting(true);
    setResults([]);

    const clubsRef = collection(db, 'clubs');
    const newResults: typeof results = [];

    for (const club of clubsToImport) {
      try {
        const docRef = await addDoc(clubsRef, {
          ...club,
          createdAt: new Date().toISOString(),
          createdBy: user.uid,
          status: 'pending',
          approvedAt: null,
          approvedBy: null,
          rejectedAt: null,
          rejectedBy: null,
          rejectReason: null,
        });
        newResults.push({ name: club.name, success: true, id: docRef.id });
      } catch (err: unknown) {
        const error = err as { message?: string };
        newResults.push({ name: club.name, success: false, error: error.message || 'Neznámá chyba' });
      }
      setResults([...newResults]);
    }

    setImporting(false);
    setDone(true);
  };

  return (
    <section className="py-12">
      <div className="container max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Import kroužků</h1>
          <p className="text-muted-foreground mt-1">
            Importuje 7 kroužků z AZ CENTRA do databáze se stavem &quot;čeká na schválení&quot;.
          </p>
        </div>

        {!done && (
          <Button onClick={handleImport} disabled={importing} size="lg">
            {importing ? 'Importuji...' : 'Spustit import (7 kroužků)'}
          </Button>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((r, i) => (
              <Card key={i} className={r.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="py-3 flex items-center justify-between">
                  <span className="font-medium">{r.name}</span>
                  {r.success ? (
                    <span className="text-green-700 text-sm">Importováno (ID: {r.id})</span>
                  ) : (
                    <span className="text-red-700 text-sm">Chyba: {r.error}</span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {done && (
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/admin">Přejít do administrace ke schválení</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
