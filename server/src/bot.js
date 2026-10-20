// Platform-independent bot logic: input in -> array of message objects out.
import { TEXT, MENU_SECTIONS, SPECIALTIES, BILLING, EMERGENCY_WORDS, CRISIS_WORDS } from './content.js';
import { PROVINCES, GP_AREAS, getHospital, hospitalsIn, countIn, mapsUrl } from './hospitals.js';
import { submitRequest, getRequestStatus, isMockMode } from './netcare.js';
import { normPhone, isValidName, isValidText, normRef, isValidRef } from './validators.js';
import { understand, findSpecialty, findHospitals, findPlace } from './nlu.js';

// In-memory sessions. Use Redis/DB in production. Personal details live only in the session until a
// request is submitted (or 30 minutes of inactivity), then they are discarded.
const sessions = new Map();
export const resetSession = (id) => sessions.delete(id);

const GREETING = /^(hi|hii+|hello|hey|heita|hallo|start|sawubona|molo|dumela|thobela|ndaa|haai)\b/i;
const MENU_WORD = /^(menu|cancel|back|stop|quit|exit)$/i;
const MAX_SUBMITS_PER_HOUR = 3;
const IDLE_MS = 30 * 60 * 1000;

const text = (body) => ({ type: 'text', body });
const buttons = (body, list) => ({ type: 'buttons', body, buttons: list });
const MENU_BTN = { id: 'topic_menu', title: 'Main menu' };
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const showPhone = (p) => `${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6)}`;
const PAYERS = { aid: 'Medical aid', private: 'Private / cash', unsure: 'Not sure yet' };
const ACTIONS = { confirm: 'Confirm my appointment', reschedule: 'Reschedule my appointment', cancel: 'Cancel my appointment' };
const INTENT_LABEL = { appointment: 'Book appointment', directions: 'Hospital directions', billing: 'Billing question', enquiry: 'Appointment enquiry', visitor: 'Visitor info', admission: 'Admission checklist', contact: 'Contact Netcare' };

// ---------- lists ----------
const mainMenu = (body = TEXT.menuBody) => ({
  type: 'list', header: 'Netcare 🏥', body, footer: TEXT.menuFooter, button: 'Menu', sections: MENU_SECTIONS,
});
const specialtyList = () => ({
  type: 'list', header: 'Request an appointment', body: 'Which specialist would you like to see? Availability differs by hospital – the rooms will confirm.',
  button: 'Choose specialist', sectionTitle: 'Specialists',
  rows: SPECIALTIES.map(({ id, title, description }) => ({ id: `spec_${id}`, title, description })), // ids must match the spec_ handler
});
const billingList = () => ({
  type: 'list', header: 'Billing questions', body: 'What is your billing question about? I will point you to the right team.',
  button: 'Choose topic', sectionTitle: 'Billing', rows: BILLING.map(({ id, title, description }) => ({ id: `bill_${id}`, title, description })),
});
const provinceList = () => ({
  type: 'list', header: 'Find a hospital', body: TEXT.pickProvince, button: 'Choose province', sectionTitle: 'Provinces',
  rows: PROVINCES.map((p) => ({ id: `prov_${p.id}`, title: p.name, description: plural(countIn(p.id), 'hospital') })),
});
const areaList = () => ({
  type: 'list', header: 'Gauteng', body: TEXT.pickArea, button: 'Choose area', sectionTitle: 'Areas',
  rows: GP_AREAS.map((a) => ({ id: `area_${a.id}`, title: a.name, description: plural(hospitalsIn({ province: 'gp', area: a.id }).length, 'hospital') })),
});
const hospitalRows = (hs) => hs.map((h) => ({ id: `hosp_${h.id}`, title: h.short, description: h.suburb }));
const hospitalList = (filter) => ({
  type: 'list', header: 'Netcare hospitals', body: TEXT.pickHospital, button: 'Choose hospital', sectionTitle: 'Hospitals', rows: hospitalRows(hospitalsIn(filter)),
});
const candidateList = (ids) => ({
  type: 'list', header: 'Which hospital?', body: 'I found more than one match. Which hospital do you mean?', button: 'Choose hospital', sectionTitle: 'Hospitals',
  rows: hospitalRows(ids.map(getHospital).filter(Boolean)),
});

