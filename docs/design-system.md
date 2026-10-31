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
6. **Class names don't collide across surfaces.** The home page owns `.hm` / `hm-*`, the Bauhaus page `.lp` / `lp-*`
   (plus `tone-*`); the dashboard never uses them. Prefer descriptive names (`ln-dish`, not two letters).
7. **Texts live in `lib/i18n.ts`** (VI and EN), never hard-coded in components.

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
  home.css       public home page (/home), minimal refined theme, scoped under .hm
  landing.css    the earlier Bauhaus landing page, kept at /bauhaus, scoped under .lp
components/
  ui/            UI kit — no business logic, no data
  layout/        app shell pieces (Header, TabBar, Ticker, Loader)
  orders/        order-specific parts (OrderForm, OrderCard, PayQR, Trash, AddressBox, bits, useBoardDrag)
                 PayQR = transfer QR on a card (lib/pay.ts); SePay → /api/sepay → sepay_payment() moves the order
  views/         one component per tab (OrdersView, RequestsView, CalendarView, MenuView, MoneyView, CustomersView, Login)
  home/          public pages: HomePage, ProductPage (+ OrderBox, RequestForm, Gallery, StockNote), HomeHeader (+ CartButton), HeroSlider, ProductCard, Reviews, Shell, Head, Photo, LineArt
  landing/       Bauhaus page (/bauhaus) + logic shared by both public pages (useCarousel, useStaffEntry)
lib/landing.ts   public page texts, slides, product extras, contact links, menuProducts() — edit content here
  Dashboard.tsx  loads the data, holds the tab state, renders the shell and the current view
