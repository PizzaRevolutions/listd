# Listd (`Ld.`) — Responsive Design System & Layout Specification

Questo documento definisce il linguaggio visivo, i token e l'architettura responsive (Mobile & Desktop) di **Listd** (`Ld.`).

---

## 1. Filosofia Responsive: Mobile-First + Desktop-Native

Listd offre un'esperienza su misura per entrambi i formati senza compromettere l'identità grafica:

### Mobile Experience (< 768px, `sm`)
- **Top Bar Compatta**:
  - Sinistra: Pillola `+ Add to your list`.
  - Centro: Logo **`Ld.`** in display font geometrico.
  - Destra: Campanello notifiche con punto rosso (`accent-red`).
- **Hero Centrato**:
  - Avatar circolare con anello (`ring-2 ring-white/20`), saluto `Hi, <Username>` e sottotitolo `there are some news.`.
- **Caroselli Orizzontali a Scorrimento Naturale**:
  - Card con bordi ultra-arrotondati (`rounded-[22px]`) scorrevoli via touch swipe con scrollbar nascosta.
- **Floating Bottom Dock**:
  - Barra dock fluttuante ancorata in basso con 5 icone (Home, Friends, Discover, Library, Profilo).

### Desktop Experience (≥ 768px, `md:` e `lg:`)
- **Top Desktop Navbar Completa**:
  - Sinistra: Brand wordmark **`Ld.`** + Search bar trigger rapida (`Search catalog...`).
  - Centro: Links di navigazione desktop con icone e label testuali (`Home`, `Library`, `Discover`, `Social`).
  - Destra: Pill button `+ Add to your list`, campanello notifiche con popover e menu profilo utente completo (avatar, username, impostazioni, sign out).
- **Dock Mobile Nascosta (`md:hidden`)**:
  - Su desktop la barra dock fluttuante inferiore viene rimossa per garantire una visualizzazione pulita senza occlusioni.
- **Container Widescreen (`max-w-7xl`)**:
  - Il layout espande la larghezza da `max-w-4xl` a `max-w-7xl` con griglie fluide da 4 a 6 colonne (`md:grid-cols-4 lg:grid-cols-6`).
- **Hero Dashboard Desktop**:
  - Visualizzazione espansa con statistiche d'archivio in pillole (voci in corso, completate, pianificate, contatti), pulsanti di navigazione rapida e caroselli con controlli freccia (Prev/Next).

---

## 2. Palette Colori & Design Tokens

| Token | HEX / Valore | Ruolo nel layout |
| :--- | :--- | :--- |
| `canvas-black` | `#000000` | Sfondo primario globale dell'app |
| `surface-charcoal` | `#121316` | Superficie card, modal, container |
| `surface-hover` | `#1A1B20` | Stato hover su card e container |
| `pill-surface` | `#16171B` | Sfondo pulsanti pillola (`+ Add to your list`, nav pills) |
| `border-subtle` | `rgba(255, 255, 255, 0.08)` | Delimitatori leggeri su card e pillole |
| `text-pure-white` | `#FFFFFF` | Testo primario, punchline di sezione, logo |
| `text-muted` | `#9CA3AF` | Sottotitoli, prima riga delle sezioni, metadati |
| `text-faint` | `#525866` | Timestamp secondari, indicatori inattivi |
| `accent-red` | `#EF4444` | Badge di notifica non letta sul campanello |
| `accent-amber` | `#F59E0B` | Stelle di rating, highlight di progresso |

---

## 3. Tipografia & Font Family

### Carattere Primario: `GillSansMTProCyr-Medium`
Tutte le intestazioni, i testi di interfaccia, i pulsanti e le card adottano **`GillSansMTProCyr-Medium`** (famiglia Gill Sans MT Pro Cyrillic / Gill Sans MT):
```css
font-family: 'GillSansMTProCyr-Medium', 'Gill Sans MT Pro Cyr', 'Gill Sans MT', 'Gill Sans', sans-serif;
```
Fornito come webfont tramite asset bundled (`/fonts/GillSansMT.ttf` e `GillSansMT-Bold.ttf`) e con riconoscimento dei font di sistema locali.

### Intestazioni Two-Tone di Sezione
- **Riga 1 (Contesto / Premessa)**:
  - Mobile: `text-zinc-400 text-lg font-normal leading-tight tracking-tight`
  - Desktop: `text-zinc-400 text-xl font-normal leading-tight tracking-tight`
- **Riga 2 (Call-to-Action / Punchline)**:
  - Mobile: `text-white text-xl font-bold leading-tight tracking-tight`
  - Desktop: `text-white text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight`

---

## 4. Specifiche Componenti Desktop

### 4.1 Navbar Superiore Desktop
```
[ Ld. ]  [ Search catalog... 🔍 ]        [ 🏠 Home ] [ 📚 Library ] [ 🧭 Discover ] [ 👥 Social ]        [ + Add to your list ]  [ 🔔 ]  [ (👤 Profile ▾) ]
```

### 4.2 Home View Desktop
- Banner di benvenuto con avatar utente, saluto e badge statistici (Total, In Progress, Completed, Planned).
- Sezione 1: "News on fictions you liked" (Carousel con frecce di navigazione desktop sinistra/destra).
- Sezione 2: "Your friends have watched/read these" / **"but you haven't"** (Friend Diff Carousel).
- Sezione 3: "Your followers started some discussions" / **"do you mind joining?"** (Griglia a 3 colonne su desktop).

### 4.3 Pagine Catalog, Library e Social Desktop
- Griglie responsive `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4`.
- Barra di ricerca, filtri per categoria e status integrati su un'unica linea orizzontale compatta.
