import { useEffect, useRef, useState } from 'react';
import { handleMessage, resetSession } from '../../server/src/bot.js';

// DEMO=true (GitHub Pages build): the bot runs inside the browser, no server needed.
const DEMO = import.meta.env.VITE_DEMO === 'true';

const newSession = () =>
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);

// Render WhatsApp-style *bold* and line breaks
function Rich({ text }) {
  return String(text ?? '').split('\n').map((line, i) => (
    <div key={i}>
      {line.split(/(\*[^*]+\*)/g).map((part, j) =>
        part.startsWith('*') && part.endsWith('*') ? <b key={j}>{part.slice(1, -1)}</b> : part
      )}
      {line === '' && <br />}
    </div>
  ));
}

export default function App() {
  const [sessionId, setSessionId] = useState(newSession);
  const [chat, setChat] = useState([]); // {from:'user'|'bot', ...message}
  const [input, setInput] = useState('');
  const [sheet, setSheet] = useState(null); // open list message
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  async function send({ text = '', id = '', label }) {
    setSheet(null);
    setChat((c) => [...c, { from: 'user', type: 'text', body: label || text }]);
    setBusy(true);
    try {
      let messages;
      if (DEMO) {
        messages = await handleMessage(`demo:${sessionId}`, { text, id });
      } else {
        const res = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, text, id }),
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        messages = Array.isArray(data.messages) ? data.messages : [];
      }
      setChat((c) => [...c, ...messages.map((m) => ({ from: 'bot', ...m }))]);
    } catch (err) {
      setChat((c) => [...c, { from: 'bot', type: 'text', body: `⚠️ Cannot reach the server (${err.message}). Is it running on port 3001?` }]);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (DEMO) resetSession(`demo:${sessionId}`);
    else {
      await fetch('/api/simulate/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
    }
    setChat([]);
    setSheet(null);
    setSessionId(newSession());
  }

  function submit(e) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    send({ text: input.trim() });
    setInput('');
  }

  return (
    <div className="page">
      <div className="phone">
        <header>
          <div className="avatar">N</div>
          <div>
            <strong>Netcare Assistant</strong>
            <small>Bot tester (simulated WhatsApp)</small>
          </div>
          <button className="reset" onClick={reset}>Reset</button>
        </header>

        <div className="messages">
          {chat.length === 0 && <div className="hint">Type <b>hi</b> to start</div>}
          {chat.length === 0 && DEMO && (
            <div className="demo">
              <b>Prototype demo</b> – sample data only. No bookings are made and nothing is sent to any hospital.<br />
              Try: <b>Hospital directions</b> → Gauteng → Johannesburg &amp; Sandton → Milpark.<br />
              Or just type: <b>I need an ENT at Sunninghill next Tuesday morning</b><br />
              Type <b>chest pain</b> to see the emergency screen.
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} className={`bubble ${m.from}`}>
              <Rich text={m.body} />
              {m.type === 'list' && (
                <button className="action" onClick={() => setSheet(m)}>☰ {m.button}</button>
              )}
              {m.type === 'buttons' && (
                <div className="btns">
                  {m.buttons.map((b) => (
                    <button key={b.id} className="action" onClick={() => send({ id: b.id, label: b.title })}>
                      {b.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="bubble bot typing">…</div>}
          <div ref={endRef} />
        </div>

        {sheet && (
          <div className="sheet">
            <div className="sheet-head">
              <strong>{sheet.button}</strong>
              <button onClick={() => setSheet(null)}>✕</button>
            </div>
            {(sheet.sections || [{ title: null, rows: sheet.rows }]).map((sec, i) => (
              <div key={i}>
                {sec.title && sheet.sections && sheet.sections.length > 1 && <div className="sec">{sec.title}</div>}
                {sec.rows.map((r) => (
                  <button key={r.id} className="row" onClick={() => send({ id: r.id, label: r.title })}>
                    <span>{r.title}</span>
                    {r.description && <small>{r.description}</small>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={submit}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message" />
          <button type="submit" disabled={busy}>Send</button>
        </form>
      </div>
    </div>
  );
}
