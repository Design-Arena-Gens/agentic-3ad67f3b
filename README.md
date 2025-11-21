# Tally Ledger Emailer

A Next.js web port of the Tally Prime custom email add-on. Compose and send professional emails with an attached ledger statement PDF directly from a voucher-style workflow. Optimized for Vercel deployment.

## ✨ Features
- `Alt + B` shortcut (or button) to open the custom email dialog from anywhere in the app.
- Party selector with auto-filled email pulled from ledger master data.
- Editable subject and rich email body seeded with a professional template.
- Inline ledger preview and PDF generation covering the current financial year.
- SMTP delivery with PDF attachment saved to `generated-ledgers/` (auto-created).

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` and press `Alt + B` to launch the email composer.

### Environment variables
Configure SMTP so the API route can deliver mail:

```
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASS=your_password
SMTP_FROM=accounts@yourcompany.com # optional, defaults to SMTP_USER
```

## 🧱 Project Structure

```
app/
  api/send-email/route.ts   # Serverless action: validates input, builds PDF, sends email
  layout.tsx                # Global layout
  page.tsx                  # App UI + modal workflow
lib/ledger.ts               # Mock ledger + helper utilities
```

## 🛡️ Notes & Parity with Tally
- The ledger PDF mimics the desktop add-on: period = start of FY → today, currency = INR.
- Output path emulates the desktop requirement via `generated-ledgers/` (gitignored, auto-created).
- API errors return the same validation messaging as the original Tally flow.
- Keyboard shortcuts mirror the add-on: `Alt + S` to send, `Esc` to cancel.

## ✅ Verification

```bash
npm run lint
npm run build
```

Add your SMTP credentials before running a production deployment.
