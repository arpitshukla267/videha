# Videha Overseas — Quotation Builder

Standalone web app for creating export quotations and downloading PDFs. **No backend, database, auth, or CMS dependency** — runs entirely in the browser.

## Run locally

```bash
cd quotation-builder
npm install
npm run dev
```

Open **http://localhost:3000**

## Deploy as its own site

This folder is a complete Vite + React app. Deploy the `quotation-builder` directory as a separate project:

| Platform | Root directory | Build command | Output |
|---|---|---|---|
| **Vercel** | `quotation-builder` | `npm run build` | `dist` |
| **Netlify** | `quotation-builder` | `npm run build` | `dist` |
| **Render** | `quotation-builder` | `npm install && npm run build` | Static site → `dist` |

`vercel.json` is included for SPA routing.

After deploy, set the live URL in the CMS:

```env
# cms/.env.local
NEXT_PUBLIC_QUOTATION_BUILDER_URL=https://your-quotation-app.vercel.app
```

The CMS sidebar opens that URL in a new tab.

## Configure branding

- Company details: `src/config/company.ts`
- Logo: replace `public/logo.png`

## Embed in another React app

The builder can still be imported as a component:

```tsx
import { QuotationBuilder } from "./quotation-builder/src";

export default function Page() {
  return <QuotationBuilder logoSrc="/logo.png" />;
}
```

## Scope

Create → Live A4 preview → Generate PDF → Download (client-side only).
