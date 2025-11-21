export type LedgerParty = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
};

export type LedgerEntry = {
  id: string;
  partyId: string;
  date: string;
  reference: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
};

export type FinancialYear = {
  label: string;
  start: string;
  end: string;
};

export const financialYear: FinancialYear = (() => {
  const today = new Date();
  const year = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
  const start = new Date(year, 3, 1);
  start.setHours(0, 0, 0, 0);
  const end = today;
  end.setHours(23, 59, 59, 999);
  return {
    label: `${year}-${year + 1}`,
    start: start.toISOString(),
    end: end.toISOString()
  };
})();

export const parties: LedgerParty[] = [
  {
    id: 'abc-co',
    name: 'ABC Company Ltd',
    email: 'accounts@abccompany.com',
    phone: '+91 9830012345',
    address: '15B Park Street, Kolkata'
  },
  {
    id: 'xyz-traders',
    name: 'XYZ Traders',
    email: 'finance@xyztraders.in',
    phone: '+91 9988776655',
    address: '7 MG Road, Bengaluru'
  },
  {
    id: 'prime-industries',
    name: 'Prime Industries Pvt Ltd',
    email: 'ap@primeindustries.in',
    phone: '+91 8877665544',
    address: 'Plot 21, MIDC, Pune'
  }
];

const entrySeed: Array<Omit<LedgerEntry, 'balance'>> = [
  {
    id: 'entry-1',
    partyId: 'abc-co',
    date: '2024-04-05',
    reference: 'SA/24-0001',
    particulars: 'Sales Invoice',
    debit: 0,
    credit: 152000
  },
  {
    id: 'entry-2',
    partyId: 'abc-co',
    date: '2024-05-02',
    reference: 'RC/24-0009',
    particulars: 'Receipt',
    debit: 152000,
    credit: 0
  },
  {
    id: 'entry-3',
    partyId: 'xyz-traders',
    date: '2024-04-10',
    reference: 'SA/24-0010',
    particulars: 'Sales Invoice',
    debit: 0,
    credit: 84500
  },
  {
    id: 'entry-4',
    partyId: 'xyz-traders',
    date: '2024-05-15',
    reference: 'RC/24-0022',
    particulars: 'Receipt',
    debit: 50000,
    credit: 0
  },
  {
    id: 'entry-5',
    partyId: 'prime-industries',
    date: '2024-04-18',
    reference: 'SA/24-0025',
    particulars: 'Sales Invoice',
    debit: 0,
    credit: 193400
  }
];

export const ledgerEntries: LedgerEntry[] = entrySeed.map((entry) => {
  const previousEntries = entrySeed
    .filter((seed) => seed.partyId === entry.partyId && new Date(seed.date) <= new Date(entry.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let balance = 0;
  for (const item of previousEntries) {
    balance += item.credit - item.debit;
  }
  return {
    ...entry,
    balance
  };
});

export function findParty(partyId: string) {
  return parties.find((party) => party.id === partyId);
}

export function getLedgerForParty(partyId: string) {
  return ledgerEntries
    .filter((entry) => entry.partyId === partyId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
