# 🛡️ Allergipasset

**Digitalt og printbart allergipas til børn med alvorlige allergier.**

> *Ét scan. Én side. Rigtige handlinger, når det gælder.*

Allergipasset gør alvorlig allergi let at forstå for alle voksne omkring barnet — et digitalt og printbart nød- og hverdagskort med allergier, instruktioner, medicin og kontaktinfo.

**[→ Åbn Allergipasset](https://patrickpstreet-pixel.github.io/allergipasset/)**

---

## Hvad er nyt i version 2.0?

### 👶 Flere børneprofiler
Skift mellem profiler for søskende eller flere børn med ét klik. Profiler gemmes lokalt i browseren – ingen konto, ingen login.

### 🎭 Tilstandstilstande – fire visninger
Samme data, fire tilpassede kortvisninger:

| Tilstand | Til hvem | Hvad vises |
|---|---|---|
| 📋 **Pas** | Alle | Fuldt allergipas med alle detaljer |
| 🎂 **Fødselsdag** | Andre forældre | "Emma kommer til din fødselsdag. Her er hvad hun ikke må få..." |
| 🏫 **Skole/SFO** | Personale | Allergi, handlingsplan, medicin-lokation, kontakter |
| 🍽️ **Restaurant** | Køkkenet | Store, tydelige allergener + krydsforureningsadvarsel |

### 📱 Del via QR-kode og link
Generer automatisk en QR-kode og et delingslink. Modtageren åbner passet i deres browser — ingen app, ingen konto. Passet er kodet direkte i URL'en, ingen backend nødvendig.

### ⏰ Medicin-udløbspåmindelse
Angiv udløbsdato for EpiPen/primær akutmedicin. Appen viser automatisk:
- ✓ Gyldig (grøn)
- ⚠️ Udløber om < 90 dage (amber)
- ⚠️ Udløber om < 30 dage – skift nu! (rød)
- Udløbet (rød)

---

## Alle funktioner

| Funktion | v1 | v2 |
|---|---|---|
| Formular med alle allergifelter | ✅ | ✅ |
| Live forhåndsvisning | ✅ | ✅ |
| Farvekodede sektioner | ✅ | ✅ |
| Alvorlighedsbadge (pulserende ved livstruende) | ✅ | ✅ |
| Gem i localStorage | ✅ | ✅ |
| Print-optimeret CSS | ✅ | ✅ |
| Kopiér delingstekst | ✅ | ✅ |
| Mobilvenligt layout | ✅ | ✅ |
| **Flere børneprofiler** | – | ✅ |
| **Tilstandstilstande (Pas/Fødselsdag/Skole/Restaurant)** | – | ✅ |
| **QR-kode generering** | – | ✅ |
| **Del som link (URL-baseret, ingen backend)** | – | ✅ |
| **Medicin udløbsdato + visuel advarsel** | – | ✅ |
| **View-only tilstand til modtager af delt link** | – | ✅ |
| Ingen eksterne afhængigheder\* | ✅ | ✅ |
| Medicinsk disclaimer | ✅ | ✅ |

\*v2.0 tilføjer qrcode.js via CDN til QR-generering.

---

## Design og tone

Allergipasset må ikke føles som en hospitalsblanket. Det skal føles:

- **Trygt** — roligt og overskueligt, ikke panikskabende
- **Tydeligt** — de vigtigste oplysninger springer i øjnene
- **Forældrevenligt** — alle kan oprette et pas på få minutter
- **Handlingsklart** — personale og andre voksne ved præcis hvad de skal gøre

**Farvepalet:**
- Navy til primær information og header
- Amber/orange til allergiadvarsler
- Rød til nødinstruktioner
- Grøn til sikker mad
- Intet blinkende panik-cirkus — undtagen den livstruende badge, som subtilt pulserer

---

## Teknisk opbygning

```
allergipasset/
├── index.html   — Struktur og formular
├── styles.css   — Design, farver, print-CSS, alle tilstande
└── app.js       — Multi-profil, tilstande, QR, deling, udløb
```

- Rent vanilla HTML, CSS og JavaScript — nul frameworks
- Ét eksternt bibliotek: `qrcode.js` via CDN (QR-generering)
- Gratis hosting på GitHub Pages — ingen server
- Data gemmes 100% lokalt i browseren (localStorage)
- Deling via URL: pasdata kodes som base64 i linket

---

## Del som link — sådan virker det

Ingen backend er nødvendig. Pasdata komprimeres og kodes direkte i URL'en:

```
https://patrickpstreet-pixel.github.io/allergipasset/index.html?view=eyJjaGlsZE5hbWUi...
```

Modtageren åbner linket → ser passet i en ren view-tilstand med en "Opret dit eget" knap. QR-koden indeholder samme URL og kan scannes direkte fra telefonen.

> **Næste skridt — Firebase:** For kortere, permanente links og mulighed for at opdatere passet efter deling, kan Firebase Firestore tilføjes som et lag ovenpå. Det kræver kun en config-fil og ændrer ikke resten af koden.

---

## Kom i gang

```bash
git clone https://github.com/patrickpstreet-pixel/allergipasset.git
```

Åbn `index.html` i en browser — ingen server nødvendig.

---

## Roadmap

| Feature | Status |
|---|---|
| Fødselsdagsmode | ✅ v2.0 |
| Skole/SFO-mode | ✅ v2.0 |
| Restaurant-mode | ✅ v2.0 |
| QR-kode | ✅ v2.0 |
| Medicin-udløbspåmindelse | ✅ v2.0 |
| Flere børneprofiler | ✅ v2.0 |
| Del som link (URL-baseret) | ✅ v2.0 |
| Firebase: kortere links + cloud sync | 🔜 v3.0 |
| Rejsemode (EN / DE / ES) | 🔜 v3.0 |
| PDF-eksport | 🔜 v3.0 |
| Madpakke-safe liste | 🔜 fremtid |
| Push-notifikation om medicinudløb | 🔜 fremtid |

---

## Disclaimer

Allergipasset erstatter ikke lægefaglig rådgivning. Følg altid barnets officielle behandlingsplan og kontakt læge/112 ved alvorlige symptomer.

---

## Licens

MIT — frit at bruge, tilpasse og bygge videre på.
