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
  try { localStorage.setItem(THEME_KEY, theme); } catch(e){}
  applyTheme(theme);
}

function loadTheme() {
  let t = "neon";
  try { t = localStorage.getItem(THEME_KEY) || "neon"; } catch(e){}
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

/* STATE SAVE/LOAD (mantiveste tudo, conforme pediste) */

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
  } catch (e) {}
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
  } catch (e) {}
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
  const lvl = parseInt(document.getElementById("astroLevel").value) || 0;
  const mField = document.getElementById("astroMetal");
  const cField = document.getElementById("astroCrystal");
  const dField = document.getElementById("astroDeut");

  if (lvl <= 0) {
    mField.value = cField.value = dField.value = "";
    return;
  }

  const baseM = 4000, baseC = 8000, baseD = 4000, mult = 1.75;
  const factor = Math.pow(mult, lvl - 1);

  const m = Math.round(baseM * factor);
  const c = Math.round(baseC * factor);
  const d = Math.round(baseD * factor);

  mField.value = fmt(m);
  cField.value = fmt(c);
  dField.value = fmt(d);

  markDirty();
}

/* ===========================
   DESTROÇOS / FROTA
   =========================== */

const SHIPS = {
  lf: { name:"Caça Ligeiro", m:3000, c:1000, d:0 },
  hf: { name:"Caça Pesado", m:6000, c:4000, d:0 },
  cr: { name:"Cruzador", m:20000, c:7000, d:2000 },
  bs: { name:"Nave de Batalha", m:45000, c:15000, d:0 },
  bc: { name:"Interceptor", m:30000, c:40000, d:15000 },
  bom:{ name:"Bombardeiro", m:50000, c:25000, d:15000 },
  des:{ name:"Destruidor", m:60000, c:50000, d:15000 },
  rip:{ name:"Estrela da Morte", m:5000000, c:4000000, d:1000000 },
  expo:{ name:"Exploradora", m:8000, c:15000, d:8000 },
  reap:{ name:"Ceifeira", m:85000, c:55000, d:20000 },
  sc: { name:"Cargueiro Pequeno", m:2000, c:2000, d:0 },
  lc: { name:"Cargueiro Grande", m:6000, c:6000, d:0 },
  col:{ name:"Nave de Colonização", m:10000, c:20000, d:10000 },
  rec:{ name:"Reciclador", m:10000, c:6000, d:2000 },
  spy:{ name:"Sonda Espionagem", m:0, c:1000, d:0 }
};

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
}

function removeShipRow(btn) {
  const tr = btn.closest("tr");
  if (tr) tr.remove();
  updateFleetStats();
  markDirty();
}

function clearFleet() {
  document.getElementById("fleetBody").innerHTML = "";
  updateFleetStats();
  markDirty();
}

function updateFleetStats() {
  const tbody = document.getElementById("fleetBody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
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
    const dmCell  = tr.querySelector(".colDM");
    const dcCell  = tr.querySelector(".colDC");
    const ddCell  = tr.querySelector(".colDD");

    if (qty <= 0) {
      ptsCell.textContent = dmCell.textContent =
      dcCell.textContent = ddCell.textContent = "";
      return;
    }

    const ptsPerUnit = (ship.m + ship.c + ship.d) / 1000;
    const pts = ptsPerUnit * qty;

    const dm  = Math.floor(ship.m * qty * debrisRate);
    const dc  = Math.floor(ship.c * qty * debrisRate);
    const dd  = Math.floor(ship.d * qty * debrisRate);

    ptsCell.textContent = fmt(Math.round(pts));
    dmCell.textContent  = fmt(dm);
    dcCell.textContent  = fmt(dc);
    ddCell.textContent  = fmt(dd);

    sumPts += pts;
    sumDM  += dm;
    sumDC  += dc;
    sumDD  += dd;
  });

  document.getElementById("sumPts").textContent = sumPts ? fmt(Math.round(sumPts)) : "";
  document.getElementById("sumDM").textContent  = sumDM  ? fmt(sumDM)  : "";
  document.getElementById("sumDC").textContent  = sumDC  ? fmt(sumDC)  : "";
  document.getElementById("sumDD").textContent  = sumDD  ? fmt(sumDD)  : "";

  return { totalPts: Math.round(sumPts), dm: sumDM, dc: sumDC, dd: sumDD };
}

