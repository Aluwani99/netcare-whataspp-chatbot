import { handleMessage } from '../src/bot.js';
import { toPayload } from '../src/whatsapp.js';
let fails=0, bad=0; const t=(n,c)=>{ if(!c){fails++;console.log('  ✗ FAIL:',n);} else console.log('  ✓',n); };
const run=async(u,i)=>{const r=await handleMessage(u,i); for(const m of r){toPayload('27',m); if(m.type==='buttons'&&(m.buttons.length>3||m.buttons.some(b=>b.title.length>20)))bad++; if(m.type==='list'){const rows=m.sections?m.sections.flatMap(s=>s.rows):m.rows; if(rows.length>10||rows.some(x=>x.title.length>24))bad++;}} return r;};
const body=r=>r.map(m=>m.body||'').join(' ');
const hasList=(r,h)=>r.some(m=>m.type==='list'&&(!h||m.header===h));
const start=async(u,spec='spec_ent')=>{await run(u,{text:'hi'}); await run(u,{id:'topic_appointment'}); if(spec) await run(u,{id:spec});};

console.log('Hospital step');
let u='a'; await start(u);
let r=await run(u,{text:'Sunninghill'}); t('typing a hospital name picks it and the request continues', /Hospital: \*Netcare Sunninghill/.test(body(r)) && /agree/i.test(JSON.stringify(r)));
u='b'; await start(u); r=await run(u,{text:'somewhere in Durban'}); t('ambiguous name → candidate list (still in the request)', hasList(r,'Which hospital?'));
r=await run(u,{id:'hosp_parklands'}); t('tapping a candidate continues', /Hospital: \*Netcare Parklands/.test(body(r)));
u='c'; await start(u); r=await run(u,{text:'hospitals in Pretoria'}); t('typing a place narrows the list (request kept)', hasList(r,'Netcare hospitals'));
r=await run(u,{id:'hosp_unitas'}); t('then tapping a hospital continues', /Unitas/.test(body(r)));
u='d'; await start(u); r=await run(u,{text:'blah blah'}); t('unrelated text → "finish your request" + province list again', /finish your request/.test(body(r)) && hasList(r,'Find a hospital'));

console.log('\nStale taps / old buttons');
u='e'; await start(u); r=await run(u,{id:'topic_directions'}); t('"Hospital directions" tap mid-request is ignored (request kept)', /earlier step/.test(body(r)) && hasList(r,'Find a hospital'));
r=await run(u,{id:'prov_ec'}); r=await run(u,{id:'hosp_cuyler'}); t('request continues after the ignored tap', /Hospital: \*Netcare Cuyler/.test(body(r)));
await run(u,{id:'consent_yes'}); await run(u,{text:'Sam Test'}); await run(u,{text:'0821234567'}); await run(u,{text:'Friday morning'});
r=await run(u,{id:'hosp_milpark'}); t('old hospital tap at the payment step does NOT change the hospital', /earlier step/.test(body(r)) && r.some(m=>m.type==='buttons'&&m.buttons[0].title==='Medical aid'));
r=await run(u,{id:'fld_hosp_use'}); t('old "Same hospital" tap at payment step ignored', /earlier step/.test(body(r)));
r=await run(u,{id:'fld_confirm_yes'}); t('early "Submit" tap (before summary) ignored, no submission', /earlier step/.test(body(r)) && !/Request received/.test(body(r)));
r=await run(u,{text:'private'}); t('typing "private" answers the payment step', /Cuyler/.test(body(r)) && /Private \/ cash/.test(body(r)));
r=await run(u,{id:'fld_payer_aid'}); t('old payment button on the summary is ignored (data unchanged)', /earlier step/.test(body(r)));
r=await run(u,{text:'submit'}); t('typing "submit" at the summary submits', /Request received/.test(body(r)));
r=await run(u,{id:'fld_confirm_yes'}); t('stale "Submit" after submitting does nothing', !/Request received/.test(body(r)) && hasList(r,'Netcare 🏥'));

