import { firestore } from './firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDocs,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import initialProducts from '../assets/products.json';
import initialSettings from '../assets/settings.json';

const PRODUCTS_KEY = 'products';
const SETTINGS_KEY = 'settings';
const SETTINGS_DOC_ID = 'global';

export const db = {
  // Subscribe to all products in real-time, seeding only if the store is not initialized
  subscribeItems: (callback) => {
    const collRef = collection(firestore, PRODUCTS_KEY);
    return onSnapshot(collRef, async (snapshot) => {
      let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // If Firestore is empty, check if we've already initialized/seeded the store
      if (snapshot.empty && initialProducts.length > 0) {
        try {
          const settingsDocRef = doc(firestore, SETTINGS_KEY, SETTINGS_DOC_ID);
          const settingsSnap = await getDoc(settingsDocRef);
          
          // Seed ONLY if the settings document doesn't exist or is_seeded is not true
          const isSeeded = settingsSnap.exists() && settingsSnap.data().is_seeded;
          if (!isSeeded) {
            console.log('First-time load: Seeding initial products to Firestore...');
            const batch = writeBatch(firestore);
            initialProducts.forEach(prod => {
              const docRef = doc(collRef, prod.id);
              batch.set(docRef, prod);
            });
            await batch.commit();
            
            // Mark settings as seeded
            await setDoc(settingsDocRef, { is_seeded: true }, { merge: true });
            return;
          }
        } catch (e) {
          console.error('Failed to check seed status / seed products:', e);
        }
      }
      
      callback(items);
    });
  },

  // Save or update product
  saveItem: async (item) => {
    try {
      const collRef = collection(firestore, PRODUCTS_KEY);
      if (item.id) {
        // Edit existing
        const docRef = doc(firestore, PRODUCTS_KEY, item.id);
        await setDoc(docRef, item, { merge: true });
      } else {
        // Add new
        const docRef = doc(collRef);
        const newItem = {
          ...item,
          id: docRef.id,
          created_at: new Date().toISOString()
        };
        await setDoc(docRef, newItem);
      }
      return true;
    } catch (e) {
      console.error('Error saving item to Firestore:', e);
      return false;
    }
  },

  // Delete product
  deleteItem: async (id) => {
    try {
      const docRef = doc(firestore, PRODUCTS_KEY, id);
      await deleteDoc(docRef);
      return true;
    } catch (e) {
      console.error('Error deleting item from Firestore:', e);
      return false;
    }
  },

  // Export products JSON
  exportDatabase: async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, PRODUCTS_KEY));
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const dataStr = JSON.stringify(items, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', 'products.json');
      linkElement.click();
    } catch (error) {
      console.error('Error exporting products database:', error);
    }
  },

  // Subscribe to settings in real-time, seeding if empty
  subscribeSettings: (callback) => {
    const docRef = doc(firestore, SETTINGS_KEY, SETTINGS_DOC_ID);
    return onSnapshot(docRef, async (snapshot) => {
      if (!snapshot.exists()) {
        console.log('Seeding initial settings to Firestore...');
        try {
          await setDoc(docRef, { ...initialSettings, is_seeded: true });
        } catch (e) {
          console.error('Failed to seed settings:', e);
        }
        return;
      }
      
      const currentSettings = snapshot.data();
      // Backfill default subcategories if missing in the live Firestore settings
      let needsBackfill = false;
      const updatedCategories = (currentSettings.categories || []).map(cat => {
        if (!cat.subcategories) {
          const match = initialSettings.categories.find(c => c.name === cat.name);
          if (match && match.subcategories) {
            needsBackfill = true;
            return { ...cat, subcategories: match.subcategories };
          }
        }
        return cat;
      });

      if (needsBackfill) {
        console.log('Backfilling default subcategories into existing settings...');
        try {
          await setDoc(docRef, { ...currentSettings, categories: updatedCategories }, { merge: true });
        } catch (e) {
          console.error('Failed to backfill settings:', e);
        }
      }

      callback(currentSettings);
    });
  },

  // Save settings
  saveSettings: async (settings) => {
    try {
      const docRef = doc(firestore, SETTINGS_KEY, SETTINGS_DOC_ID);
      await setDoc(docRef, settings, { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving settings to Firestore:', e);
      return false;
    }
  },

  // Export settings JSON
  exportSettings: async () => {
    try {
      const docRef = doc(firestore, SETTINGS_KEY, SETTINGS_DOC_ID);
      const docSnap = await getDoc(docRef);
      const settingsData = docSnap.exists() ? docSnap.data() : initialSettings;
      
      const dataStr = JSON.stringify(settingsData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', 'settings.json');
      linkElement.click();
    } catch (error) {
      console.error('Error exporting settings:', error);
    }
  }
};
