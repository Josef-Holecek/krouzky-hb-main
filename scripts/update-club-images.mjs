import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { basename, extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBXZ5xOtzRcg7iwn6hiA-EUmamejECEazA',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ict-projekt2.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ict-projekt2',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ict-projekt2.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '987048208484',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:987048208484:web:4dfc4cf25ad503a2ef9771',
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const mimeTypeByExt = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function parseClubNameFromJson(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);
  const md = json.data?.markdown || '';
  const match = md.match(/^# (.+)$/m);
  return match ? match[1].trim() : '';
}

function buildClubImageMap() {
  const dataDir = join(rootDir, 'data-krouzky.json');
  const imagesDir = join(rootDir, 'public', 'images');
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const map = new Map();

  const dataFiles = readdirSync(dataDir)
    .filter((file) => file.toLowerCase().endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, 'cs'));

  for (const dataFile of dataFiles) {
    const jsonPath = join(dataDir, dataFile);
    const clubName = parseClubNameFromJson(jsonPath);
    if (!clubName) continue;

    const slug = basename(dataFile, '.json');
    let foundImagePath = null;

    for (const ext of imageExtensions) {
      const candidate = join(imagesDir, `${slug}${ext}`);
      if (existsSync(candidate)) {
        foundImagePath = candidate;
        break;
      }
    }

    if (foundImagePath) {
      map.set(clubName, { slug, imagePath: foundImagePath });
    }
  }

  return map;
}

async function authenticateForStorage() {
  const email = process.env.FIREBASE_SCRIPT_EMAIL;
  const password = process.env.FIREBASE_SCRIPT_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Chybí FIREBASE_SCRIPT_EMAIL nebo FIREBASE_SCRIPT_PASSWORD. Bez přihlášení nelze zapisovat do Firebase Storage.'
    );
  }

  await signInWithEmailAndPassword(auth, email, password);
  console.log(`✅ Přihlášeno do Firebase Auth jako ${email}`);
}

async function uploadImageToStorage(localPath, slug) {
  const extension = extname(localPath).toLowerCase();
  const contentType = mimeTypeByExt[extension] || 'application/octet-stream';
  const fileBuffer = readFileSync(localPath);

  // Stable path allows overwriting same imported image without creating duplicates.
  const storagePath = `clubs/imported/${slug}${extension}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, fileBuffer, { contentType, cacheControl: 'public,max-age=31536000' });
  return getDownloadURL(storageRef);
}

async function updateClubImages() {
  console.log('🔄 Nahrávám obrázky kroužků do Firebase Storage a aktualizuji Firestore...\n');
  await authenticateForStorage();

  const clubImageMap = buildClubImageMap();
  console.log(`🖼️  Nalezeno ${clubImageMap.size} lokálních obrázků pro import.`);
  
  const clubsRef = collection(db, 'clubs');
  const snapshot = await getDocs(clubsRef);
  
  let uploadedAndUpdated = 0;
  let notFound = 0;
  let failed = 0;

  for (const clubDoc of snapshot.docs) {
    const clubData = clubDoc.data();
    const clubName = clubData.name;
    const imageMeta = clubImageMap.get(clubName);
    
    if (imageMeta) {
      try {
        const downloadURL = await uploadImageToStorage(imageMeta.imagePath, imageMeta.slug);
        await updateDoc(doc(db, 'clubs', clubDoc.id), {
          image: downloadURL,
        });
        console.log(`✅ ${clubName} → ${downloadURL}`);
        uploadedAndUpdated++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`❌ Chyba při uploadu/aktualizaci ${clubName}: ${message}`);
        failed++;
      }
    } else {
      console.log(`⚠️  Kroužek "${clubName}" nemá lokální obrázek v public/images podle data-krouzky.json`);
      notFound++;
    }
  }
  
  console.log(`\n✨ Hotovo! Upload+aktualizace: ${uploadedAndUpdated}, Bez obrázku: ${notFound}, Chyby: ${failed}`);
  process.exit(0);
}

updateClubImages().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`❌ Skript selhal: ${message}`);
  process.exit(1);
});