function hospitalCard(h, visitor = false) {
  const lines = [
    `*${h.name}*`,
    `📍 ${h.address}`,
    `📞 ${h.tel || TEXT.noTel}`,
    ...(h.email ? [`✉️ Customer care: ${h.email}`] : []),
    ...(visitor ? ['🕐 Visiting hours: please call the hospital to confirm'] : []),
    `🗺️ Directions: ${mapsUrl(h)}`,
    '',
    '🚨 Emergency? Call Netcare 911 on *082 911* or go to the hospital\'s emergency unit.',
    'ℹ️ Please confirm details with the hospital before you travel.',
  ];
  return [
    text(lines.join('\n')),
    buttons(TEXT.more, [{ id: 'topic_appointment', title: 'Book appointment' }, { id: 'topic_directions', title: 'Other hospital' }, MENU_BTN]),
  ];
}

// ---------- request forms ----------
const FORMS = {
  appointment: { who: 'the rooms', label: 'appointment request', fields: ['specialty', 'hospital', 'name', 'phone', 'when', 'payer', 'confirm'] },
  billing: { who: 'the accounts team', label: 'call-back request', fields: ['hospital', 'name', 'phone', 'ref', 'confirm'] },
  change: { who: 'the rooms', label: 'appointment change request', fields: ['action', 'hospital', 'name', 'phone', 'ref', 'confirm'] },
};
const FIELD_LABEL = { specialty: 'Specialist', hospital: 'Hospital', name: 'Your name', phone: 'Phone number', when: 'Preferred time', payer: 'Payment', ref: 'Reference', action: 'Type of request' };
const PII_FIELDS = new Set(['name', 'phone']); // consent is asked just before the first personal detail

function summary(s) {
  const f = s.form, d = f.data, h = getHospital(d.hospital);
  const rows = [
    `🏥 Hospital: ${h.name}`,
    ...(d.specialty ? [`🩺 Specialist: ${d.specialty}`] : []),
    ...(d.topic ? [`💳 Topic: ${d.topic}`] : []),
    ...(d.action ? [`🔁 Request: ${ACTIONS[d.action]}`] : []),
    `👤 Name: ${d.name}`,
    `📞 Phone: ${showPhone(d.phone)}`,
    ...(d.when ? [`🕐 Preferred time: ${d.when}`] : []),
    ...(d.payer ? [`💳 Payment: ${PAYERS[d.payer]}`] : []),
    ...(d.ref ? [`🔖 Reference: ${d.ref}`] : []),
  ];
  return [
    buttons(`*Please check your ${FORMS[f.kind].label}*\n\n${rows.join('\n')}\n\nThis is a *request* – ${FORMS[f.kind].who} will contact you. It is not a confirmed booking.`, [
      { id: 'fld_confirm_yes', title: 'Submit request' },
      { id: 'fld_edit', title: 'Edit details' },
      { id: 'topic_menu', title: 'Cancel' },
    ]),
  ];
}

function editList(s) {
  const fields = FORMS[s.form.kind].fields.filter((f) => f !== 'confirm' && s.form.data[f] !== undefined);
  return [{
    type: 'list', header: 'Edit details', body: TEXT.editBody, button: 'Choose detail', sectionTitle: 'Details',
    rows: fields.map((f) => ({ id: `edit_${f}`, title: FIELD_LABEL[f] })),
  }];
}

