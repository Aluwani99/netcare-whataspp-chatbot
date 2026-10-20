import { handleMessage } from '../src/bot.js';
let sid = 0, taps = 0; const problems = [], seen = new Set();
const AUTO = [[/What is your \*?full name/, 'Sam Test'], [/best \*?phone number\*? to reach you/, '0821234567'], [/When would you like to be seen/, 'Friday morning'], [/account or booking reference\? Type it/, 'skip'], [/Which specialist do you need\? \(for example/, 'dermatologist'], [/Please type your request reference/, 'NC-ABC234']];
const rowsOf = (m) => (m.sections ? m.sections.flatMap((s) => s.rows) : m.rows);
const idsOf = (r) => [...new Set(r.flatMap((m) => m.type === 'list' ? rowsOf(m).map((x) => x.id) : m.type === 'buttons' ? m.buttons.map((b) => b.id) : []))];
const bad = (r) => !r.length || r.some((m) => /didn't understand|Sorry,|earlier step|finish your request first/i.test(m.body || ''));
const body = (r) => r.map((m) => m.body || '').join(' ');
async function auto(u, r) { for (let i = 0; i < 6; i++) { const a = AUTO.find(([re]) => re.test(body(r))); if (!a) break; r = await handleMessage(u, { text: a[1] }); } return r; }
async function session(path) { const u = 'c' + sid++; let r = await auto(u, await handleMessage(u, { text: 'hi' })); for (const id of path) r = await auto(u, await handleMessage(u, { id })); return { u, r }; }
async function visit(path, depth) {
  const { r } = await session(path);
  const ids = idsOf(r); if (!ids.length) return;
  const sig = (path[0] || '') + '|' + (path.find((p) => p.startsWith('spec_')) ? 'S' : '') + '|' + ids.join(',');
  if (seen.has(sig)) return; seen.add(sig);
  const isList = r.some((m) => m.type === 'list');
  for (const [i, id] of ids.entries()) {
    const { u, r: before } = await session(path);
    const out = await auto(u, await handleMessage(u, { id })); taps++;
    if (bad(out)) problems.push(`${[...path, id].join(' → ')}  ⇒  ${(out[0]?.body || 'EMPTY').slice(0, 50)}`);
    if (depth < 8 && (!isList || i < 2)) await visit([...path, id], depth + 1);
  }
}
await visit([], 0);
console.log(`tapped ${taps} buttons/list rows across ${seen.size} distinct screens`);
console.log(problems.length ? 'PROBLEMS:\n' + problems.slice(0, 15).join('\n') : '✓ every offered button and list row leads somewhere valid (no dead ends)');
process.exit(problems.length ? 1 : 0);
