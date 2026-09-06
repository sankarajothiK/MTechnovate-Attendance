import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function testNextId() {
  const snap = await getDocs(collection(db, 'employees'));
  console.log('Current employee count in Firestore:', snap.size);
  let maxNumber = 0;
  snap.forEach(d => {
    const data = d.data();
    const match = data.employeeId?.match(/^MT(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  });

  const nextId = `MT${String(maxNumber + 1).padStart(3, '0')}`;
  console.log('Next calculated Employee ID for empty DB:', nextId);
  if (nextId !== 'MT001') throw new Error(`Expected MT001 but got ${nextId}`);
  console.log('PASS: The very first employee added will automatically receive MT001!');
  process.exit(0);
}

testNextId().catch(err => {
  console.error(err);
  process.exit(1);
});
