import { auth } from "./firebase.js";

import { 
signInWithEmailAndPassword,
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// LOGIN
window.login = async function(){

const email = document.getElementById("email").value;
const senha = document.getElementById("senha").value;

try{

await signInWithEmailAndPassword(auth, email, senha);

window.location.href = "index.html";

}
catch(erro){

alert(erro.message);
console.log(erro);

}


// VERIFICAR USUÁRIO
onAuthStateChanged(auth,(user)=>{

if(user){

console.log("Usuário logado:",user.email);

}else{

console.log("Nenhum usuário");

}

});


// LOGOUT
window.logout = async function(){

await signOut(auth);

window.location.href = "login.html";

}
onAuthStateChanged(auth,(user)=>{

if(!user){

window.location.href = "login.html";

}

});
