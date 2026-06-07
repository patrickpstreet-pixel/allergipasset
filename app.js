/* =======================================================
   ALLERGIPASSET v2.0 – app.js
   Multi-profil · Modes · QR-deling · Medicinpåmindelser
   ======================================================= */

'use strict';

/* -------------------------------------------------------
   KONSTANTER
   ------------------------------------------------------- */

const DEFAULT_EMERGENCY =
`Ved mistanke om allergisk reaktion:
1. Stop mad eller kontakt med allergenet med det samme.
2. Barnet må ikke være alene.
3. Kontakt forælder/værge med det samme.
4. Giv akutmedicin hvis barnets plan siger det.
5. Ring 112 ved vejrtrækningsbesvær, hævelse i ansigt/hals, sløvhed, kraftig reaktion eller hurtig forværring.`;

const STORAGE_KEY_V2 = 'allergyPassportV2';
const STORAGE_KEY_V1 = 'allergyPassportData'; // til migration

const FIELD_IDS = [
  'childName', 'childAge', 'allergies', 'severity',
  'exposure', 'symptoms', 'safeFood',
  'medicine', 'medicineExpiry', 'medicineLocation',
  'contact1Name', 'contact1Phone',
  'contact2Name', 'contact2Phone',
  'emergencyInstructions', 'notes'
];

const SEV_LABELS = {
  mild:        'Mild',
  moderat:     'Moderat',
  alvorlig:    'Alvorlig',
  livstruende: '⚠️ Livstruende'
};

/* -------------------------------------------------------
   STATE
   ------------------------------------------------------- */

let activeProfileId = null;
let profiles        = {};  // { [id]: { id, data: { fieldId: value } } }
let currentMode     = 'standard';
let isViewMode      = false;
let qrUpdateTimer   = null;

/* -------------------------------------------------------
   HELPERS
   ------------------------------------------------------- */

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/* -------------------------------------------------------
   MEDICIN UDLØB
   ------------------------------------------------------- */

function expiryStatus(dateStr) {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
  if (days < 0)   return { text: `Udløbet for ${Math.abs(days)} dag${Math.abs(days) === 1 ? '' : 'e'} siden!`, cls: 'expiry--expired' };
  if (days <= 30) return { text: `⚠️ Udløber om ${days} dag${days === 1 ? '' : 'e'} – skift nu!`, cls: 'expiry--critical' };
  if (days <= 90) return { text: `Udløber om ${days} dage`, cls: 'expiry--warning' };
  return { text: `✓ Gyldig til ${new Date(dateStr).toLocaleDateString('da-DK')}`, cls: 'expiry--ok' };
}

function updateExpiryWidget() {
  const dateStr = val('medicineExpiry');
  const warningEl = document.getElementById('expiry-warning');
  if (!warningEl) return;

  const status = expiryStatus(dateStr);
  if (status) {
    warningEl.textContent = status.text;
    warningEl.className = `expiry-warning visible ${status.cls}`;
  } else {
    warningEl.className = 'expiry-warning';
  }
}

/* -------------------------------------------------------
   STORAGE – gem / indlæs / migrer fra v1
   ------------------------------------------------------- */

function saveStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify({ activeProfileId, profiles }));
  } catch (e) {
    showToast('⚠️ Kunne ikke gemme – tjek browserindstillinger', '#B45309');
  }
}

function loadStorage() {
  const raw = localStorage.getItem(STORAGE_KEY_V2);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      profiles        = parsed.profiles       || {};
      activeProfileId = parsed.activeProfileId || null;
      return true;
    } catch { /* ignorér */ }
  }
  return false;
}

// Migrer v1 data til v2 som første profil
function migrateV1() {
  const raw = localStorage.getItem(STORAGE_KEY_V1);
  if (!raw) return false;
  try {
    const oldData = JSON.parse(raw);
    const id = uid();
    profiles[id] = { id, data: { ...emptyData(), ...oldData } };
    activeProfileId = id;
    saveStorage();
    return true;
  } catch { return false; }
}

function emptyData() {
  const d = {};
  FIELD_IDS.forEach(id => { d[id] = id === 'emergencyInstructions' ? DEFAULT_EMERGENCY : ''; });
  return d;
}

/* -------------------------------------------------------
   PROFIL MANAGEMENT
   ------------------------------------------------------- */

