// Shared task helpers and presentation tokens used across the dashboard views.

export const PRIORITY = {
  high: {
    label: 'High',
    dot: 'bg-rose-500',
    chip: 'bg-rose-50 text-rose-700 ring-rose-200',
    soft: 'bg-rose-50 text-rose-600',
    bar: 'bg-rose-500',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-700 ring-amber-200',
    soft: 'bg-amber-50 text-amber-600',
    bar: 'bg-amber-400',
  },
  low: {
    label: 'Low',
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    soft: 'bg-emerald-50 text-emerald-600',
    bar: 'bg-emerald-500',
  },
};

export function priority(value) {
  return PRIORITY[value] || PRIORITY.medium;
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

// Sort: undone first, then priority, then time, then title — for stable list views.
export function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const p = (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
    if (p !== 0) return p;
    const ta = a.task_time || '99:99';
    const tb = b.task_time || '99:99';
    if (ta !== tb) return ta < tb ? -1 : 1;
    return (a.title || '').localeCompare(b.title || '');
  });
}

// Accepts a string ("YYYY-MM-DD" / ISO) or Date and returns a local "YYYY-MM-DD" key.
export function toDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function normalizeTime(value) {
  if (!value) return '';
  return value.slice(0, 5);
}

export function formatTime(value) {
  const t = normalizeTime(value);
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDate(value) {
  const key = toDateKey(value);
  if (!key) return 'No date';
  const date = new Date(`${key}T00:00:00`);
  if (Number.isNaN(date.getTime())) return key;
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatFullDate(key) {
  if (!key) return '';
  const date = new Date(`${key}T00:00:00`);
  if (Number.isNaN(date.getTime())) return key;
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function getToday() {
  return toDateKey(new Date());
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function monthLabel(date) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
}

// Build a 6x7 grid of day cells covering the month, padded with adjacent days.
export function buildCalendar(monthDate) {
  const first = startOfMonth(monthDate);
  const startDay = first.getDay(); // 0 = Sunday
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startDay);

  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    cells.push({
      date,
      key: toDateKey(date),
      inMonth: date.getMonth() === monthDate.getMonth(),
    });
  }
  return cells;
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
