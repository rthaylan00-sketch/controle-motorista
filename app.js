// ============================================================
// app.js — Lógica completa do DriveControl Pro
// ============================================================

// -------- Estado global --------
let uid             = null;
let corridas        = [];
let gastos          = [];
let veiculo         = {};
let starSelecionada = 5;
let turnoAtivo      = false;
let turnoInicio     = null;
let turnoTimer      = null;

// ============================================================
//  INIT — disparado quando Firebase confirma usuário logado
// ============================================================
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  uid = user.uid;

  // Exibe nome e avatar
  const nome = user.displayName || user.email.split('@')[0];
  document.getElementById('user-name').textContent   = nome;
  document.getElementById('user-avatar').textContent = nome[0].toUpperCase();

  // Define datas padrão
  const hoje = new Date().toISOString().split('T')[0];
  const mes  = hoje.slice(0, 7);
  setValSe('corrida-data', hoje);
  setValSe('gasto-data',   hoje);
  ['filtro-mes-corridas','filtro-mes-gastos','filtro-mes-relatorio'].forEach(id => setValSe(id, mes));

  const dataEl = document.getElementById('data-hoje');
  if (dataEl) dataEl.textContent = new Date().toLocaleDateString('pt-BR',{ weekday:'short', day:'2-digit', month:'short' });

  // Carrega dados do Firestore
  carregarDados();
  restaurarTurno();
});

// ============================================================
//  FIRESTORE
// ============================================================
function carregarDados() {
  // Corridas em tempo real
  db.collection(`usuarios/${uid}/corridas`)
    .orderBy('data','desc')
    .onSnapshot(snap => {
      corridas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      atualizarTudo();
    }, err => console.error('Corridas:', err));

  // Gastos em tempo real
  db.collection(`usuarios/${uid}/gastos`)
    .orderBy('data','desc')
    .onSnapshot(snap => {
      gastos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      atualizarTudo();
    }, err => console.error('Gastos:', err));

  // Veículo
  db.doc(`usuarios/${uid}/config/veiculo`)
    .onSnapshot(snap => {
      veiculo = snap.exists ? snap.data() : {};
      preencherVeiculo();
      renderAlertas();
    });
}

function restaurarTurno() {
  db.doc(`usuarios/${uid}/config/turno`).get().then(snap => {
    if (snap.exists && snap.data().ativo) {
      turnoInicio = new Date(snap.data().inicio);
      turnoAtivo  = true;
      ativarTimerUI();
    }
  });
}

// ============================================================
//  ATUALIZA TUDO
// ============================================================
function atualizarTudo() {
  const hoje    = new Date().toISOString().split('T')[0];
  const mesAtual= hoje.slice(0, 7);

  const cHoje = corridas.filter(c => c.data === hoje);
  const gHoje = gastos.filter(g => g.data === hoje);
  const cMes  = corridas.filter(c => c.data && c.data.startsWith(mesAtual));
  const gMes  = gastos.filter(g => g.data && g.data.startsWith(mesAtual));

  // --- Hoje ---
  const rHoje = soma(cHoje,'valor');
  const gHojeV= soma(gHoje,'valor');
  setText('hoje-receita',  fmt(rHoje));
  setText('hoje-gastos',   fmt(gHojeV));
  setText('hoje-corridas', cHoje.length);
  setText('hoje-liquido',  fmt(rHoje - gHojeV));

  // --- Mês ---
  const rMes   = soma(cMes,'valor');
  const gMesV  = soma(gMes,'valor');
  const kmMes  = soma(cMes,'km');
  const minMes = soma(cMes,'duracao');
  const media  = cMes.length ? rMes / cMes.length : 0;

  setText('mes-receita',  fmt(rMes));
  setText('mes-gastos',   fmt(gMesV));
  setText('mes-liquido',  fmt(rMes - gMesV));
  setText('mes-corridas', cMes.length);
  setText('mes-horas',    `${Math.floor(minMes/60)}h ${minMes%60}min`);
  setText('mes-media',    fmt(media));
  setText('mes-km',       `${kmMes.toFixed(1)} km`);

  // Dashboard: últimas 5
  renderLista('dash-corridas', corridas.slice(0,5), 'corrida');

  // Páginas secundárias (se abertas)
  renderCorridas();
  renderGastos();
  renderRelatorio();
}

