const firebaseConfig = {
  apiKey: "AIzaSyA829hZRNAJ_2xXYJkWW4skWiZLs6Zyc38",
  authDomain: "drivecontrol-pro.firebaseapp.com",
  projectId: "drivecontrol-pro",
  storageBucket: "drivecontrol-pro.firebasestorage.app",
  messagingSenderId: "367865364380",
  appId: "1:367865364380:web:d3a69977e438ca76861259"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Ativar autenticação
const auth = firebase.auth();