function ask(s, field) {
  switch (field) {
    case 'specialty': return [specialtyList()];
    case 'hospital': {
      if (s.form.candidates?.length) { s.purpose = 'form'; return [candidateList(s.form.candidates)]; }
      if (s.lastHospital) {
        const h = getHospital(s.lastHospital);
        return [buttons(`Use *${h.name}* for this request?`, [{ id: 'fld_hosp_use', title: 'Same hospital' }, { id: 'fld_hosp_other', title: 'Other hospital' }])];
      }
      s.purpose = 'form';
      return [provinceList()];
    }
    case 'name': s.awaiting = { field }; return [text(TEXT.askName)];
    case 'phone': s.awaiting = { field }; return [text(TEXT.askPhone)];
    case 'when': s.awaiting = { field }; return [text(TEXT.askWhen)];
    case 'ref': s.awaiting = { field }; return [text(TEXT.askRef)];
    case 'payer':
      return [buttons(TEXT.askPayer, [{ id: 'fld_payer_aid', title: 'Medical aid' }, { id: 'fld_payer_private', title: 'Private / cash' }, { id: 'fld_payer_unsure', title: 'Not sure' }])];
    case 'action':
      return [buttons(TEXT.askAction, [{ id: 'fld_action_confirm', title: 'Confirm booking' }, { id: 'fld_action_reschedule', title: 'Reschedule' }, { id: 'fld_action_cancel', title: 'Cancel booking' }])];
    case 'confirm': return summary(s);
  }
}

function nextStep(s) {
  if (!s.form) return [mainMenu()];
  const field = FORMS[s.form.kind].fields.find((f) => s.form.data[f] === undefined);
  if (PII_FIELDS.has(field) && !s.consent) return [buttons(TEXT.consent, [{ id: 'consent_yes', title: 'I agree' }, { id: 'topic_menu', title: 'Cancel' }])];
  return ask(s, field);
}

// Start a form, optionally pre-filled from what the person already typed
function startForm(s, kind, slots = {}, extra = {}) {
  s.form = { kind, data: { ...extra }, candidates: null };
  const got = [];
  if (kind === 'appointment' && slots.specialty) {
    const sp = SPECIALTIES.find((x) => x.id === slots.specialty);
    s.form.data.specialty = sp.title; got.push(`🩺 Specialist: ${sp.title}`);
  }
  if (slots.hospitals?.length === 1) {
    s.form.data.hospital = slots.hospitals[0]; s.lastHospital = slots.hospitals[0];
    got.push(`🏥 Hospital: ${getHospital(slots.hospitals[0]).name}`);
  } else if (slots.hospitals?.length > 1) s.form.candidates = slots.hospitals;
  if (kind === 'appointment' && slots.when) { s.form.data.when = slots.when; got.push(`🕐 Preferred time: ${slots.when}`); }
  const intro = got.length ? [text(`Got it ✅ I've noted:\n${got.join('\n')}\n\nI just need a few more details.`)] : [];
  return [...intro, ...nextStep(s)];
}

async function submit(s) {
  const now = Date.now();
  s.submits = (s.submits || []).filter((t) => now - t < 3600e3);
  if (s.submits.length >= MAX_SUBMITS_PER_HOUR) return [text(TEXT.rateLimited), buttons(TEXT.more, [MENU_BTN])];
  const f = s.form, d = f.data, h = getHospital(d.hospital);
  let r;
  try {
    r = await submitRequest({ kind: f.kind, hospital: h.name, specialty: d.specialty, topic: d.topic, action: d.action, name: d.name, phone: d.phone, when: d.when, payer: d.payer, ref: d.ref });
  } catch (e) {
    console.error('Request submit failed:', e.message); // never log personal details
    return [text(TEXT.submitError), buttons(TEXT.more, [MENU_BTN])];
  }
  s.submits.push(now);
  s.form = null; // personal details are discarded
  s.awaiting = null;
  const who = FORMS[f.kind].who;
  const body =
    `✅ *Request received*\nReference: *${r.reference}*\n\n${who[0].toUpperCase() + who.slice(1)} will contact you on ${showPhone(d.phone)}. This is a *request*, not a confirmed booking.\n\nIf it is urgent, phone the hospital${h.tel ? ` on ${h.tel}` : ''}. For emergencies call Netcare 911 on *082 911*.` +
    (isMockMode() ? TEXT.demoNote : '');
  return [text(body), buttons(TEXT.more, [{ id: 'topic_enquiry', title: 'Check status' }, MENU_BTN])];
}

