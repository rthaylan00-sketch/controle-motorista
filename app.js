import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let usuarioAtual = null;
let gastosTemp = [];
let dadosHistorico = [];
let filtroAtual = "hoje";
let btnSalvarRegistrado = false;

// ==========================
// ADICIONAR GASTO
// ==========================
document.getElementById("btn-add-gasto")?.addEventListener("click", () => {
  const categoria = document.getElementById("input-categoria").value;
  const valor = parseFloat(document.getElementById("input-valor").value);

  if (!categoria || !valor) return alert("Preencha categoria e valor!");

  gastosTemp.push({ categoria, valor });
  renderizarChips();

  document.getElementById("input-categoria").value = "";
  document.getElementById("input-valor").value = "";
});

// ==========================
// CHIPS DE GASTO
// ==========================
function renderizarChips() {
  const container = document.getElementById("gastos-chips");
  container.innerHTML = "";

  gastosTemp.forEach((g, i) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML =
      g.categoria +
      " R$ " +
      g.valor.toFixed(2) +
      " <span class='chip-remove' data-index='" +
      i +
      "'>x</span>";

    container.appendChild(chip);
  });

  container.querySelectorAll(".chip-remove").forEach(span => {
    span.addEventListener("click", () => {
      gastosTemp.splice(parseInt(span.dataset.index), 1);
      renderizarChips();
    });
  });
}

// ==========================
// FILTROS
// ==========================
document.querySelectorAll(".filtro").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filtro").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filtroAtual = btn.dataset.filtro;
    renderizarTudo();
  });
});

// ==========================
// FILTRAR DADOS
// ==========================
function filtrarDados() {
  const hoje = new Date();
  const hojeStr = hoje.toISOString().split("T")[0];

  if (filtroAtual === "hoje") {
    return dadosHistorico.filter(d => d.data === hojeStr);
  }

  if (filtroAtual === "semana") {
    const semana = new Date();
    semana.setDate(hoje.getDate() - 7);
    return dadosHistorico.filter(d =>
      new Date(d.data + "T00:00:00") >= semana
    );
  }

  if (filtroAtual === "mes") {
    return dadosHistorico.filter(d => {
      const data = new Date(d.data + "T00:00:00");
      return (
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear()
      );
    });
  }

  return dadosHistorico;
}

// ==========================
// RESUMO
// ==========================
function gerarResumo(dados) {
  let ganhos = 0, gastos = 0, km = 0;

  dados.forEach(d => {
    ganhos += d.ganhos || 0;
    gastos += d.totalGastos || 0;
    km += d.km || 0;
  });

  const lucro = ganhos - gastos;
  const media = km > 0 ? (ganhos / km).toFixed(2) : 0;

  return { ganhos, gastos, km, lucro, media };
}

function gerarMensagem(media) {
  if (media >= 3.5) return "Excelente resultado hoje!";
  if (media >= 3) return "Bom resultado hoje!";
  return "Pode melhorar!";
}

// ==========================
// RENDER RESUMO
// ==========================
function renderizarResumo(dados) {
  const container = document.getElementById("resumo-periodo");
  if (!container) return;

  const { ganhos, gastos, km, lucro, media } = gerarResumo(dados);

  if (filtroAtual === "hoje") {
    container.innerHTML =
      "<div class='resumo-lucro'>Lucro: R$ " + lucro.toFixed(2) +
      "</div><div class='resumo-km'>R$ " + media +
      "/km</div><div class='resumo-grid' style='margin-top:12px'><div class='resumo-item'>Km rodados<strong>" + km +
      " km</strong></div><div class='resumo-item'>Ganhos<strong>R$ " + ganhos.toFixed(2) +
      "</strong></div><div class='resumo-item'>Gastos<strong>R$ " + gastos.toFixed(2) +
      "</strong></div></div><div class='resumo-msg'>" + gerarMensagem(parseFloat(media)) + "</div>";
    return;
  }

  if (filtroAtual === "semana") {
    container.innerHTML =
      "<div class='resumo-lucro'>Total: R$ " + lucro.toFixed(2) +
      "</div><div class='resumo-grid' style='margin-top:12px'><div class='resumo-item'>Km<strong>" + km +
      " km</strong></div><div class='resumo-item'>Media<strong>R$ " + media +
      "/km</strong></div><div class='resumo-item'>Ganhos<strong>R$ " + ganhos.toFixed(2) +
      "</strong></div><div class='resumo-item'>Gastos<strong>R$ " + gastos.toFixed(2) +
      "</strong></div></div>";
    return;
  }

  if (filtroAtual === "mes") {
    container.innerHTML =
      "<div class='resumo-grid'><div class='resumo-item'>Ganhos<strong>R$ " + ganhos.toFixed(2) +
      "</strong></div><div class='resumo-item'>Gastos<strong>R$ " + gastos.toFixed(2) +
      "</strong></div></div><div class='resumo-lucro' style='margin-top:12px'>Lucro: R$ " + lucro.toFixed(2) +
      "</div><div class='resumo-grid' style='margin-top:8px'><div class='resumo-item'>Media<strong>R$ " + media +
      "/km</strong></div><div class='resumo-item'>Km<strong>" + km + " km</strong></div></div>";
  }
}

