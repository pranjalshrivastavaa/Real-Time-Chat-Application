// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "reactchat-e5a75.firebaseapp.com",
  projectId: "reactchat-e5a75",
  storageBucket: "reactchat-e5a75.firebasestorage.app",
  messagingSenderId: "603464897415",
  appId: "1:603464897415:web:95ca652c8e57aa31c8f922",
  measurementId: "G-CLLSFF23WL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()