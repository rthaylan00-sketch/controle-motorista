// Importações Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
apiKey:            “AIzaSyBHfI8CE9eMUQ99JM_XAjEkiuFMDoz3M8I”,
authDomain:        “controle-pro-motorista.firebaseapp.com”,
projectId:         “controle-pro-motorista”,
storageBucket:     “controle-pro-motorista.firebasestorage.app”,
messagingSenderId: “991201688036”,
appId:             “1:991201688036:web:fac529d7c0e7cad826eff1”
};

// Inicializa
firebase.initializeApp(firebaseConfig);

// Instâncias globais (usadas em app.js, login.html e cadastro.html)
const auth = firebase.auth();
const db   = firebase.firestore();
