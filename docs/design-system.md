# Cua Nhà Ếch — design system

The look: **hand-drawn sticker style**. Ink-purple outlines (2px), hard offset shadows (no blur), pill buttons,
pastel fills on a yellow polka-dot page. Every screen is built from the same few parts so it stays consistent.

See every component live at **`/admin/kit`**.

## Rules

1. **Build screens from `components/ui`.** Import from `@/components/ui` only. Don't write a raw
   `<button className="...">`, `<input>` with your own class, or a new popup.
2. **Missing something? Extend the kit**, don't fork it: add a prop/variant to the existing component, its
   styles to `app/styles/ui.css`, and an example to `/admin/kit`.
3. **No raw values in CSS.** Colors, borders, radii and shadows come from `app/styles/tokens.css`
   (`var(--ink)`, `var(--bd)`, `var(--r-md)`, `var(--lift-2)` …). Add a token before adding a hex code.
4. **No inline `style={{…}}`** except for data-driven values (a bar's height, a timer's duration).
   Spacing helpers: `.mt-12`, `.mt-20`; text helpers: `.sub`, `.sub.tight`, `.sg`.
5. **Mobile first.** Check every change at 375px wide. Phone breakpoint is `max-width:600px`,
   desktop is `min-width:700px`. Forms (`FormCard`) already go full width on phones.
6. **Texts live in `lib/i18n.ts`** (VI and EN), never hard-coded in components.

## Files

```
app/styles/
  tokens.css     design tokens (palette, borders, radii, shadows, layers) — the only place for raw values
  base.css       reset, page background, shared keyframes, scrollbars
  ui.css         styles of the UI kit components
  layout.css     app shell: ticker, header, tab bar, loading screen
  orders.css     Orders tab (form layout, board, cards, trash)
  calendar.css   Delivery calendar tab
  insights.css   Money / Customers / Menu tabs (charts, price list)
  landing.css    public landing page (/home), Bauhaus theme, scoped under .lp
components/
  ui/            UI kit — no business logic, no data
  layout/        app shell pieces (Header, TabBar, Ticker, Loader)
  orders/        order-specific parts (OrderForm, OrderCard, Trash, AddressBox, bits, useBoardDrag)
  views/         one component per tab (OrdersView, CalendarView, MenuView, MoneyView, CustomersView, Login)
  landing/       public landing page (LandingPage, LandingHeader, Gallery, Pic)
lib/landing.ts   landing texts, products, gallery slides, contact links — edit content here
  Dashboard.tsx  loads the data, holds the tab state, renders the shell and the current view
```

A new tab = a `components/views/XxxView.tsx` (receives `ViewProps`: `s`, `t`, `update`) plus, only if it
needs its own layout, an `app/styles/xxx.css` imported in `app/layout.tsx`.

## UI kit

| Need | Use |
|---|---|
| Main action of a form | `<Button variant="primary" type="submit">` |
| Any other button | `<Button>` (ghost pill); `on` = selected; `variant="danger"` = destructive confirm |
| Icon-only square button next to fields | `<IconButton label="…">` |
| Block of content with a title | `<Panel title="…">` |
| Page title + controls | `<Toolbar title meta>` + `<Button>`s |
| Notice / error banner | `<Note>` / `<Note bad>` |
| "Nothing here" | `<Empty>` |
| Big numbers | `<Stats><Stat label value tone="in|out" sub /></Stats>` |
| Two columns | `<TwoCols>` |
| Form | `<FormCard onSubmit>` + fields + `<FormError>` (`below` inside a panel), validation with `useErrors()` |
| Text / multi-line | `<TextInput bad>` / `<TextArea>` |
| Number with unit | `<UnitInput suffix="kg">`, money in thousands: `<Money>` |
| Yes/no option | `<ToggleChip checked onChange>` |
| Pick one (fixed list) | `<Select options>` (supports `group` headings) |
| Type + suggestions | `<Combobox options>` (`filter={false}` when results come from a server) |
| Date / time | `<DatePicker>` / `<TimePicker>` (bottom sheet on phones) |
| 2–3 way switch | `<Segmented options>` |
| Label pill | `<Chip kind="channel|crab|shrimp|steam|raw|live|late">`, several: `<Chips>` |
| Copy a value | `<CopyBtn text label>` |
| Ask before acting | `const [node, ask] = useConfirm()`; render `node`; `if (await ask({...}))` |
| Short message with undo | `<Toast action onAction onDone>` |
| Data table | plain `<table>` (styled globally; `className="r"` right-aligns a cell) |

## Tokens at a glance

- **Ink** `--ink` text, borders, shadows · **muted** `--mut` · **surface** `--wh`
- **Accent** `--pk` (focus, selected) · `--pk2` (hover) · notes `--sun` · money in `--grn` · out/danger `--red`
- **Borders** `--bd` (2px) · `--bd-thin` (1.5px, chips) · `--bd-dash` (notes, inner boxes) · `--bd-soft` (dividers)
- **Radii** fields `--r-md` · cards/popups `--r-lg` · panels `--r-xl` · columns/dialogs `--r-2xl` · pills `--r-pill`
- **Shadows** buttons `--drop-1..3` (straight down) · cards `--lift-1..4` (down-right) · focus `--ring` + `--focus`

## Landing page theme (Bauhaus)

The public page at `/home` (the site root redirects there) has its own look, deliberately different from the
doodle dashboard: **Bauhaus** — primary red / blue / yellow, black, paper; 3px black lines, square corners,
circles-squares-triangles, bold uppercase type in **Unbounded** (`--font-display`).

- Colors and lines: the `--bh-*` tokens in `tokens.css` only. Styles live in `landing.css`, all under `.lp`,
  so they never affect the dashboard (and the dashboard kit is not used there).
- Buttons `.lp-btn` (black, offset colored shadow) / `.lp-btn-ghost`, square icon buttons `.lp-sq`,
  shapes `.lp-shape.circle|square|triangle`, color blocks via `.tone-red|blue|yellow|black` (sets `--tone` / `--on`).
- Images: `<Pic pic={{ img, alt, tone }}>` shows the photo, or a geometric placeholder until `img` is set.
  Photos go in `public/landing/`; set the path in `lib/landing.ts`.
- Products and prices come from the dashboard's menu (`lib/publicMenu.ts`, cached under the `menu` tag; the
  dashboard calls `POST /api/menu-changed` after a menu change). Per-item tag/photo: `PRODUCT_EXTRAS` in `lib/landing.ts`.
  Needs the "public read menu" policies from `supabase/schema.sql`; without them the default menu shows without prices.
- Icons `<CrabIcon>` / `<ShrimpIcon>` (components/landing/Icons.tsx): built from basic shapes, primary colors only.
- `<Gallery slides>`: swipeable slider (scroll snap), arrows, shape dots, keyboard arrows, autoplay that pauses.
- Admin entry is hidden from customers: a "Quản lý" link shows only in a browser signed in to the dashboard,
  and tapping the logo 5 times opens `/admin`.
