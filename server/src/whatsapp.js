// Converts our simple message objects into Meta WhatsApp Cloud API payloads and sends them.
import { config } from './config.js';

const clamp = (s = '', n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

export function toPayload(to, m) {
  const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to };

  if (m.type === 'text') {
    return { ...base, type: 'text', text: { body: clamp(m.body, 4096), preview_url: false } };
  }

  if (m.type === 'buttons') {
    // Reply buttons: max 3, title max 20 chars
    return {
      ...base,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: clamp(m.body, 1024) },
        action: {
          buttons: m.buttons.slice(0, 3).map((b) => ({
            type: 'reply',
            reply: { id: b.id, title: clamp(b.title, 20) },
          })),
        },
      },
    };
  }

  if (m.type === 'list') {
    // List: max 10 rows, row title max 24, description max 72, button max 20
    return {
      ...base,
      type: 'interactive',
      interactive: {
        type: 'list',
        ...(m.header && { header: { type: 'text', text: clamp(m.header, 60) } }),
        body: { text: clamp(m.body, 1024) },
        ...(m.footer && { footer: { text: clamp(m.footer, 60) } }),
        action: {
          button: clamp(m.button, 20),
          sections: (() => {
            let left = 10; // WhatsApp allows 10 rows in total across all sections
            const secs = m.sections ?? [{ title: m.sectionTitle || 'Options', rows: m.rows }];
            return secs.map((sec) => {
              const rows = sec.rows.slice(0, left);
              left -= rows.length;
              return {
                title: clamp(sec.title || 'Options', 24),
                rows: rows.map((r) => ({
                  id: r.id,
                  title: clamp(r.title, 24),
                  ...(r.description && { description: clamp(r.description, 72) }),
                })),
              };
            }).filter((sec) => sec.rows.length);
          })(),
        },
      },
    };
  }
  throw new Error(`Unknown message type: ${m.type}`);
}

async function callGraph(payload) {
  const url = `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error('WhatsApp API error', res.status, await res.text());
}

export async function sendMessages(to, messages) {
  for (const m of messages) await callGraph(toPayload(to, m)); // sequential keeps order
}

export async function markRead(messageId) {
  await callGraph({ messaging_product: 'whatsapp', status: 'read', message_id: messageId });
}
