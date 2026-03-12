function login(){

const email = document.getElementById("email").value
const senha = document.getElementById("senha").value

auth.signInWithEmailAndPassword(email, senha)

.then(()=>{
window.location.href = "index.html"
})

.catch((error)=>{
document.getElementById("msg").innerText = error.message
})

}

function cadastrar(){

const email = document.getElementById("email").value
const senha = document.getElementById("senha").value

auth.createUserWithEmailAndPassword(email, senha)

.then(()=>{
window.location.href = "index.html"
})

.catch((error)=>{
document.getElementById("msg").innerText = error.message
})

}

function logout(){

auth.signOut().then(()=>{
window.location.href = "login.html"
})

}
