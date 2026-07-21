# BCM — Design System

Questo documento descrive il sistema di design **già in uso** nell'app (Next.js + Tailwind CSS v4 + shadcn/ui + Recharts), così da restare coerenti tra sessioni di lavoro diverse. Non introduce una nuova direzione visiva: fotografa le regole emerse durante le rifiniture della dashboard e della Fase 2 (tabelle, widget, landing).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**.
- **Tailwind CSS v4** — CSS-first, nessun `tailwind.config.js`. I token vivono in `app/globals.css` dentro `@theme inline` + `:root`/`.dark`.
- **shadcn/ui** in `components/ui/`: `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `table`, `table-skeleton`, `textarea`.
- **Recharts** per tutti i grafici della dashboard.
- Font: **Geist Sans** / **Geist Mono** (self-hosted via `next/font`, nessuna dipendenza da CDN esterni).

## Colore

Tutti i colori sono CSS custom properties definite in `app/globals.css`, ridefinite per `.dark` — **mai** hex diretti o classi Tailwind hardcoded (`bg-green-500`, `text-red-600`...) nei componenti applicativi.

### Core / brand

| Token | Uso | Light | Dark |
|---|---|---|---|
| `--background` | sfondo pagina | `#f5f7fb` | `#070b14` |
| `--card` / `--card-foreground` | superficie card | `#ffffff` | `#0e1525` |
| `--primary` | accento di brand (bottoni, link, focus ring) | `#2563eb` | `#2563eb` |
| `--border` | bordi sottili | `#e4e9f0` | `#1e2940` |
| `--muted` / `--muted-foreground` | testo/sfondo secondario | `#eef2f7` / `#5b6b82` | `#18223a` / `#93a1b8` |
| `--destructive` | azioni distruttive (bottoni, non stati) | `#b91c1c` | `#f87171` |
| `--radius` | raggio di riferimento (9px) — `--radius-{sm,md,lg,xl,2xl,3xl,4xl}` derivano da questo | `0.5625rem` | uguale |

### Stato semantico — `--status-{colore}-{fg,bg}`

Unica fonte di colore per **qualunque concetto di stato**: contratti attivi/in scadenza/scaduti/annullati, livelli di rischio, gravità anomalie, badge di verifica, avvisi. Non hex diretti, non scale Tailwind (`green-500`, `amber-400`...).

| Token | Significato | Light fg / bg | Dark fg / bg |
|---|---|---|---|
| `--status-green-*` | positivo / attivo / basso rischio | `#15803d` / `#dcfce7` | `#4ade80` / `#0f2a1c` |
| `--status-amber-*` | attenzione / in scadenza / medio | `#b45309` / `#fdf0d3` | `#fbbf24` / `#33260a` |
| `--status-red-*` | critico / scaduto / alto rischio | `#b91c1c` / `#fde4e4` | `#f87171` / `#321518` |
| `--status-blue-*` | neutro/informativo (es. KPI "totale") | `#1d4ed8` / `#e2ecff` | `#7aa7ff` / `#15233f` |
| `--status-slate-*` | annullato/disattivato | `#475569` / `#eef2f7` | `#aeb9ca` / `#18223a` |

**In Tailwind**: `text-[var(--status-green-fg)]`, `bg-[var(--status-amber-bg)]`, `border-l-[var(--status-red-fg)]`. Il token si adatta da solo in dark mode: **non serve mai** una classe `dark:` accanto.

### Grafici — `--chart-1..5`

Riservati ai grafici Recharts, **due usi distinti e non intercambiabili**:

1. **Serie neutre a colore unico** (andamento contratti, previsione finanziaria, ranking per area/manager): sempre `--chart-1` per tutte le serie/barre. Storico e previsione si distinguono per **stile del tratto** (continuo vs tratteggiato), mai per colore — "un solo accento blu ristretto".
2. **Segmenti realmente categorici senza equivalente di stato** (nessun caso attuale nella dashboard: il donut usa `--status-*` perché rappresenta stati, non categorie arbitrarie) — se mai servisse una palette qualitativa a più colori, usare `--chart-1..5` in sequenza, non un colore a caso.

| Token | Light | Dark |
|---|---|---|
| `--chart-1` | `#2563eb` | `#3b82f6` |
| `--chart-2` | `#0f766e` | `#14b8a6` |
| `--chart-3` | `#b45309` | `#f59e0b` |
| `--chart-4` | `#7c3aed` | `#a78bfa` |
| `--chart-5` | `#be123c` | `#fb7185` |

## Tipografia

- `--font-sans` = Geist Sans (UI, titoli, testo).
- `--font-mono` = Geist Mono — riservato a **tutti i numeri che si allineano in colonna**: valori KPI, importi in tabella, tick degli assi. Sempre con `tabular-nums`.
- Nessuna scala tipografica custom dichiarata: dimensioni per lo più esplicite (`text-[13px]`, `text-sm`, ecc.) coerenti per famiglia di componente più che per un sistema rigido a step.

## Spaziatura

- Nessuna scala di spaziatura custom: scala di default Tailwind (4px).
- **Densità dashboard**: le card della dashboard usano `py-5`/`px-5`/`gap-5` (20px) invece del default shadcn `py-6`/`px-6`/`gap-6` (24px) di `Card`/`CardHeader`/`CardContent` — applicato via `className` sulle singole card, **mai modificando `components/ui/card.tsx`**, che resta al default 24px per il resto dell'app (form, tabelle, dialoghi).

## Regole dei componenti ricorrenti

- **Select**: sempre `Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem` di shadcn. Mai un `<select>` HTML ristilizzato a mano — anche per un singolo filtro semplice.
- **Badge**: variante `success`→`--status-green-*`, `warning`→`--status-amber-*`, `destructive`→`--destructive`, `secondary`/`outline` per stati neutri. Prima di scrivere uno `<span>` colorato a mano per un badge di stato, controllare se `Badge` con la variante giusta basta già.
- **KPI card**: barra colorata a sinistra (`border-l-4`) + icona in cerchio con sfondo tenue, entrambe sullo stesso `--status-*` — mai due famiglie di colore diverse per lo stesso concetto nello stesso componente.
- **Grafici Recharts**: riempimenti piatti con `fillOpacity` ridotta (0.10–0.15), mai gradienti (`<linearGradient>`); griglia orizzontale sottile (`CHART_GRID_STROKE`/`CHART_GRID_OPACITY` da `lib/chartTheme.ts`); tick/tooltip/legenda sempre da `lib/chartTheme.ts`, non ridefiniti per singolo grafico.
- **Ranking a barre neutri** (`CapsuleBarList`): un solo colore (`--chart-1`), mai una palette che ruota per riga; tacche di riferimento (25/50/75%) disegnate **sopra** il riempimento (non sotto — altrimenti spariscono su barre >75%).
- **Immagini**: l'app non usa fotografia. Login e landing pubblica usano gradienti astratti / un mockup UI disegnato a mano (`components/landing/Hero.tsx`) — scelta deliberata per un prodotto B2B tecnico, da mantenere salvo indicazione esplicita in senso contrario.

## Cosa evitare

- Colori Tailwind hardcoded (`text-green-600`, `bg-red-50`, `border-amber-400`...) in componenti applicativi — usare sempre il token `--status-*` equivalente.
- Coppie `dark:` accanto a un token CSS: il token cambia già da solo.
- Un `<select>` nativo accanto a un `Select` shadcn nello stesso file (inconsistenza diretta, successo in passato in `ContractTable`/`UserTable`/`FinancialValueTable`, corretta).
- Colore semantico usato senza motivo semantico (es. bottone di navigazione neutro colorato di verde).