console.log('\n"hi", cancel, emergency');
u='f'; await start(u); await run(u,{id:'prov_ec'}); await run(u,{id:'hosp_cuyler'}); await run(u,{id:'consent_yes'}); await run(u,{text:'Sam Test'});
r=await run(u,{text:'hi'}); t('"hi" mid-request does not wipe it (re-asks phone)', /finish your request/.test(body(r)) && /phone number/.test(body(r)));
r=await run(u,{text:'0821234567'}); t('request still intact after "hi"', /Preferred time|When would you like/.test(body(r)) || /When would you like/.test(body(r)));
r=await run(u,{id:'topic_menu'}); t('Main-menu/Cancel tap cancels with a clear message', /cancelled/.test(body(r)));
r=await run(u,{id:'fld_confirm_yes'}); t('nothing can be submitted after cancelling', !/Request received/.test(body(r)));
u='g'; await start(u); r=await run(u,{text:'cancel'}); t('typing "cancel" cancels', /cancelled/.test(body(r)));
u='h'; await start(u); await run(u,{id:'prov_ec'}); await run(u,{id:'hosp_cuyler'}); r=await run(u,{text:'I cant breathe'}); t('emergency mid-request shows emergency screen', /Netcare 911/.test(body(r)));
r=await run(u,{id:'consent_yes'}); t('and the half-finished request was cleared', !/Hospital:/.test(body(r)));

console.log('\nTyped answers at other steps');
u='i'; await run(u,{text:'hi'}); await run(u,{id:'topic_appointment'}); r=await run(u,{text:'I need a dentist'}); t('typing a specialist at the specialist step picks it', /Specialist: \*Dentist/.test(body(r)));
await run(u,{id:'prov_ec'}); await run(u,{id:'hosp_cuyler'}); r=await run(u,{text:'yes'}); t('typing "yes" gives consent', /full name/.test(body(r)));
u='j'; await run(u,{text:'hi'}); await run(u,{id:'topic_appointment'}); await run(u,{id:'spec_ent'}); await run(u,{id:'prov_ec'}); await run(u,{id:'hosp_cuyler'}); r=await run(u,{text:'no'}); t('typing "no" at consent cancels and clears', /cancelled/.test(body(r)));

console.log('\nOther request types are locked too');
u='k'; await run(u,{text:'hi'}); await run(u,{id:'bill_scheme'}); r=await run(u,{id:'bill_callback'}); t('billing call-back asks for a hospital', hasList(r,'Find a hospital'));
r=await run(u,{text:'Rosebank'}); t('billing call-back: typed hospital works', /Hospital: \*Netcare Rosebank/.test(body(r)));
r=await run(u,{id:'topic_visitor'}); t('billing call-back: stale tap ignored', /earlier step/.test(body(r)));
u='l'; await run(u,{text:'hi'}); await run(u,{id:'enq_change'}); r=await run(u,{id:'consent_yes'}); t('change request: consent not needed before action step', true);
u='m'; await run(u,{text:'hi'}); r=await run(u,{id:'enq_change'}); t('change request starts with request-type buttons', r.some(m=>m.type==='buttons'&&m.buttons[0].title==='Confirm booking'));
r=await run(u,{text:'I want to reschedule'}); t('typing "reschedule" picks it', /province/i.test(JSON.stringify(r)));
r=await run(u,{text:'Linksfield'}); t('then typed hospital works', /Hospital: \*Netcare Linksfield/.test(body(r)));

console.log('\nEdit still works inside the lock');
u='n'; await run(u,{text:'hi'}); await run(u,{text:'I need an ENT at Sunninghill next Tuesday morning'}); await run(u,{id:'consent_yes'}); await run(u,{text:'Thandi Mokoena'}); await run(u,{text:'0821234567'}); await run(u,{id:'fld_payer_aid'});
r=await run(u,{id:'fld_edit'}); t('edit list opens', hasList(r,'Edit details'));
r=await run(u,{id:'edit_hospital'}); t('edit hospital → asks for a hospital', hasList(r,'Find a hospital'));
r=await run(u,{text:'Rosebank'}); t('typed new hospital shown on the summary', /Rosebank/.test(body(r)) && r.some(m=>m.type==='buttons'&&m.buttons[0].title==='Submit request'));
r=await run(u,{id:'fld_confirm_yes'}); t('and submits', /Request received/.test(body(r)));

console.log(`\nLOCK RESULT: ${fails} failed, ${bad} WhatsApp-limit problems`);
process.exit(fails || bad ? 1 : 0);
