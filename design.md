# Listd (`Ld.`) — Design System & UI Specification

Questo documento definisce il linguaggio visivo, i token di stile, i componenti e l'architettura dell'interfaccia di **Listd** (`Ld.`), ricavati fedelmente dal concept mobile ad alto contrasto dark mode.

---

## 1. Filosofia Visiva & Atmosfera

- **Pitch Black Canvas (`#000000`)**: Fondo nero assoluto privo di gradienti pesanti, studiato per schermi OLED/AMOLED per massimizzare la leggibilità, l'immersione cinematografica e ridurre il consumo energetico.
- **Dark Charcoal Elevation (`#121316` / `#16171B`)**: Le card e i contenitori interattivi galleggiano sul nero assoluto tramite una superficie antracite profonda, con bordi ultra-sottili (`rgba(255, 255, 255, 0.06)`–`0.08`).
- **High-Radius Modern Geometry (20px - 26px)**: Card, pulsanti a pillola e dock di navigazione adottano curve morbide (`rounded-2xl` e `rounded-full`), donando un'esperienza tattile e contemporanea.
- **Tipografia Two-Tone a Contrasto**: Le intestazioni di sezione impiegano una gerarchia bimodale:
  - *Prima riga (contesto/ambientazione)*: Peso regular/light, grigio medio (`#9CA3AF` / `text-zinc-400`).
  - *Seconda riga (call-to-action / punchline)*: Peso bold/extrabold, bianco puro (`#FFFFFF`).

---

## 2. Palette Colori & Design Tokens

### Colori Fondamentali
| Token | HEX / Valore | Ruolo nel layout |
| :--- | :--- | :--- |
| `canvas-black` | `#000000` | Sfondo primario globale dell'app |
| `surface-charcoal` | `#121316` | Superficie card, modal, container |
| `surface-hover` | `#1A1B20` | Stato hover su card e container |
| `pill-surface` | `#16171B` | Sfondo pulsanti pillola (`+ Add to your list`, pill active) |
| `border-subtle` | `rgba(255, 255, 255, 0.08)` | Delimitatori leggeri su card e pillole |
| `text-pure-white` | `#FFFFFF` | Testo primario, punchline di sezione, logo |
| `text-muted` | `#9CA3AF` | Sottotitoli, prima riga delle sezioni, metadati |
| `text-faint` | `#525866` | Timestamp secondari, indicatori inattivi |
| `accent-red` | `#EF4444` | Badge di notifica non letta sul campanello |
| `accent-amber` | `#F59E0B` | Stelle di rating, highlight di progresso |

---

## 3. Brand & Typography

### Logo: `Ld.`
- Wordmark minimalista, bold e geometrico: lettere minuscole/maiuscole compatte seguite da punto fermo (**`Ld.`**).
- Posizionato al centro esatto della barra superiore, bilanciato a sinistra dal tasto d'azione rapida e a destra dall'icona notifiche.

### Scale Tipografiche
- **Logo Wordmark**: `font-black text-2xl tracking-tighter text-white font-sans`
- **Two-Tone Section Header**:
  - Line 1: `text-zinc-400 text-lg sm:text-xl font-normal leading-tight tracking-tight`
  - Line 2: `text-white text-xl sm:text-2xl font-bold leading-tight tracking-tight`
- **Greeting Hero**:
  - `Hi, <Username>`: `text-xl sm:text-2xl font-semibold text-white tracking-tight`
  - `there are some news.`: `text-sm text-zinc-400 font-normal`
- **Card Titles**: `text-sm font-medium text-white line-clamp-1`
- **Card Subtext / Metadati**: `text-xs font-mono text-zinc-400`

---

## 4. Componenti Chiave

### 4.1. Top Navigation Bar
- **Pulsante Sinistro (`+ Add to your list`)**:
  - Capsule `rounded-full`, padding `px-4 py-2`, font `text-xs sm:text-sm font-medium`.
  - Icona `Plus` (14px) + testo. Conduce direttamente alla schermata di ricerca/aggiunta (`/discover`).
- **Centro**: Logo **`Ld.`** perfettamente allineato.
- **Pulsante Destro (Notifiche)**:
  - Icona `Bell` (20px) con indicatore a punto rosso brillante (`w-2 h-2 rounded-full bg-red-500 absolute top-0.5 right-0.5 ring-2 ring-black`).

### 4.2. Hero Greeting del Profilo (Centrato)
- **Avatar circolare**:
  - Diametro `72px–80px` (`w-20 h-20`), bordo circolare ad anello (`ring-2 ring-white/20`).
  - Immagine profilo personalizzata (manga/sketch o foto utente con fallback iniziale ad alta risoluzione).
- **Testo di Benvenuto**:
  - Centrato direttamente sotto l'avatar:
    ```html
    <div class="text-center mt-3">
      <h1 class="text-xl sm:text-2xl font-semibold text-white">Hi, {{ username }}</h1>
      <p class="text-sm text-zinc-400 mt-0.5">there are some news.</p>
    </div>
    ```

### 4.3. Sezioni Home a Scorrimento Orizzontale
1. **"News on fictions you liked"**:
   - Carousel orizzontale con titoli che l'utente sta seguendo o ha completato e che presentano aggiornamenti (nuovi episodi/capitoli o news).
2. **"Your friends have watched/read these" / "but you haven't"**:
   - Carousel orizzontale alimentato dal motore di Friend Comparison ("Friend Diff"), mostrando titoli popolari tra gli amici che l'utente non ha ancora nella propria libreria.
3. **"Your followers started some discussions" / "do you mind joining?"**:
   - Card interattive per le discussioni e i messaggi diretti con consigli multimediali da parte della community e amici.

### 4.4. Media Card (Stile Ld.)
- Dimensioni: `w-40 sm:w-48` in visualizzazione a carosello orizzontale, o griglia fluida.
- Raggio di curvatura: `rounded-[22px]`.
- Superficie: `bg-[#121316] border border-white/[0.06] hover:border-white/[0.16]`.
- Poster cinematografico con angoli curvi superiori, badge tipo media (Film, TV, Anime, Manga, Game, Music) e rating su layer trasparente.
- Overlay d'azione rapida: pulsante "1-Click Watch/Play" + avanzamento rapido (`+1 ep` / `+1 ch`).

### 4.5. Floating Bottom Navigation Dock
Dock orizzontale fluttuante ancorato alla parte inferiore dello schermo:
- Sfondo: `#121316` con bordi `rounded-full` (capsule dock) e sfocatura `backdrop-blur-xl`.
- 5 Icone essenziali:
  1. **Home / Dashboard**: Icona `Home` in capsula attiva (`bg-white/10 rounded-full px-4 py-2`).
  2. **Social / Friends**: Icona `Users` (Community & Friend Library Diff).
  3. **Search / Discover**: Icona `Search` (Catalogo unificato & Aggiunte).
  4. **Library**: Icona `List` (Libreria personale & Tracking).
  5. **Profile**: Mini avatar circolare dell'utente loggato.

---

## 5. Responsive Strategy
- **Mobile First**: L'interfaccia rispecchia nativamente lo screen mobile fornito, ideale per PWA e wrapper Capacitor (iOS/Android).
- **Desktop / Tablet**:
  - Il container centrale si estende fino a `max-w-4xl` mantenendo l'esperienza focalizzata e pulita.
  - La barra superiore mantiene il layout iconico (Pill a sinistra, logo `Ld.` al centro, Notifiche a destra).
  - La dock inferiore fluttua elegantemente centratata in basso o si sincronizza per un'esperienza d'uso fluida.