function createProfile(name) {
  const id   = uid();
  const data = emptyData();
  data.childName = name || '';
  profiles[id] = { id, data };
  activeProfileId = id;
  saveStorage();
  fillForm(profiles[id].data);
  renderProfileBar();
  updatePreview();
}

function switchProfile(id) {
  if (!profiles[id]) return;
  // Gem nuværende formular inden skift
  if (activeProfileId && profiles[activeProfileId]) {
    profiles[activeProfileId].data = readForm();
  }
  activeProfileId = id;
  saveStorage();
  fillForm(profiles[id].data);
  renderProfileBar();
  updatePreview();
}

function deleteProfile(id) {
  if (Object.keys(profiles).length <= 1) {
    showToast('Du kan ikke slette den eneste profil.', '#B45309');
    return;
  }
  const name = profiles[id]?.data?.childName || 'denne profil';
  if (!confirm(`Vil du slette profilen for "${name}"?`)) return;
  delete profiles[id];
  if (activeProfileId === id) {
    activeProfileId = Object.keys(profiles)[0];
    fillForm(profiles[activeProfileId].data);
  }
  saveStorage();
  renderProfileBar();
  updatePreview();
}

// Returnér kortnavn til profil-pill
function profileDisplayName(profile) {
  const name = (profile.data.childName || '').trim();
  if (!name) return 'Nyt barn';
  return name.split(' ')[0]; // kun fornavn i pill
}

/* -------------------------------------------------------
   PROFIL-BAR RENDERING
   ------------------------------------------------------- */

function renderProfileBar() {
  const bar = document.getElementById('profile-bar');
  if (!bar) return;

  const pills = Object.values(profiles).map(p => {
    const active = p.id === activeProfileId ? 'active' : '';
    const dname  = escHtml(profileDisplayName(p));
    return `
      <button class="profile-pill ${active}" data-profile-id="${p.id}" aria-pressed="${p.id === activeProfileId}">
        ${dname}
        <span class="profile-pill-delete" data-delete-id="${p.id}" title="Slet profil" aria-label="Slet profil for ${dname}">✕</span>
      </button>`;
  }).join('');

  bar.innerHTML = pills + `
    <button class="profile-add-btn" id="btn-add-profile" aria-label="Tilføj ny profil">
      + Tilføj barn
    </button>`;

  // Klik på profil-pill (men ikke delete-knap)
  bar.querySelectorAll('.profile-pill').forEach(btn => {
    btn.addEventListener('click', e => {
      if (e.target.closest('.profile-pill-delete')) return;
      switchProfile(btn.dataset.profileId);
    });
  });

  // Klik på delete
  bar.querySelectorAll('.profile-pill-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteProfile(btn.dataset.deleteId);
    });
  });

  // Tilføj nyt barn
  document.getElementById('btn-add-profile')?.addEventListener('click', () => {
    const name = prompt('Barnets navn:');
    if (name === null) return; // annulleret
    createProfile(name.trim());
    showToast(`✓ Profil oprettet for ${name || 'nyt barn'}`, '#16A34A');
  });
}

/* -------------------------------------------------------
   FORM ↔ DATA BINDING
   ------------------------------------------------------- */

function readForm() {
  const data = {};
  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    data[id] = el ? el.value : '';
  });
  return data;
}

function fillForm(data) {
  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = data[id] !== undefined ? data[id] : (id === 'emergencyInstructions' ? DEFAULT_EMERGENCY : '');
  });
  updateExpiryWidget();
}

// Kaldes ved hvert tastetryk: gem til aktiv profil + opdater preview
function onFieldChange() {
  if (activeProfileId && profiles[activeProfileId]) {
    profiles[activeProfileId].data = readForm();
    // Opdater profil-pill navn live
    const pill = document.querySelector(`.profile-pill[data-profile-id="${activeProfileId}"] `);
    if (pill) {
      const nameNode = pill.firstChild;
      if (nameNode && nameNode.nodeType === 3) {
        nameNode.textContent = profileDisplayName(profiles[activeProfileId]);
      }
    }
  }
  updateExpiryWidget();
  updatePreview();
  // Debounce QR-generering (tung operation)
  clearTimeout(qrUpdateTimer);
  qrUpdateTimer = setTimeout(updateQR, 600);
}

/* -------------------------------------------------------
   PASSPORT PREVIEW RENDERING
   ------------------------------------------------------- */

