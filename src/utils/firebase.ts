// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDig3wwQRpVzH8VPgCcqm_V2jUrZO9ADSY",
  authDomain: "pontaj-e090b.firebaseapp.com",
  projectId: "pontaj-e090b",
  storageBucket: "pontaj-e090b.appspot.com",
  messagingSenderId: "668493273104",
  appId: "1:668493273104:web:3e9fa3c7a50a75928b9295",
  measurementId: "G-N3RP5WW8QH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
