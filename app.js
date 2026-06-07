/* =======================================================
   ALLERGIPASSET – app.js
   Vanilla JS: live preview, localStorage, print, copy
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

const STORAGE_KEY = 'allergyPassportData';

// Alle felt-ID'er der skal gemmes og indlæses
const FIELD_IDS = [
  'childName', 'childAge', 'allergies', 'severity',
  'exposure', 'symptoms', 'safeFood',
  'medicine', 'medicineLocation',
  'contact1Name', 'contact1Phone',
  'contact2Name', 'contact2Phone',
  'emergencyInstructions', 'notes'
];

const SEVERITY_LABELS = {
  mild:         'Mild',
  moderat:      'Moderat',
  alvorlig:     'Alvorlig',
  livstruende:  '⚠️ Livstruende'
};

/* -------------------------------------------------------
   HJÆLPEFUNKTIONER
   ------------------------------------------------------- */

// Sikker HTML-escaping (bruges ved innerHTML-indsættelse)
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// Hent et enkelt felt-ID's trimmede værdi
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/* -------------------------------------------------------
   LOCALSTORAGE – gem / indlæs / ryd
   ------------------------------------------------------- */

function saveData() {
  const data = {};
  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) data[id] = el.value;
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    showToast('✓ Allergipas gemt', '#16A34A');
  } catch (e) {
    showToast('⚠️ Kunne ikke gemme – kontrollér browserindstillinger', '#B45309');
  }
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    FIELD_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && data[id] !== undefined) el.value = data[id];
    });
  } catch (e) {
    console.warn('Allergipasset: kunne ikke indlæse gemt data:', e);
  }
}

function clearData() {
  const confirmed = window.confirm(
    'Er du sikker på, at du vil rydde formularen?\nAlt gemt data slettes permanent.'
  );
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);

  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === 'severity') {
      el.value = '';
    } else if (id === 'emergencyInstructions') {
      el.value = DEFAULT_EMERGENCY;
    } else {
      el.value = '';
    }
  });

  updatePreview();
  showToast('Formular ryddet', '#64748B');
}

/* -------------------------------------------------------
   LIVE PREVIEW – opdateres ved hvert tastaturtryk
   ------------------------------------------------------- */

function updatePreview() {
  const name              = val('childName');
  const age               = val('childAge');
  const allergies         = val('allergies');
  const severity          = val('severity');
  const exposure          = val('exposure');
  const symptoms          = val('symptoms');
  const safeFood          = val('safeFood');
  const medicine          = val('medicine');
  const medLoc            = val('medicineLocation');
  const c1Name            = val('contact1Name');
  const c1Phone           = val('contact1Phone');
  const c2Name            = val('contact2Name');
  const c2Phone           = val('contact2Phone');
  const emergency         = val('emergencyInstructions');
  const notes             = val('notes');

  // --- Navn & alder ---
  document.getElementById('prev-name').textContent = name || 'Barnets navn';
  document.getElementById('prev-age').textContent  = age || '';

  // --- Alvorlighedsbadge ---
  const sevEl = document.getElementById('prev-severity');
  sevEl.className = 'sev-badge';
  if (severity && SEVERITY_LABELS[severity]) {
    sevEl.textContent = SEVERITY_LABELS[severity];
    sevEl.classList.add('sev--' + severity);
  } else {
    sevEl.textContent = 'Alvorlighed ikke angivet';
    sevEl.classList.add('sev--empty');
  }

  // --- Simpelt tekstindhold ---
  document.getElementById('prev-allergies').textContent = allergies || '–';
  document.getElementById('prev-exposure').textContent  = exposure  || '–';
  document.getElementById('prev-symptoms').textContent  = symptoms  || '–';
  document.getElementById('prev-emergency').textContent = emergency || '–';
  document.getElementById('prev-medicine').textContent  = medicine  || '–';
  document.getElementById('prev-safe-food').textContent = safeFood  || '–';
  document.getElementById('prev-notes').textContent     = notes     || '–';

  // --- Medicin-lokation ---
  const medLocRow = document.getElementById('prev-med-loc-row');
  document.getElementById('prev-med-loc').textContent = medLoc;
  medLocRow.style.display = medLoc ? '' : 'none';

  // --- Kontaktkort ---
  renderContacts(c1Name, c1Phone, c2Name, c2Phone);

  // --- Skriv print-dato på disclaimeren (bruges i print-CSS) ---
  const today = new Date().toLocaleDateString('da-DK', { day:'2-digit', month:'long', year:'numeric' });
  document.querySelector('.passport-disclaimer')
          ?.setAttribute('data-print-date', today);
}

