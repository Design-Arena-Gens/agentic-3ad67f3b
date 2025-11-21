import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tally Ledger Emailer',
  description: 'Send custom ledger statements via email with inline PDF generation.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