// ==========================
// LISTA
// ==========================
function renderizarLista(dados) {
  const lista = document.getElementById("historico-lista");

  if (dados.length === 0) {
    lista.innerHTML = "<p class='empty-state'>Nenhum registro.</p>";
    return;
  }

  lista.innerHTML = "";

  dados.forEach(d => {
    const partes = d.data.split("-");
    const dataFormatada = new Date(
      partes[0], partes[1] - 1, partes[2]
    ).toLocaleDateString("pt-BR");

    const lucro = d.ganhos - d.totalGastos;
    const porKm = d.km > 0 ? (d.ganhos / d.km).toFixed(2) : "--";

    const item = document.createElement("div");
    item.className = "historico-item";
    item.innerHTML =
      "<div class='historico-topo'><span class='historico-data'>" + dataFormatada +
      "</span><button class='btn-apagar' data-id='" + d.id +
      "'>x</button></div><div class='historico-lucro'>R$ " + lucro.toFixed(2) +
      "</div><div class='historico-km'>" + d.km + " km - R$ " + porKm + "/km</div>";

    lista.appendChild(item);
  });

  lista.querySelectorAll(".btn-apagar").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("Apagar registro?")) {
        await deleteDoc(doc(db, "registros", btn.dataset.id));
        carregarHistorico();
      }
    });
  });
}

// ==========================
// GERAL
// ==========================
function renderizarTudo() {
  const dados = filtrarDados();
  renderizarResumo(dados);
  renderizarLista(dados);
}

// ==========================
// CARREGAR HISTÓRICO
// ==========================
async function carregarHistorico() {
  const lista = document.getElementById("historico-lista");
  lista.innerHTML = "<div class='loading-state'><div class='spinner'></div><span>Carregando...</span></div>";

  const q = query(
    collection(db, "registros"),
    where("uid", "==", usuarioAtual.uid),
    orderBy("data", "desc")
  );

  const snapshot = await getDocs(q);
  dadosHistorico = [];

  snapshot.forEach(d => {
    dadosHistorico.push({ id: d.id, ...d.data() });
  });

  // ── CALCULAR CARDS ──
  const hoje = new Date().toISOString().split("T")[0];
  const mesAtual = hoje.slice(0, 7);

  let ganhosHoje = 0, gastosHoje = 0;
  let ganhosMes = 0, kmMes = 0, gastosMes = 0;

  dadosHistorico.forEach(d => {
    if (d.data === hoje) {
      ganhosHoje += d.ganhos;
      gastosHoje += d.totalGastos;
    }
    if (d.data.startsWith(mesAtual)) {
      ganhosMes += d.ganhos;
      kmMes += d.km;
      gastosMes += d.totalGastos;
    }
  });

  const lucro = ganhosMes - gastosMes;

  const el = id => document.getElementById(id);
  if (el("ganhos-hoje")) el("ganhos-hoje").textContent = `R$ ${ganhosHoje.toFixed(2)}`;
  if (el("gastos-hoje")) el("gastos-hoje").textContent = `R$ ${gastosHoje.toFixed(2)}`;
  if (el("ganhos-mes")) el("ganhos-mes").textContent = `R$ ${ganhosMes.toFixed(2)}`;
  if (el("km-mes")) el("km-mes").textContent = `${kmMes} km`;
  if (el("lucro-liquido")) el("lucro-liquido").textContent = `R$ ${lucro.toFixed(2)}`;
  if (el("label-calc")) el("label-calc").textContent = `Ganhos R$ ${ganhosMes.toFixed(2)} - Gastos R$ ${gastosMes.toFixed(2)}`;

  renderizarTudo();
}

// ==========================
// AUTH
// ==========================
onAuthStateChanged(auth, user => {
  if (!user) return;

  usuarioAtual = user;
  carregarHistorico();

  if (!btnSalvarRegistrado) {
    btnSalvarRegistrado = true;

    document.getElementById("btn-salvar").addEventListener("click", async () => {
      const ganhos = parseFloat(document.getElementById("input-ganhos").value) || 0;
      const km = parseFloat(document.getElementById("input-km").value) || 0;
      const data = document.getElementById("input-data").value;

      if (!data) return alert("Informe a data!");

      const totalGastos = gastosTemp.reduce((acc, g) => acc + g.valor, 0);

      await addDoc(collection(db, "registros"), {
        uid: usuarioAtual.uid,
        data,
        ganhos,
        km,
        gastos: gastosTemp,
        totalGastos,
        criadoEm: new Date()
      });

      alert("Salvo!");

      gastosTemp = [];
      renderizarChips();

      document.getElementById("input-ganhos").value = "";
      document.getElementById("input-km").value = "";
      document.getElementById("input-data").value = "";

      carregarHistorico();
    });
  }
});

​​​​​​​​​