function renderContacts(c1Name, c1Phone, c2Name, c2Phone) {
  const container = document.getElementById('prev-contacts');
  const contacts  = [];

  if (c1Name || c1Phone) contacts.push({ name: c1Name, phone: c1Phone });
  if (c2Name || c2Phone) contacts.push({ name: c2Name, phone: c2Phone });

  if (contacts.length === 0) {
    container.innerHTML = '<span class="prev-contact-empty">Ingen kontakter angivet</span>';
    return;
  }

  container.innerHTML = contacts.map(c => `
    <div class="prev-contact-card">
      <span class="prev-contact-name">${escHtml(c.name || 'Kontakt')}</span>
      ${c.phone
        ? `<a href="tel:${escHtml(c.phone)}" class="prev-contact-phone">${escHtml(c.phone)}</a>`
        : '<span class="prev-contact-phone" style="opacity:.5">–</span>'
      }
    </div>
  `).join('');
}

/* -------------------------------------------------------
   KOPIÉR DELINGSTEKST
   ------------------------------------------------------- */

function copyShareText() {
  const sevMap = { mild: 'Mild', moderat: 'Moderat', alvorlig: 'ALVORLIG', livstruende: '⚠️ LIVSTRUENDE' };

  const lines = [
    '======== ALLERGIPAS ========',
    val('childName') ? `Navn:      ${val('childName')}${val('childAge') ? ', ' + val('childAge') : ''}` : null,
    val('severity')  ? `Alvorlighed: ${sevMap[val('severity')] || val('severity')}` : null,
    val('allergies') ? `Allergi:   ${val('allergies')}` : null,
    val('exposure')  ? `Eksponering: ${val('exposure')}` : null,
    val('symptoms')  ? `Symptomer: ${val('symptoms')}` : null,
    '',
    val('emergencyInstructions') ? '--- NØDINSTRUKTIONER ---\n' + val('emergencyInstructions') : null,
    '',
    val('medicine')         ? `Medicin:   ${val('medicine')}` : null,
    val('medicineLocation') ? `Medicin ligger: ${val('medicineLocation')}` : null,
    val('safeFood')         ? `Sikker mad: ${val('safeFood')}` : null,
    '',
    '--- KONTAKT ---',
    (val('contact1Name') || val('contact1Phone'))
      ? `${val('contact1Name') || 'Kontakt 1'}: ${val('contact1Phone') || '–'}` : null,
    (val('contact2Name') || val('contact2Phone'))
      ? `${val('contact2Name') || 'Kontakt 2'}: ${val('contact2Phone') || '–'}` : null,
    val('notes') ? `\nEkstra noter:\n${val('notes')}` : null,
    '',
    'Allergipasset erstatter ikke lægefaglig rådgivning.',
    '============================',
  ]
  .filter(l => l !== null)
  .join('\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

  navigator.clipboard.writeText(lines)
    .then(() => showToast('📋 Tekst kopieret til udklipsholder', '#2C4A7C'))
    .catch(() => {
      // Fallback til execCommand for ældre browsere
      const ta = document.createElement('textarea');
      ta.value = lines;
      ta.style.cssText = 'position:fixed;opacity:0;top:-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('📋 Tekst kopieret', '#2C4A7C'); }
      catch { showToast('⚠️ Kopiering mislykkedes', '#B45309'); }
      document.body.removeChild(ta);
    });
}

/* -------------------------------------------------------
   TOAST-BESKED
   ------------------------------------------------------- */

let toastTimer = null;

function showToast(message, color = '#16A34A') {
  const toast = document.getElementById('save-toast');
  if (!toast) return;

  toast.textContent = message;
  toast.style.background = color;
  toast.classList.add('visible');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

/* -------------------------------------------------------
   INITIALISERING
   ------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {

  // Sæt standard nødinstruktioner inden indlæsning fra localStorage
  const emergField = document.getElementById('emergencyInstructions');
  if (emergField) emergField.value = DEFAULT_EMERGENCY;

  // Indlæs evt. gemte data (overskriver standard)
  loadData();

  // Første preview-render
  updatePreview();

  // Live-opdatering ved hvert tastetryk / ændring
  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input',  updatePreview);
    el.addEventListener('change', updatePreview);
  });

  // Knapper – formular
  document.getElementById('btn-save')?.addEventListener('click', saveData);
  document.getElementById('btn-copy')?.addEventListener('click', copyShareText);
  document.getElementById('btn-print')?.addEventListener('click', () => window.print());
  document.getElementById('btn-clear')?.addEventListener('click', clearData);

  // Knapper – header (genveje)
  document.getElementById('btn-header-save')?.addEventListener('click', saveData);
  document.getElementById('btn-header-print')?.addEventListener('click', () => window.print());

});

/* -------------------------------------------------------
   TODO – fremtidige features:

   [ ] QR-kode generering (f.eks. via qrcode.js)
   [ ] Offentlig delingslink (kræver backend / Firebase)
   [ ] Flere børneprofiler (faner / dropdown)
   [ ] Udløbspåmindelse for EpiPen / medicin
   [ ] Sprogskift: Dansk / Engelsk
   [ ] Restaurant-tilstand (forenklet visning)
   [ ] Skole/SFO-tilstand (med ekstra info)
   [ ] Fødselsdags-tilstand (compact version til events)
   [ ] PDF-eksport (html2pdf.js)
   [ ] Backup / eksporter til JSON-fil
   ------------------------------------------------------- */
