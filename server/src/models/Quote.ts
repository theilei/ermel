// ============================================================
// Quote Model — In-memory store (will migrate to PostgreSQL)
// ============================================================

export type QuoteStatus =
  | 'pending'
  | 'draft'
  | 'approved'
  | 'customer_accepted'
  | 'customer_declined'
  | 'converted_to_order'
  | 'expired';

export interface Quote {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  projectType: string;
  glassType: string;
  frameMaterial: string;
  width: number;
  height: number;
  quantity: number;
  color: string;
  estimatedCost: number;
  status: QuoteStatus;
  submissionDate: string;
  rejectionReason?: string;
  approvedDate?: string;
  expiryDate?: string;
  acceptedDate?: string;
  declinedDate?: string;
  convertedDate?: string;
  notes?: string;
}

// ---- Sequential ID counter ----
let quoteSeq = 8; // Start after mock data

function genId(seq: number): string {
  return `Q-${String(seq).padStart(4, '0')}`;
}

// ---- In-memory store with seed data ----
const quotes: Map<string, Quote> = new Map();

// Seed mock data
const seedData: Quote[] = [
  {
    id: 'Q-0001',
    customerName: 'Maria Santos',
    customerEmail: 'maria.santos@email.com',
    customerPhone: '09171234567',
    customerAddress: '123 Rizal Ave, Makati City, Metro Manila',
    projectType: 'Storefront',
    glassType: 'Clear Glass',
    frameMaterial: 'Aluminum Frame',
    width: 240,
    height: 180,
    quantity: 1,
    color: 'Clear',
    estimatedCost: 45000,
    status: 'pending',
    submissionDate: '2026-02-28',
  },
  {
    id: 'Q-0002',
    customerName: 'Jose Reyes',
    customerEmail: 'jose.reyes@email.com',
    customerPhone: '09281234567',
    customerAddress: '456 Bonifacio St, Taguig City, Metro Manila',
    projectType: 'Sliding Window',
    glassType: 'Bronze Glass',
    frameMaterial: 'Aluminum Frame',
    width: 180,
    height: 120,
    quantity: 2,
    color: 'Bronze',
    estimatedCost: 28000,
    status: 'draft',
    submissionDate: '2026-02-25',
  },
  {
    id: 'Q-0003',
    customerName: 'Ana Dela Cruz',
    customerEmail: 'ana.delacruz@email.com',
    customerPhone: '09351234567',
    customerAddress: '789 Mabini Blvd, Pasig City, Metro Manila',
    projectType: 'Glass Partition',
    glassType: 'Frosted Glass',
    frameMaterial: 'Steel Frame',
    width: 300,
    height: 250,
    quantity: 1,
    color: 'Frosted',
    estimatedCost: 62000,
    status: 'approved',
    submissionDate: '2026-02-20',
    approvedDate: '2026-02-22',
    expiryDate: '2026-03-24',
  },
  {
    id: 'Q-0004',
    customerName: 'Roberto Lim',
    customerEmail: 'roberto.lim@email.com',
    customerPhone: '09451234567',
    customerAddress: '321 Luna St, Quezon City, Metro Manila',
    projectType: 'Glass Door',
    glassType: 'Tempered Glass',
    frameMaterial: 'Stainless Frame',
    width: 100,
    height: 220,
    quantity: 1,
    color: 'Clear',
    estimatedCost: 35000,
    status: 'customer_accepted',
    submissionDate: '2026-02-15',
    approvedDate: '2026-02-17',
    expiryDate: '2026-03-19',
    acceptedDate: '2026-02-19',
  },
  {
    id: 'Q-0005',
    customerName: 'Carla Mendoza',
    customerEmail: 'carla.mendoza@email.com',
    customerPhone: '09561234567',
    customerAddress: '654 Aguinaldo Hwy, Cavite City, Cavite',
    projectType: 'Awning Window',
    glassType: 'Clear Glass',
    frameMaterial: 'Aluminum Frame',
    width: 120,
    height: 90,
    quantity: 3,
    color: 'Clear',
    estimatedCost: 18000,
    status: 'converted_to_order',
    submissionDate: '2026-02-10',
    approvedDate: '2026-02-12',
    expiryDate: '2026-03-14',
    acceptedDate: '2026-02-14',
    convertedDate: '2026-02-16',
  },
  {
    id: 'Q-0006',
    customerName: 'Pedro Garcia',
    customerEmail: 'pedro.garcia@email.com',
    customerPhone: '09671234567',
    customerAddress: '987 Del Pilar St, Manila City, Metro Manila',
    projectType: 'Fixed Window',
    glassType: 'Bronze Glass',
    frameMaterial: 'Aluminum Frame',
    width: 200,
    height: 150,
    quantity: 2,
    color: 'Bronze',
    estimatedCost: 32000,
    status: 'customer_declined',
    submissionDate: '2026-02-08',
    approvedDate: '2026-02-10',
    expiryDate: '2026-03-12',
    declinedDate: '2026-02-12',
  },
  {
    id: 'Q-0007',
    customerName: 'Linda Torres',
    customerEmail: 'linda.torres@email.com',
    customerPhone: '09781234567',
    customerAddress: '147 Quezon Ave, Caloocan City, Metro Manila',
    projectType: 'Glass Partition',
    glassType: 'Tempered Glass',
    frameMaterial: 'Aluminum Frame',
    width: 400,
    height: 280,
    quantity: 1,
    color: 'Clear',
    estimatedCost: 85000,
    status: 'pending',
    submissionDate: '2026-03-01',
  },
];

seedData.forEach((q) => quotes.set(q.id, q));

// ---- CRUD operations ----
export function getAllQuotes(): Quote[] {
  return Array.from(quotes.values()).sort(
    (a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
  );
}

export function getQuoteById(id: string): Quote | undefined {
  return quotes.get(id);
}

export function getQuotesByEmail(email: string): Quote[] {
  return getAllQuotes().filter((q) => q.customerEmail.toLowerCase() === email.toLowerCase());
}

export function createQuote(data: Omit<Quote, 'id' | 'status' | 'submissionDate'>): Quote {
  const id = genId(quoteSeq++);
  const quote: Quote = {
    ...data,
    id,
    status: 'pending',
    submissionDate: new Date().toISOString().split('T')[0],
  };
  quotes.set(id, quote);
  return quote;
}

export function updateQuote(id: string, updates: Partial<Quote>): Quote | undefined {
  const existing = quotes.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, id: existing.id }; // never overwrite id
  quotes.set(id, updated);
  return updated;
}

// ---- Check and expire old approved quotes ----
export function expireOldQuotes(): number {
  const now = new Date();
  let count = 0;
  quotes.forEach((q) => {
    if (q.status === 'approved' && q.expiryDate && new Date(q.expiryDate) < now) {
      q.status = 'expired';
      count++;
    }
  });
  return count;
}
