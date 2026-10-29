<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## UI and styling

Read `docs/design-system.md` before touching UI. In short:

- Build screens only from `@/components/ui` (Button, Panel, FormCard, TextInput, Select, DatePicker, Chip, useConfirm, Toast…).
  If something is missing, add a prop/variant to the kit (+ its CSS in `app/styles/ui.css` + an example on `/admin/kit`),
  never a one-off component or class.
- CSS values come from `app/styles/tokens.css` (no raw hex, radii or shadows elsewhere). No inline styles except data-driven values.
- Always check the change at phone width (375px).
- One component per tab in `components/views/`; order-specific parts in `components/orders/`; app shell in `components/layout/`.
