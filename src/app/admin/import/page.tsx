'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
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
    name: 'Divadelní průprava pro nejmenší',
    category: 'Jazykové',
    description: 'Tento kroužek je určen mladším dětem, které si chtějí vyzkoušet, jaké to je stát se na chvíli někým jiným a ponořit se do světa fantazie a her. Základem je hraní v roli, rozvoj tvořivosti, pohybových i hlasových dovedností a týmové spolupráce.\n\nVýstupem kroužku bude samostatné představení v divadelním sále AZ CENTRA. Součástí ceny je volný vstup do Dračí herny (PO, ÚT, ST - 15:00 - 18:00).',
    address: 'AZ CENTRUM',
    dayTime: 'ÚT 15:00-16:15',
    trainerName: 'Marie Domkářová',
    trainerEmail: '',
    trainerPhone: '',
    web: 'https://www.azcentrumhb.cz/krouzky/krouzek/154505-divadelni-pruprava-pro-nejmensi',
    ageFrom: 6,
    ageTo: 8,
    level: 'all',
    capacity: 20,
    price: 2000,
    pricePeriod: 'rok',
    image: 'https://www.azcentrumhb.cz/image.php?nid=21376&oid=13219374&width=700',
  },
  {
    name: 'Divadelní průprava',
    category: 'Jazykové',
    description: 'Kroužek zaměřený na hraní v roli, kde vyhrává ten, kdo se nejvíc bavil. Děti a mladí divadelníci zapojují tělo, smysly, city i týmového ducha.\n\nVýstupem kroužku budou drobná představení v divadelním sále AZ CENTRA. Součástí ceny je volný vstup do Dračí herny (PO, ÚT, ST - 15:00 - 18:00).',
    address: 'AZ CENTRUM',
    dayTime: 'ÚT 16:30-18:00',
    trainerName: 'Anna Provazníková',
    trainerEmail: '',
    trainerPhone: '',
    web: 'https://www.azcentrumhb.cz/krouzky/krouzek/154501-divadelni-pruprava',
    ageFrom: 9,
    ageTo: 14,
    level: 'all',
    capacity: 20,
    price: 2000,
    pricePeriod: 'rok',
    image: 'https://www.azcentrumhb.cz/image.php?nid=21376&oid=13219373&width=700',
  },
  {
    name: 'Flétna pro mírně pokročilé',
    category: 'Hudební',
    description: 'Kroužek je určen pro žáky, kteří již navštěvovali výuku flétny. Časový rozvrh je stanoven dle dohody s vedoucím a cílem je vánoční a jarní koncert.\n\nSoučástí ceny je volný vstup do Dračí herny (PO, ÚT, ST - 15:00 - 18:00).',
    address: 'AZ CENTRUM',
    dayTime: 'ST 14:00-18:00',
    trainerName: 'Jan Zvolánek',
    trainerEmail: '',
    trainerPhone: '',
    web: 'https://www.azcentrumhb.cz/krouzky/krouzek/152502-fletna-pro-mirne-pokrocile',
    ageFrom: 7,
    ageTo: 17,
    level: 'all',
    capacity: 20,
    price: 2000,
    pricePeriod: 'rok',
    image: 'https://www.azcentrumhb.cz/image.php?nid=21376&oid=13219380&width=700',
  },
  {
    name: 'Flétna pro začátečníky',
    category: 'Hudební',
    description: 'Kroužek je určen pro děti od 7 let, které se chtějí naučit hrát na flétnu. Získají základy hry na flétnu i hudební nauky a připraví se na vánoční a jarní koncert.\n\nSoučástí ceny je volný vstup do Dračí herny (PO, ÚT, ST - 15:00 - 18:00).',
    address: 'AZ CENTRUM',
    dayTime: 'PO 15:00-16:00',
    trainerName: 'Jan Zvolánek',
    trainerEmail: '',
    trainerPhone: '',
    web: 'https://www.azcentrumhb.cz/krouzky/krouzek/152501-fletna-pro-zacatecniky',
    ageFrom: 7,
    ageTo: 17,
    level: 'beginner',
    capacity: 20,
    price: 2000,
    pricePeriod: 'rok',
    image: 'https://www.azcentrumhb.cz/image.php?nid=21376&oid=13219384&width=700',
  },
  {
    name: 'Florbal - přípravka - pondělí',
    category: 'Sport',
    description: 'Děti se seznámí se základy florbalu hravou formou přizpůsobenou jejich věku. Rozvíjejí pohybové dovednosti, týmovou spolupráci a radost z pohybu v bezpečném prostředí.\n\nTréninky probíhají 1x týdně v pondělí. Součástí ceny je volný vstup do Dračí herny (PO, ÚT, ST - 15:00 - 18:00).',
    address: 'AZ CENTRUM',
    dayTime: 'PO 17:30-18:30',
    trainerName: 'Michal Sedmík',
    trainerEmail: '',
    trainerPhone: '',
    web: 'https://www.azcentrumhb.cz/krouzky/krouzek/153519-florbal-pripravka-pondeli',
    ageFrom: 4,
    ageTo: 8,
    level: 'all',
    capacity: 20,
    price: 1900,
    pricePeriod: 'rok',
    image: 'https://www.azcentrumhb.cz/image.php?nid=21376&oid=13219387&width=700',
  },
  {
    name: 'Fotografování',
    category: 'Technické',
    description: 'Kroužek pro milovníky fotografie, kteří chtějí zdokonalit své dovednosti a objevovat různé techniky, styly a žánry. Fotí se v interiéru i exteriéru, bez nutnosti předchozích zkušeností.\n\nSoučástí ceny je volný vstup do Dračí herny (PO, ÚT, ST - 15:00 - 18:00).',
    address: 'AZ CENTRUM',
    dayTime: 'PÁ 14:30-16:00',
    trainerName: 'Martina Niklová',
    trainerEmail: '',
    trainerPhone: '',
    web: 'https://www.azcentrumhb.cz/krouzky/krouzek/151010-fotografovani',
    ageFrom: 10,
    ageTo: 18,
    level: 'all',
    capacity: 20,
    price: 2400,
    pricePeriod: 'rok',
    image: 'https://www.azcentrumhb.cz/image.php?nid=21376&oid=13219389&width=700',
  },
  {
    name: 'Hravá angličtina pro ty nejmenší',
    category: 'Jazykové',
    description: 'Kroužek je vhodný pro děti od 3 let bez dozoru rodičů až po předškoláky. Lekce jsou vedeny hravou formou, děti si hrají, zpívají, poslouchají pohádky a nenásilně poznávají anglický jazyk.\n\nVýuka se zaměřuje na rozvoj poslechu a mluvení. Součástí ceny je volný vstup do Dračí herny (PO, ÚT, ST - 15:00 - 18:00).',
    address: 'AZ CENTRUM',
    dayTime: 'ST 16:30-17:30',
    trainerName: 'Lucie Brigantová',
    trainerEmail: '',
    trainerPhone: '',
    web: 'https://www.azcentrumhb.cz/krouzky/krouzek/154502-hrava-anglictina-pro-ty-nejmensi',
    ageFrom: 3,
    ageTo: 6,
    level: 'all',
    capacity: 20,
    price: 1800,
    pricePeriod: 'rok',
    image: 'https://www.azcentrumhb.cz/image.php?nid=21376&oid=13219390&width=700',
  },
];

