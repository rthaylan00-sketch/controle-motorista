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

const btnSalvar = document-getElementById("btn-salvar");
const btnAddGasto = document-getElementById("btn-add-gasto");

let gastosTemp = [];

if (btnAddGasto) {
  btnAddGasto.addEventListener("click", () => {
    const categoria = document.getElementById("input-categoria").value;
    const valor = parseFloat(document.getElementById("input-valor").value);

    if (!categoria || !valor) return alert("Preencha categoria e valor!");

    gastosTemp.push({ categoria, valor });
    renderizarChips();

    document.getElementById("input-categoria").value = "";
    document.getElementById("input-valor").value = "";
  });
}

function renderizarChips() {
  const container = document.getElementById("gastos-chips");
  if (!container) return;
  container.innerHTML = "";

  gastosTemp.forEach((g, i) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `${g.categoria} R$ ${g.valor.toFixed(2)} <span data-index="${i}">✕</span>`;
    container.appendChild(chip);
  });

  container.querySelectorAll("span").forEach(span => {
    span.addEventListener("click", () => {
      gastosTemp.splice(parseInt(span.dataset.index), 1);
      renderizarChips();
    });
  });
}