async function lookupRef(s, input) {
  if (!isValidRef(input)) return [text(TEXT.badRefLookup)];
  s.awaiting = null;
  const ref = normRef(input);
  let r;
  try { r = await getRequestStatus(ref); } catch (e) { console.error('Status lookup failed:', e.message); return [text(TEXT.submitError), buttons(TEXT.more, [MENU_BTN])]; }
  const again = { id: 'enq_status', title: 'Check another' };
  if (!r.found) return [text(TEXT.statusNotFound(ref)), buttons(TEXT.more, [again, MENU_BTN])];
  const when = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  return [
    text(`*Request ${ref}*\nStatus: ${r.status}\n${r.hospital ? `Hospital: ${r.hospital}\n` : ''}${r.specialty ? `Regarding: ${r.specialty}\n` : ''}${when ? `Submitted: ${when}\n` : ''}\nThis is a request, not a confirmed booking.` + (isMockMode() ? TEXT.demoNote : '')),
    buttons(TEXT.more, [again, MENU_BTN]),
  ];
}

async function handleAwaiting(s, input) {
  const a = s.awaiting;
  if (a.field === 'lookup') return lookupRef(s, input);
  const d = s.form.data;
  switch (a.field) {
    case 'name': if (!isValidName(input)) return [text(TEXT.badName)]; d.name = input.trim(); break;
    case 'phone': { const p = normPhone(input); if (!p) return [text(TEXT.badPhone)]; d.phone = p; break; }
    case 'when': if (!isValidText(input, 3, 100)) return [text(TEXT.badWhen)]; d.when = input.trim(); break;
    case 'ref':
      if (/^skip$/i.test(input)) d.ref = '';
      else if (isValidText(input, 3, 30)) d.ref = input.trim();
      else return [text(TEXT.badRef)];
      break;
    case 'specialty': if (!isValidText(input, 3, 60)) return [text(TEXT.badSpecialty)]; d.specialty = input.trim(); break;
  }
  s.awaiting = null;
  return nextStep(s);
}

function selectHospital(s, hid) {
  const h = getHospital(hid);
  if (!h) return [provinceList()];
  s.lastHospital = hid;
  if (s.form && currentStep(s) === 'hospital') return chooseHospitalForForm(s, hid);
  const visitor = s.purpose === 'visitor';
  s.purpose = null;
  return hospitalCard(h, visitor);
}

const info = (body, extraButtons = []) => [text(body), buttons(TEXT.more, [...extraButtons, MENU_BTN])];
const emergencyMsgs = (input = '') => [text(TEXT.emergency + (CRISIS_WORDS.test(input) ? TEXT.crisis : '')), buttons(TEXT.more, [MENU_BTN])];
const billingAnswer = (s, id) => {
  const b = BILLING.find((x) => x.id === id);
  s.billTopic = b.title;
  return [text(b.a), buttons(TEXT.more, [{ id: 'bill_callback', title: 'Request call-back' }, { id: 'topic_directions', title: 'Hospital numbers' }, MENU_BTN])];
};

function directions(s, slots, visitor = false) {
  s.form = null;
  const ids = slots.hospitals || [];
  if (ids.length === 1) { s.lastHospital = ids[0]; return hospitalCard(getHospital(ids[0]), visitor); }
  s.purpose = visitor ? 'visitor' : 'directions';
  if (ids.length > 1) return [candidateList(ids)];
  if (slots.place) return slots.place.province === 'gp' && !slots.place.area ? [areaList()] : [hospitalList(slots.place)];
  return [provinceList()];
}

