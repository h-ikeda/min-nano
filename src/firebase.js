import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

export const app = initializeApp(process.env.PROJECT_ID === 'min-nano' ? {
   apiKey: "AIzaSyCdnB2GdSfBN0MPIKfZo6ECWPRKsE8bVes",
   authDomain: "min-nano.web.app",
   projectId: "min-nano",
   storageBucket: "min-nano.appspot.com",
   messagingSenderId: "479803681619",
   appId: "1:479803681619:web:513b28ecd119450e7c0fa6",
   measurementId: "G-GD27QLYBMY"
} : {
   apiKey: "AIzaSyD9w38rATAw-gY5_6u7qduHz26JqJQ45YY",
   authDomain: "min-nano-test.web.app",
   projectId: "min-nano-test",
   storageBucket: "min-nano-test.appspot.com",
   messagingSenderId: "608290323204",
   appId: "1:608290323204:web:64594b709ce8b67ba5ae51",
});

if (process.env.NODE_ENV !== 'production') {
   connectAuthEmulator(getAuth(), 'http://localhost:9099');
   connectFirestoreEmulator(getFirestore(), 'localhost', 8080);
   connectStorageEmulator(getStorage(), 'localhost', 9199);
}

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
