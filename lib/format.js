export function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

// The scout name saved in this browser ('' if none or storage is blocked).
export function readScoutName() {
  try {
    return localStorage.getItem('scoutName') || '';
  } catch {
    return '';
  }
}