function updatePreview() {
  const card = document.getElementById('passport-card');
  if (!card) return;

  const data = isViewMode
    ? (window._viewData || {})
    : (profiles[activeProfileId]?.data || emptyData());

  card.innerHTML = renderPassport(currentMode, data);

  // Print-dato
  const disclaimer = card.querySelector('.passport-disclaimer');
  if (disclaimer) {
    disclaimer.setAttribute('data-print-date',
      new Date().toLocaleDateString('da-DK', { day:'2-digit', month:'long', year:'numeric' }));
  }
}

function renderPassport(mode, d) {
  switch (mode) {
    case 'birthday':    return renderBirthdayMode(d);
    case 'school':      return renderSchoolMode(d);
    case 'restaurant':  return renderRestaurantMode(d);
    default:            return renderStandardMode(d);
  }
}

/* --- Hjælpefunktioner til rendering --- */

function sevBadgeHtml(severity) {
  if (!severity) return `<span class="sev-badge sev--empty">Alvorlighed ikke angivet</span>`;
  return `<span class="sev-badge sev--${severity}">${escHtml(SEV_LABELS[severity] || severity)}</span>`;
}

function contactCardsHtml(c1Name, c1Phone, c2Name, c2Phone) {
  const contacts = [];
  if (c1Name || c1Phone) contacts.push({ name: c1Name, phone: c1Phone });
  if (c2Name || c2Phone) contacts.push({ name: c2Name, phone: c2Phone });

  if (!contacts.length) {
    return `<div class="prev-contact-grid"><span class="prev-contact-empty">Ingen kontakter angivet</span></div>`;
  }
  const cards = contacts.map(c => `
    <div class="prev-contact-card">
      <span class="prev-contact-name">${escHtml(c.name || 'Kontakt')}</span>
      ${c.phone
        ? `<a href="tel:${escHtml(c.phone)}" class="prev-contact-phone">${escHtml(c.phone)}</a>`
        : '<span class="prev-contact-phone" style="opacity:.4">–</span>'}
    </div>`).join('');
  return `<div class="prev-contact-grid">${cards}</div>`;
}

function expiryBadgeHtml(dateStr) {
  const s = expiryStatus(dateStr);
  if (!s) return '';
  return `<div class="ps-expiry ${s.cls}">${escHtml(s.text)}</div>`;
}

function disclaimerHtml() {
  return `<div class="passport-disclaimer">
    Allergipasset erstatter ikke lægefaglig rådgivning. Følg altid barnets officielle
    behandlingsplan og kontakt læge/112 ved alvorlige symptomer.
  </div>`;
}

/* --- STANDARD MODE --- */
function renderStandardMode(d) {
  return `
    <header class="passport-top">
      <div class="passport-logo-line">🛡️ ALLERGIPAS</div>
      <div class="passport-name-row">
        <span class="passport-name">${escHtml(d.childName || 'Barnets navn')}</span>
        ${d.childAge ? `<span class="passport-age">${escHtml(d.childAge)}</span>` : ''}
      </div>
      ${sevBadgeHtml(d.severity)}
    </header>
    <div class="passport-body">
      <div class="ps ps--allergy">
        <div class="ps-label">⚠️ Allergi</div>
        <div class="ps-content">${escHtml(d.allergies || '–')}</div>
      </div>
      <div class="ps">
        <div class="ps-label">🔬 Spor / kontakt / luftbåren reaktion</div>
        <div class="ps-content">${escHtml(d.exposure || '–')}</div>
      </div>
      <div class="ps">
        <div class="ps-label">🩺 Symptomer</div>
        <div class="ps-content">${escHtml(d.symptoms || '–')}</div>
      </div>
      <div class="ps ps--emergency">
        <div class="ps-label">🚨 Nødinstruktioner</div>
        <div class="ps-content">${escHtml(d.emergencyInstructions || '–')}</div>
      </div>
      <div class="ps ps--medicine">
        <div class="ps-label">💊 Medicin</div>
        <div class="ps-content">${escHtml(d.medicine || '–')}</div>
        ${d.medicineLocation ? `<div class="ps-med-loc"><span class="ps-med-loc-label">📍 Ligger i:</span>${escHtml(d.medicineLocation)}</div>` : ''}
        ${expiryBadgeHtml(d.medicineExpiry)}
      </div>
      <div class="ps ps--safe">
        <div class="ps-label">✅ Sikker mad & snacks</div>
        <div class="ps-content">${escHtml(d.safeFood || '–')}</div>
      </div>
      <div class="ps">
        <div class="ps-label">📞 Kontakt straks ved reaktion</div>
        ${contactCardsHtml(d.contact1Name, d.contact1Phone, d.contact2Name, d.contact2Phone)}
      </div>
      ${d.notes ? `<div class="ps"><div class="ps-label">📝 Ekstra noter</div><div class="ps-content">${escHtml(d.notes)}</div></div>` : ''}
      ${disclaimerHtml()}
    </div>`;
}

