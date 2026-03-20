import { validateReservationDate } from '../../server/src/controllers/reservationController';

const DAY_MS = 24 * 60 * 60 * 1000;

function asIsoDate(offsetDays: number): string {
  const now = new Date();
  const utcDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const target = new Date(utcDay.getTime() + offsetDays * DAY_MS);
  return target.toISOString().slice(0, 10);
}

describe('reservation rules', () => {
  test('rejects dates earlier than 3 days from today', () => {
    const date = asIsoDate(2);
    const result = validateReservationDate(date);
    expect(result.ok).toBe(false);
  });

  test('accepts dates from 3 to 60 days from today', () => {
    expect(validateReservationDate(asIsoDate(3)).ok).toBe(true);
    expect(validateReservationDate(asIsoDate(60)).ok).toBe(true);
  });

  test('rejects dates beyond 60 days', () => {
    const result = validateReservationDate(asIsoDate(61));
    expect(result.ok).toBe(false);
  });
});
