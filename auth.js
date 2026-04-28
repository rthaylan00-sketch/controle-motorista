import { auth } from "./firebase.js";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const btnLogin = document.getElementById("btn-login");
const btnCadastrar = document.getElementById("btn-cadastrar");
const btnLogout = document.getElementById("btn-logout")

if (btnLogin) {
  btnLogin.addEventListener("click", () => {
     const email = document.getElementById("email").value;
     const senha = document.getElementById("senha").value;

  signInWithEmailAndPassword(auth, email, senha)
   .then(() => { window.location.href = "index.html"; })
   .catch(error => { document.getElementById("msg").innerText = error.message;});
 });
}
if (btnCadastrar) {
  btnCadastrar.addEventListener("click", () => {
     const email = document.getElementById("email").value;
     const senha = document.getElementById("senha").value;

  createUserWithEmailAndPassword(auth, email, senha)
   .then(() => { window.location.href = "index.html"; })
   .catch(error => { document.getElementById("msg").innerText = error.message;});
 });
}
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    signOut(auth).then(() => { window.location.href = "login.html"; })
 });
}

  
  
                        
