import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(dateStr));
}

export function truncate(str, n = 80) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const PRIORITY_LABELS = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const STATUS_LABELS = {
  pending: 'Pending',
  analysed: 'Analysed',
  under_review: 'Under Review',
  resolved: 'Resolved',
  rejected: 'Rejected',
  duplicate: 'Duplicate',
};

export const CATEGORIES = [
  'Infrastructure', 'Health', 'Education', 'Water', 'Electricity',
  'Sanitation', 'Transport', 'Housing', 'Agriculture',
  'Law & Order', 'Environment', 'Finance', 'Other',
];
