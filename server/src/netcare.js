// Intake layer: where appointment / call-back requests go, and how request status is looked up.
//   submitRequest(payload) -> { reference }
//   getRequestStatus(reference) -> { found:false } | { found:true, status, kind, hospital, specialty, createdAt }
//
// NETCARE_PROVIDER=mock -> DEMO ONLY. Nothing is sent anywhere. A reference is generated and only
//   non-personal details (hospital, specialty, type, time) are kept in memory so status checks can be demonstrated.
//   The person's name and phone number are NEVER stored by the mock.
// NETCARE_PROVIDER=http -> your real intake service (Netcare CRM / booking system / secure webhook):
//   POST {NETCARE_API_URL}/requests          body: {kind,hospital,specialty,topic,action,name,phone,when,payer,ref}  -> 200 {"reference":"NC-XXXXXX"}
//   GET  {NETCARE_API_URL}/requests/{ref}    -> 200 {"status","kind","hospital","specialty","createdAt"} | 404
//   (Authorization: Bearer NETCARE_API_KEY.)  Adapt to whatever Netcare's real system exposes.
import { config } from './config.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeRef = () => 'NC-' + Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
const MOCK = new Map();

const mock = {
  async submit(p) {
    const reference = makeRef();
    MOCK.set(reference, { status: 'Received – waiting for the rooms to contact you', kind: p.kind, hospital: p.hospital, specialty: p.specialty || p.topic || p.action || '', createdAt: new Date().toISOString() });
    return { reference };
  },
  async status(ref) { return MOCK.has(ref) ? { found: true, ...MOCK.get(ref) } : { found: false }; },
};

async function call(path, init = {}) {
  if (!config.netcare.url) throw new Error('NETCARE_API_URL is not set');
  const res = await fetch(config.netcare.url.replace(/\/$/, '') + path, {
    ...init,
    headers: { Authorization: `Bearer ${config.netcare.key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Intake service returned ${res.status}`);
  return res.json();
}
const http = {
  submit: (p) => call('/requests', { method: 'POST', body: JSON.stringify(p) }),
  async status(ref) { const d = await call(`/requests/${encodeURIComponent(ref)}`); return d ? { found: true, ...d } : { found: false }; },
};

const useHttp = () => config.netcare.provider === 'http';
export const submitRequest = (p) => (useHttp() ? http.submit(p) : mock.submit(p));
export const getRequestStatus = (r) => (useHttp() ? http.status(r) : mock.status(r));
export const isMockMode = () => !useHttp();
