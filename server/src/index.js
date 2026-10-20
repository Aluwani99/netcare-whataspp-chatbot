import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { config } from './config.js';
import { handleMessage, resetSession } from './bot.js';
import { sendMessages, markRead } from './whatsapp.js';

const app = express();
app.use(cors());
// keep the raw body so we can verify Meta's signature
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

// ---------- 1. Webhook verification (Meta calls this once when you save the webhook) ----------
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === config.verifyToken) return res.status(200).send(challenge);
  res.sendStatus(403);
});

function validSignature(req) {
  if (!config.appSecret) return true; // skip only in local dev
  const sig = req.get('x-hub-signature-256') || '';
  const expected = 'sha256=' + crypto.createHmac('sha256', config.appSecret).update(req.rawBody || '').digest('hex');
  const a = Buffer.from(sig), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---------- 2. Incoming messages ----------
const seen = new Set(); // simple de-duplication (Meta can retry). Use Redis in production.

app.post('/webhook', (req, res) => {
  if (!validSignature(req)) return res.sendStatus(401);
  res.sendStatus(200); // always answer fast, then process

  const changes = req.body?.entry?.flatMap((e) => e.changes || []) || [];
  for (const change of changes) {
    for (const msg of change.value?.messages || []) {
      if (seen.has(msg.id)) continue;
      seen.add(msg.id);
      if (seen.size > 5000) seen.clear();
      processMessage(msg).catch((err) => console.error('Process error', err));
    }
  }
});

async function processMessage(msg) {
  const input = { text: '', id: '' };
  if (msg.type === 'text') input.text = msg.text.body;
  else if (msg.type === 'interactive') {
    input.id = msg.interactive.list_reply?.id || msg.interactive.button_reply?.id || '';
  } // images/voice notes etc. fall through to the bot's fallback reply

  markRead(msg.id).catch(() => {});
  const replies = await handleMessage(msg.from, input);
  await sendMessages(msg.from, replies);
}

// ---------- 3. Simulator endpoints (used by the React tester, no WhatsApp needed) ----------
app.post('/api/simulate', async (req, res) => {
  const { sessionId = 'demo', text = '', id = '' } = req.body || {};
  res.json({ messages: await handleMessage(`sim:${sessionId}`, { text, id }) });
});
app.post('/api/simulate/reset', (req, res) => {
  resetSession(`sim:${req.body?.sessionId || 'demo'}`);
  res.json({ ok: true });
});

app.get('/health', (_req, res) => res.json({ status: 'ok', dataSource: config.paycity.provider }));

app.listen(config.port, () => console.log(`NHBRC bot server listening on :${config.port}`));
