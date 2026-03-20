import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAUzL5c9CD_cCv9hP-FNrbTSRKOiIMxMOs",
  authDomain: "bot-trading-5f8c9.firebaseapp.com",
  projectId: "bot-trading-5f8c9",
  storageBucket: "bot-trading-5f8c9.firebasestorage.app",
  messagingSenderId: "725310671686",
  appId: "1:725310671686:web:0a901bb870d9ce9f0ab347",
  measurementId: "G-6SQJB8MD9H"
};;

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore (Database)
export const db = getFirestore(app);