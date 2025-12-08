// firebase-config.js - YOUR REAL PROJECT
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDmYf0vhkUPiUgCmLZqj88Y3a5j77ogVbw",
  authDomain: "cashierapp-894a4.firebaseapp.com",
  projectId: "cashierapp-894a4",
  storageBucket: "cashierapp-894a4.firebasestorage.app",
  messagingSenderId: "29550790074",
  appId: "1:29550790074:web:ae6f4c5f6e3fad32ce0983"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(() => {});