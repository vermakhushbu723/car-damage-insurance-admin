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

/** Rows + [{ title, value(row) }] columns -> delimited text (CSV by default, tab for Excel). */
export function toDelimited(rows, columns, sep = ',') {
    const escape = (v) => {
        const s = String(v ?? '');
        return /[",\n\t]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = columns.map((c) => escape(c.title)).join(sep);
    const body = rows.map((r) => columns.map((c) => escape(c.value(r))).join(sep)).join('\n');
    return `${header}\n${body}`;
}

/** Build a CSV from rows + [{ title, value(row) }] columns and trigger a browser download. */
export function downloadCsv(fileName, rows, columns) {
    return downloadFile(fileName, toDelimited(rows, columns), 'text/csv;charset=utf-8');
}

/** Triggers a browser download of `content`; returns the file size in bytes. */
export function downloadFile(fileName, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return blob.size;
}

/** "4.2 MB" / "18 KB" */
export const formatSize = (kb) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`);

const PW_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
/** Temp password with at least one upper, lower, digit and symbol. */
export function generatePassword(length = 10) {
    const pick = (s) => s[Math.floor(Math.random() * s.length)];
    const core = Array.from({ length: length - 4 }, () => pick(PW_CHARS)).join('');
    return `${pick('ABCDEFGHJKLMNPQRSTUVWXYZ')}${pick('abcdefghjkmnpqrstuvwxyz')}${core}${pick('23456789')}${pick('@#$%&!')}`;
}

/**
 * StatCard trend props: how many `items` matching `match` fall in the last
 * 30 days vs the 30 days before (by `dateOf`). -> { trend: '12%', trendDown }
 */
export function periodTrend(items, dateOf, match = () => true) {
    const now = dayjs();
    let current = 0;
    let previous = 0;
    for (const it of items) {
        if (!match(it)) continue;
        const d = dayjs(dateOf(it));
        if (d.isAfter(now.subtract(30, 'day'))) current += 1;
        else if (d.isAfter(now.subtract(60, 'day'))) previous += 1;
    }
    const pct = previous ? Math.round(((current - previous) / previous) * 1000) / 10 : current ? 100 : 0;
    return { trend: `${Math.abs(pct)}%`, trendDown: pct < 0 };
}