// ============================================================
//  TURNO
// ============================================================
function toggleTurno() {
  if (!turnoAtivo) {
    turnoAtivo  = true;
    turnoInicio = new Date();
    ativarTimerUI();
    db.doc(`usuarios/${uid}/config/turno`).set({ ativo: true, inicio: turnoInicio.toISOString() });
    showToast('Turno iniciado! Bom trabalho 🚗', 'ok');
  } else {
    turnoAtivo = false;
    clearInterval(turnoTimer);
    const durMin = Math.round((new Date() - turnoInicio) / 60000);
    db.doc(`usuarios/${uid}/config/turno`).set({ ativo: false });
    db.collection(`usuarios/${uid}/turnos`).add({
      inicio:  turnoInicio.toISOString(),
      fim:     new Date().toISOString(),
      duracao: durMin,
      data:    new Date().toISOString().split('T')[0]
    });
    turnoInicio = null;
    document.getElementById('turno-card').classList.remove('ativo');
    document.getElementById('turno-status-text').textContent = 'Parado';
    document.getElementById('turno-timer').textContent       = '00:00:00';
    document.getElementById('btn-turno').className           = 'btn-turno iniciar';
    document.getElementById('btn-turno-icon').textContent    = '▶';
    document.getElementById('btn-turno-text').textContent    = 'Iniciar';
    showToast(`Turno encerrado: ${Math.floor(durMin/60)}h ${durMin%60}min`, 'ok');
  }
}

function ativarTimerUI() {
  document.getElementById('turno-card').classList.add('ativo');
  document.getElementById('turno-status-text').textContent = 'Em andamento';
  document.getElementById('btn-turno').className           = 'btn-turno parar';
  document.getElementById('btn-turno-icon').textContent    = '■';
  document.getElementById('btn-turno-text').textContent    = 'Parar';
  clearInterval(turnoTimer);
  turnoTimer = setInterval(() => {
    const ms = new Date() - turnoInicio;
    const h  = String(Math.floor(ms/3600000)).padStart(2,'0');
    const m  = String(Math.floor((ms%3600000)/60000)).padStart(2,'0');
    const s  = String(Math.floor((ms%60000)/1000)).padStart(2,'0');
    document.getElementById('turno-timer').textContent = `${h}:${m}:${s}`;
  }, 1000);
}

// ============================================================
//  SALVAR CORRIDA
// ============================================================
function salvarCorrida() {
  const plataforma = document.getElementById('corrida-plataforma').value;
  const valor      = parseFloat(document.getElementById('corrida-valor').value);
  const km         = parseFloat(document.getElementById('corrida-km').value)      || 0;
  const duracao    = parseInt(document.getElementById('corrida-duracao').value)    || 0;
  const data       = document.getElementById('corrida-data').value;
  const obs        = document.getElementById('corrida-obs').value.trim();

  if (!valor || valor <= 0) return showToast('Informe um valor válido!', 'err');
  if (!data)                return showToast('Informe a data!', 'err');

  db.collection(`usuarios/${uid}/corridas`).add({
    plataforma, valor, km, duracao, data, obs,
    avaliacao: starSelecionada,
    criadoEm:  firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    fecharModal('modal-corrida');
    limparCorrida();
    showToast('Corrida salva! 🛣️', 'ok');
  }).catch(() => showToast('Erro ao salvar. Tente novamente.', 'err'));
}

function limparCorrida() {
  ['corrida-valor','corrida-km','corrida-duracao','corrida-obs'].forEach(id => setValSe(id,''));
  setValSe('corrida-data', new Date().toISOString().split('T')[0]);
  setStar(5);
}

function deletarCorrida(id) {
  if (!confirm('Excluir esta corrida?')) return;
  db.doc(`usuarios/${uid}/corridas/${id}`).delete()
    .then(() => showToast('Corrida excluída.'));
}

