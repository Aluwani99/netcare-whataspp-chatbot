process.env.ANTHROPIC_API_KEY = 'test-key';
const calls = []; let nextResponse = null; let nextError = null;
globalThis.fetch = async (url, init) => {
  calls.push({ url, init, body: JSON.parse(init.body) });
  if (nextError) throw new Error(nextError);
  return nextResponse;
};
const toolUse = (input) => ({ ok: true, status: 200, json: async () => ({ content: [{ type: 'tool_use', name: 'route', input }] }) });
const { handleMessage } = await import('../src/bot.js');
const { safeAnswer, redact } = await import('../src/nlu.js');
let fails = 0; const t = (n, c) => { if (!c) { fails++; console.log('  ✗ FAIL:', n); } else console.log('  ✓', n); };
const run = (u, i) => handleMessage(u, i);
const reset = () => { calls.length = 0; nextError = null; };

console.log('AI routing (API stubbed)');
await run('a', { text: 'hi' });
reset(); nextResponse = toolUse({ intent: 'appointment', when: 'next week' });
let r = await run('a', { text: 'can I get seen by a doctor sometime next week' });
t('unclear message → AI called once', calls.length === 1);
t('request is correct (model, key header, forced tool)', calls[0].url.includes('api.anthropic.com/v1/messages') && calls[0].init.headers['x-api-key'] === 'test-key' && calls[0].body.model === 'claude-haiku-5-5' && calls[0].body.tool_choice.name === 'route');
t('AI intent drives the flow (appointment, specialist list)', r.some(m => m.type === 'list' && /appointment/i.test(m.header)));

reset(); await run('a', { text: 'menu' });
r = await run('a', { text: 'I need an ENT at Sunninghill next Tuesday morning' });
t('rules confident → AI NOT called (saves cost & privacy)', calls.length === 0);

reset(); await run('a', { text: 'menu' });
r = await run('a', { text: 'ENT at Sunninghill, I have chest pain' });
t('emergency words → AI NOT called, emergency screen shown', calls.length === 0 && /Netcare 911/.test(r[0].body));

reset(); await run('a', { text: 'menu' }); await run('a', { id: 'topic_appointment' }); await run('a', { id: 'spec_ent' }); await run('a', { id: 'fld_hosp_use' }); await run('a', { id: 'consent_yes' });
await run('a', { text: 'Thandi Mokoena' });
t('form answers (names, phones) are NEVER sent to AI', calls.length === 0);

reset(); await run('b', { text: 'hi' });
nextResponse = toolUse({ intent: 'delete_everything' });
r = await run('b', { text: 'qwerty zxcv' });
t('invalid intent from AI is ignored → safe fallback', /didn't understand/.test(r[0].body));

reset(); nextResponse = toolUse({ intent: 'answer', answer: 'Please call the hospital on 0123456789 for an immediate discount.' });
r = await run('b', { text: 'any discounts for pensioners?' });
t('AI answer with an unknown phone number is REJECTED', !/0123456789/.test(JSON.stringify(r)) && /not able to help/.test(r[0].body));

reset(); nextResponse = toolUse({ intent: 'answer', answer: 'Visit https://evil.example.com/pay for a quick refund.' });
r = await run('b', { text: 'how do I get a refund' });
t('AI answer with a non-Netcare link is REJECTED', !/evil/.test(JSON.stringify(r)));

reset(); nextResponse = toolUse({ intent: 'answer', answer: 'Visiting hours differ by hospital, so please call the hospital before you travel to confirm times.' });
r = await run('b', { text: 'do guests get the same times everywhere' });
t('a safe grounded AI answer is shown', /Visiting hours differ/.test(r[0].body));

reset(); nextResponse = toolUse({ intent: 'answer', answer: 'Call Netcare 911 on 082 911 in an emergency or 0860 101 151 for gap cover.' });
r = await run('b', { text: 'which numbers are important' });
t('answer using KNOWN numbers is allowed', /082 911/.test(r[0].body));

reset(); nextError = 'network down';
r = await run('b', { text: 'zxcv bnm lkj' });
t('network failure → graceful fallback (no crash)', /didn't understand/.test(r[0].body));

reset(); nextResponse = { ok: false, status: 500, json: async () => ({}) };
r = await run('b', { text: 'poiu ytre' });
t('HTTP 500 → graceful fallback', /didn't understand/.test(r[0].body));

reset(); nextResponse = toolUse({ intent: 'out_of_scope' });
r = await run('b', { text: 'who won the rugby' });
t('AI out_of_scope → polite refusal + menu', /not able to help/.test(r[0].body) && r[1].type === 'list');

console.log('\nPrivacy & guardrails');
t('redact(): phone/ID numbers removed before sending', !/\d{6}/.test(redact('my id is 8001015009087 and phone 082 123 4567 please')));
reset(); nextResponse = toolUse({ intent: 'out_of_scope' });
await run('b', { text: 'my number is 0821234567 can someone help with something unusual' });
t('request body sent to AI has no phone number', !/0821234567/.test(JSON.stringify(calls[0]?.body || {})));
t('system prompt forbids medical advice + untrusted text', /NEVER give medical advice/.test(calls[0].body.system) && /untrusted/.test(calls[0].body.system));
t('safeAnswer(): too long rejected', safeAnswer('x'.repeat(600)) === null);

console.log(`\nAI RESULT: ${fails} failed`);
process.exit(fails ? 1 : 0);