/* --- BIRTHDAY MODE --- */
function renderBirthdayMode(d) {
  const name     = escHtml(d.childName || 'Barnet');
  const allergen = escHtml(d.allergies || '–');
  return `
    <header class="passport-top passport-top--birthday">
      <div class="passport-logo-line">🎂 FØDSELSDAGSKORT</div>
      <div class="passport-name-row">
        <span class="passport-name">${name}</span>
        ${d.childAge ? `<span class="passport-age">${escHtml(d.childAge)}</span>` : ''}
      </div>
      <p class="birthday-intro-text">kommer til din fødselsdag! Her er hvad der er vigtigt at vide.</p>
    </header>
    <div class="passport-body">
      <div class="ps ps--allergy">
        <div class="ps-label">❌ MÅ IKKE spise</div>
        <div class="ps-content ps-content--lg">${allergen}</div>
        ${d.exposure ? `<div class="ps-content" style="margin-top:6px;font-size:.8rem;color:#92400E">Heller ikke spor, kontakt eller luftbåren eksponering af: ${escHtml(d.exposure)}</div>` : ''}
      </div>
      <div class="ps ps--safe">
        <div class="ps-label">✅ MÅ GERNE spise</div>
        <div class="ps-content">${escHtml(d.safeFood || 'Spørg barnets forældre inden du giver mad.')}</div>
      </div>
      <div class="ps ps--emergency">
        <div class="ps-label">🚨 Hvis noget sker – gør dette:</div>
        <div class="ps-content" style="font-size:.8125rem">
          Stop al mad. Hold barnet under opsyn. Ring straks til forældrene.
          ${d.medicine ? `<br><strong>Medicin: ${escHtml(d.medicine)}</strong>` : ''}
          ${d.medicineLocation ? `<br>Medicin ligger: ${escHtml(d.medicineLocation)}` : ''}
          <br>Ring 112 ved vejrtrækningsbesvær, hævelse eller kraftig reaktion.
        </div>
      </div>
      <div class="ps">
        <div class="ps-label">📞 Ring straks til forælder</div>
        ${contactCardsHtml(d.contact1Name, d.contact1Phone, d.contact2Name, d.contact2Phone)}
      </div>
      ${d.notes ? `<div class="ps"><div class="ps-label">📝 Ekstra</div><div class="ps-content">${escHtml(d.notes)}</div></div>` : ''}
      ${disclaimerHtml()}
    </div>`;
}

/* --- SCHOOL / SFO MODE --- */
function renderSchoolMode(d) {
  return `
    <header class="passport-top passport-top--school">
      <div class="passport-logo-line">🏫 ALLERGIKORT – PERSONALE</div>
      <div class="passport-name-row">
        <span class="passport-name">${escHtml(d.childName || 'Barnets navn')}</span>
        ${d.childAge ? `<span class="passport-age">${escHtml(d.childAge)}</span>` : ''}
      </div>
      ${sevBadgeHtml(d.severity)}
    </header>
    <div class="passport-body">
      <div class="ps ps--allergy">
        <div class="ps-label">⚠️ Allergi</div>
        <div class="ps-content ps-content--lg">${escHtml(d.allergies || '–')}</div>
        ${d.exposure ? `<div class="ps-content" style="margin-top:5px;font-size:.8rem">Reaktion på: ${escHtml(d.exposure)}</div>` : ''}
      </div>
      <div class="ps ps--emergency">
        <div class="ps-label">🚨 Handlingsplan ved reaktion</div>
        <div class="ps-content">${escHtml(d.emergencyInstructions || '–')}</div>
      </div>
      <div class="ps ps--medicine">
        <div class="ps-label">💊 Medicin – find den straks</div>
        <div class="ps-content" style="font-weight:600">${escHtml(d.medicine || '–')}</div>
        ${d.medicineLocation ? `<div class="ps-med-loc"><span class="ps-med-loc-label">📍 Ligger i:</span>${escHtml(d.medicineLocation)}</div>` : ''}
        ${expiryBadgeHtml(d.medicineExpiry)}
      </div>
      <div class="ps ps--safe">
        <div class="ps-label">✅ Sikker mad</div>
        <div class="ps-content">${escHtml(d.safeFood || '–')}</div>
      </div>
      <div class="ps">
        <div class="ps-label">📞 Kontakt forældre straks</div>
        ${contactCardsHtml(d.contact1Name, d.contact1Phone, d.contact2Name, d.contact2Phone)}
      </div>
      ${d.notes ? `<div class="ps"><div class="ps-label">📝 Ekstra</div><div class="ps-content">${escHtml(d.notes)}</div></div>` : ''}
      ${disclaimerHtml()}
    </div>`;
}