// ============================================================
//  SALVAR GASTO
// ============================================================
function salvarGasto() {
  const categoria = document.getElementById('gasto-categoria').value;
  const valor     = parseFloat(document.getElementById('gasto-valor').value);
  const desc      = document.getElementById('gasto-desc').value.trim();
  const data      = document.getElementById('gasto-data').value;
  const litros    = parseFloat(document.getElementById('gasto-litros').value) || 0;

  if (!valor || valor <= 0) return showToast('Informe um valor válido!', 'err');
  if (!data)                return showToast('Informe a data!', 'err');

  db.collection(`usuarios/${uid}/gastos`).add({
    categoria, valor, desc, data, litros,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    fecharModal('modal-gasto');
    limparGasto();
    showToast('Gasto salvo! ⛽', 'ok');
  }).catch(() => showToast('Erro ao salvar. Tente novamente.', 'err'));
}

function limparGasto() {
  ['gasto-valor','gasto-desc','gasto-litros'].forEach(id => setValSe(id,''));
  setValSe('gasto-data', new Date().toISOString().split('T')[0]);
}

function deletarGasto(id) {
  if (!confirm('Excluir este gasto?')) return;
  db.doc(`usuarios/${uid}/gastos/${id}`).delete()
    .then(() => showToast('Gasto excluído.'));
}

function toggleLitros() {
  const cat = document.getElementById('gasto-categoria').value;
  const el  = document.getElementById('litros-group');
  if (el) el.style.display = cat === 'Combustível' ? 'flex' : 'none';
}

// ============================================================
//  VEÍCULO
// ============================================================
function salvarVeiculo() {
  const dados = {
    modelo:  document.getElementById('v-modelo').value,
    placa:   document.getElementById('v-placa').value,
    ano:     document.getElementById('v-ano').value,
    km:      parseFloat(document.getElementById('v-km').value)      || 0,
    consumo: parseFloat(document.getElementById('v-consumo').value) || 0,
    oleo:    parseFloat(document.getElementById('v-oleo').value)    || 0,
  };
  db.doc(`usuarios/${uid}/config/veiculo`).set(dados)
    .then(() => showToast('Veículo salvo! 🚗', 'ok'));
}

function preencherVeiculo() {
  if (!veiculo.modelo) return;
  setValSe('v-modelo',  veiculo.modelo  || '');
  setValSe('v-placa',   veiculo.placa   || '');
  setValSe('v-ano',     veiculo.ano     || '');
  setValSe('v-km',      veiculo.km      || '');
  setValSe('v-consumo', veiculo.consumo || '');
  setValSe('v-oleo',    veiculo.oleo    || '');
  setText('v-modelo-display', veiculo.modelo || 'Meu Carro');
  setText('v-placa-display',  veiculo.placa  || '---');
}

function renderAlertas() {
  const el = document.getElementById('alertas-manutencao');
  if (!el) return;
  if (!veiculo.km || !veiculo.oleo) {
    el.innerHTML = '<div class="empty-state"><span>🔧</span><p>Cadastre seu veículo para ver alertas.</p></div>';
    return;
  }
  const diff = veiculo.oleo - veiculo.km;
  el.innerHTML = diff <= 1000
    ? `<div class="alert-card"><span>⚠️</span><div class="alert-text"><strong>Troca de óleo próxima!</strong><span>Faltam ${Math.max(0,diff)} km</span></div></div>`
    : `<div class="alert-card ok"><span>✅</span><div class="alert-text"><strong>Óleo em dia</strong><span>Próxima troca em ${diff} km</span></div></div>`;
}

// ============================================================
//  RENDER CORRIDAS
// ============================================================
function renderCorridas() {
  const plat = document.getElementById('filtro-plataforma')?.value || '';
  const mes  = document.getElementById('filtro-mes-corridas')?.value || '';
  let lista  = corridas;
  if (plat) lista = lista.filter(c => c.plataforma === plat);
  if (mes)  lista = lista.filter(c => c.data && c.data.startsWith(mes));
  renderLista('lista-corridas', lista, 'corrida');
}

