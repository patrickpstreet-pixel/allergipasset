# 🛡️ Allergipasset

**Digitalt og printbart allergipas til børn med alvorlige allergier.**

> *Ét scan. Én side. Rigtige handlinger, når det gælder.*

Allergipasset gør alvorlig allergi let at forstå for alle voksne omkring barnet — et digitalt og printbart nød- og hverdagskort med allergier, instruktioner, medicin og kontaktinfo. Klar til skole, SFO, klub, bedsteforældre, legeaftaler, restauranter og fødselsdage.

**[→ Åbn Allergipasset](https://patrickpstreet-pixel.github.io/allergipasset/)**

---

## Hvad er Allergipasset?

Allergipasset er en simpel webapp, der hjælper forældre med at oprette et klart og overskueligt allergipas til deres barn. Passet kan:

- Vises digitalt på telefon eller tablet
- Printes som et kompakt nødkort
- Deles som ren tekst via besked eller mail
- Gemmes lokalt i browseren — ingen konto, ingen login, ingen data sendt nogen steder

Ingen backend. Ingen database. Virker offline. Klar til GitHub Pages.

---

## Funktioner i version 1

| Funktion | Status |
|---|---|
| Formular med alle relevante felter | ✅ |
| Live forhåndsvisning af paskortet | ✅ |
| Farvekodede sektioner (nød, medicin, sikker mad) | ✅ |
| Alvorlighedsbadge (mild → livstruende) | ✅ |
| Gem i browserens localStorage | ✅ |
| Print-optimeret CSS (kun paskortet printes) | ✅ |
| Kopiér delingstekst til udklipsholder | ✅ |
| Mobilvenligt layout | ✅ |
| Ingen eksterne afhængigheder | ✅ |
| Medicinsk disclaimer | ✅ |

---

## Skærmbillede

```
┌─────────────────────────────────────┐
│  🛡️ ALLERGIPAS                      │
│  Emma Larsen · 7 år                 │
│  ⚠️ LIVSTRUENDE                      │
├─────────────────────────────────────┤
│  ⚠️  Allergi                         │
│  Jordnødder, sesam, træ-nødder       │
├─────────────────────────────────────┤
│  🚨  Nødinstruktioner                │
│  1. Stop kontakt med allergenet...   │
│  5. Ring 112 ved ...                 │
├─────────────────────────────────────┤
│  💊  Medicin                         │
│  EpiPen 0,15 mg                     │
│  📍 Rød etui i skoletasken           │
├─────────────────────────────────────┤
│  📞  Kontakt straks                  │
│  [Mette – 12345678] [Lars – 87654321]│
└─────────────────────────────────────┘
```

---

## Design og tone

Allergipasset skal ikke føles som en hospitalsblanket. Det skal føles:

- **Trygt** — roligt og overskueligt, ikke panikskabende
- **Tydeligt** — de vigtigste oplysninger springer i øjnene med det samme
- **Forældrevenligt** — alle kan oprette et pas på få minutter
- **Handlingsklart** — personale og voksne ved præcis hvad de skal gøre

**Farvepalet:**
- Hvid og mørk navy til generel information
- Blød amber/orange til allergiadvarsler
- Rolig rød til nødinstruktioner
- Grøn til sikker mad
- Ingen blinkende panik-cirkus

---

## Teknisk opbygning

```
allergipasset/
├── index.html   — Struktur og formular
├── styles.css   — Design, farver, print-CSS
└── app.js       — Live preview, localStorage, print, kopier
```

Rent vanilla HTML, CSS og JavaScript. Ingen frameworks, ingen afhængigheder. Kan hostes gratis på GitHub Pages, Netlify eller enhver statisk hosting.

---

## Mulige features i version 2

### 🎂 Fødselsdagsmode
En simpel side til andre forældre:
*"Joris kommer til fødselsdag. Her er hvad han ikke må få, og hvad der er sikkert."*

### 🏫 Skole/SFO-mode
En kort instruktion målrettet personale med præcis den information de har brug for.

### 🍽️ Restaurant-mode
En tydelig tekst der kan vises til køkkenet, med fokus på allergener og krydskontaminering.

### ✈️ Rejsemode
Oversættelse af passet til engelsk, tysk, spansk og andre sprog, klar til ferien.

### 🥕 Madpakke-safe liste
Forælderen kan lave og dele en liste over sikre snacks, mærker og butiksprodukter.

### ⏰ Medicintjek-påmindelse
*"EpiPen udløber om 30 dage."* — En lokal reminder der advarer om udløbsdato.

### 📱 QR-kode generering
Generer en QR-kode der linker direkte til passet, klar til at printe eller sende.

### 👨‍👩‍👧‍👦 Flere børneprofiler
Skift mellem profiler for søskende eller flere børn i familien.

### 🌐 Offentlig delingslink
Gem passet online og del det som et link (kræver backend eller Firebase).

### 📄 PDF-eksport
Download passet som en PDF-fil direkte fra browseren.

---

## Kom i gang

1. Klon eller download projektet:
   ```bash
   git clone https://github.com/patrickpstreet-pixel/allergipasset.git
   ```
2. Åbn `index.html` i en browser — ingen server nødvendig.
3. Udfyld formularen og se passet opdatere sig live.
4. Gem med "Gem allergipas" og print med "Print allergipas".

---

## Disclaimer

Allergipasset erstatter ikke lægefaglig rådgivning. Følg altid barnets officielle behandlingsplan og kontakt læge/112 ved alvorlige symptomer.

---

## Licens

MIT — frit at bruge, tilpasse og bygge videre på.
