import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCfbY_f0eJgOFvtyllSwU4fZW_dSLUPvWU",
  authDomain: "m-technovate-attendance.firebaseapp.com",
  projectId: "m-technovate-attendance",
  storageBucket: "m-technovate-attendance.firebasestorage.app",
  messagingSenderId: "50293975206",
  appId: "1:50293975206:web:a4395d16dbba47b2aeec67"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearCollections() {
  console.log('Connecting to Firebase Firestore to delete all employees and attendance ...');

  // 1. Clear employees collection
  const empSnap = await getDocs(collection(db, 'employees'));
  console.log(`Found ${empSnap.size} employees in Firestore to delete.`);
  for (const d of empSnap.docs) {
    console.log(`Deleting employee document: ${d.id}`);
    await deleteDoc(doc(db, 'employees', d.id));
  }

  // 2. Clear attendance collection
  const attSnap = await getDocs(collection(db, 'attendance'));
  console.log(`Found ${attSnap.size} attendance records in Firestore to delete.`);
  for (const d of attSnap.docs) {
    console.log(`Deleting attendance document: ${d.id}`);
    await deleteDoc(doc(db, 'attendance', d.id));
  }

  console.log('\nSUCCESS: All employees and attendance records have been deleted from Firebase Firestore!');
  process.exit(0);
}

clearCollections().catch((err) => {
  console.error('Error deleting from Firestore:', err);
  process.exit(1);
});