// Turn an understood message into a reply
async function route(s, u) {
  const slots = u.slots || {};
  switch (u.intent) {
    case 'emergency': s.form = null; s.awaiting = null; return emergencyMsgs();
    case 'appointment': return startForm(s, 'appointment', slots);
    case 'directions': return directions(s, slots);
    case 'visitor':
      return slots.hospitals?.length ? directions(s, slots, true) : info(TEXT.visitor, [{ id: 'visitor_details', title: 'Hospital details' }]);
    case 'admission': return info(TEXT.admission, [{ id: 'topic_directions', title: 'Find my hospital' }]);
    case 'billing': return slots.billingTopic ? billingAnswer(s, slots.billingTopic) : [billingList()];
    case 'enquiry':
      if (slots.enquiryAction === 'change') return startForm(s, 'change', slots);
      s.form = null;
      return [text(TEXT.enquiry), buttons(TEXT.more, [{ id: 'enq_status', title: 'Request status' }, { id: 'enq_change', title: 'Change or cancel' }, MENU_BTN])];
    case 'contact': return info(TEXT.contact);
    case 'human': return info(`${TEXT.humanNote}\n\n${TEXT.contact}`);
    case 'thanks': return [text(TEXT.thanks), buttons(TEXT.more, [MENU_BTN])];
    case 'bye': return [text(TEXT.bye)];
    case 'answer': return [text(u.answer), buttons(TEXT.more, [MENU_BTN])];
    default: return [text(TEXT.outOfScope), mainMenu()];
  }
}

// ---------- conversation lock ----------
// While a request (appointment / call-back / change) is in progress the bot STAYS INSIDE it:
//  - taps on old buttons or lists from earlier in the chat are ignored (the current step is repeated),
//  - typed text is read as an answer to the CURRENT step (e.g. typing "Sunninghill" at the hospital step picks it),
//  - "hi" or unrelated words don't wipe the request, and no general-purpose understanding/AI is used,
//  - only "cancel"/"menu" (or an emergency) leaves the request.
function currentStep(s) {
  if (!s.form) return null;
  const field = FORMS[s.form.kind].fields.find((x) => s.form.data[x] === undefined);
  return PII_FIELDS.has(field) && !s.consent ? 'consent' : field;
}

function cancelFlow(s) {
  const had = Boolean(s.form);
  s.awaiting = null; s.form = null; s.purpose = null;
  return had ? [text(TEXT.cancelled), mainMenu()] : [mainMenu()];
}

// which step each kind of tap belongs to
const STEP_FOR_ID = [
  [/^(fld_hosp_use|fld_hosp_other|prov_|area_|hosp_)/, 'hospital'],
  [/^spec_/, 'specialty'],
  [/^fld_payer_/, 'payer'],
  [/^fld_action_/, 'action'],
  [/^(fld_confirm_yes|fld_edit|edit_)/, 'confirm'],
  [/^consent_yes$/, 'consent'],
];

function chooseHospitalForForm(s, hid) {
  const h = getHospital(hid);
  s.lastHospital = hid; s.form.data.hospital = hid; s.form.candidates = null; s.purpose = null;
  return [text(`✅ Hospital: *${h.name}*`), ...nextStep(s)];
}