// ============================================================
//  RENDER GASTOS
// ============================================================
function renderGastos() {
  const mes  = document.getElementById('filtro-mes-gastos')?.value || '';
  let lista  = gastos;
  if (mes) lista = lista.filter(g => g.data && g.data.startsWith(mes));

  const cats = { Combustível:0, Manutenção:0, Seguro:0, outros:0 };
  lista.forEach(g => {
    if      (g.categoria === 'Combustível') cats.Combustível += g.valor;
    else if (g.categoria === 'Manutenção')  cats.Manutenção  += g.valor;
    else if (g.categoria === 'Seguro')      cats.Seguro      += g.valor;
    else                                    cats.outros      += g.valor;
  });
  setText('g-combustivel', fmt(cats.Combustível));
  setText('g-manutencao',  fmt(cats.Manutenção));
  setText('g-seguro',      fmt(cats.Seguro));
  setText('g-outros',      fmt(cats.outros));
  renderLista('lista-gastos', lista, 'gasto');
}

// ============================================================
//  RENDER RELATÓRIO
// ============================================================
function renderRelatorio() {
  const mes   = document.getElementById('filtro-mes-relatorio')?.value || '';
  const cMes  = mes ? corridas.filter(c => c.data && c.data.startsWith(mes)) : corridas;
  const gMes  = mes ? gastos.filter(g => g.data && g.data.startsWith(mes))   : gastos;

  const receita  = soma(cMes,'valor');
  const despesas = soma(gMes,'valor');
  const liquido  = receita - despesas;
  const kmTotal  = soma(cMes,'km');
  const media    = cMes.length ? receita / cMes.length : 0;
  const minutos  = soma(cMes,'duracao');
  const combust  = gMes.filter(g=>g.categoria==='Combustível').reduce((a,b)=>a+b.valor,0);
  const percent  = receita ? ((despesas/receita)*100).toFixed(1) : 0;

  setText('rel-liquido',     fmt(liquido));
  setText('rel-receita',     fmt(receita));
  setText('rel-despesas',    fmt(despesas));
  setText('rel-corridas',    cMes.length);
  setText('rel-km',          `${kmTotal.toFixed(1)} km`);
  setText('rel-media',       fmt(media));
  setText('rel-horas',       `${Math.floor(minutos/60)}h ${minutos%60}min`);
  setText('rel-combustivel', fmt(combust));
  setText('rel-percent',     `${percent}%`);

  const elLiq = document.getElementById('rel-liquido');
  if (elLiq) elLiq.style.color = liquido >= 0 ? 'var(--green)' : 'var(--red)';

  // Ranking por plataforma
  const rankEl = document.getElementById('rel-plataformas');
  if (!rankEl) return;
  const plats = {};
  cMes.forEach(c => {
    if (!plats[c.plataforma]) plats[c.plataforma] = { corridas:0, total:0 };
    plats[c.plataforma].corridas++;
    plats[c.plataforma].total += c.valor;
  });
  const sorted = Object.entries(plats).sort((a,b) => b[1].total - a[1].total);
  rankEl.innerHTML = sorted.length
    ? sorted.map(([p,d],i) => `
        <div class="item-card">
          <span class="item-icon">${['🥇','🥈','🥉'][i]||'🏅'}</span>
          <div class="item-info">
            <div class="item-top"><span class="item-title">${p}</span><span class="item-valor">${fmt(d.total)}</span></div>
            <p class="item-sub">${d.corridas} corridas · média ${fmt(d.total/d.corridas)}</p>
          </div>
        </div>`).join('')
    : '<div class="empty-state"><span>📊</span><p>Sem dados neste mês.</p></div>';
}

// ============================================================
//  EXPORTAR CSV
// ============================================================
function exportarCSV() {
  const mes   = document.getElementById('filtro-mes-relatorio')?.value || '';
  const cMes  = mes ? corridas.filter(c => c.data && c.data.startsWith(mes)) : corridas;
  const gMes  = mes ? gastos.filter(g => g.data && g.data.startsWith(mes))   : gastos;

  let csv = 'Tipo,Data,Categoria/Plataforma,Valor,KM,Duração(min),Descrição\n';
  cMes.forEach(c => csv += `Corrida,${c.data},${c.plataforma},${c.valor},${c.km||0},${c.duracao||0},"${c.obs||''}"\n`);
  gMes.forEach(g => csv += `Gasto,${g.data},${g.categoria},${g.valor},,,${g.desc||''}\n`);

  const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `drivecontrol-${mes||'geral'}.csv` });
  a.click();
  showToast('CSV exportado! 📥', 'ok');
}

