// All user-facing text (English).
// ⚠️ This is a PROTOTYPE. Netcare should review every message (especially visitor, admission and billing
// wording) and confirm numbers. This assistant gives general information only – never medical advice.
// WhatsApp limits: list row title 24 chars, description 72, reply-button title 20, button body 1024.

export const MENU_ROWS = [
  { id: 'topic_emergency', title: '🚨 Emergency help', description: 'Netcare 911: 082 911 (24/7)' },
  { id: 'topic_directions', title: 'Hospital directions', description: 'Find a Netcare hospital, address and map' },
  { id: 'topic_appointment', title: 'Request appointment', description: 'Dentist, surgeon, neurologist, ENT and more' },
  { id: 'topic_enquiry', title: 'Appointment enquiries', description: 'Check, change or cancel a request' },
  { id: 'topic_visitor', title: 'Visitor information', description: 'Visiting guidance and what to know' },
  { id: 'topic_admission', title: 'Admission checklist', description: 'What to bring when you are admitted' },
  { id: 'topic_billing', title: 'Billing questions', description: 'We point you to the right team' },
  { id: 'topic_contact', title: 'Contact & about', description: 'Numbers, website, about Netcare' },
];

const byId = (id) => MENU_ROWS.find((r) => r.id === id);
// The menu is shown in sections so it is easy to scan (WhatsApp: max 10 rows in total)
export const MENU_SECTIONS = [
  { title: 'Urgent', rows: ['topic_emergency'].map(byId) },
  { title: 'Appointments', rows: ['topic_appointment', 'topic_enquiry'].map(byId) },
  { title: 'Hospital info', rows: ['topic_directions', 'topic_visitor', 'topic_admission'].map(byId) },
  { title: 'Billing & contact', rows: ['topic_billing', 'topic_contact'].map(byId) },
];

export const SPECIALTIES = [
  { id: 'dentist', title: 'Dentist', description: 'Dental care and oral surgery' },
  { id: 'surgeon', title: 'General surgeon', description: 'Surgical consultations and procedures' },
  { id: 'neurologist', title: 'Neurologist', description: 'Brain and nervous system' },
  { id: 'urologist', title: 'Urologist', description: 'Kidneys, bladder and urinary tract' },
  { id: 'ent', title: 'Ear, nose & throat (ENT)', description: 'Ear, nose and throat specialist' },
  { id: 'cardiologist', title: 'Cardiologist', description: 'Heart and blood vessels' },
  { id: 'orthopaedic', title: 'Orthopaedic surgeon', description: 'Bones, joints and sports injuries' },
  { id: 'gynaecologist', title: 'Gynaecologist', description: "Women's health" },
  { id: 'paediatrician', title: 'Paediatrician', description: "Children's health" },
  { id: 'other', title: 'Other specialty', description: 'Tell us which specialist you need' },
];

export const BILLING = [
  { id: 'hospital', title: 'Hospital account', description: 'Ward, theatre and hospital charges',
    a: '*Hospital account*\nThe hospital account covers the hospital\'s own charges (ward, theatre, nursing and consumables).\n\n➡️ *Who to contact:* the accounts / patient administration office of the hospital where you were treated. Have your account or patient number ready.' },
  { id: 'doctor', title: 'Doctor/specialist bill', description: 'Surgeon, anaesthetist, radiology…',
    a: '*Doctor or specialist bill*\nSurgeons, specialists, anaesthetists, radiologists and pathologists usually bill you *separately* from the hospital, so the hospital cannot change or explain those accounts.\n\n➡️ *Who to contact:* the practice or service named on that account.' },
  { id: 'scheme', title: 'Medical aid / shortfall', description: 'Claims, co-payments, shortfalls',
    a: '*Medical aid claims and shortfalls*\nYour medical scheme decides what it pays. If it pays only part of an account, you are responsible for the shortfall or co-payment.\n\n➡️ *Who to contact:* your medical scheme first (the number is on your membership card). For questions about the hospital\'s account itself, contact the hospital\'s accounts office.' },
  { id: 'auth', title: 'Authorisation/estimate', description: 'Pre-authorisation and cost estimates',
    a: '*Authorisation and estimates*\nMedical aid patients get authorisation from their scheme *before* admission. Private (non-medical-aid) patients can ask the hospital for an *estimate* – it is not the final bill.\n\n➡️ *Who to contact:* the hospital\'s admissions office or case manager.' },
  { id: 'private', title: 'Private / cash patient', description: 'Estimates, deposits and payment',
    a: '*Private (cash) patients*\nPrivate patients are normally given an estimate, which is usually payable before admission (typically by card or EFT). Please confirm the payment options with the hospital.\n\n➡️ *Who to contact:* the hospital\'s admissions office.' },
  { id: 'gap', title: 'Gap cover (NetcarePlus)', description: 'Gap cover service centre',
    a: '*Gap cover (NetcarePlus)*\nFor NetcarePlus gap-cover queries, call the NetcarePlus service centre on *0860 101 151*.' },
  { id: 'arrange', title: 'Payment arrangements', description: 'Cannot pay in full?',
    a: '*Payment arrangements*\nIf you cannot settle an account in full, please contact the hospital\'s accounts office *early* to discuss your options.\n\n➡️ *Who to contact:* the accounts office of the hospital that sent the account.' },
  { id: 'dispute', title: 'Dispute or complaint', description: 'Something looks wrong on a bill',
    a: '*Dispute or complaint*\nPlease contact the hospital\'s *customer care* team and quote your account number. If the hospital has a customer-care email it is shown with its details under *Hospital directions*; otherwise call the hospital and ask for customer care or patient relations.' },
];