/* --- RESTAURANT MODE --- */
function renderRestaurantMode(d) {
  const isSerious = d.severity === 'alvorlig' || d.severity === 'livstruende';
  return `
    <header class="passport-top passport-top--restaurant">
      <div class="passport-logo-line">🍽️ ALLERGIINFORMATION – KØKKEN</div>
      <div class="passport-name-row">
        <span class="passport-name">${escHtml(d.childName || 'Gæst')}</span>
        ${d.childAge ? `<span class="passport-age">${escHtml(d.childAge)}</span>` : ''}
      </div>
      ${sevBadgeHtml(d.severity)}
    </header>
    <div class="passport-body">
      <div class="ps ps--allergy">
        <div class="ps-label">⚠️ Kan ikke spise</div>
        <div class="ps-content ps-content--xl">${escHtml(d.allergies || '–')}</div>
      </div>
      ${d.exposure ? `
      <div class="ps" style="background:#FEF2F2;border-left:4px solid #D62828">
        <div class="ps-label" style="color:#C1121F">🔬 Reagerer på spor / kontakt / luftbåren eksponering</div>
        <div class="ps-content">${escHtml(d.exposure)}</div>
      </div>` : ''}
      <div class="ps">
        <div class="ps-label">📋 Anmodning til køkkenet</div>
        <div class="restaurant-request">
          ${isSerious ? '⚠️ <strong>Krydsforurening accepteres IKKE.</strong><br>' : ''}
          Venligst bekræft allergenindhold i alle retter og undgå kontakt med ovenstående allergener.
        </div>
      </div>
      ${d.safeFood ? `
      <div class="ps ps--safe">
        <div class="ps-label">✅ Gæsten kan spise</div>
        <div class="ps-content">${escHtml(d.safeFood)}</div>
      </div>` : ''}
      ${(d.contact1Name || d.contact1Phone) ? `
      <div class="ps">
        <div class="ps-label">📞 Spørgsmål? Kontakt</div>
        ${contactCardsHtml(d.contact1Name, d.contact1Phone, d.contact2Name, d.contact2Phone)}
      </div>` : ''}
      ${disclaimerHtml()}
    </div>`;
}

/* -------------------------------------------------------
   QR-KODE & DELING
   ------------------------------------------------------- */

function buildShareUrl(data) {
  try {
    // Kun ikke-tomme felter – og spring standard-nødinstruktioner over for at holde URL kort
    const compact = {};
    Object.entries(data).forEach(([k, v]) => {
      const trimmed = typeof v === 'string' ? v.trim() : v;
      if (!trimmed) return;
      if (k === 'emergencyInstructions' && trimmed === DEFAULT_EMERGENCY.trim()) return;
      compact[k] = trimmed;
    });

    const encoded = btoa(encodeURIComponent(JSON.stringify(compact)));

    // Byg base-URL – virker både lokalt (file://) og på GitHub Pages
    let base;
    if (location.protocol === 'file:') {
      // Lokal brug: opbyg sti fra href
      base = location.href.split('?')[0].replace(/\/[^/]*$/, '/');
    } else {
      base = location.origin + location.pathname.replace(/\/[^/]*$/, '/');
    }

    return `${base}index.html?view=${encoded}`;
  } catch (e) {
    console.warn('buildShareUrl fejl:', e);
    return '';
  }
}

