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

// =============================
// VARIÁVEIS
// =============================
let usuarioAtual = null;
let gastosTemp = [];

const btnSalvar = document.getElementById("btn-salvar");
const btnAddGasto = document.getElementById("btn-add-gasto");

// =============================
// ADICIONAR GASTO
// =============================
if (btnAddGasto) {
  btnAddGasto.addEventListener("click", () => {
    const categoria = document.getElementById("input-categoria").value;
    const valor = parseFloat(document.getElementById("input-valor").value);

    if (!categoria || !valor) {
      alert("Preencha categoria e valor!");
      return;
    }

    gastosTemp.push({ categoria, valor });
    renderizarChips();

    document.getElementById("input-categoria").value = "";
    document.getElementById("input-valor").value = "";
  });
}

// =============================
// RENDERIZAR CHIPS
// =============================
function renderizarChips() {
  const container = document.getElementById("gastos-chips");
  if (!container) return;

  container.innerHTML = "";

  gastosTemp.forEach((g, i) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = ${g.categoria} R$ ${g.valor.toFixed(2)} <span data-index="${i}">✕</span>;
    container.appendChild(chip);
  });

  container.querySelectorAll("span").forEach(span => {
    span.addEventListener("click", () => {
      gastosTemp.splice(parseInt(span.dataset.index), 1);
      renderizarChips();
    });
  });
}

// =============================
// CARREGAR HISTÓRICO
// =============================
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
      item.innerHTML =         <div class="historico-data">${d.data}</div>         <div class="historico-valores">           <span class="green">+R$ ${d.ganhos.toFixed(2)}</span>           <span class="red">-R$ ${d.totalGastos.toFixed(2)}</span>           <span>${d.km} km</span>         </div>      ;

      lista.appendChild(item);
    });

  } catch (erro) {
    console.error("Erro ao carregar histórico:", erro);
    lista.innerHTML = "<p>Erro ao carregar dados.</p>";
  }
}

// =============================
// AUTENTICAÇÃO + EVENTOS
// =============================
onAuthStateChanged(auth, user => {
  console.log("Usuário detectado:", user);

  if (user) {
    usuarioAtual = user;

    carregarHistorico();

    // =============================
    // BOTÃO SALVAR (AGORA CORRETO)
    // =============================
    if (btnSalvar) {
      btnSalvar.addEventListener("click", async () => {
        console.log("Clicou em salvar");

        const ganhos = parseFloat(document.getElementById("input-ganhos").value) || 0;
        const km = parseFloat(document.getElementById("input-km").value) || 0;
        const data = document.getElementById("input-data").value;

        if (!data) {
          alert("Informe a data!");
          return;
        }

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

          // RESET
          gastosTemp = [];
          renderizarChips();

          document.getElementById("input-ganhos").value = "";
          document.getElementById("input-km").value = "";
          document.getElementById("input-data").value = "";

          carregarHistorico();

        } catch (erro) {
          console.error("Erro ao salvar:", erro);
          alert("Erro ao salvar: " + erro.message);
        }
      });
    }

  } else {
    usuarioAtual = null;
  }
});