```

A new tab = a `components/views/XxxView.tsx` (receives `ViewProps`: `s`, `t`, `update`) plus, only if it
needs its own layout, an `app/styles/xxx.css` imported in `app/layout.tsx`.

## UI kit

| Need | Use |
|---|---|
| Main action of a form | `<Button variant="primary" type="submit">` |
| Any other button | `<Button>` (ghost pill); `on` = selected; `variant="danger"` = destructive confirm |
| Go to another page | `<LinkButton href>` (same look as `<Button>`) |
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
- Icons `<CrabIcon>` / `<ShrimpIcon>` (components/landing/Icons.tsx) and illustrations in components/landing/Art.tsx
  (`<HeroCrab>` poster, `<BadgeRing>` stamp, highlight icons, `<ApronIcon>` crab guide, `<SizeDots>`): basic shapes and primary
  colors only. Sections are joined by `<Waves>` (rows of half circles); phones get a fixed call/Zalo bar (`.lp-dock`).
- `<Gallery slides>`: swipeable slider (scroll snap), arrows, shape dots, keyboard arrows, autoplay that pauses.
- Admin entry is hidden from customers: a "Quản lý" link shows only in a browser signed in to the dashboard,
  and tapping the logo 5 times opens `/admin`.

## Home page theme (minimal, refined) — the live public page

`/home` (the site root redirects there) is light and calm: warm ivory, ink, steamed-crab red and a touch of gold
(`--mn-*` tokens), serif headings in **Playfair Display** (`--font-serif`), light body text, hairlines instead of boxes.
**The food is the hero**: it opens on full-width photos of the crabs, then products and today's prices.

- Two accents with fixed jobs: **crab red** `--mn-red` = prices, totals, kickers, focus ring, button hover;
  **mangrove green** `--mn-sea` (+ `--mn-sea-wash`) = freshness and trust marks (top strip, promise icons,
  "Hợp món" chips, ✓ points). Don't swap them.
- Every value in `home.css` is a token: text `--mn-text-2xs…5xl` + `--mn-display-*`, spacing `--mn-s-1…26` (4px
  steps), radii `--mn-r-sm|md|lg|pill`, shadows `--mn-shadow-sm|(default)|lg|float`, states `--mn-focus*`,
  `--mn-lift`, `--mn-press`, `--mn-dur*`, `--mn-ease`, on-photo colors `--mn-on-photo*`, `--mn-glass`.
- Text contrast is AA: `--mn-mut` is 5.0:1 on `--mn-bg2`; `--mn-line` is for decoration only (use `--mn-line-strong`
  for dividers people need to see). Tap targets ≥ 44px. `prefers-reduced-motion` turns animations off.
- Light only (`color-scheme: light`); a dark mode would redefine the `--mn-*` colors, nothing else.

- Order of sections, along the buyer's path: photo slider (with today's lowest price) → promises → products & prices
  → customer feedback → how to order & deposit rules → FAQ → crab guide → contact. Sections alternate plain / `.hm-sec-alt`.
- Product pages `/san-pham/<slug>` (`ProductPage`, address from `slugOf(name)`): opened by "Đặt món này". Photos
  (`<Gallery>`: big photo that swipes, arrows, counter, thumbnails; `img` + `imgs` in `PRODUCT_EXTRAS`), stock,
  price, note, `<OrderBox>` (kilos → pieces, total, 30% deposit; the Zalo button copies the order message first),
  the rules, other products. Shared bits: `ProductCard`, `HomeFooter` (footer, floating buttons, phone dock),
  `HomeHeader base="/home"` on pages other than /home.
- Today's stock (`<StockNote>`, crabs only): the shop enters kg and pieces per crab each morning in the dashboard's
  Menu tab; orders delivered that day (or placed that day, without a delivery day) from "Đã xác nhận" on come off (kg from kg, "con" from pieces, `lib/stock.ts`).
  Cards and product pages show "Sẵn sàng giao · còn …" (green check) or "Đã hết hôm nay" (hollow circle), nothing
  when today's stock isn't entered. Needs the meta `stock` read policy from `supabase/schema.sql`.
- Cart: "Thêm vào giỏ" in `<OrderBox>` stores the crab in this browser (`lib/cart.ts`, localStorage, up to 10 kinds);
  the header's `<CartButton>` opens a side sheet (`<dialog>`) to change kilos, then order everything by Zalo or
  through `<RequestForm>` with all lines. On phones the header's "Đặt hàng" button hides (the bottom bar has it).
- Order requests: "Đặt giao ngày khác" in `<OrderBox>` opens `<RequestForm>` (one or more dishes in `items`, raw or steamed, name, phone, delivery day today–30 days
  ahead and time, Google Maps link, note; labels above fields, errors under each). It posts to `/api/requests`;
  the same checks (`lib/request.ts`) run in the browser, the route (same-site, size, honeypot, timing, rate limit)
  and the database (`submit_request()`). Requests wait in the dashboard's "Chờ duyệt" tab (number badge, toast when
  one arrives); confirming one creates an order at "Đã xác nhận" with channel "Website".
- Product notes: hovering a product photo (tapping it on phones) shows `.hm-peek`, a short note from `info` in
  `PRODUCT_EXTRAS` (or a general one per kind). Keep each note to about two sentences plus three dishes.
- Customer feedback: `REVIEWS` in `lib/landing.ts` (`<Reviews>`) — real messages only (screenshot and/or words);
  empty, it links to the shop's TikTok and Facebook instead. Swipe row on phones, masonry columns on desktop.
- Photos: `<Photo img alt>` (components/home/Photo.tsx) — real photos of the shop's own crabs only (set `img` in
  `GALLERY` / `PRODUCT_EXTRAS`); until then a calm line-drawing placeholder marks the spot. Shared with /bauhaus.
- Drawings: `LineCrab`, `LineShrimp`, `LineApron`, `LinePond`, `LineBox`, `LineSteam` — one thin stroke, current color.
- Buttons `.hm-btn` (ink pill) / `.hm-btn-outline` / `-light` / `-ghost` (on photos), text links `.hm-link`.
- Slider logic (`useCarousel`) and the hidden dashboard entry (`useStaffEntry`) are shared with the Bauhaus page.
