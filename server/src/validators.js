// Input checks for the request forms.

// South African mobile/landline -> 0XXXXXXXXX (accepts +27…, 27…, spaces, dashes)
export function normPhone(raw) {
  let d = String(raw).replace(/[\s()-]/g, '');
  if (d.startsWith('+27')) d = '0' + d.slice(3);
  else if (d.startsWith('27') && d.length === 11) d = '0' + d.slice(2);
  return /^0\d{9}$/.test(d) ? d : null;
}
export const isValidName = (s) => /^\p{L}[\p{L} .'’-]{1,59}$/u.test(String(s).trim());
export const isValidText = (s, min = 3, max = 100) => { const t = String(s).trim(); return t.length >= min && t.length <= max; };
export const normRef = (s) => String(s).trim().toUpperCase();
export const isValidRef = (s) => /^NC-[A-Z0-9]{6}$/.test(normRef(s));