/* ===========================
   CÁLCULO PRINCIPAL
   =========================== */
function calcular() {

  const astroM = valIntById("astroMetal");
  const astroC = valIntById("astroCrystal");
  const astroD = valIntById("astroDeut");

  const curM = valIntById("curMetal");
  const curC = valIntById("curCrystal");
  const curD = valIntById("curDeut");

  const prodM = valIntById("prodMetal");
  const prodC = valIntById("prodCrystal");
  const prodD = valIntById("prodDeut");

  const rateM = Math.min(3, valFloatById("rateM",3));
  const rateC = Math.min(2, valFloatById("rateC",2));
  const rateD = Math.min(1, valFloatById("rateD",1));

  const fleetStats = updateFleetStats();
  const dm = fleetStats.dm, dc = fleetStats.dc, dd = fleetStats.dd;

  const totalM = curM + dm;
  const totalC = curC + dc;
  const totalD = curD + dd;

  const faltaM = astroM - totalM;
  const faltaC = astroC - totalC;
  const faltaD = astroD - totalD;

  const missM = Math.max(faltaM, 0);
  const missC = Math.max(faltaC, 0);
  const missD = Math.max(faltaD, 0);

  const extraM = Math.max(-faltaM, 0);
  const extraC = Math.max(-faltaC, 0);
  const extraD = Math.max(-faltaD, 0);

  const mFactor = 1;
  const cFactor = rateM / rateC;
  const dFactor = rateM / rateD;

  const missMSU = missM*mFactor + missC*cFactor + missD*dFactor;

  const msuFromM = extraM*mFactor;
  const msuFromC = extraC*cFactor;
  const msuFromD = extraD*dFactor;
  const totalExtraMSU = msuFromM + msuFromC + msuFromD;

  const msuAfterTrades = Math.max(missMSU - totalExtraMSU, 0);

  const prodMSU = prodM*mFactor + prodC*cFactor + prodD*dFactor;
  const metalMSUPerDay = prodM * mFactor;

  let diasMSU = null;
  if (missMSU > 0 && prodMSU > 0) {
    diasMSU = missMSU / prodMSU;
  }

  let packs = 0;
  if (missMSU > 0 && metalMSUPerDay > 0) {
    packs = Math.ceil(missMSU / metalMSUPerDay);
  }
  const packDM = valIntById("packDM");
  const dmTotal = packs * packDM;

  document.getElementById("kpiMissMSU").textContent = fmt(Math.round(missMSU));
  document.getElementById("kpiProdMSU").textContent = fmt(Math.round(prodMSU));
  document.getElementById("kpiPts").textContent = fmt(fleetStats.totalPts);

  const kDays = document.getElementById("kpiDays");
  if (diasMSU !== null) {
    kDays.textContent = "~ " + diasMSU.toFixed(1) + " dias";
  } else {
    kDays.textContent = "0";```

---

**⚠️ AQUI ESTÁ A CORREÇÃO IMPORTANTE — BLOCO DE CAPACIDADE**

```javascript
/* ================================
   Verificação de capacidade (CORRIGIDA)
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

  const lvlM = parseInt(document.getElementById("storLvlM").value) || 0;
  const lvlC = parseInt(document.getElementById("storLvlC").value) || 0;
  const lvlD = parseInt(document.getElementById("storLvlD").value) || 0;

  const capM = storageCap(lvlM);
  const capC = storageCap(lvlC);
  const capD = storageCap(lvlD);

  // DESTROÇOS (únicos dados que interessam!)
  const dm2 = dm;
  const dc2 = dc;
  const dd2 = dd;

  // CORRIGIDO: NÃO verificar recursos atuais!
  // Antes:
  // if (curM2 > capM) ...
  // Agora: apenas debris

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
