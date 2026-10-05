import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const formatDate = (iso) => (iso ? dayjs(iso).format('DD MMM YYYY') : '—');
export const formatDateTime = (iso) => (iso ? dayjs(iso).format('DD MMM YYYY,  hh:mm A') : '—');
export const formatNumber = (n) => (typeof n === 'number' ? n.toLocaleString('en-IN') : n);

/** "Updated 1 Day Ago" style, as on the template cards. */
export const timeAgo = (iso) => {
    if (!iso) return '—';
    const days = dayjs().startOf('day').diff(dayjs(iso).startOf('day'), 'day');
    if (days <= 0) return 'Today';
    return `${days} Day${days === 1 ? '' : 's'} Ago`;
};

export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();

/** Case-insensitive "any of these fields contains the query" match for search boxes. */
export const matchesQuery = (row, query, fields) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return fields.some((f) => String(typeof f === 'function' ? f(row) : row[f] ?? '').toLowerCase().includes(q));
};

/** Build a CSV from rows + [{ title, value(row) }] columns and trigger a browser download. */
export function downloadCsv(fileName, rows, columns) {
    const escape = (v) => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = columns.map((c) => escape(c.title)).join(',');
    const body = rows.map((r) => columns.map((c) => escape(c.value(r))).join(',')).join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

const PW_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
/** Temp password with at least one upper, lower, digit and symbol. */
export function generatePassword(length = 10) {
    const pick = (s) => s[Math.floor(Math.random() * s.length)];
    const core = Array.from({ length: length - 4 }, () => pick(PW_CHARS)).join('');
    return `${pick('ABCDEFGHJKLMNPQRSTUVWXYZ')}${pick('abcdefghjkmnpqrstuvwxyz')}${core}${pick('23456789')}${pick('@#$%&!')}`;
}
