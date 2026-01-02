// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 🔴 PASTE YOUR CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyDeKtYw3u2u7cus_A0xGvlTKtq_9fg0SMU",
  authDomain: "safe-para.firebaseapp.com",
  projectId: "safe-para",
  storageBucket: "safe-para.firebasestorage.app",
  messagingSenderId: "64245888",
  appId: "1:64245888:web:4e50c2251424fa7b0b5665",
  measurementId: "G-2WTK2HBVGJ"
};

const app = initializeApp(firebaseConfig);

// Firestore database reference
export const db = getFirestore(app);
