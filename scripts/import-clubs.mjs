import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Firebase config from .env.local
const firebaseConfig = {
  apiKey: 'AIzaSyBXZ5xOtzRcg7iwn6hiA-EUmamejECEazA',
  authDomain: 'ict-projekt2.firebaseapp.com',
  projectId: 'ict-projekt2',
  storageBucket: 'ict-projekt2.firebasestorage.app',
  messagingSenderId: '987048208484',
  appId: '1:987048208484:web:4dfc4cf25ad503a2ef9771',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Parse club data from scraped markdown content
function parseClubFromJson(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);
  const md = json.data.markdown;

  const get = (label) => {
    // Match **Label** followed by the value on the next non-empty line(s)
    const re = new RegExp(`\\*\\*${label}\\*\\*\\s*\\n+([^\\n*]+)`, 'i');
    const m = md.match(re);
    return m ? m[1].trim() : '';
  };

  const name = (() => {
    const m = md.match(/^# (.+)$/m);
    return m ? m[1].trim() : '';
  })();

  const category = get('Zaměření kroužku');
  const address = get('Místo konání');
  const dayTime = get('Dny konání');
  const trainerName = get('Lektor');
  const priceStr = get('Cena za rok');
  const price = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
  const ageStr = get('Věková skupina');
  
  let ageFrom = 0, ageTo = 99;
  const ageMatch = ageStr.match(/(\d+)\s*-\s*(\d+)/);
  if (ageMatch) {
    ageFrom = parseInt(ageMatch[1], 10);
    ageTo = parseInt(ageMatch[2], 10);
  }

  const availabilityStr = get('Volná místa');

  // Extract description from the section after the horizontal rule and details
  const descriptionMatch = md.match(/\*\*Přihlášení\*\*[\s\S]*?\n\* \* \*\n\n([\s\S]*?)\n\n\[Zpět na přehled\]/);
  const description = descriptionMatch ? descriptionMatch[1].trim() : '';

  // Map category names to app categories
  const categoryMap = {
    'Digitální tech. a elektrotechnika, Lego': 'Technické',
    'Přírodovědné směřování': 'Přírodovědné',
    'Sport (tradiční i netradiční) a šachy': 'Sport',
  };

  return {
    name,
    category: categoryMap[category] || category,
    description,
    address,
    dayTime,
    trainerName,
    trainerEmail: '',
    trainerPhone: '',
    web: json.data.metadata?.sourceURL || '',
    ageFrom,
    ageTo,
    level: name.toLowerCase().includes('začátečn') ? 'beginner' : 
           name.toLowerCase().includes('pokročil') ? 'advanced' : 'all',
    capacity: 20,
    price,
    pricePeriod: 'rok',
    image: '',
    createdAt: new Date().toISOString(),
    createdBy: 'import-script',
    status: 'pending',
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    rejectReason: null,
  };
}

async function main() {
  const dataDir = join(rootDir, 'data-krouzky.json');
  const files = [
    'krouzek1.json',
    'krouzek2.json',
    'krouzek3.json',
    'krouzek4.json',
    'krouzek5.json',
    'krouzek6.json',
    'krouzek7.json',
  ];

  const clubsRef = collection(db, 'clubs');

  for (const file of files) {
    const filePath = join(dataDir, file);
    try {
      const clubData = parseClubFromJson(filePath);
      console.log(`\nImporting: ${clubData.name}`);
      console.log(`  Category: ${clubData.category}`);
      console.log(`  Address: ${clubData.address}`);
      console.log(`  Day/Time: ${clubData.dayTime}`);
      console.log(`  Trainer: ${clubData.trainerName}`);
      console.log(`  Age: ${clubData.ageFrom}-${clubData.ageTo}`);
      console.log(`  Price: ${clubData.price} Kč`);
      console.log(`  Status: ${clubData.status}`);

      const docRef = await addDoc(clubsRef, clubData);
      console.log(`  ✅ Created with ID: ${docRef.id}`);
    } catch (err) {
      console.error(`  ❌ Error importing ${file}:`, err.message);
    }
  }

  console.log('\n🎉 Import complete! All clubs added with status "pending" (připravené na schválení).');
  process.exit(0);
}

main();
