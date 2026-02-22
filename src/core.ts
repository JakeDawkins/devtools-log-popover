export interface LogEntry {
  id: number;
  timestamp: Date;
  message: string;
  data?: unknown;
  category?: string;
}

export type UserMetadata = Record<string, unknown>;
export type UserEntry = { link?: string; metadata: UserMetadata };

export type Listener = (entry: LogEntry) => void;

export const listeners = new Set<Listener>();
let idCounter = 0;

export function devLog(message: string, data?: unknown, category?: string) {
  if (process.env.NODE_ENV !== 'development') return;
  const entry: LogEntry = {
    id: idCounter++,
    timestamp: new Date(),
    message,
    data,
    category,
  };
  listeners.forEach((l) => l(entry));
}

export const PRESET_COLORS = {
  blue: '#89b4fa',
  green: '#a6e3a1',
  yellow: '#f9e2af',
  peach: '#fab387',
  mauve: '#cba6f7',
  sky: '#89dceb',
  red: '#f38ba8',
  teal: '#94e2d5',
  pink: '#f5c2e7',
} as const;

export type PresetColor = keyof typeof PRESET_COLORS;

// Ordered palette for category colors
export const CATEGORY_COLORS = [
  PRESET_COLORS.blue,
  PRESET_COLORS.green,
  PRESET_COLORS.yellow,
  PRESET_COLORS.peach,
  PRESET_COLORS.mauve,
  PRESET_COLORS.sky,
  PRESET_COLORS.red,
  PRESET_COLORS.teal,
];

export function getCategoryColor(categories: string[], category: string) {
  const idx = categories.indexOf(category);
  return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
}

export function formatValueAsBullets(value: unknown, indent: string): string {
  if (value === null || value === undefined) return `${indent}- ${value}`;
  if (Array.isArray(value)) {
    return value
      .map((item, i) =>
        item !== null && typeof item === 'object'
          ? `${indent}- [${i}]:\n${formatValueAsBullets(item, indent + '    ')}`
          : `${indent}- [${i}]: ${JSON.stringify(item)}`,
      )
      .join('\n');
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) =>
        v !== null && typeof v === 'object'
          ? `${indent}- ${k}:\n${formatValueAsBullets(v, indent + '    ')}`
          : `${indent}- ${k}: ${JSON.stringify(v)}`,
      )
      .join('\n');
  }
  return `${indent}- ${JSON.stringify(value)}`;
}

export function formatEntryAsMarkdown(entry: LogEntry): string {
  const label = entry.category
    ? `**[${entry.category}]** \`${entry.message}\``
    : `\`${entry.message}\``;
  if (entry.data === undefined) return `- ${label}`;
  return `- ${label}\n${formatValueAsBullets(entry.data, '    ')}`;
}

export function formatLogsAsMarkdown(entries: LogEntry[]): string {
  return entries.map(formatEntryAsMarkdown).join('\n');
}