async function updateQR() {
  const imgEl = document.getElementById('qr-img');
  if (!imgEl) return;

  const data = profiles[activeProfileId]?.data || emptyData();
  const url  = buildShareUrl(data);

  // Gem URL til kopiér-knap
  imgEl.dataset.shareUrl = url;

  // Vis placeholder hvis bibliotek ikke er indlæst endnu
  if (typeof QRCode === 'undefined') {
    imgEl.src = '';
    imgEl.alt = 'Kopiér link nedenfor';
    imgEl.classList.add('qr-loading');
    return;
  }

  imgEl.classList.remove('qr-loading');

  try {
    const dataUrl = await QRCode.toDataURL(url || 'https://allergipasset.dk', {
      width: 200,
      margin: 1,
      color: { dark: '#1A2B4A', light: '#FFFFFF' },
      errorCorrectionLevel: 'L' // lavest = mindste QR = bedst scanbar ved 100px
    });
    imgEl.src    = dataUrl;
    imgEl.alt    = 'QR-kode til allergipas';
  } catch (err) {
    console.warn('QR generering fejlede:', err);
    imgEl.src = '';
    imgEl.alt = 'Brug kopiér link';
    imgEl.classList.add('qr-loading');
  }
}

function copyShareLink() {
  const imgEl = document.getElementById('qr-img');
  const url   = imgEl?.dataset.shareUrl || buildShareUrl(profiles[activeProfileId]?.data || {});

  if (!url) {
    showToast('⚠️ Intet link at kopiere endnu', '#B45309');
    return;
  }

  navigator.clipboard.writeText(url)
    .then(() => showToast('📎 Link kopieret til udklipsholder', '#2C4A7C'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.cssText = 'position:fixed;opacity:0;top:-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('📎 Link kopieret', '#2C4A7C'); }
      catch { showToast('⚠️ Kopiering mislykkedes', '#B45309'); }
      document.body.removeChild(ta);
    });
}

/* -------------------------------------------------------
   KOPIÉR DELINGSTEKST
   ------------------------------------------------------- */

function copyShareText() {
  const d = profiles[activeProfileId]?.data || emptyData();
  const sevMap = { mild: 'Mild', moderat: 'Moderat', alvorlig: 'ALVORLIG', livstruende: '⚠️ LIVSTRUENDE' };

  const lines = [
    '======== ALLERGIPAS ========',
    d.childName ? `Navn: ${d.childName}${d.childAge ? ', ' + d.childAge : ''}` : null,
    d.severity  ? `Alvorlighed: ${sevMap[d.severity] || d.severity}` : null,
    d.allergies ? `Allergi: ${d.allergies}` : null,
    d.exposure  ? `Eksponering: ${d.exposure}` : null,
    d.symptoms  ? `Symptomer: ${d.symptoms}` : null,
    '',
    '--- NØDINSTRUKTIONER ---',
    d.emergencyInstructions || null,
    '',
    d.medicine         ? `Medicin: ${d.medicine}` : null,
    d.medicineLocation ? `Medicin ligger: ${d.medicineLocation}` : null,
    d.safeFood         ? `Sikker mad: ${d.safeFood}` : null,
    '',
    '--- KONTAKT ---',
    (d.contact1Name || d.contact1Phone) ? `${d.contact1Name || 'Kontakt 1'}: ${d.contact1Phone || '–'}` : null,
    (d.contact2Name || d.contact2Phone) ? `${d.contact2Name || 'Kontakt 2'}: ${d.contact2Phone || '–'}` : null,
    d.notes ? `\nEkstra: ${d.notes}` : null,
    '',
    'Allergipasset erstatter ikke lægefaglig rådgivning.',
    '============================',
  ].filter(l => l !== null).join('\n').replace(/\n{3,}/g, '\n\n').trim();

  navigator.clipboard.writeText(lines)
    .then(() => showToast('📋 Tekst kopieret til udklipsholder', '#2C4A7C'))
    .catch(() => showToast('⚠️ Kopiering mislykkedes', '#B45309'));
}

/* -------------------------------------------------------
   GEM / RYDNING
   ------------------------------------------------------- */

function saveData() {
  if (activeProfileId && profiles[activeProfileId]) {
    profiles[activeProfileId].data = readForm();
  }
  saveStorage();
  showToast('✓ Allergipas gemt', '#16A34A');
}

