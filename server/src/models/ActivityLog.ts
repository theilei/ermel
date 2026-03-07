// ============================================================
// Activity Log Model — In-memory store
// ============================================================

export interface ActivityLog {
  id: string;
  event: string;
  quoteId?: string;
  orderId?: string;
  userRole: 'admin' | 'customer';
  userName: string;
  timestamp: string;
  details?: string;
}

let logSeq = 1;
const logs: ActivityLog[] = [];

export function addLog(entry: Omit<ActivityLog, 'id' | 'timestamp'>): ActivityLog {
  const log: ActivityLog = {
    ...entry,
    id: `LOG-${String(logSeq++).padStart(5, '0')}`,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(log); // newest first
  return log;
}

export function getAllLogs(): ActivityLog[] {
  return [...logs];
}

export function getLogsByQuote(quoteId: string): ActivityLog[] {
  return logs.filter((l) => l.quoteId === quoteId);
}

export function getLogsByOrder(orderId: string): ActivityLog[] {
  return logs.filter((l) => l.orderId === orderId);
}
