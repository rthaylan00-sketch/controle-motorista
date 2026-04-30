function renderizarTela() {
  const lista = document.getElementById("historico-lista");
  const resumo = document.getElementById("resumo-periodo");

  const hoje = new Date().toISOString().split("T")[0];

  let filtrados = [];

  if (filtroAtual === "hoje") {
    filtrados = dadosCache.filter(d => d.data === hoje);
  }

  if (filtroAtual === "semana") {
    const agora = new Date();
    filtrados = dadosCache.filter(d => {
      const data = new Date(d.data);
      const diff = (agora - data) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    });
  }

  if (filtroAtual === "mes") {
    const mesAtual = hoje.slice(0, 7);
    filtrados = dadosCache.filter(d => d.data.startsWith(mesAtual));
  }

  // =====================
  // CALCULOS
  // =====================
  let ganhos = 0;
  let gastos = 0;
  let km = 0;

  filtrados.forEach(d => {
    ganhos += d.ganhos || 0;
    gastos += d.totalGastos || 0;
    km += d.km || 0;
  });

  const lucro = ganhos - gastos;
  const porKm = km > 0 ? (ganhos / km).toFixed(2) : 0;

  // =====================
  // RESUMO
  // =====================
  let mensagem = "";

  if (filtroAtual === "hoje") {
    if (porKm >= 3.5) mensagem = "🔥 Excelente dia!";
    else if (porKm >= 3) mensagem = "👍 Bom resultado";
    else mensagem = "⚠️ Pode melhorar";
  }

  resumo.innerHTML = `
    <div class="resumo-lucro">R$ ${lucro.toFixed(2)}</div>
    <div class="resumo-grid">
      <div class="resumo-item">Ganhos <strong>R$ ${ganhos.toFixed(2)}</strong></div>
      <div class="resumo-item">Gastos <strong>R$ ${gastos.toFixed(2)}</strong></div>
    </div>
    <div class="resumo-km">🚗 ${km} km • R$ ${porKm}/km</div>
    ${mensagem ? `<div class="resumo-msg">${mensagem}</div>` : ""}
  `;

  // =====================
  // HISTORICO
  // =====================
  lista.innerHTML = "";

  if (filtrados.length === 0) {
    lista.innerHTML = "<p style='text-align:center;color:#888'>Sem dados.</p>";
    return;
  }

  filtrados.forEach(d => {
    const item = document.createElement("div");

    const porKmItem = d.km > 0 ? (d
