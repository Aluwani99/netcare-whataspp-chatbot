# Netcare WhatsApp Assistant – Prototype (Node.js + React + Meta Cloud API)

Say **hi** → menu:
- 🚨 **Emergency help** – Netcare 911 (082 911), 112, 10177
- **Hospital directions** – 46 hospitals by province (Gauteng by area): address, phone, Google Maps link
- **Request appointment** – dentist, general surgeon, neurologist, urologist, ENT, cardiologist, orthopaedic, gynaecologist, paediatrician, other → hospital → name/phone/preferred time → reference number
- **Appointment enquiries** – check a request's status, or ask to confirm / reschedule / cancel
- **Visitor information** · **Admission checklist**
- **Billing questions** – 8 topics routed to the right team (hospital account, doctor's bill, medical aid/shortfall, authorisation/estimate, private patients, gap cover, payment arrangements, disputes) + call-back request
- **Contact & about**

## How the bot understands people (new)
1. **Menu (sectioned):** Urgent · Appointments · Hospital info · Billing & contact – easier to scan than one long list.
2. **Natural typing:** people can type *"I need an ENT at Sunninghill next Tuesday morning"*. The bot picks out the specialist, hospital/place and preferred time, shows a recap, and only asks for what is still missing (consent → name → phone → payment).
3. **Smart shortcuts:** a hospital name alone ("Milpark") gives directions; "cancel my appointment" goes to enquiries; a pasted reference (NC-ABC123) shows its status straight away; "can't afford my bill" jumps to payment arrangements.
4. **Asks when unsure:** if a message could mean two things, the bot offers buttons ("Did you mean: Book appointment / Billing question?") instead of guessing.
5. **Edit before submit:** the summary has *Submit request · Edit details · Cancel*; people can change any single detail. Typing *menu*, *cancel* or *back* works anywhere.
6. **Privacy timeout:** a half-finished request is discarded after 30 minutes of silence.
7. **Optional AI (Claude):** for messages the rules can't classify, the server can ask Claude to pick an intent/slots, or write a SHORT answer from the knowledge in `content.js`. It is a router, not a free chatbot:
   - emergency words are caught by rules *before* any AI call, and AI is never called for form answers (names, phones)
   - only the user's free-text question is sent, with long numbers redacted
   - the model's reply is validated: intents come from a fixed list; any answer containing a phone number, link or e-mail that is not in Netcare's own content is thrown away
   - if the AI is slow, down or off, the bot falls back to rules automatically
   - enable it by putting `ANTHROPIC_API_KEY` in `server/.env` (**server only – never in the client**; the GitHub Pages demo always runs on rules). `AI_MODE=off` disables it. Get Netcare/POPIA sign-off first because health-related text may reach a third-party service.

## Conversation lock (requests can't be derailed)
While an appointment / call-back / change request is in progress the bot **stays inside it**:
- Typed text is read as the answer to the *current* step (e.g. typing "Sunninghill" at the hospital step picks it; "medical aid" answers the payment step; "yes" gives consent; "submit" submits).
- Taps on old buttons/lists from earlier in the chat are ignored and the current step is repeated – they can't change or submit anything.
- "hi", unrelated words, or general questions don't wipe the request, and no AI/general understanding is used mid-request.
- Only **cancel / menu** (or an emergency) leaves the request, and the bot confirms that the details were cleared.
- Every choice is acknowledged ("✅ Hospital: …", "✅ Specialist: …").

## Tests
`cd server && npm test` runs four suites: a **crawler that taps every button and list row the bot offers** (using the exact ids WhatsApp sends back, so dead ends are caught), the lock behaviour, general behaviour/limits, and the AI guardrails (API stubbed).

## Structure
```
server/   Node.js (Express): WhatsApp webhook, bot.js (conversation), nlu.js (understanding + optional AI), hospitals.js, netcare.js (request intake), content.js (all text)
client/   React (Vite): WhatsApp-style tester + hosted demo
```

## Run locally (VS Code terminal)
```bash
cd server && npm install && copy .env.example .env && npm run dev     # terminal 1
cd client && npm install && npm run dev                               # terminal 2 → http://localhost:5173
```
Type **hi**. Try the full request flow: *Request appointment → ENT → I agree → Gauteng → Johannesburg & Sandton → Sunninghill → …*. Type **chest pain** to see the emergency screen.

## Safety & privacy (built in – keep these)
- **Emergency words** ("chest pain", "can't breathe", "stroke", "overdose", suicide-related words…) trigger the emergency screen at ANY point and cancel the current form. Crisis words also show the SADAG line (0800 567 567).
- The bot gives **no medical advice** and never diagnoses; messages say so.
- Forms collect only **name, phone, preferred time, payment type** – users are told NOT to send medical details or ID numbers. A consent screen comes first (POPIA).
- Requests are described as **requests, not confirmed bookings**.
- Personal details live in the session only until the request is submitted, then are discarded. The demo (mock) provider never stores names/phones and logs nothing personal.
- Max 3 requests per user per hour.

## Data you must verify with Netcare before going live
- **Hospital addresses** come from Netcare's own site list. **Phone numbers are only filled in where several sources agreed** (Milpark, Sunninghill, Linksfield, Rosebank, Park Lane, Garden City, Rand, Unitas, uMhlanga); the rest say "find the number at netcare.co.za". Complete `server/src/hospitals.js` with official switchboards and customer-care emails (some e-mails there come from a published directory – confirm them).
- **Visiting hours** differ by hospital and change, so the bot gives general guidance and tells users to phone the hospital. If Netcare can supply per-hospital hours, add them.
- **Admission checklist and billing routing** are general good-practice guidance. Netcare's patient-administration/accounts teams should review and correct them (e.g. real central accounts contacts).
- Netcare 911 082 911 and NetcarePlus 0860 101 151 are from public Netcare/partner sources.

## Where requests go (important)
`NETCARE_PROVIDER=mock` (default) is a **demo only**: nothing is sent anywhere and nothing is booked. For real use set `NETCARE_PROVIDER=http` with `NETCARE_API_URL` / `NETCARE_API_KEY`;
`server/src/netcare.js` documents the two calls (POST /requests, GET /requests/{ref}) – adapt them to Netcare's real booking/CRM system or a secure intake service.
Test the connection with `npm run check-api` (it prints MOCK or REAL and sends one TEST request).

## Publish the prototype (GitHub Pages)
The hosted demo runs the bot inside the browser (no server).
```bash
git init
git add .
git commit -m "Netcare bot prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/netcare-whatsapp-bot.git
git push -u origin main
```
Then GitHub → **Settings → Pages → Source: GitHub Actions**; wait for the green tick under **Actions**; share `https://YOUR-USERNAME.github.io/netcare-whatsapp-bot/`.
(Free accounts need a public repo for Pages. Never commit `.env`.)

## Connect to real WhatsApp
Meta app → WhatsApp → Phone number ID, access token, App Secret → webhook `https://YOUR-HOST/webhook` with your `VERIFY_TOKEN`, subscribe to `messages`. Host `server/` on any Node host.
Netcare would need its own verified WhatsApp Business account; WhatsApp health-related use must follow Meta's Business policies.

## Before production
- [ ] Netcare clinical/legal/POPIA review of all wording, consent and data flows
- [ ] Real intake (booking/CRM) integration + human hand-off
- [ ] Redis/DB sessions, monitoring, audit logging WITHOUT personal data
- [ ] Complete hospital phone/email data; add other languages if required
