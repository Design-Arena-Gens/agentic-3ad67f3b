import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { findParty, financialYear, getLedgerForParty } from '@/lib/ledger';

const payloadSchema = z.object({
  partyId: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1)
});

const outputDirectory = path.join(process.cwd(), 'generated-ledgers');

function ensureOutputDirectory() {
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }
}

function buildLedgerPdfBuffer(partyId: string) {
  const party = findParty(partyId);
  if (!party) {
    throw new Error('Party not found');
  }

  const ledger = getLedgerForParty(partyId);
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => {
    chunks.push(chunk);
  });

  doc.on('error', (error) => {
    throw error;
  });

  doc.fontSize(18).text(party.name, { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(12).text(party.address ?? '', { continued: false });
  if (party.phone) {
    doc.text(`Phone: ${party.phone}`);
  }
  doc.moveDown();

  doc.fontSize(14).text('Ledger Statement', { align: 'left' });
  doc.fontSize(11).text(`Financial Year: ${financialYear.label}`);
  doc.text(
    `Period: ${new Date(financialYear.start).toLocaleDateString()} - ${new Date(financialYear.end).toLocaleDateString()}`
  );
  doc.moveDown();

  const tableTop = doc.y + 10;
  const columnWidths = [90, 90, 160, 80, 80, 90];

  doc.font('Helvetica-Bold');
  const headers = ['Date', 'Reference', 'Particulars', 'Debit', 'Credit', 'Balance'];
  headers.forEach((header, index) => {
    doc.text(header, 50 + columnWidths.slice(0, index).reduce((acc, width) => acc + width, 0), tableTop, {
      width: columnWidths[index],
      align: index >= 3 ? 'right' : 'left'
    });
  });
  doc.moveDown();
  doc.font('Helvetica');

  ledger.forEach((entry) => {
    const rowTop = doc.y + 5;
    const cells = [
      new Date(entry.date).toLocaleDateString(),
      entry.reference,
      entry.particulars,
      entry.debit ? entry.debit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-',
      entry.credit ? entry.credit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-',
      entry.balance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
    ];
    cells.forEach((cell, index) => {
      doc.text(cell, 50 + columnWidths.slice(0, index).reduce((acc, width) => acc + width, 0), rowTop, {
        width: columnWidths[index],
        align: index >= 3 ? 'right' : 'left'
      });
    });
  });

  doc.end();
  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);
  });
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error('SMTP configuration is incomplete. Ensure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS are set.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = payloadSchema.parse(json);
    const party = findParty(parsed.partyId);

    if (!party) {
      return NextResponse.json({ error: 'Please select a Party Ledger' }, { status: 400 });
    }

    ensureOutputDirectory();
    const pdfBuffer = await buildLedgerPdfBuffer(parsed.partyId);

    const fileName = `Ledger_${party.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    const filePath = path.join(outputDirectory, fileName);
    await fs.promises.writeFile(filePath, pdfBuffer);

    const transporter = createTransport();
    const fromAddress = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'no-reply@example.com';

    await transporter.sendMail({
      from: fromAddress,
      to: parsed.email,
      subject: parsed.subject,
      text: parsed.body,
      attachments: [
        {
          filename: fileName,
          path: filePath
        }
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully with Ledger attachment!',
      filePath
    });
  } catch (error) {
    console.error('Failed to send email', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? 'Invalid payload' }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}
