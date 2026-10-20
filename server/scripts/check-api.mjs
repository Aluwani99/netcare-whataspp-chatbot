// Tests the request-intake connection:  npm run check-api
// Sends ONE harmless TEST request through the configured provider, then looks its reference up again.
import { config } from '../src/config.js';
import { submitRequest, getRequestStatus } from '../src/netcare.js';

const http = config.netcare.provider === 'http';
console.log(`Data source: ${http ? 'REAL intake service → ' + config.netcare.url : 'MOCK (demo only – nothing is sent anywhere)'}`);
if (!http) console.log('⚠️  To test the real service set NETCARE_PROVIDER=http, NETCARE_API_URL and NETCARE_API_KEY in .env\n');
try {
  const r = await submitRequest({ kind: 'appointment', hospital: 'TEST HOSPITAL', specialty: 'TEST', name: 'Test Person', phone: '0820000000', when: 'test', payer: 'unsure', ref: '' });
  console.log('✅ Submit OK – reference:', r.reference);
  const s = await getRequestStatus(r.reference);
  console.log(s.found ? `✅ Status OK – ${s.status}` : '❌ Status lookup did not find the reference');
} catch (e) { console.log('❌ Failed:', e.message); process.exit(1); }