function clearForm() {
  const name = profiles[activeProfileId]?.data?.childName || 'dette allergipas';
  if (!confirm(`Er du sikker på, at du vil rydde formularen for "${name}"?\nAlt data på denne profil slettes.`)) return;
  const freshData = emptyData();
  if (activeProfileId && profiles[activeProfileId]) {
    profiles[activeProfileId].data = freshData;
  }
  fillForm(freshData);
  saveStorage();
  updatePreview();
  updateQR();
  showToast('Formular ryddet', '#64748B');
}

/* -------------------------------------------------------
   VIEW-MODE – åbn delt pas fra URL (?view=)
   ------------------------------------------------------- */

function loadFromShareUrl() {
  const params  = new URLSearchParams(location.search);
  const encoded = params.get('view');
  if (!encoded) return false;

  try {
    const data = JSON.parse(decodeURIComponent(atob(encoded)));
    window._viewData = data;
    return true;
  } catch {
    return false;
  }
}

function enterViewMode() {
  isViewMode = true;
  document.body.classList.add('view-mode');
  document.getElementById('view-banner')?.classList.remove('hidden');
  document.getElementById('site-footer')?.classList.remove('hidden');
  // Skjul del-knapper i view-mode
  document.getElementById('share-panel')?.classList.add('hidden');
  document.getElementById('live-badge')?.classList.add('hidden');
  updatePreview();
}

/* -------------------------------------------------------
   TOAST
   ------------------------------------------------------- */

let _toastTimer = null;
function showToast(msg, color = '#16A34A') {
  const el = document.getElementById('save-toast');
  if (!el) return;
  el.textContent = msg;
  el.style.background = color;
  el.classList.add('visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('visible'), 3000);
}

/* -------------------------------------------------------
   MODE TABS
   ------------------------------------------------------- */

function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-tab').forEach(btn => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active);
  });
  updatePreview();
}

/* -------------------------------------------------------
   INITIALISERING
   ------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Tjek for view-mode (delt link)
  if (loadFromShareUrl()) {
    enterViewMode();
    return; // resten af init er unødvendig i view-mode
  }

  // 2. Indlæs data (eller migrer fra v1, eller opret tomt)
  const loaded = loadStorage();
  if (!loaded || Object.keys(profiles).length === 0) {
    if (!migrateV1()) {
      // Opret første profil
      createProfile('');
    }
  }

  // Sørg for aktiv profil peger på noget gyldigt
  if (!activeProfileId || !profiles[activeProfileId]) {
    activeProfileId = Object.keys(profiles)[0];
  }

  // 3. Udfyld formular
  fillForm(profiles[activeProfileId].data);

  // 4. Render profil-bar
  renderProfileBar();

  // 5. Første preview + QR
  updatePreview();
  updateQR();

  // 6. Live-opdatering ved input
  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input',  onFieldChange);
    el.addEventListener('change', onFieldChange);
  });

  // 7. Mode tabs
  document.querySelectorAll('.mode-tab').forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
  });

  // 8. Knapper – formular
  document.getElementById('btn-save')?.addEventListener('click',  saveData);
  document.getElementById('btn-copy')?.addEventListener('click',  copyShareText);
  document.getElementById('btn-print')?.addEventListener('click', () => window.print());
  document.getElementById('btn-clear')?.addEventListener('click', clearForm);

  // 9. Knapper – header
  document.getElementById('btn-header-save')?.addEventListener('click',  saveData);
  document.getElementById('btn-header-share')?.addEventListener('click', copyShareLink);

  // 10. Del-link
  document.getElementById('btn-copy-link')?.addEventListener('click', copyShareLink);

});

// Generer QR igen når siden og CDN-scriptet er fuldt indlæst
// (QRCode biblioteket kan godt ankomme efter DOMContentLoaded)
window.addEventListener('load', () => {
  if (!isViewMode) updateQR();
});

/* -------------------------------------------------------
   TODO – fremtidige features:

   [ ] Firebase Firestore: kortere del-URL + cloud sync
   [ ] QR-download som billede (canvas.toBlob)
   [ ] PDF-eksport (html2pdf.js)
   [ ] Rejsemode: oversæt til EN / DE / ES
   [ ] Madpakke-safe liste (egne mærker/produkter)
   [ ] Push-notifikation om medicinudløb (Service Worker)
   [ ] Multiple kontaktpersoner (dynamisk tilføjelse)
   [ ] Profil-eksport / import som JSON-fil
   ------------------------------------------------------- */