async function typedAnswer(s, step, input) {
  const f = s.form, d = f.data;
  switch (step) {
    case 'consent':
      if (/^(yes|yeah|yep|ok|okay|sure|agree|i agree|accept)\b/i.test(input)) { s.consent = true; return nextStep(s); }
      if (/^(no|nope|decline|disagree)\b/i.test(input)) return cancelFlow(s);
      return null;
    case 'specialty': {
      const id = findSpecialty(input);
      const sp = SPECIALTIES.find((x) => x.id === id);
      if (!sp) return null;
      d.specialty = sp.title;
      return [text(`✅ Specialist: *${sp.title}*`), ...nextStep(s)];
    }
    case 'hospital': {
      if (s.lastHospital && !f.candidates?.length) {
        if (/^(yes|same|yep|ok|okay)\b/i.test(input)) return chooseHospitalForForm(s, s.lastHospital);
        if (/^(no|other|different|another)\b/i.test(input)) { s.lastHospital = null; return nextStep(s); }
      }
      const ids = findHospitals(input);
      if (ids.length === 1) return chooseHospitalForForm(s, ids[0]);
      if (ids.length > 1) { f.candidates = ids; s.purpose = 'form'; return [candidateList(ids)]; }
      const place = findPlace(input);
      if (place) { s.purpose = 'form'; return place.province === 'gp' && !place.area ? [areaList()] : [hospitalList(place)]; }
      return null;
    }
    case 'payer':
      if (/not sure|unsure|don'?t know/i.test(input)) d.payer = 'unsure';
      else if (/private|cash|self|no medical aid/i.test(input)) d.payer = 'private';
      else if (/medical aid|medical scheme|scheme|\baid\b/i.test(input)) d.payer = 'aid';
      else return null;
      return nextStep(s);
    case 'action':
      if (/reschedul|change|move/i.test(input)) d.action = 'reschedule';
      else if (/cancel/i.test(input)) d.action = 'cancel';
      else if (/confirm/i.test(input)) d.action = 'confirm';
      else return null;
      return nextStep(s);
    case 'confirm':
      if (/^(yes|submit|confirm|send|ok|okay|correct|looks good)\b/i.test(input)) return submit(s);
      if (/^(edit|change)\b/i.test(input)) return editList(s);
      if (/^no\b/i.test(input)) return cancelFlow(s);
      return null;
  }
  return null;
}

// returns messages to send, or null to let normal handling continue
async function lockedHandler(s, input, id) {
  const step = currentStep(s);
  if (id) {
    if (id === 'topic_menu') return cancelFlow(s);
    if (id === 'topic_emergency') return null;
    const rule = STEP_FOR_ID.find(([re]) => re.test(id));
    if (rule && rule[1] === step) return null;            // the tap belongs to the current step
    return [text(TEXT.stale), ...nextStep(s)];            // stale / unrelated tap → repeat the current step
  }
  if (!input) return null;
  if (MENU_WORD.test(input)) return cancelFlow(s);
  return (await typedAnswer(s, step, input)) ?? [text(TEXT.lock), ...nextStep(s)];
}

// ---------- main handler ----------
export async function handleMessage(from, { text: raw = '', id = '' }) {
  const s = sessions.get(from) || { started: false, consent: false, awaiting: null, form: null, purpose: null, lastHospital: null, billTopic: null, pendingSlots: null, submits: [], updatedAt: Date.now() };
  sessions.set(from, s);
  const input = raw.trim();

  // privacy: forget half-finished requests after 30 minutes of silence
  const now = Date.now();
  const timedOut = now - s.updatedAt > IDLE_MS && (s.form || s.awaiting);
  s.updatedAt = now;
  if (timedOut) { s.form = null; s.awaiting = null; s.purpose = null; if (!GREETING.test(input)) return [text(TEXT.timeout), mainMenu()]; }

  // 0. Safety first: emergencies and crisis words ALWAYS get the emergency screen (rules, never AI)
  if (input && EMERGENCY_WORDS.test(input)) { s.awaiting = null; s.form = null; s.purpose = null; return emergencyMsgs(input); }

  // 1. A typed answer is expected (name, phone, reference…)
  if (s.awaiting && !id && input && !GREETING.test(input)) {
    if (MENU_WORD.test(input)) return cancelFlow(s);
    return handleAwaiting(s, input);
  }

  // 1b. LOCK: while a request is in progress, stay inside it
  if (s.form) {
    const locked = await lockedHandler(s, input, id);
    if (locked) return locked;
  }
  if (id) s.awaiting = null;

  // 2. Greeting / first message
  if (GREETING.test(input) || !s.started) { s.started = true; s.awaiting = null; s.form = null; s.purpose = null; return [mainMenu(TEXT.welcome)]; }

  // 3. Buttons and lists
  switch (id) {
    case 'topic_menu': s.form = null; s.purpose = null; return [mainMenu()];
    case 'topic_emergency': return emergencyMsgs();
    case 'topic_directions': return directions(s, {});
    case 'visitor_details': s.purpose = 'visitor'; return [provinceList()];
    case 'topic_visitor': return route(s, { intent: 'visitor', slots: {} });
    case 'topic_admission': return route(s, { intent: 'admission', slots: {} });
    case 'topic_contact': return route(s, { intent: 'contact', slots: {} });
    case 'topic_appointment': return startForm(s, 'appointment');
    case 'topic_enquiry': return route(s, { intent: 'enquiry', slots: {} });
    case 'enq_status': s.awaiting = { field: 'lookup' }; return [text(TEXT.statusAsk)];
    case 'enq_change': return startForm(s, 'change');
    case 'topic_billing': return [billingList()];
    case 'bill_callback': return startForm(s, 'billing', {}, { topic: s.billTopic || 'Billing question' });
    case 'consent_yes': s.consent = true; return s.form ? nextStep(s) : [mainMenu()];
    case 'fld_hosp_use': if (s.form) { s.form.data.hospital = s.lastHospital; return nextStep(s); } break;
    case 'fld_hosp_other': s.lastHospital = null; return s.form ? nextStep(s) : [provinceList()];
    case 'fld_edit': return s.form ? editList(s) : [mainMenu()];
    case 'fld_confirm_yes':
      if (!s.form) return [mainMenu()];
      // never submit an incomplete form – ask for whatever is still missing
      if (FORMS[s.form.kind].fields.some((f) => f !== 'confirm' && s.form.data[f] === undefined)) return nextStep(s);
      return submit(s);
  }
  if (id.startsWith('clar_')) return route(s, { intent: id.slice(5), slots: s.pendingSlots || {} });
  if (id.startsWith('edit_') && s.form) {
    const field = id.slice(5);
    if (FORMS[s.form.kind].fields.includes(field) && field !== 'confirm') {
      delete s.form.data[field];
      if (field === 'hospital') { s.lastHospital = null; s.form.candidates = null; }
      return nextStep(s);
    }
  }
  if (id.startsWith('prov_')) { const p = id.slice(5); return p === 'gp' ? [areaList()] : [hospitalList({ province: p })]; }
  if (id.startsWith('area_')) return [hospitalList({ province: 'gp', area: id.slice(5) })];
  if (id.startsWith('hosp_')) return selectHospital(s, id.slice(5));
  if (id.startsWith('spec_') && s.form?.kind === 'appointment') {
    const sp = SPECIALTIES.find((x) => x.id === id.slice(5));
    if (!sp) return [specialtyList()];
    if (sp.id === 'other') { s.awaiting = { field: 'specialty' }; return [text(TEXT.askSpecialty)]; }
    s.form.data.specialty = sp.title;
    return [text(`✅ Specialist: *${sp.title}*`), ...nextStep(s)];
  }
  if (id.startsWith('bill_') && BILLING.some((b) => b.id === id.slice(5))) return billingAnswer(s, id.slice(5));
  if (id.startsWith('fld_payer_') && s.form) { s.form.data.payer = id.slice(10); return nextStep(s); }
  if (id.startsWith('fld_action_') && s.form) { s.form.data.action = id.slice(11); return nextStep(s); }

  // 4. Typed words
  if (MENU_WORD.test(input)) return [mainMenu()];
  if (!input) return [text(TEXT.fallback), mainMenu()];
  const ref = input.match(/\bNC-[A-Z0-9]{6}\b/i); // a pasted reference number is looked up straight away
  if (ref) return lookupRef(s, ref[0]);

  const u = await understand(input);
  if (u.clarify) {
    s.pendingSlots = u.slots;
    return [buttons(TEXT.clarify, u.clarify.map((i) => ({ id: `clar_${i}`, title: INTENT_LABEL[i] || i })))];
  }
  if (!u.intent) return [text(TEXT.fallback), mainMenu()]; // nothing understood
  return route(s, u);
}
