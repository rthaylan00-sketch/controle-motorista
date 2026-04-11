// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA829hZRNAJ_2xXYJkWW4skWiZLs6Zyc38",
  authDomain: "drivecontrol-pro.firebaseapp.com",
  projectId: "drivecontrol-pro",
  storageBucket: "drivecontrol-pro.firebasestorage.app",
  messagingSenderId: "367865364380",
  appId: "1:367865364380:web:d3a69977e438ca76861259"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