// ============================================================
//  RENDER LISTA GENÉRICA
// ============================================================
function renderLista(containerId, lista, tipo) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!lista.length) {
    el.innerHTML = `<div class="empty-state"><span>${tipo==='corrida'?'🛣️':'💸'}</span><p>Nenhum registro ainda.</p></div>`;
    return;
  }
  el.innerHTML = lista.map(item => tipo==='corrida' ? htmlCorrida(item) : htmlGasto(item)).join('');
}

function htmlCorrida(c) {
  const plat  = (c.plataforma||'').toLowerCase().replace(/\s/g,'');
  const stars = '★'.repeat(c.avaliacao||5) + '☆'.repeat(5-(c.avaliacao||5));
  return `
    <div class="item-card">
      <span class="item-icon">${iconePlat(c.plataforma)}</span>
      <div class="item-info">
        <div class="item-top">
          <span class="item-badge badge-${plat}">${c.plataforma}</span>
          <span class="item-valor">${fmt(c.valor)}</span>
        </div>
        <p class="item-sub">
          ${c.data?fmtData(c.data):''}
          ${c.km?` · ${c.km} km`:''}
          ${c.duracao?` · ${c.duracao} min`:''}
          <span style="color:var(--gold);font-size:.8rem"> ${stars}</span>
        </p>
        ${c.obs?`<p class="item-sub" style="margin-top:2px;color:var(--text)">${c.obs}</p>`:''}
      </div>
      <button class="item-delete" onclick="deletarCorrida('${c.id}')" title="Excluir">🗑</button>
    </div>`;
}

function htmlGasto(g) {
  const icones = { 'Combustível':'⛽','Manutenção':'🔧','Seguro':'🛡️','Lavagem':'🚿','Alimentação':'🍔','Multa':'🚨','Estacionamento':'🅿️','Outros':'📦' };
  return `
    <div class="item-card">
      <span class="item-icon">${icones[g.categoria]||'📦'}</span>
      <div class="item-info">
        <div class="item-top">
          <span class="item-title">${g.categoria}</span>
          <span class="item-valor gasto">- ${fmt(g.valor)}</span>
        </div>
        <p class="item-sub">
          ${g.data?fmtData(g.data):''}
          ${g.desc?` · ${g.desc}`:''}
          ${g.litros?` · ${g.litros}L`:''}
        </p>
      </div>
      <button class="item-delete" onclick="deletarGasto('${g.id}')" title="Excluir">🗑</button>
    </div>`;
}

// ============================================================
//  NAVEGAÇÃO
// ============================================================
function goTo(page) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${page}`);
    p.classList.toggle('hidden', p.id !== `page-${page}`);
  });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  if (page === 'corridas')  renderCorridas();
  if (page === 'gastos')    renderGastos();
  if (page === 'relatorio') renderRelatorio();
}

function sair() {
  if (confirm('Deseja sair?')) firebase.auth().signOut().then(() => window.location.href = 'login.html');
}

// ============================================================
//  MODAIS
// ============================================================
function abrirModal(id) {
  document.getElementById(id).classList.remove('hidden');
}
function fecharModal(id) {
  document.getElementById(id).classList.add('hidden');
}
function fecharModalFora(e, id) {
  if (e.target.id === id) fecharModal(id);
}

// ============================================================
//  ESTRELAS
// ============================================================
function setStar(val) {
  starSelecionada = val;
  document.querySelectorAll('.star').forEach((s,i) => s.classList.toggle('active', i < val));
}

// ============================================================
//  TOAST
// ============================================================
function showToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${tipo}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 3000);
}

// ============================================================
//  UTILITÁRIOS
// ============================================================
function soma(arr, campo) { return arr.reduce((a,b) => a + (parseFloat(b[campo])||0), 0); }
function fmt(v)  { return (v||0).toLocaleString('pt-BR',{ style:'currency', currency:'BRL' }); }
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function setValSe(id, v){ const el = document.getElementById(id); if (el) el.value = v; }
function fmtData(s) { const [y,m,d]=s.split('-'); return `${d}/${m}/${y}`; }
function iconePlat(p) { return {Uber:'🚖','99':'🚕',InDrive:'🛻',iFood:'🍔',Rappi:'🛵',Outro:'🚗'}[p]||'🚗'; }
