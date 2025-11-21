/* ===========================
   TEMA
   =========================== */
const THEME_KEY = "astroCalc_theme";

function applyTheme(theme) {
  const body = document.body;
  body.classList.remove("theme-neon", "theme-carbon", "theme-light");

  let normalized;
  if (theme === "carbon") normalized = "theme-carbon";
  else if (theme === "light") normalized = "theme-light";
  else normalized = "theme-neon";

  body.classList.add(normalized);

  const sel = document.getElementById("themeSelect");
  if (sel) sel.value = theme;
}

function setTheme(theme) {
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { }
  applyTheme(theme);
}

function loadTheme() {
  let t = "neon";
  try { t = localStorage.getItem(THEME_KEY) || "neon"; } catch (e) { }
  applyTheme(t);
}

/* ===========================
   UTILS
   =========================== */
const STORAGE_KEY = "astroCalc_v2_state";

function fmt(n) {
  if (!isFinite(n)) return "0";
  n = Math.round(n);
  const s = Math.abs(n).toString();
  const spaced = s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (n < 0 ? "-" : "") + spaced;
}

function unfmt(str) {
  if (!str) return "";
  return str.toString().replace(/\s+/g, "");
}

function maskWithSpaces(el) {
  let raw = (el.value || "").replace(/\D/g, "");
  if (raw === "") {
    el.value = "";
    return;
  }
  el.value = raw.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function valIntById(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const raw = unfmt(el.value);
  if (raw === "" || isNaN(raw)) return 0;
  return parseInt(raw, 10);
}

function valFloatById(id, defVal) {
  const el = document.getElementById(id);
  if (!el) return defVal || 0;
  let raw = (el.value || "").toString().replace(/\s+/g, "");
  raw = raw.replace(",", ".");
  const v = parseFloat(raw);
  return isNaN(v) ? (defVal || 0) : v;
}

function clampRates() {
  const rM = document.getElementById("rateM");
  const rC = document.getElementById("rateC");
  const rD = document.getElementById("rateD");

  if (rM) {
    let n = parseFloat(rM.value.replace(",", "."));
    if (!isNaN(n)) {
      if (n > 3) rM.value = "3";
      if (n < 0) rM.value = "0";
    }
  }
  if (rC) {
    let n = parseFloat(rC.value.replace(",", "."));
    if (!isNaN(n)) {
      if (n > 2) rC.value = "2";
      if (n < 0) rC.value = "0";
    }
  }
  if (rD) {
    let n = parseFloat(rD.value.replace(",", "."));
    if (!isNaN(n)) {
      if (n > 1) rD.value = "1";
      if (n < 0) rD.value = "0";
    }
  }
}

function collectState() {
  const data = {};
  document.querySelectorAll("input, select").forEach(el => {
    if (!el.id) return;
    if (el.type === "button" || el.readOnly) return;
    data[el.id] = el.value;
  });
  return data;
}

function saveState() {
  try {
    const data = collectState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.keys(data).forEach(id => {
      const el = document.getElementById(id);
      if (el && typeof data[id] === "string") el.value = data[id];
    });
  } catch (e) { }
}

function markDirty() {
  const notes = document.getElementById("statusNotes");
  if (!notes) return;
  notes.innerHTML =
    '<div class="pill"><strong>Atenção:</strong> parâmetros alterados — clica em Calcular para atualizar.</div>';
  saveState();
}

/* ===========================
   ARMAZÉNS
   =========================== */
function storageCapBase(level) {
  if (level <= 0) return 10000;
  const k = 20 / 33;
  return 5000 * Math.floor(2.5 * Math.exp(k * level));
}

function storageCap(level) {
  const lfEl = document.getElementById("storBonus");
  let lf = 0;
  if (lfEl) {
    let raw = lfEl.value.replace(",", ".");
    lf = raw === "" ? 0 : parseFloat(raw);
    if (!isFinite(lf)) lf = 0;
  }

  const allyEl = document.getElementById("allyClass");
  let classBonus = 0;
  if (allyEl && allyEl.value === "merchant") classBonus = 10;

  const base = storageCapBase(level);
  const totalBonus = lf + classBonus;
  return Math.round(base * (1 + totalBonus / 100));
}

function updateStorages() {
  const lvlM = parseInt(document.getElementById("storLvlM").value) || 0;
  const lvlC = parseInt(document.getElementById("storLvlC").value) || 0;
  const lvlD = parseInt(document.getElementById("storLvlD").value) || 0;

  const capM = storageCap(lvlM);
  const capC = storageCap(lvlC);
  const capD = storageCap(lvlD);

  document.getElementById("storCapM").value = fmt(capM);
  document.getElementById("storCapC").value = fmt(capC);
  document.getElementById("storCapD").value = fmt(capD);

  const curM = valIntById("curMetal");
  const curC = valIntById("curCrystal");
  const curD = valIntById("curDeut");

  document.getElementById("storCapM").classList.toggle("warning", curM > capM);
  document.getElementById("storCapC").classList.toggle("warning", curC > capC);
  document.getElementById("storCapD").classList.toggle("warning", curD > capD);
}

/* ===========================
   ASTROFÍSICA
   =========================== */
function updateAstroCost() {
  const mField = document.getElementById("astroMetal");
  const cField = document.getElementById("astroCrystal");
  const dField = document.getElementById("astroDeut");
  if (!mField || !cField || !dField) return;

  const baseM = 4000, baseC = 8000, baseD = 4000, mult = 1.75;

  const fromEl = document.getElementById("astroLevelFrom");
  const toEl   = document.getElementById("astroLevelTo");

  const from = fromEl ? (parseInt(fromEl.value, 10) || 0) : 0;
  const to   = toEl   ? (parseInt(toEl.value, 10)   || 0) : 0;

  // Se não houver nível final válido, limpa os campos
  if (to <= 0) {
    mField.value = cField.value = dField.value = "";
    return;
  }

  let totalM = 0;
  let totalC = 0;
  let totalD = 0;

  if (from > 0 && from < to) {
    // Soma dos custos dos níveis (from+1 ... to)
    for (let lvl = from + 1; lvl <= to; lvl++) {
      const factor = Math.pow(mult, lvl - 1);
      totalM += Math.round(baseM * factor);
      totalC += Math.round(baseC * factor);
      totalD += Math.round(baseD * factor);
    }
  } else {
    // Sem nível inicial válido → custo apenas do nível "to" (comportamento simples)
    const factor = Math.pow(mult, to - 1);
    totalM = Math.round(baseM * factor);
    totalC = Math.round(baseC * factor);
    totalD = Math.round(baseD * factor);
  }

  mField.value = fmt(totalM);
  cField.value = fmt(totalC);
  dField.value = fmt(totalD);

  markDirty();
}



/* ===========================
   DESTROÇOS / FROTA
   =========================== */
function getDebrisRate() {
  const el = document.getElementById("debrisRate");
  if (!el) return 0.7;
  let v = parseInt(el.value, 10);
  if (isNaN(v)) return 0.7;
  if (v < 0) v = 0;
  if (v > 100) v = 100;
  return v / 100;
}

function onDebrisRateChange() {
  const el = document.getElementById("debrisRate");
  if (!el) return;
  let v = parseInt(el.value, 10);
  if (isNaN(v)) {
    el.classList.add("warning");
    return;
  }
  if (v < 0) v = 0;
  if (v > 100) v = 100;
  el.value = v;
  el.classList.remove("warning");
  updateFleetStats();
  markDirty();
}

const SHIPS = {
  lf: { name: "Caça Ligeiro", m: 3000, c: 1000, d: 0 },
  hf: { name: "Caça Pesado", m: 6000, c: 4000, d: 0 },
  cr: { name: "Cruzador", m: 20000, c: 7000, d: 2000 },
  bs: { name: "Nave de Batalha", m: 45000, c: 15000, d: 0 },
  bc: { name: "Interceptor", m: 30000, c: 40000, d: 15000 },
  bom: { name: "Bombardeiro", m: 50000, c: 25000, d: 15000 },
  des: { name: "Destruidor", m: 60000, c: 50000, d: 15000 },
  rip: { name: "Estrela da Morte", m: 5000000, c: 4000000, d: 1000000 },
  expo: { name: "Exploradora", m: 8000, c: 15000, d: 8000 },
  reap: { name: "Ceifeira", m: 85000, c: 55000, d: 20000 },
  sc: { name: "Cargueiro Pequeno", m: 2000, c: 2000, d: 0 },
  lc: { name: "Cargueiro Grande", m: 6000, c: 6000, d: 0 },
  col: { name: "Nave de Colonização", m: 10000, c: 20000, d: 10000 },
  rec: { name: "Reciclador", m: 10000, c: 6000, d: 2000 },
  spy: { name: "Sonda Espionagem", m: 0, c: 1000, d: 0 }
};

function addShipRow() {
  const select = document.getElementById("shipSelect");
  const key = select.value;
  if (!key || !SHIPS[key]) return;

  const ship = SHIPS[key];
  const tbody = document.getElementById("fleetBody");

  const tr = document.createElement("tr");
  tr.dataset.shipKey = key;
  tr.innerHTML = `
    <td>${ship.name}</td>
    <td class="fleet-input-cell">
      <div class="field">
        <input class="narrow" placeholder="Qtd"
               oninput="maskWithSpaces(this); updateFleetStats(); markDirty()">
      </div>
    </td>
    <td class="narrow colPts"></td>
    <td class="narrow colDM"></td>
    <td class="narrow colDC"></td>
    <td class="narrow colDD"></td>
    <td class="narrow">
      <button type="button" class="btn-danger" onclick="removeShipRow(this)">X</button>
    </td>
  `;

  tbody.appendChild(tr);
  updateFleetStats();
  markDirty();
  toggleDebrisSection();
}

function removeShipRow(btn) {
  const tr = btn.closest("tr");
  if (tr) tr.remove();
  updateFleetStats();
  markDirty();
  toggleDebrisSection();
}

function clearFleet() {
  const body = document.getElementById("fleetBody");
  if (body) body.innerHTML = "";
  updateFleetStats();
  markDirty();
  toggleDebrisSection();
}

function updateFleetStats() {
  const tbody = document.getElementById("fleetBody");
  const rows = tbody ? Array.from(tbody.querySelectorAll("tr")) : [];
  const debrisRate = getDebrisRate();

  let sumPts = 0, sumDM = 0, sumDC = 0, sumDD = 0;

  rows.forEach(tr => {
    const key = tr.dataset.shipKey;
    const ship = SHIPS[key];
    if (!ship) return;

    const qtyInput = tr.querySelector("input");
    const qtyRaw = unfmt(qtyInput.value);
    const qty = qtyRaw === "" || isNaN(qtyRaw) ? 0 : parseInt(qtyRaw, 10);

    const ptsCell = tr.querySelector(".colPts");
    const dmCell = tr.querySelector(".colDM");
    const dcCell = tr.querySelector(".colDC");
    const ddCell = tr.querySelector(".colDD");

    if (qty <= 0) {
      ptsCell.textContent = dmCell.textContent =
        dcCell.textContent = ddCell.textContent = "";
      return;
    }

    const ptsPerUnit = (ship.m + ship.c + ship.d) / 1000;
    const pts = ptsPerUnit * qty;

    const dm = Math.floor(ship.m * qty * debrisRate);
    const dc = Math.floor(ship.c * qty * debrisRate);
    const dd = Math.floor(ship.d * qty * debrisRate);

    ptsCell.textContent = fmt(Math.round(pts));
    dmCell.textContent = fmt(dm);
    dcCell.textContent = fmt(dc);
    ddCell.textContent = fmt(dd);

    sumPts += pts;
    sumDM += dm;
    sumDC += dc;
    sumDD += dd;
  });

  const sumPtsEl = document.getElementById("sumPts");
  const sumDMEl = document.getElementById("sumDM");
  const sumDCEl = document.getElementById("sumDC");
  const sumDDEl = document.getElementById("sumDD");

  if (sumPtsEl) sumPtsEl.textContent = sumPts ? fmt(Math.round(sumPts)) : "";
  if (sumDMEl) sumDMEl.textContent = sumDM ? fmt(sumDM) : "";
  if (sumDCEl) sumDCEl.textContent = sumDC ? fmt(sumDC) : "";
  if (sumDDEl) sumDDEl.textContent = sumDD ? fmt(sumDD) : "";

  return { totalPts: Math.round(sumPts), dm: sumDM, dc: sumDC, dd: sumDD };
}

/* Mostrar/ocultar bloco de destroços */
function toggleDebrisSection() {
  const block = document.querySelector('#statusDebris')?.closest('.status-block');
  if (!block) return;
  const hasFleet = document.querySelectorAll('#fleetBody tr').length > 0;
  block.style.display = hasFleet ? 'flex' : 'none';
}

/* ===========================
   CONVERSÃO MANUAL (estado global)
   =========================== */
let manualConversionActive = false;
let manualConversionFrom = "none";
let manualConversionTo = "none";
let manualConversionCount = 0;

// Estado acumulado das conversões (totais após conversões)
let convStateActive = false;
let convTotalM = 0;
let convTotalC = 0;
let convTotalD = 0;

const RESOURCE_NAMES = {
  metal: "metal",
  crystal: "cristal",
  deut: "deutério"
};

function updateConvertFromOptions(extraM, extraC, extraD, selected) {
  const cf = document.getElementById("convertFrom");
  if (!cf) return;

  const options = [{ label: "Nenhum", value: "none" }];
  if (extraM > 0) options.push({ label: "Metal", value: "metal" });
  if (extraC > 0) options.push({ label: "Cristal", value: "crystal" });
  if (extraD > 0) options.push({ label: "Deutério", value: "deut" });

  const prev = selected || cf.value || "none";

  cf.innerHTML = "";
  options.forEach(o => cf.add(new Option(o.label, o.value)));

  if (options.some(o => o.value === prev)) cf.value = prev;
  else cf.value = "none";
}

function updateConvertToOptions(missM, missC, missD, selected) {
  const ct = document.getElementById("convertTo");
  if (!ct) return;

  const options = [{ label: "Nenhum", value: "none" }];
  if (missM > 0) options.push({ label: "Metal", value: "metal" });
  if (missC > 0) options.push({ label: "Cristal", value: "crystal" });
  if (missD > 0) options.push({ label: "Deutério", value: "deut" });

  const prev = selected || ct.value || "none";

  ct.innerHTML = "";
  options.forEach(o => ct.add(new Option(o.label, o.value)));

  if (options.some(o => o.value === prev)) ct.value = prev;
  else ct.value = "none";
}

/* Botão "Converter" */
function applyConversion() {
  const convBlock = document.querySelector("[data-convert-block]");
  if (!convBlock || convBlock.style.display === "none") {
    const sumEl = document.getElementById("convertSummary");
    if (sumEl) sumEl.textContent = "Sem recursos em excesso para converter.";
    manualConversionActive = false;
    return;
  }

  const cf = document.getElementById("convertFrom");
  const ct = document.getElementById("convertTo");
  if (!cf || !ct) return;

  const from = cf.value;
  const to = ct.value;

  if (from === "none" || to === "none" || from === to) {
    manualConversionActive = false;
    const sumEl = document.getElementById("convertSummary");
    if (sumEl) sumEl.textContent = "Seleciona um recurso excedente e um recurso em falta.";
    return;
  }

  manualConversionFrom = from;
  manualConversionTo = to;
  manualConversionActive = true;

  calcular();
}

/* Botão "Limpar conversão" */
function clearConversion() {
  manualConversionActive = false;
  manualConversionFrom = "none";
  manualConversionTo = "none";
  manualConversionCount = 0;

  convStateActive = false;
  convTotalM = 0;
  convTotalC = 0;
  convTotalD = 0;

  const cf = document.getElementById("convertFrom");
  const ct = document.getElementById("convertTo");
  if (cf) cf.value = "none";
  if (ct) ct.value = "none";

  const sumEl = document.getElementById("convertSummary");
  if (sumEl) {
    sumEl.textContent =
      'Escolhe "de" e "para" e clica "Converter". ' +
      'Podes repetir o processo várias vezes com outras combinações.';
  }

  calcular();
}

/* ===========================
   CÁLCULO PRINCIPAL
   =========================== */
function calcular() {

  /* --- Ler valores base (inputs nunca são alterados) --- */
  const astroM = valIntById("astroMetal");
  const astroC = valIntById("astroCrystal");
  const astroD = valIntById("astroDeut");

  const curM_input = valIntById("curMetal");
  const curC_input = valIntById("curCrystal");
  const curD_input = valIntById("curDeut");

  const prodM = valIntById("prodMetal");
  const prodC = valIntById("prodCrystal");
  const prodD = valIntById("prodDeut");

  const rateM = Math.min(3, valFloatById("rateM", 3));
  const rateC = Math.min(2, valFloatById("rateC", 2));
  const rateD = Math.min(1, valFloatById("rateD", 1));

  const fleetStats = updateFleetStats();
  const dm = fleetStats.dm, dc = fleetStats.dc, dd = fleetStats.dd;

  toggleDebrisSection();

  /* --- Totais "base" sem conversões --- */
  const baseTotalM = curM_input + dm;
  const baseTotalC = curC_input + dc;
  const baseTotalD = curD_input + dd;

  /* --- Estado inicial para esta execução (pode já ter conversões acumuladas) --- */
  let totalM_start, totalC_start, totalD_start;

  if (convStateActive) {
    // Já houve conversões antes: continuar a partir do estado convertido
    totalM_start = convTotalM;
    totalC_start = convTotalC;
    totalD_start = convTotalD;
  } else {
    // Sem conversões: usar diretamente stocks + destroços
    totalM_start = baseTotalM;
    totalC_start = baseTotalC;
    totalD_start = baseTotalD;
  }

  /* --- Faltas/excedentes antes desta conversão --- */
  let faltaM_before = astroM - totalM_start;
  let faltaC_before = astroC - totalC_start;
  let faltaD_before = astroD - totalD_start;

  let missM_before = Math.max(faltaM_before, 0);
  let missC_before = Math.max(faltaC_before, 0);
  let missD_before = Math.max(faltaD_before, 0);

  let extraM_before = Math.max(totalM_start - astroM, 0);
  let extraC_before = Math.max(totalC_start - astroC, 0);
  let extraD_before = Math.max(totalD_start - astroD, 0);

  /* --- Conversão para MSU (antes das conversões desta execução) --- */
  const mFactor = 1;
  const cFactor = rateM / rateC;
  const dFactor = rateM / rateD;

  const missMSU_before =
    missM_before * mFactor +
    missC_before * cFactor +
    missD_before * dFactor;

  /* --- Mostrar/ocultar bloco de conversão + dropdowns --- */
  const convBlock = document.querySelector("[data-convert-block]");
  if (convBlock) {
    if (extraM_before > 0 || extraC_before > 0 || extraD_before > 0) {
      convBlock.style.display = "block";

      const cfEl = document.getElementById("convertFrom");
      const ctEl = document.getElementById("convertTo");

      const currentFrom = manualConversionActive ? manualConversionFrom : (cfEl ? cfEl.value : "none");
      const currentTo = manualConversionActive ? manualConversionTo : (ctEl ? ctEl.value : "none");

      updateConvertFromOptions(extraM_before, extraC_before, extraD_before, currentFrom);
      updateConvertToOptions(missM_before, missC_before, missD_before, currentTo);

      const sumEl = document.getElementById("convertSummary");
      if (sumEl && !manualConversionActive && manualConversionCount === 0) {
        sumEl.textContent = 'Escolha as opções acima e clique "Converter".';
      }

    } else {
      convBlock.style.display = "none";

      const cf = document.getElementById("convertFrom");
      const ct = document.getElementById("convertTo");
      if (cf) cf.value = "none";
      if (ct) ct.value = "none";

      manualConversionActive = false;
      manualConversionFrom = "none";
      manualConversionTo = "none";
      manualConversionCount = 0;

      const sumEl = document.getElementById("convertSummary");
      if (sumEl) sumEl.textContent = "Sem recursos em excesso para converter.";
    }
  }

  /* ===========================
     Aplicar (eventual) conversão desta execução
     =========================== */

  // Totais de trabalho (serão a base para tudo o resto)
  let totalM_work = totalM_start;
  let totalC_work = totalC_start;
  let totalD_work = totalD_start;

  // miss/excess "reais" (serão atualizados se houver conversão)
  let missM_real = missM_before;
  let missC_real = missC_before;
  let missD_real = missD_before;
  let extraM_real = extraM_before;
  let extraC_real = extraC_before;
  let extraD_real = extraD_before;

  function convertExcess(from, to) {
    if (from === "none" || to === "none" || from === to) return false;

    // Excedentes e faltas com base nos totais atuais
    const extraMap = {
      metal: Math.max(totalM_work - astroM, 0),
      crystal: Math.max(totalC_work - astroC, 0),
      deut: Math.max(totalD_work - astroD, 0)
    };
    const needMap = {
      metal: Math.max(astroM - totalM_work, 0),
      crystal: Math.max(astroC - totalC_work, 0),
      deut: Math.max(astroD - totalD_work, 0)
    };

    const excessUnits = extraMap[from];
    const needUnits = needMap[to];

    if (excessUnits <= 0 || needUnits <= 0) {
      const sumEl = document.getElementById("convertSummary");
      if (sumEl) {
        sumEl.textContent = "Não há excedentes ou faltas suficientes para converter.";
      }
      return false;
    }

    const rate = {
      metal: 1,
      crystal: rateM / rateC,
      deut: rateM / rateD
    };

    const excessMSU = excessUnits * rate[from];
    const needMSU = needUnits * rate[to];
    const usedMSU = Math.min(excessMSU, needMSU);
    if (usedMSU <= 0) return false;

    const usedFrom = usedMSU / rate[from];
    const gainedTo = usedMSU / rate[to];

    // Atualizar totais "virtuais" (não mexe nos inputs!)
    if (from === "metal") totalM_work -= usedFrom;
    if (from === "crystal") totalC_work -= usedFrom;
    if (from === "deut") totalD_work -= usedFrom;

    if (to === "metal") totalM_work += gainedTo;
    if (to === "crystal") totalC_work += gainedTo;
    if (to === "deut") totalD_work += gainedTo;

    // Nunca deixar negativos (só por segurança de arredondamentos)
    totalM_work = Math.max(totalM_work, 0);
    totalC_work = Math.max(totalC_work, 0);
    totalD_work = Math.max(totalD_work, 0);

    // Recalcular faltas/excedentes após a conversão
    missM_real = Math.max(astroM - totalM_work, 0);
    missC_real = Math.max(astroC - totalC_work, 0);
    missD_real = Math.max(astroD - totalD_work, 0);

    extraM_real = Math.max(totalM_work - astroM, 0);
    extraC_real = Math.max(totalC_work - astroC, 0);
    extraD_real = Math.max(totalD_work - astroD, 0);

    const leftoverFrom = {
      metal: extraM_real,
      crystal: extraC_real,
      deut: extraD_real
    }[from];

    const sumEl = document.getElementById("convertSummary");
    if (sumEl) {
      let msg =
        `Convertido ${fmt(Math.round(usedFrom))} de ${RESOURCE_NAMES[from]} ` +
        `em ${fmt(Math.round(gainedTo))} ${RESOURCE_NAMES[to]}.`;

      if (leftoverFrom > 0) {
        msg += `<br>Ainda tens ${fmt(Math.round(leftoverFrom))} de ${RESOURCE_NAMES[from]} em excesso que podes usar numa nova conversão.`;
      }

      sumEl.innerHTML = msg;
    }

    manualConversionCount++;
    return true;
  }

  if (manualConversionActive &&
    manualConversionFrom !== "none" &&
    manualConversionTo !== "none" &&
    manualConversionFrom !== manualConversionTo) {
    const didConvert = convertExcess(manualConversionFrom, manualConversionTo);
    if (didConvert) {
      convStateActive = true;
      convTotalM = totalM_work;
      convTotalC = totalC_work;
      convTotalD = totalD_work;
    }
  }

  // Depois desta execução, já não queremos repetir conversão automaticamente
  manualConversionActive = false;

  /* --- Estado final após possíveis conversões desta execução --- */
  const missMSU_final =
    missM_real * mFactor +
    missC_real * cFactor +
    missD_real * dFactor;

  const prodMSU =
    prodM * mFactor +
    prodC * cFactor +
    prodD * dFactor;

  const metalMSUPerDay = prodM * mFactor;

  /* --- Estimativas de tempo --- */
  let diasMSU = null;
  if (missMSU_final > 0 && prodMSU > 0) {
    diasMSU = missMSU_final / prodMSU;
  }

  let packs = 0;
  if (missMSU_final > 0 && metalMSUPerDay > 0) {
    packs = Math.ceil(missMSU_final / metalMSUPerDay);
  }
  const packDM = valIntById("packDM");
  const dmTotal = packs * packDM;

  /* --- KPIs (topo) --- */
  const kMiss = document.getElementById("kpiMissMSU");
  const kProd = document.getElementById("kpiProdMSU");
  const kPts = document.getElementById("kpiPts");
  const kDays = document.getElementById("kpiDays");

  if (kMiss) kMiss.textContent = fmt(Math.round(missMSU_final));
  if (kProd) kProd.textContent = fmt(Math.round(prodMSU));
  if (kPts) kPts.textContent = fmt(fleetStats.totalPts);
  if (kDays) {
    if (diasMSU !== null) kDays.textContent = "~ " + diasMSU.toFixed(1) + " dias";
    else kDays.textContent = "0";
  }

  /* ========================
     Estado da Astrofísica
     ======================== */
  const stAstro = document.getElementById("statusAstro");
  if (stAstro) {
    stAstro.innerHTML = "";

    const makeLineAstro = (label, val) => {
      const div = document.createElement("div");
      const s1 = document.createElement("span");
      const s2 = document.createElement("span");
      s1.textContent = label;
      s2.textContent = typeof val === "number" ? fmt(val) : val;
      div.appendChild(s1); div.appendChild(s2);
      return div;
    };

    function appendNeedExcess(nome, falta, excesso) {
      const row = document.createElement("div");
      row.classList.add("astro-line");
      const s1 = document.createElement("span");
      const s2 = document.createElement("span");

      if (falta > 0) {
        row.classList.add("astro-missing");
        s1.textContent = nome + " em falta:";
        s2.textContent = fmt(falta);
      } else if (excesso > 0) {
        row.classList.add("astro-excess");
        s1.textContent = nome + " em excesso:";
        s2.textContent = fmt(excesso);
      } else {
        s1.textContent = nome + ":";
        s2.textContent = "OK";
      }

      row.appendChild(s1);
      row.appendChild(s2);
      stAstro.appendChild(row);
    }

    appendNeedExcess("Metal", missM_real, extraM_real);
    appendNeedExcess("Cristal", missC_real, extraC_real);
    appendNeedExcess("Deutério", missD_real, extraD_real);

    const metalFromC = missC_real * cFactor;
    const metalFromD = missD_real * dFactor;

    stAstro.appendChild(makeLineAstro("Metal equivalente do cristal:", Math.round(metalFromC)));
    stAstro.appendChild(makeLineAstro("Metal equivalente do deutério:", Math.round(metalFromD)));
    stAstro.appendChild(makeLineAstro("Custo total em metal (taxa aplicada):", Math.round(missMSU_final)));
  }

  /* ========================
     Destroços
     ======================== */
  const stDebris = document.getElementById("statusDebris");
  if (stDebris) {
    stDebris.innerHTML = "";

    const makeLineDebris = (label, val) => {
      const div = document.createElement("div");
      const s1 = document.createElement("span");
      const s2 = document.createElement("span");
      s1.textContent = label;
      s2.textContent = fmt(val);
      div.appendChild(s1); div.appendChild(s2);
      return div;
    };

    stDebris.appendChild(makeLineDebris("Metal destroços:", dm));
    stDebris.appendChild(makeLineDebris("Cristal destroços:", dc));
    stDebris.appendChild(makeLineDebris("Deutério destroços:", dd));
  }

  /* ========================
     Totais
     ======================== */
  const stTotals = document.getElementById("statusTotals");
  if (stTotals) {
    const titleEl = stTotals.previousElementSibling;
    if (titleEl && titleEl.tagName === "H3") {
      const hasStock = (baseTotalM > 0 || baseTotalC > 0 || baseTotalD > 0);
      const hasDebris = (dm > 0 || dc > 0 || dd > 0);

      if (hasStock && hasDebris) {
        titleEl.textContent = "Totais após recursos + destroços gerados";
      } else if (hasStock && !hasDebris) {
        titleEl.textContent = "Total de recursos";
      } else if (!hasStock && hasDebris) {
        titleEl.textContent = "Total de recursos + Destroços Gerados";
      } else {
        titleEl.textContent = "Total de recursos";
      }
    }

    stTotals.innerHTML = "";

    const makeLineTotals = (label, val) => {
      const div = document.createElement("div");
      const s1 = document.createElement("span");
      const s2 = document.createElement("span");
      s1.textContent = label;
      s2.textContent = fmt(val);
      div.appendChild(s1); div.appendChild(s2);
      return div;
    };

    stTotals.appendChild(makeLineTotals("Total Metal:", totalM_work));
    stTotals.appendChild(makeLineTotals("Total Cristal:", totalC_work));
    stTotals.appendChild(makeLineTotals("Total Deutério:", totalD_work));
  }

  /* ================================
     Verificação de capacidade
     ================================ */
  const capContainer = document.getElementById("statusCapacity");
  if (capContainer) {
    capContainer.innerHTML = "";

    const issues = [];

    function capIssue(label, amount) {
      const row = document.createElement("div");
      row.className = "capacity-row";

      const icon = document.createElement("span");
      icon.className = "cap-icon";
      icon.textContent = "⚠️";

      const lbl = document.createElement("span");
      lbl.className = "cap-label";
      lbl.innerHTML = label;

      const msg = document.createElement("span");
      msg.className = "cap-msg";
      msg.textContent = "recursos excedem a capacidade em";

      const val = document.createElement("span");
      val.className = "cap-value";
      val.textContent = fmt(amount);

      row.appendChild(icon);
      row.appendChild(lbl);
      row.appendChild(msg);
      row.appendChild(val);

      return row;
    }

    const lvlM2 = parseInt(document.getElementById("storLvlM").value) || 0;
    const lvlC2 = parseInt(document.getElementById("storLvlC").value) || 0;
    const lvlD2 = parseInt(document.getElementById("storLvlD").value) || 0;

    const capM = storageCap(lvlM2);
    const capC = storageCap(lvlC2);
    const capD = storageCap(lvlD2);

    const dm2 = dm, dc2 = dc, dd2 = dd;

    if (dm2 > capM) issues.push(capIssue("Armazém de <strong>Metal</strong>", dm2 - capM));
    if (dc2 > capC) issues.push(capIssue("Armazém de <strong>Cristal</strong>", dc2 - capC));
    if (dd2 > capD) issues.push(capIssue("Tanque de <strong>Deutério</strong>", dd2 - capD));

    if (issues.length === 0) {
      const ok = document.createElement("div");
      ok.className = "capacity-row";
      ok.textContent = "Nenhum problema de capacidade detetado.";
      capContainer.appendChild(ok);
    } else {
      issues.forEach(i => capContainer.appendChild(i));
    }
  }

  /* =========================
     Trocas recomendadas
     ========================= */
  const stTrades = document.getElementById("statusTrades");
  if (stTrades) {
    stTrades.innerHTML = "";

    const row = (label, text) => {
      const div = document.createElement("div");
      const s1 = document.createElement("span");
      const s2 = document.createElement("span");
      s1.textContent = label;
      s2.textContent = text;
      div.appendChild(s1); div.appendChild(s2);
      return div;
    };

    const lvlM3 = parseInt(document.getElementById("storLvlM").value) || 0;
    const lvlC3 = parseInt(document.getElementById("storLvlC").value) || 0;
    const lvlD3 = parseInt(document.getElementById("storLvlD").value) || 0;

    const caps = {
      metal: storageCap(lvlM3),
      crystal: storageCap(lvlC3),
      deut: storageCap(lvlD3)
    };

    const needs = {
      metal: Math.max(missM_real, 0),
      crystal: Math.max(missC_real, 0),
      deut: Math.max(missD_real, 0)
    };

    const extras = {
      metal: extraM_real,
      crystal: extraC_real,
      deut: extraD_real
    };

    const rate2 = {
      metal: 1,
      crystal: rateM / rateC,
      deut: rateM / rateD
    };

    const hasExcess =
      extras.metal > 0 || extras.crystal > 0 || extras.deut > 0;

    if (needs.metal === 0 && needs.crystal === 0 && needs.deut === 0) {
      stTrades.appendChild(row("Trocas necessárias:", "Nenhuma — tens tudo."));
    } else if (!hasExcess && needs.crystal === 0 && needs.deut === 0) {
      stTrades.appendChild(
        row(
          "Trocas necessárias:",
          "Nenhuma troca possível — apenas falta metal (cobre com produção/pacotes)."
        )
      );
    } else {
      let fromKey = "metal";
      if (hasExcess) {
        let maxExtraMSU = -Infinity;
        ["metal", "crystal", "deut"].forEach(k => {
          const e = extras[k];
          if (e > 0) {
            const msu = e * rate2[k];
            if (msu > maxExtraMSU) {
              maxExtraMSU = msu;
              fromKey = k;
            }
          }
        });
      }

      const fromName = RESOURCE_NAMES[fromKey];
      const fromNameCap = fromName.charAt(0).toUpperCase() + fromName.slice(1);

      let totalBlocks = 0;
      let totalFromNeeded = 0;
      let linesCount = 0;

      ["metal", "crystal", "deut"].forEach(destKey => {
        const need = needs[destKey];
        if (need <= 0) return;
        if (destKey === fromKey) return;

        const capDest = caps[destKey] || 0;
        const blocks = capDest > 0 ? Math.ceil(need / capDest) : 0;

        const needMSU = need * rate2[destKey];
        const fromAmount = needMSU / rate2[fromKey];

        totalBlocks += blocks;
        totalFromNeeded += fromAmount;
        linesCount++;

        const destName = RESOURCE_NAMES[destKey];
        const destNameCap = destName.charAt(0).toUpperCase() + destName.slice(1);

        stTrades.appendChild(
          row(
            `${fromNameCap} → ${destNameCap}:`,
            "Necessário: " + fmt(need) +
            " " + destName +
            (capDest > 0
              ? " (≈ " + blocks + " trocas; limite " + fmt(capDest) + "). "
              : ". ") +
            fromNameCap + ": " + fmt(Math.round(fromAmount))
          )
        );
      });

      if (linesCount === 0) {
        stTrades.appendChild(
          row(
            "Trocas necessárias:",
            "Nenhuma troca direta recomendada — a maior parte da falta é no mesmo recurso que usarias para trocar."
          )
        );
      } else {
        stTrades.appendChild(row("Trocas totais:", totalBlocks));
        stTrades.appendChild(
          row(
            `${fromNameCap} total necessário:`,
            fmt(Math.round(totalFromNeeded))
          )
        );
      }
    }
  }

  /* ============================
     Pacotes e Matéria Negra
     ============================ */
  const stPacks = document.getElementById("statusPacks");
  if (stPacks) {
    stPacks.innerHTML = "";

    const makeLinePacks = (label, val) => {
      const div = document.createElement("div");
      const s1 = document.createElement("span");
      const s2 = document.createElement("span");
      s1.textContent = label;
      s2.textContent = fmt(val);
      div.appendChild(s1); div.appendChild(s2);
      return div;
    };

    const faltaDepois = Math.max(missMSU_final, 0);

    stPacks.appendChild(makeLinePacks(
      "Custo em metal (taxa aplicada):",
      Math.round(faltaDepois)
    ));
    stPacks.appendChild(makeLinePacks(
      "Custo metal/dia equivalente (total):",
      Math.round(prodMSU)
    ));
    stPacks.appendChild(makeLinePacks(
      "Custo metal/dia equivalente (metal):",
      Math.round(metalMSUPerDay)
    ));

    const packsUsados = (faltaDepois > 0) ? packs : 0;
    const dmPacotes = packsUsados * packDM;
    stPacks.appendChild(makeLinePacks("Pacotes necessários (aprox.):", packsUsados));
    stPacks.appendChild(makeLinePacks("Matéria Negra (Pacotes):", dmPacotes));

    let dmPerTradeVal = 0;
    const dmEl = document.getElementById("tradeDM");
    if (dmEl) {
      const raw = unfmt(dmEl.value);
      if (raw !== "" && !isNaN(raw)) dmPerTradeVal = parseInt(raw, 10);
    }

    let needC2 = Math.max(missC_real, 0);
    let needD2 = Math.max(missD_real, 0);

    let lvlC2 = parseInt(document.getElementById("storLvlC").value) || 0;
    let lvlD2 = parseInt(document.getElementById("storLvlD").value) || 0;

    let capC2 = storageCap(lvlC2);
    let capD2 = storageCap(lvlD2);

    let blocksC2 = (needC2 > 0 ? Math.ceil(needC2 / capC2) : 0);
    let blocksD2 = (needD2 > 0 ? Math.ceil(needD2 / capD2) : 0);

    const autoTrades = blocksC2 + blocksD2;
    const manualTrades = manualConversionCount;
    const totalTrades = autoTrades + manualTrades;

    const dmTrades = totalTrades * dmPerTradeVal;

    stPacks.appendChild(makeLinePacks("Matéria Negra (Trocas):", dmTrades));
    stPacks.appendChild(makeLinePacks("Matéria Negra Total:", dmPacotes + dmTrades));
  }

  /* ============================
     Notas finais
     ============================ */
  const stNotes = document.getElementById("statusNotes");
  if (stNotes) {
    stNotes.innerHTML = "";

    if (missMSU_final <= 0) {
      const pill = document.createElement("div");
      pill.className = "pill";

      if (missMSU_before > 0) {
        pill.innerHTML =
          "<strong>Concluído:</strong> com as conversões de excedentes " +
          "consegues obter todos os recursos que faltavam para este nível, " +
          "sem precisares de produção extra nem pacotes.";
      } else {
        pill.innerHTML =
          "<strong>Concluído:</strong> já tens metal suficiente (taxa aplicada) para este nível.";
      }

      stNotes.appendChild(pill);
    } else {
      const pill1 = document.createElement("div");
      pill1.className = "pill danger";
      pill1.innerHTML =
        "<strong>Em falta:</strong> " + fmt(Math.round(missMSU_final)) + " metal.";
      stNotes.appendChild(pill1);

      if (diasMSU !== null) {
        const pill2 = document.createElement("div");
        pill2.className = "pill";
        pill2.innerHTML =
          "<strong>Tempo estimado:</strong> ~" + diasMSU.toFixed(1) + " dias.";
        stNotes.appendChild(pill2);
      }
    }

    if (fleetStats.totalPts > 0) {
      const pill3 = document.createElement("div");
      pill3.className = "pill";
      pill3.innerHTML =
        "<strong>Pontos perdidos com abate:</strong> " + fmt(fleetStats.totalPts) + ".";
      stNotes.appendChild(pill3);
    }
  }

  updateStorages();
}

/* ===========================
   RESET TOTAL
   =========================== */
function resetAll() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { }

  document.querySelectorAll("input").forEach(el => {
    if (el.type === "button" || el.readOnly) return;
    el.value = "";
  });

  const rM = document.getElementById("rateM");
  const rC = document.getElementById("rateC");
  const rD = document.getElementById("rateD");
  if (rM) rM.value = "3";
  if (rC) rC.value = "2";
  if (rD) rD.value = "1";

  const ally = document.getElementById("allyClass");
  if (ally) ally.value = "warrior";

  const debris = document.getElementById("debrisRate");
  if (debris) debris.value = "";

  const fleetBody = document.getElementById("fleetBody");
  if (fleetBody) fleetBody.innerHTML = "";

  [
    "statusAstro",
    "statusDebris",
    "statusTotals",
    "statusCapacity",
    "statusTrades",
    "statusPacks",
    "statusNotes"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });

  manualConversionActive = false;
  manualConversionFrom = "none";
  manualConversionTo = "none";
  manualConversionCount = 0;

  convStateActive = false;
  convTotalM = 0;
  convTotalC = 0;
  convTotalD = 0;

  const cf = document.getElementById("convertFrom");
  const ct = document.getElementById("convertTo");
  if (cf) cf.value = "none";
  if (ct) ct.value = "none";

  const sumEl = document.getElementById("convertSummary");
  if (sumEl) {
    sumEl.textContent =
      'Escolhe "de" e "para" e clica "Converter". ' +
      'Podes repetir o processo várias vezes com outras combinações.';
  }

  updateStorages();
  updateAstroCost();
  toggleDebrisSection();
}

/* ===========================
   CARREGAMENTO INICIAL
   =========================== */
document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  loadState();
  updateStorages();
  updateAstroCost();
  toggleDebrisSection();
});
