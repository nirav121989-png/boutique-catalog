import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCPeyTBLgM0rZAs1CkMH7tpgqRQilegrkg",
  authDomain: "alankarajewels-4add3.firebaseapp.com",
  projectId: "alankarajewels-4add3",
  storageBucket: "alankarajewels-4add3.firebasestorage.app",
  messagingSenderId: "145351586067",
  appId: "1:145351586067:web:d87a36a3070aed70faeae6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const docRef = doc(db, 'settings', 'global');
  const snap = await getDoc(docRef);
  
  if (snap.exists()) {
    const data = snap.data();
    const sizeStr = JSON.stringify(data);
    console.log(`Settings document size: ${(sizeStr.length / 1024).toFixed(2)} KB`);
    
    if (data.categories) {
      console.log('Categories found:', data.categories.length);
      const updatedCategories = data.categories.map(c => {
        return {
          ...c,
          image_url: '' // Clear the large images
        };
      });
      
      data.categories = updatedCategories;
      const newSizeStr = JSON.stringify(data);
      console.log(`New document size: ${(newSizeStr.length / 1024).toFixed(2)} KB`);
      
      await setDoc(docRef, data, { merge: true });
      console.log('Successfully cleared category images from database!');
    }
  } else {
    console.log('Settings doc does not exist.');
  }
  
  process.exit(0);
}

check().catch(console.error);
