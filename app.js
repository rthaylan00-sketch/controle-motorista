import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let usuarioAtual = null;
let gastosTemp = [];

const btnSalvar = document.getElementById("btn-salvar");
const btnAddGasto = document.getElementById("btn-add-gasto");

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

async function carregarHistorico() {
  const lista = document.getElementById("historico-lista");
  if (!lista || !usuarioAtual) return;

  lista.innerHTML = "<p>Carregando...</p>";

  try {
    const q = query(
      collection(db, "registros"),
      where("uid", "==", usuarioAtual.uid),
      orderBy("data", "desc")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      lista.innerHTML = "<p style='text-align:center;color:#888'>Nenhum registro ainda.</p>";
      return;
    }

    lista.innerHTML = "";

    snapshot.forEach(doc => {
      const d = doc.data();
      const item = document.createElement("div");
      item.className = "historico-item";
      item.innerHTML = `
        <div class="historico-data">${d.data}</div>
        <div class="historico-valores">
          <span class="green">+R$ ${d.ganhos.toFixed(2)}</span>
          <span class="red">-R$ ${d.totalGastos.toFixed(2)}</span>
          <span>${d.km} km</span>
        </div>
      `;
      lista.appendChild(item);
    });

  } catch (erro) {
    lista.innerHTML = "<p>Erro: " + erro.message + "</p>";
  }

}

onAuthStateChanged(auth, user => {
  if (user) {
    usuarioAtual = user;
    carregarHistorico();
    
alert("onAuthStateChanged rodou! usuário: " + user.email);
    if (btnSalvar) {
      btnSalvar.addEventListener("click", async () => {
        const ganhos = parseFloat(document.getElementById("input-ganhos").value) || 0;
        const km = parseFloat(document.getElementById("input-km").value) || 0;
        const data = document.getElementById("input-data").value;

        if (!data) return alert("Informe a data!");

        const totalGastos = gastosTemp.reduce((acc, g) => acc + g.valor, 0);

        try {
          await addDoc(collection(db, "registros"), {
            uid: usuarioAtual.uid,
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
          carregarHistorico();

        } catch (erro) {
          alert("Erro ao salvar: " + erro.message);
        }
      });
    }

  } else {
    usuarioAtual = null;
  }
});
