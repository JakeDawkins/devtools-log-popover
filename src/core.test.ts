import { describe, it, expect } from 'vitest';
import { filterLogs, type LogEntry } from './core';

function entry(
  id: number,
  message: string,
  category?: string,
): LogEntry {
  return { id, timestamp: new Date(), message, data: undefined, category };
}

const logs: LogEntry[] = [
  entry(1, 'User signed in', 'auth'),
  entry(2, 'GET /api/users', 'api'),
  entry(3, 'Token refresh failed', 'auth'),
  entry(4, 'POST /api/orders failed', 'api'),
  entry(5, 'App mounted successfully'),
  entry(6, 'Socket message received', 'ws'),
  entry(7, 'Turnstile challenge completed', 'auth'),
];

describe('filterLogs', () => {
  it('returns all logs when no category or search query', () => {
    const result = filterLogs(logs, null, '');
    expect(result).toEqual(logs);
  });

  it('filters by category only', () => {
    const result = filterLogs(logs, 'auth', '');
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.id)).toEqual([1, 3, 7]);
  });

  it('filters by search query only (matches message)', () => {
    const result = filterLogs(logs, null, 'socket');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(6);
  });

  it('filters by search query matching category name', () => {
    const result = filterLogs(logs, null, 'ws');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(6);
  });

  it('search is case-insensitive', () => {
    const result = filterLogs(logs, null, 'TURNSTILE');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(7);
  });

  it('combines category filter and search query (intersection)', () => {
    const result = filterLogs(logs, 'auth', 'turnstile');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(7);
  });

  it('returns empty when category + search have no intersection', () => {
    const result = filterLogs(logs, 'api', 'turnstile');
    expect(result).toHaveLength(0);
  });

  it('returns empty for a query that matches nothing', () => {
    const result = filterLogs(logs, null, 'xyznonexistent');
    expect(result).toHaveLength(0);
  });

  it('matches partial substrings in message', () => {
    const result = filterLogs(logs, null, 'mounted');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(5);
  });

  it('handles entries with no category gracefully', () => {
    const result = filterLogs(logs, null, 'app');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(5);
    expect(result[0].category).toBeUndefined();
  });

  it('empty search query with active category returns all in category', () => {
    const result = filterLogs(logs, 'api', '');
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual([2, 4]);
  });
});