export const TEXT = {
  welcome:
    '👋 Welcome to the *Netcare* assistant.\n\nI can help with hospital directions, appointment requests, visitor information, admission checklists and billing questions.\n\n🚨 *In an emergency, call Netcare 911 on 082 911.*\n\nI give general information only – not medical advice.\n\nTap *Menu*, or just type what you need – for example "ENT specialist at Sunninghill next Tuesday morning".',
  menuBody: 'Choose a topic from the menu – or just type what you need, for example "ENT specialist at Sunninghill next Tuesday morning".',
  thanks: "You're welcome! 😊 Tap *Menu* whenever you need me.",
  bye: 'Take care! 👋 Message me any time. In an emergency, call Netcare 911 on 082 911.',
  outOfScope: "I'm not able to help with that here – I can't give medical advice or answer questions outside what's in the menu. For anything urgent, phone the hospital or call Netcare 911 on 082 911.",
  lock: "Let's finish your request first 😊 (type *cancel* at any time to leave it).",
  stale: "That option is from an earlier step, so I've kept your request where it was. (Type *cancel* at any time to leave it.)",
  cancelled: "No problem – I've cancelled that request and cleared your details.",
  clarify: 'I want to be sure I help with the right thing. Did you mean:',
  timeout: 'Your earlier request timed out to protect your privacy, so I cleared it. Let\'s start again.',
  editBody: 'What would you like to change?',
  humanNote: 'I can\'t transfer you to a person in this chat, but here is how to reach Netcare directly:',
  menuFooter: 'Type menu anytime',
  more: 'Is there anything else I can help with?',
  fallback: "Sorry, I didn't understand that. Please use the *Menu* to choose a topic.",

  emergency:
    '🚨 *If this is an emergency, act now:*\n• Call *Netcare 911: 082 911* (24/7)\n• Or call *112* from a cellphone\n• Public ambulance: *10177*\n• Go to the nearest hospital emergency unit\n\nGive your exact location and a number the crew can call back.\n\nThis assistant cannot give medical advice or send an ambulance.',
  crisis:
    '\n\n💙 If you are thinking of harming yourself, you are not alone. The SADAG suicide crisis line is *0800 567 567*, or call Netcare 911 on 082 911.',

  contact:
    '*Contact Netcare*\n🚨 Netcare 911 (24/7): *082 911*\n🌐 www.netcare.co.za\n🏥 Each hospital\'s phone number and address: choose *Hospital directions* in this chat\n💳 Gap cover (NetcarePlus service centre): 0860 101 151\n\n*About Netcare*\nNetcare runs South Africa\'s largest network of private hospitals, along with Medicross clinics, Akeso psychiatric facilities and the Netcare 911 emergency service.',

  visitor:
    '*Visitor information*\nVisiting hours are different at every hospital and can change (for example for infection control), so *please call the hospital before you travel* to confirm times.\n\n*General guidance*\n• Bring an ID document – you may be asked to sign in.\n• The number of visitors per patient is usually limited, and ICU / high care has its own stricter hours.\n• Please do not visit if you are unwell (flu, fever, diarrhoea) – it protects patients.\n• Keep phones on silent and voices low.\n• Check with the ward before bringing food, flowers or gifts.\n• For an emergency, use the hospital\'s emergency unit entrance or call Netcare 911 on 082 911.\n\nTap *Hospital details* to get a hospital\'s phone number and directions.',

  admission:
    '*Admission checklist*\n_General list – your doctor or hospital may ask for more._\n\n✅ *Bring*\n• ID document (for a child, the parent or guardian\'s ID)\n• Medical aid card and membership number\n• Your *authorisation number* from your medical scheme\n• Your doctor\'s admission letter or booking details\n• A list of your medicines, and chronic medicine in its original packaging\n• Allergy details and any medical alerts\n• Recent test results, X-rays or scans\n• Comfortable clothing, toiletries and slippers\n• Phone, charger and a contact person\'s number\n\n💳 *Private (non-medical-aid) patients:* the hospital gives an estimate, which is usually payable before admission – confirm with the admissions office.\n\n❌ *Leave at home:* jewellery, large amounts of cash and other valuables.\n\n🍽️ Follow your doctor\'s instructions about fasting and medicines before your procedure.\n\nMany hospitals also offer pre-admission – call yours to ask.',

  // ---- hospital picker ----
  pickProvince: 'Which province is the hospital in?',
  pickArea: 'Which part of Gauteng?',
  pickHospital: 'Choose a hospital.',
  noTel: 'Find the number at www.netcare.co.za (Find a hospital)',

  // ---- forms ----
  consent:
    '🔒 *Before we continue*\nTo pass your request on, the hospital or rooms will receive your *name, phone number and preferred time*. Please do *not* type medical details or ID numbers in this chat.\n\nDo you agree?',
  askName: 'What is your *full name*?\n\nType *menu* to cancel.',
  askPhone: 'What is the best *phone number* to reach you on? (for example 082 123 4567)',
  askWhen: 'When would you like to be seen? (for example "weekday mornings next week" or "20 Oct after 2pm")',
  askPayer: 'How will this be paid?',
  askRef: 'Do you have an account or booking reference? Type it, or type *skip*.',
  askAction: 'What would you like to do with your appointment?',
  askSpecialty: 'Which specialist do you need? (for example "dermatologist")',
  badName: "That doesn't look like a name. Please type your full name.",
  badPhone: "That doesn't look like a South African phone number. Please type it like 082 123 4567.",
  badWhen: 'Please tell us a day or time that suits you (a few words is fine).',
  badRef: 'Please type your reference, or type *skip*.',
  badSpecialty: 'Please type the kind of specialist you need (a few words).',
  badRefLookup: 'A request reference looks like *NC-ABC123*. Please check it and try again, or type *menu* to cancel.',
  rateLimited: 'You have reached the limit of requests for now. Please try again later or phone the hospital directly.',
  submitError: '⚠️ We could not send your request right now. Please try again later or phone the hospital directly.',
  statusAsk: '🔎 Please type your request reference (for example *NC-ABC123*).\n\nType *menu* to cancel.',
  statusNotFound: (r) => `⚠️ We couldn't find a request with reference *${r}*. Please check it, or contact the hospital directly.`,
  demoNote: '\n\n🧪 *Demo mode:* this prototype does not send requests to any hospital, and nothing is booked.',
  enquiry: '*Appointment enquiries*\nI cannot see your diary, but I can:\n• check the status of a request made through this chat\n• pass on a request to confirm, reschedule or cancel\n\nFor anything urgent, phone the hospital or the doctor\'s rooms directly.',
};

export const EMERGENCY_WORDS =
  /(chest pain|can'?t breathe|cannot breathe|difficulty breathing|not breathing|short of breath|unconscious|collapsed|seizure|stroke|heart attack|severe bleeding|bleeding heavily|won'?t stop bleeding|overdose|poison|choking|emergency|ambulance|suicid|kill myself|want to die|self[- ]?harm)/i;
export const CRISIS_WORDS = /(suicid|kill myself|want to die|self[- ]?harm)/i;
