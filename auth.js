import { auth } from "./firebase.js";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const btnLogin = document.getElementById("btn-login");
const btnCadastrar = document.getElementById("btn-cadastrar");
const btnLogout = document.getElementById("btn-logout");

// ==========================
// FUNÇÃO DE ERRO PADRÃO
// ==========================
function tratarErro(error) {
  let mensagem = "";

  switch (error.code) {
    case "auth/invalid-email":
      mensagem = "Email inválido!";
      break;

    case "auth/user-not-found":
      mensagem = "Usuário não encontrado!";
      break;

    case "auth/wrong-password":
      mensagem = "Senha incorreta!";
      break;

    case "auth/email-already-in-use":
      mensagem = "Esse email já está cadastrado!";
      break;

    case "auth/weak-password":
      mensagem = "Senha muito fraca (mínimo 6 caracteres)";
      break;

    case "auth/missing-password":
      mensagem = "Digite a senha!";
      break;

    default:
      mensagem = "Erro ao processar. Tente novamente.";
  }

  document.getElementById("msg").innerText = mensagem;
}

// ==========================
// LOGIN
// ==========================
if (btnLogin) {
  btnLogin.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    signInWithEmailAndPassword(auth, email, senha)
      .then(() => {
        window.location.href = "index.html";
      })
      .catch(tratarErro);
  });
}

// ==========================
// CADASTRO
// ==========================
if (btnCadastrar) {
  btnCadastrar.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    createUserWithEmailAndPassword(auth, email, senha)
      .then(() => {
        window.location.href = "index.html";
      })
      .catch(tratarErro);
  });
}

// ==========================
// LOGOUT
// ==========================
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    signOut(auth).then(() => {
      window.location.href = "login.html";
    });
  });
}