export default function ImportPage() {
  const { user, userProfile, loading } = useAuth();
  const [results, setResults] = useState<{ name: string; success: boolean; id?: string; error?: string }[]>([]);
  const [imageResults, setImageResults] = useState<{ name: string; success: boolean; detail: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [syncingImages, setSyncingImages] = useState(false);
  const [done, setDone] = useState(false);

  // Use user.email from Firebase Auth directly (more reliable than userProfile from Firestore)
  const userEmail = user?.email || userProfile?.email || '';
  const isAdmin = !!user && !!userEmail && adminEmails.includes(userEmail.toLowerCase());

  if (loading) {
    return (
      <section className="py-12">
        <div className="container max-w-2xl">
          <Card>
            <CardContent className="pt-6">
              <p>Načítání...</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="py-12">
        <div className="container max-w-2xl">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p>Přihlaste se jako administrátor.</p>
              <p className="text-xs text-muted-foreground">
                Přejděte na <a href="/prihlaseni" className="underline">/prihlaseni</a> a přihlaste se.
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
                <p>Přihlášený email: {userEmail}</p>
                <p>Povolené emaily: {adminEmails.join(', ')}</p>
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

  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

  const extensionFromPath = (path: string) => {
    const cleanPath = path.split('?')[0];
    const ext = cleanPath.slice(cleanPath.lastIndexOf('.')).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp') return ext;
    return '.jpg';
  };

  const handleSyncImagesToStorage = async () => {
    if (!db || !storage || !user) return;

    setSyncingImages(true);
    setImageResults([]);

    const clubsSnapshot = await getDocs(collection(db, 'clubs'));
    const nextResults: typeof imageResults = [];

    for (const clubDoc of clubsSnapshot.docs) {
      const club = clubDoc.data() as { name?: string; image?: string };
      const clubName = club.name || clubDoc.id;
      const image = club.image || '';

      if (!image.startsWith('/images/')) {
        nextResults.push({
          name: clubName,
          success: true,
          detail: 'Přeskočeno (obrázek už není lokální /images cesta)',
        });
        setImageResults([...nextResults]);
        continue;
      }

      try {
        const response = await fetch(image);
        if (!response.ok) {
          throw new Error(`Nelze načíst lokální obrázek (${response.status})`);
        }

        const blob = await response.blob();
        const ext = extensionFromPath(image);
        const slug = toSlug(clubName);
        const storageRef = ref(storage, `clubs/imported/${clubDoc.id}-${slug}${ext}`);

        await uploadBytes(storageRef, blob, {
          contentType: blob.type || 'image/jpeg',
          cacheControl: 'public,max-age=31536000',
        });

        const downloadURL = await getDownloadURL(storageRef);
        await updateDoc(doc(db, 'clubs', clubDoc.id), { image: downloadURL });

        nextResults.push({
          name: clubName,
          success: true,
          detail: 'Nahráno do Storage a URL uložena do Firestore',
        });
      } catch (error: unknown) {
        const err = error as { message?: string };
        nextResults.push({
          name: clubName,
          success: false,
          detail: err.message || 'Neznámá chyba při nahrávání obrázku',
        });
      }

      setImageResults([...nextResults]);
    }

    setSyncingImages(false);
  };

  return (
    <section className="py-12">
      <div className="container max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Import kroužků</h1>
          <p className="text-muted-foreground mt-1">
            Importuje dalších 7 kroužků z AZ CENTRA do databáze se stavem &quot;čeká na schválení&quot;.
          </p>
        </div>

        {!done && (
          <Button onClick={handleImport} disabled={importing || syncingImages} size="lg">
            {importing ? 'Importuji...' : 'Spustit import (7 nových kroužků)'}
          </Button>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Přesun obrázků do Firebase Storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Projde všechny kroužky a pokud mají obrázek ve tvaru /images/..., nahraje ho do Firebase Storage a přepíše pole image na download URL.
            </p>
            <Button onClick={handleSyncImagesToStorage} disabled={syncingImages || importing}>
              {syncingImages ? 'Nahrávám obrázky...' : 'Nahrát /images obrázky do Storage'}
            </Button>
          </CardContent>
        </Card>

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

        {imageResults.length > 0 && (
          <div className="space-y-2">
            {imageResults.map((r, i) => (
              <Card key={`img-${i}`} className={r.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="py-3 flex items-center justify-between gap-3">
                  <span className="font-medium">{r.name}</span>
                  <span className={r.success ? 'text-green-700 text-sm text-right' : 'text-red-700 text-sm text-right'}>{r.detail}</span>
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
