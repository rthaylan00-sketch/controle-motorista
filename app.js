// app.js
import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ========== AUTH ==========

export function login() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  signInWithEmailAndPassword(auth, email, senha)
    .then(() => { window.location.href = "index.html"; })
    .catch(error => { document.getElementById("msg").innerText = error.message; });
}

export function cadastrar() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  createUserWithEmailAndPassword(auth, email, senha)
    .then(() => { window.location.href = "index.html"; })
    .catch(error => { document.getElementById("msg").innerText = error.message; });
}

export function logout() {
  signOut(auth).then(() => { window.location.href = "login.html"; });
}

// ========== GASTOS TEMPORÁRIOS ==========

let gastosTemp = [];

document.getElementById("btn-add-gasto")?.addEventListener("click", () => {
  const categoria = document.getElementById("input-categoria").value;
  const valor = parseFloat(document.getElementById("input-valor").value);

  if (!categoria || !valor) return alert("Preencha categoria e valor!");

  gastosTemp.push({ categoria, valor });
  renderizarChips();

  document.getElementById("input-categoria").value = "";
  document.getElementById("input-valor").value = "";
});

function renderizarChips() {
  const container = document.getElementById("gastos-chips");
  if (!container) return;
  container.innerHTML = "";
  gastosTemp.forEach((g, i) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `${g.categoria} R$ ${g.valor.toFixed(2)} <span onclick="removerGasto(${i})">✕</span>`;
    container.appendChild(chip);
  });
}

window.removerGasto = (i) => {
  gastosTemp.splice(i, 1);
  renderizarChips();
};

// ========== SALVAR DIA ==========

document.getElementById("btn-salvar")?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const ganhos = parseFloat(document.getElementById("input-ganhos").value) || 0;
  const km = parseFloat(document.getElementById("input-km").value) || 0;
  const data = document.getElementById("input-data").value;

  if (!data) return alert("Informe a data!");

  const totalGastos = gastosTemp.reduce((acc, g) => acc + g.valor, 0);

  await addDoc(collection(db, "registros"), {
    uid: user.uid,
    data,
    ganhos,
    km,
    gastos: gastosTemp,
    totalGastos,
    criadoEm: new Date()
  });

  alert("Dia salvo com sucesso!");
  gastosTemp = [];
  renderizarChips();
  document.getElementById("input-ganhos").value = "";
  document.getElementById("input-km").value = "";
  document.getElementById("input-data").value = "";
});
