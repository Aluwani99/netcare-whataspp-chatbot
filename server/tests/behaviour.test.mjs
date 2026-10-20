import { handleMessage } from '../src/bot.js';
import { toPayload } from '../src/whatsapp.js';
import { ruleUnderstand, findWhen } from '../src/nlu.js';
import { HOSPITALS, PROVINCES } from '../src/hospitals.js';
let bad=0, fails=0;
const rowsOf = m => (m.sections ? m.sections.flatMap(s=>s.rows) : m.rows);
const run = async (u,i) => { const r=await handleMessage(u,i); for(const m of r){ const p=toPayload('27',m);
  if(m.type==='list'){ const rows=rowsOf(m); const pr=p.interactive.action.sections.flatMap(s=>s.rows);
    if(pr.length>10||rows.some(x=>x.title.length>24||(x.description||'').length>72)||m.button.length>20||m.body.length>1024||p.interactive.action.sections.some(s=>s.title.length>24)){bad++;console.log('LIST LIMIT',m.header);} }
  if(m.type==='buttons'&&(m.buttons.length>3||m.buttons.some(b=>b.title.length>20)||m.body.length>1024)){bad++;console.log('BTN LIMIT',m.buttons.map(b=>b.title),m.body.length);}
  if(m.type==='text'&&m.body.length>4096){bad++;} } return r; };
const t = (name, cond) => { if(!cond){fails++;console.log('  ✗ FAIL:',name);} else console.log('  ✓',name); };
const first = r => (r[0].header||r[0].body||'');

console.log('NLU – slots & intents');
const n = s => ruleUnderstand(s);
t('"I need an ENT at Sunninghill next Tuesday morning" → appointment + ent + sunninghill + when', (()=>{const r=n('I need an ENT at Sunninghill next Tuesday morning'); return r.intents.join()==='appointment'&&r.slots.specialty==='ent'&&r.slots.hospitals.join()==='sunninghill'&&/next tuesday morning/i.test(r.slots.when);})());
t('"cancel my appointment" → enquiry (not appointment)', n('cancel my appointment').intents.join()==='enquiry');
t('"where can I find a dentist near Rosebank" → appointment (dentist), hospital rosebank', (()=>{const r=n('where can I find a dentist near Rosebank'); return r.intents.join()==='appointment'&&r.slots.hospitals.join()==='rosebank';})());
t('"Milpark" alone → directions', n('Milpark').intents.join()==='directions' && n('Milpark').slots.hospitals.join()==='milpark');
t('"East Rand" does NOT match Rand Hospital', !n('I live in East Rand').slots.hospitals.includes('rand') && n('East Rand').slots.place.area==='rand');
t('"Rand Hospital" matches', n('directions to Rand Hospital').slots.hospitals.includes('rand'));
t('"Durban" → 2+ hospitals (ambiguous)', n('hospital in Durban').slots.hospitals.length>=2);
t('billing topic: "gap cover question"', n('gap cover question').slots.billingTopic==='gap');
t('billing topic: "I cant afford to pay my hospital bill"', n('I cant afford to pay my hospital bill').slots.billingTopic==='arrange');
t('"my medical aid shortfall" → billing/scheme', n('my medical aid shortfall').slots.billingTopic==='scheme');
t('"what must I bring for admission" → admission', n('what must I bring for admission').intents.join()==='admission');
t('"visiting hours at Linksfield" → visitor + linksfield', (()=>{const r=n('visiting hours at Linksfield'); return r.intents.includes('visitor')&&r.slots.hospitals.join()==='linksfield';})());
t('when: "20 Oct after 2pm"', /20 oct after 2pm/i.test(findWhen('can I come 20 Oct after 2pm')));
t('when: "weekday mornings"', /weekday mornings/i.test(findWhen('weekday mornings please')));
t('"asdf qwerty" → no intent', n('asdf qwerty').intents.length===0);

console.log('\nMenu');
let r=await run('m',{text:'hi'}); t('menu is sectioned (4 sections, 8 rows)', r[0].sections.length===4 && rowsOf(r[0]).length===8);
t('welcome invites natural typing', /ENT specialist/.test(r[0].body));

console.log('\nNatural typing → pre-filled request');
r=await run('p1',{text:'hi'}); r=await run('p1',{text:'I need an ENT at Sunninghill next Tuesday morning'});
t('recap shows specialist, hospital, time', /Ear, nose & throat/.test(r[0].body)&&/Sunninghill/.test(r[0].body)&&/next Tuesday morning/i.test(r[0].body));
t('then asks consent (before name)', r[1].buttons?.[0].title==='I agree');
r=await run('p1',{id:'consent_yes'}); t('asks name', /full name/.test(r[0].body));
await run('p1',{text:'Thandi Mokoena'}); r=await run('p1',{text:'0821234567'}); t('skips "when" (already known) → asks payment', r[0].buttons?.[0].title==='Medical aid');
r=await run('p1',{id:'fld_payer_aid'}); t('summary has 3 buttons incl. Edit', r[0].buttons.map(b=>b.title).join()==='Submit request,Edit details,Cancel');

