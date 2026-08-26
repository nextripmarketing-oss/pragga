import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, query, where, limit, DocumentData } from 'firebase/firestore';

const nextTripFirebaseConfig = {
  apiKey: "AIzaSyA4tcfpi9BjkL54tsptYXkcv2wFX_Z66Oo",
  authDomain: "inductive-rhino-107pf.firebaseapp.com",
  projectId: "inductive-rhino-107pf",
  storageBucket: "inductive-rhino-107pf.firebasestorage.app",
  messagingSenderId: "255245042817",
  appId: "1:255245042817:web:1aa0db14ce1bf78b84b980"
};

const app = !getApps().length ? initializeApp(nextTripFirebaseConfig, "nextrip-client") : getApp("nextrip-client");
export const db = getFirestore(app);

export interface SearchResult {
  collection: string;
  id: string;
  data: DocumentData;
}

// Common collection names in travel/agency CRMs
const TARGET_COLLECTIONS = [
  'clients',
  'passports',
  'customers',
  'users',
  'travelers',
  'bookings',
  'visas',
  'trips',
  'applications',
  'leads',
  'records',
  'invoices'
];

/**
 * Searches across collections for matching passport numbers, names, phone numbers, or keywords
 */
export async function searchNextTripDatabase(searchTerm: string): Promise<SearchResult[]> {
  const term = searchTerm.trim().toLowerCase();
  const rawTerm = searchTerm.trim();
  const results: SearchResult[] = [];

  for (const colName of TARGET_COLLECTIONS) {
    try {
      const colRef = collection(db, colName);
      // Fetch recent records to perform deep search if rules permit
      const q = query(colRef, limit(30));
      const snap = await getDocs(q);
      
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const strData = JSON.stringify(data).toLowerCase();
        
        if (strData.includes(term) || (rawTerm && JSON.stringify(data).includes(rawTerm))) {
          results.push({
            collection: colName,
            id: docSnap.id,
            data
          });
        }
      });
    } catch (err: any) {
      console.warn(`Collection ${colName} query error:`, err?.message);
    }
  }

  return results;
}

/**
 * Get all available collections overview
 */
export async function getNextTripStats(): Promise<{ [key: string]: number }> {
  const stats: { [key: string]: number } = {};

  for (const colName of TARGET_COLLECTIONS) {
    try {
      const colRef = collection(db, colName);
      const snap = await getDocs(query(colRef, limit(50)));
      if (!snap.empty) {
        stats[colName] = snap.size;
      }
    } catch (e) {
      // Permission or collection missing
    }
  }

  return stats;
}
