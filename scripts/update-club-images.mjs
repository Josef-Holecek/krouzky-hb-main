import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Firebase config
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

// Mapping club names to image filenames
const clubImages = {
  'Aerobic a posilování': '/images/aerobic.jpg',
  'Aikido - pokročilí': '/images/aikido-pokrocili.jpg',
  'Aikido - začátečníci': '/images/aikido-zacatecnici.jpg',
  'Active training / fitness cirkus': '/images/active-training.jpg',
  'Dinosauři': '/images/dinosauri.jpg',
  'B:TECH - Elektrotechnický I.': '/images/btech-1.jpg',
  'B:TECH - Elektrotechnický IV.': '/images/btech-4.jpg',
};

async function updateClubImages() {
  console.log('🔄 Aktualizuji obrázky kroužků...\n');
  
  const clubsRef = collection(db, 'clubs');
  const snapshot = await getDocs(clubsRef);
  
  let updated = 0;
  let notFound = 0;

  for (const clubDoc of snapshot.docs) {
    const clubData = clubDoc.data();
    const clubName = clubData.name;
    
    if (clubImages[clubName]) {
      try {
        await updateDoc(doc(db, 'clubs', clubDoc.id), {
          image: clubImages[clubName]
        });
        console.log(`✅ ${clubName} → ${clubImages[clubName]}`);
        updated++;
      } catch (err) {
        console.error(`❌ Chyba při aktualizaci ${clubName}:`, err.message);
      }
    } else {
      console.log(`⚠️  Kroužek "${clubName}" nemá přiřazený obrázek`);
      notFound++;
    }
  }
  
  console.log(`\n✨ Hotovo! Aktualizováno: ${updated}, Nepřiřazeno: ${notFound}`);
  process.exit(0);
}

updateClubImages();
