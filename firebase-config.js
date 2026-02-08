import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCh-qW2ftNHFS_n-cST9xLoK1BtskF4OOY",
    authDomain: "plusninja-ced6a.firebaseapp.com",
    projectId: "plusninja-ced6a",
    storageBucket: "plusninja-ced6a.firebasestorage.app",
    messagingSenderId: "475618119291",
    appId: "1:475618119291:web:a169db719edec3a11c9cde",
    measurementId: "G-9J3BGPXE9L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
