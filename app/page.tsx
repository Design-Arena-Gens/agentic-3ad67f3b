'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { parties, findParty, getLedgerForParty } from '@/lib/ledger';

type Status =
  | { state: 'idle' }
  | { state: 'success'; message: string }
  | { state: 'error'; message: string }
  | { state: 'sending' };

const defaultSubject = 'Tax Invoice & Ledger Statement';
const defaultBody = `Dear Sir/Madam,

Please find attached:
1) Tax Invoice
2) Ledger Statement

Regards,
Your Company Name`;

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState(parties[0]?.id ?? '');
  const [email, setEmail] = useState(parties[0]?.email ?? '');
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [status, setStatus] = useState<Status>({ state: 'idle' });

  const selectedParty = useMemo(() => findParty(selectedPartyId ?? ''), [selectedPartyId]);
  const ledgerPreview = useMemo(() => {
    if (!selectedPartyId) {
      return [];
    }
    return getLedgerForParty(selectedPartyId);
  }, [selectedPartyId]);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
    setStatus({ state: 'idle' });
    if (!selectedPartyId && parties.length > 0) {
      setSelectedPartyId(parties[0].id);
      setEmail(parties[0].email);
    }
  }, [selectedPartyId]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const submit = useCallback(async () => {
    if (!selectedPartyId) {
      setStatus({ state: 'error', message: 'Please select a Party Ledger.' });
      return;
    }
    if (!email) {
      setStatus({ state: 'error', message: 'Please enter an Email Address.' });
      return;
    }

    setStatus({ state: 'sending' });

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          partyId: selectedPartyId,
          email,
          subject,
          body
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Failed to send email');
      }

      const result = await response.json();
      setStatus({ state: 'success', message: result.message ?? 'Email sent successfully.' });
    } catch (error) {
      setStatus({
        state: 'error',
        message: error instanceof Error ? error.message : 'Failed to send email.'
      });
    }
  }, [body, email, selectedPartyId, subject]);

  const handleSubmit = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      void submit();
    },
    [submit]
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey && (event.key === 'b' || event.key === 'B')) {
        event.preventDefault();
        openModal();
      }
      if (event.altKey && (event.key === 's' || event.key === 'S')) {
        if (isModalOpen) {
          event.preventDefault();
          void submit();
        }
      }
      if (event.key === 'Escape' && isModalOpen) {
        event.preventDefault();
        closeModal();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeModal, isModalOpen, openModal, submit]);

  useEffect(() => {
    if (!isModalOpen && selectedParty) {
      setSubject(defaultSubject);
      setBody(defaultBody);
      setStatus({ state: 'idle' });
    }
  }, [isModalOpen, selectedParty]);

  useEffect(() => {
    if (selectedParty) {
      setEmail(selectedParty.email);
    }
  }, [selectedPartyId, selectedParty]);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl bg-white p-10 shadow-xl">
          <header className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-50 px-4 py-1 text-sm font-medium text-indigo-600">
              Alt + B
            </span>
            <h1 className="text-3xl font-semibold text-gray-900">Custom Tally Email Trigger</h1>
            <p className="text-gray-600">
              Launch the custom email composer from any voucher screen. One shortcut, instant ledger PDF, professional
              email, and attachment-ready.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={openModal}
                className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
              >
                Press Alt + B
              </button>
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-300 px-5 py-3 text-sm text-gray-500">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                  2
                </span>
                Gateway of Tally → Send Custom Email
              </div>
            </div>
          </header>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-indigo-700">Method 1: From Any Voucher</h2>
            <ol className="mt-4 space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                  1
                </span>
                Open any Sales, Purchase, or Accounting voucher.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                  2
                </span>
                Press <strong>Alt + B</strong> to launch the custom email composer instantly.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                  3
                </span>
                Review the auto-filled party details, tweak the message, and send with <strong>Alt + S</strong>.
              </li>
            </ol>
          </article>

          <article className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Method 2: From Gateway</h2>
            <p className="mt-4 text-sm text-gray-600">
              Navigate to <strong>Gateway of Tally → Send Custom Email</strong> to access the same popup without
              opening a voucher. Perfect for resending statements or following up without leaving the dashboard.
            </p>
            <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-xs text-gray-500">
              Tip: ensure your SMTP settings are configured under <strong>F12 → E-Mailing</strong> and the folder
              <code className="ml-1 rounded bg-white px-2 py-0.5">generated-ledgers/</code> exists (auto-created here).
            </div>
          </article>
        </section>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-8">
                <header className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Send Custom Email</h2>
                    <p className="text-sm text-gray-500">
                      Attach ledger statement PDF automatically generated for the selected party.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
                  >
                    Esc
                  </button>
                </header>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                    Select Party
                    <select
                      value={selectedPartyId}
                      onChange={(event) => {
                        setSelectedPartyId(event.target.value);
                        const party = findParty(event.target.value);
                        if (party) {
                          setEmail(party.email);
                        }
                      }}
                      className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 shadow-sm focus-visible:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                    >
                      <option value="">Select a party</option>
                      {parties.map((party) => (
                        <option value={party.id} key={party.id}>
                          {party.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                    Email Address
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      placeholder="accounts@example.com"
                      className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 shadow-sm focus-visible:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                  Subject
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 shadow-sm focus-visible:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                  Body
                  <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    rows={8}
                    className="rounded-3xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 shadow-sm focus-visible:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                  />
                </label>

                <div className="rounded-3xl bg-gray-50 p-4 text-sm text-gray-600">
                  <strong className="font-semibold text-gray-800">Attachment preview</strong>
                  <p className="mt-1">Ledger statement PDF: automatically generated from {selectedParty?.name ?? 'selected party'}.</p>
                  <p className="mt-1 text-xs text-gray-500">Files stored briefly at /generated-ledgers for download durability.</p>
                </div>

                {ledgerPreview.length > 0 && (
                  <div className="overflow-hidden rounded-3xl border border-gray-100 shadow-sm">
                    <table className="w-full table-fixed border-collapse text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Date</th>
                          <th className="px-4 py-3 font-semibold">Reference</th>
                          <th className="px-4 py-3 font-semibold">Particulars</th>
                          <th className="px-4 py-3 text-right font-semibold">Debit</th>
                          <th className="px-4 py-3 text-right font-semibold">Credit</th>
                          <th className="px-4 py-3 text-right font-semibold">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledgerPreview.map((entry) => (
                          <tr key={entry.id} className="odd:bg-white even:bg-gray-50">
                            <td className="px-4 py-2 text-gray-700">{new Date(entry.date).toLocaleDateString()}</td>
                            <td className="px-4 py-2 text-gray-700">{entry.reference}</td>
                            <td className="px-4 py-2 text-gray-700">{entry.particulars}</td>
                            <td className="px-4 py-2 text-right text-gray-700">
                              {entry.debit ? entry.debit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-700">
                              {entry.credit ? entry.credit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-gray-900">
                              {entry.balance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {status.state !== 'idle' && (
                  <div
                    className={`rounded-3xl px-4 py-3 text-sm font-semibold ${
                      status.state === 'success'
                        ? 'bg-emerald-50 text-emerald-700'
                        : status.state === 'error'
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    {status.state === 'sending' ? 'Sending email…' : status.message}
                  </div>
                )}

                <footer className="flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs font-medium text-gray-500">
                    Alt + S to send • Esc to cancel
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
                    >
                      Cancel (Esc)
                    </button>
                    <button
                      type="submit"
                      disabled={status.state === 'sending'}
                      className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-indigo-300"
                    >
                      Send Email (Alt + S)
                    </button>
                  </div>
                </footer>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