console.log('\nEdit before submit');
r=await run('p1',{id:'fld_edit'}); t('edit list offers fields', rowsOf(r[0]).map(x=>x.title).includes('Preferred time')&&rowsOf(r[0]).length>=5);
r=await run('p1',{id:'edit_when'}); t('asks preferred time again', /When would you like/.test(r[0].body));
r=await run('p1',{text:'Friday after 3pm'}); t('returns to updated summary', /Friday after 3pm/.test(r[0].body));
r=await run('p1',{id:'edit_phone'}); r=await run('p1',{text:'12'}); t('invalid phone re-asks', /phone number/.test(r[0].body));
r=await run('p1',{text:'+27 83 555 0000'}); t('edited phone shown', /083 555 0000/.test(r[0].body));
r=await run('p1',{id:'fld_confirm_yes'}); const ref=r[0].body.match(/NC-[A-Z0-9]{6}/)[0]; t('submit works → reference', !!ref);

console.log('\nPaste a reference → instant status');
r=await run('p2',{text:'hi'}); r=await run('p2',{text:`what is the status of ${ref}`}); t('status shown without menus', new RegExp(ref).test(r[0].body)&&/Status:/.test(r[0].body));

console.log('\nAmbiguity → clarifying question');
r=await run('c',{text:'hi'}); r=await run('c',{text:'I have a question about my appointment bill'}); t('offers buttons (billing / appointment)', r[0].type==='buttons'&&r[0].buttons.length>=2);
r=await run('c',{id:r[0].buttons[0].id}); t('button routes correctly', !!r[0]);

console.log('\nHospital by name / place');
r=await run('h',{text:'hi'}); r=await run('h',{text:'directions to Netcare Milpark'}); t('single hospital → card with map link', /google\.com\/maps/.test(r[0].body)&&/011 480 5600/.test(r[0].body));
r=await run('h',{text:'hospital in Durban'}); t('ambiguous → candidate list', r[0].type==='list'&&rowsOf(r[0]).length>=2);
r=await run('h',{text:'hospitals in Pretoria'}); t('place → hospital list for Pretoria', r[0].type==='list'&&rowsOf(r[0]).some(x=>x.title==='Unitas'));
r=await run('h',{text:'visiting hours at Rosebank'}); t('visitor + hospital → card with hours note', /Visiting hours: please call/.test(r[0].body));

console.log('\nBilling via natural language');
r=await run('b',{text:'hi'}); r=await run('b',{text:'I cant afford to pay my hospital bill'}); t('direct billing answer', /Payment arrangements/.test(r[0].body));
r=await run('b',{text:'who do I call about gap cover'}); t('gap answer with 0860 101 151', /0860 101 151/.test(r[0].body));

console.log('\nCommands & small talk');
r=await run('s',{text:'hi'}); r=await run('s',{id:'topic_appointment'}); r=await run('s',{id:'spec_dentist'}); r=await run('s',{text:'cancel'}); t('"cancel" leaves the request and shows the menu', /cancelled/.test(r[0].body)&&r.some(m=>m.type==='list'));
r=await run('s',{text:'thanks!'}); t('thanks reply', /welcome/i.test(r[0].body));
r=await run('s',{text:'bye'}); t('bye reply', /Take care/.test(r[0].body));
r=await run('s',{text:'I want to speak to a person'}); t('human → contact info', /Netcare 911/.test(r[0].body)&&/can't transfer/.test(r[0].body));
r=await run('s',{text:'asdf qwerty'}); t('gibberish → polite fallback + menu', /didn't understand/.test(r[0].body)&&r[1].type==='list');
r=await run('s',{text:'what is the weather'}); t('off-topic → fallback', /didn't understand|not able/.test(r[0].body));

console.log('\nEmergency still wins');
r=await run('e',{text:'hi'}); r=await run('e',{text:'ENT at Sunninghill, I have chest pain'}); t('chest pain mid-sentence → emergency', /Netcare 911/.test(r[0].body)&&!/Got it/.test(r[0].body));

console.log('\nPrivacy timeout');
const realNow = Date.now; let fake = realNow();
Date.now = () => fake;
r=await run('t',{text:'hi'}); await run('t',{id:'topic_appointment'}); await run('t',{id:'spec_ent'}); await run('t',{id:'prov_ec'}); await run('t',{id:'hosp_cuyler'}); await run('t',{id:'consent_yes'});
fake += 31*60*1000; r=await run('t',{text:'Thandi Mokoena'});
t('after 31 min idle the half-finished request is cleared', /timed out/.test(r[0].body));
Date.now = realNow;

console.log('\nRegression: every hospital & flow within WhatsApp limits');
for (const p of PROVINCES) { await run('x',{id:'topic_directions'}); await run('x',{id:'prov_'+p.id}); }
for (const a of ['jhb','pta','rand']) { await run('x',{id:'topic_directions'}); await run('x',{id:'prov_gp'}); await run('x',{id:'area_'+a}); }
for (const h of HOSPITALS) { await run('x',{id:'topic_directions'}); await run('x',{id:'hosp_'+h.id}); }
for (const id of ['hospital','doctor','scheme','auth','private','gap','arrange','dispute']) await run('x',{id:'bill_'+id});
for (const id of ['topic_visitor','topic_admission','topic_contact','topic_emergency','topic_billing','topic_enquiry','enq_change','visitor_details']) await run('x',{id});
console.log(`\nRESULT: ${fails} failed checks, ${bad} limit problems`);
process.exit(fails || bad ? 1 : 0);
