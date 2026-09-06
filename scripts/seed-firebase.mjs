import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';

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

const EMPLOYEES = [
  {
    id: 'emp-mt001',
    employeeId: 'MT001',
    name: 'Naveen Kumar',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    department: 'Development',
    designation: 'Senior Full Stack Engineer',
    phone: '+91 98765 43210',
    email: 'naveen.kumar@mtechnovate.com',
    joiningDate: '2024-01-15',
    status: 'Active',
    createdAt: '2024-01-15T09:00:00.000Z',
  },
  {
    id: 'emp-mt002',
    employeeId: 'MT002',
    name: 'Rahul Kumar',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    department: 'Testing',
    designation: 'QA Lead Specialist',
    phone: '+91 98765 43211',
    email: 'rahul.kumar@mtechnovate.com',
    joiningDate: '2024-02-01',
    status: 'Active',
    createdAt: '2024-02-01T09:00:00.000Z',
  },
  {
    id: 'emp-mt003',
    employeeId: 'MT003',
    name: 'Priya Sharma',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    department: 'UI/UX Design',
    designation: 'Lead UI/UX Designer',
    phone: '+91 98765 43212',
    email: 'priya.sharma@mtechnovate.com',
    joiningDate: '2024-03-10',
    status: 'Active',
    createdAt: '2024-03-10T09:00:00.000Z',
  },
  {
    id: 'emp-mt004',
    employeeId: 'MT004',
    name: 'Anita Verma',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    department: 'Human Resources',
    designation: 'HR & Operations Manager',
    phone: '+91 98765 43213',
    email: 'anita.verma@mtechnovate.com',
    joiningDate: '2023-11-20',
    status: 'Active',
    createdAt: '2023-11-20T09:00:00.000Z',
  },
  {
    id: 'emp-mt005',
    employeeId: 'MT005',
    name: 'Vikram Singh',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    department: 'Development',
    designation: 'Backend Architect',
    phone: '+91 98765 43214',
    email: 'vikram.singh@mtechnovate.com',
    joiningDate: '2024-04-01',
    status: 'Inactive',
    createdAt: '2024-04-01T09:00:00.000Z',
  },
];

const SETTINGS = {
  officeName: 'M Technovate Solutions Headquarters',
  officeAddress: 'Tech Hub Park, Tower 4, Cyber City',
  geofenceEnabled: false,
  latitude: 12.9716,
  longitude: 77.5946,
  radiusMeters: 150,
  workStartTime: '09:30 AM',
  workEndTime: '06:00 PM',
};

async function seed() {
  console.log('Connecting to Firebase Firestore for project: m-technovate-attendance ...');

  try {
    for (const emp of EMPLOYEES) {
      console.log(`Uploading ${emp.employeeId} (${emp.name}) ...`);
      await setDoc(doc(db, 'employees', emp.employeeId), emp);
    }

    console.log('Uploading office settings ...');
    await setDoc(doc(db, 'settings', 'office'), SETTINGS);

    console.log('Verifying uploaded employees from Firestore ...');
    const snapshot = await getDocs(collection(db, 'employees'));
    console.log(`SUCCESS! Found ${snapshot.size} employee documents in Firestore:`);
    snapshot.forEach(doc => {
      console.log(` - ${doc.id}: ${doc.data().name} [${doc.data().department}]`);
    });

    console.log('\nFirebase Firestore is 100% connected and active!');
    process.exit(0);
  } catch (err) {
    console.error('Firestore connection response:', err);
    process.exit(1);
  }
}

seed();
