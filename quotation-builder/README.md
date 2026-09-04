# Videha Overseas — Quotation Builder

Standalone, portable quotation builder. **No backend, database, auth, or CMS dependency.**

All quotation logic, UI, styles, calculations, and PDF generation live in this folder.

## Extract later

1. Copy the entire `quotation-builder/` folder into another React project.
2. Install deps: `jspdf`, `html2canvas`, and peer `react` / `react-dom`.
3. Serve the logo from your host (`public/`) or pass `logoSrc`.
4. Mount:

```tsx
import { QuotationBuilder } from "./quotation-builder/src";

export default function Page() {
  return <QuotationBuilder logoSrc="/quotation-builder-logo.png" />;
}
```

## Configure branding

Edit `src/config/company.ts` and replace `assets/logo.png` as needed.

## Scope (V1)

Create → Live A4 preview → Generate PDF → Download

Everything runs **client-side only**.
