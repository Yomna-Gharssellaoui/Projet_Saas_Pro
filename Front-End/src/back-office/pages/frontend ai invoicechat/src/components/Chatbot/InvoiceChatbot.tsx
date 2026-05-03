import { useState, useRef, useEffect, KeyboardEvent } from 'react';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

interface Row   { [key: string]: any }
interface Msg   {
  id:         string;
  role:       'user' | 'bot';
  text:       string;
  table?:     Row[] | null;
  intent?:    string;
  type?:      string;
  ts:         Date;
}

const CHIPS = [
  "Who should pay tomorrow?",
  "Show overdue invoices",
  "Which invoices are flagged?",
  "High risk clients",
  "Dashboard overview",
  "Worst payers",
  "Show by city",
  "Paid today",
];

function uid() { return Math.random().toString(36).slice(2, 9); }

/* ── Markdown-lite renderer ─────────────────────────────────────────────── */
function RichText({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,     '<em>$1</em>')
    .replace(/\n/g,             '<br/>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ── Data table ─────────────────────────────────────────────────────────── */
function DataTable({ rows }: { rows: Row[] }) {
  if (!rows?.length) return null;
  const cols = Object.keys(rows[0]);
  return (
    <div style={{ overflowX: 'auto', marginTop: 12 }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontSize: 12, fontFamily: "'DM Mono', monospace",
      }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c} style={{
                padding: '6px 10px', textAlign: 'left',
                background: '#0d2235', color: '#5b9bd5',
                borderBottom: '1px solid #1e3a5a',
                whiteSpace: 'nowrap', fontWeight: 600,
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#0a1a2a' : '#0d2235' }}>
              {cols.map(c => (
                <td key={c} style={{
                  padding: '6px 10px', color: '#c9d1d9',
                  borderBottom: '1px solid #1a2a3a',
                  whiteSpace: 'nowrap',
                }}>
                  {String(row[c] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Typing dots ────────────────────────────────────────────────────────── */
function Dots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '14px 16px',
      background: '#111c2b', border: '1px solid #1e3050',
      borderRadius: 10, borderTopLeftRadius: 3, width: 'fit-content' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#00d9a6',
          animation: `blink 1.2s ${i * 0.2}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

/* ── Main chatbot ───────────────────────────────────────────────────────── */
export function InvoiceChatbot() {
  const [msgs,    setMsgs]    = useState<Msg[]>([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);
  const taRef                 = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);
  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = 'auto';
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 130) + 'px';
  }, [input]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { id: uid(), role: 'user', text: text.trim(), ts: new Date() };
    setMsgs(p => [...p, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      });
      const data = await res.json();
      setMsgs(p => [...p, {
        id: uid(), role: 'bot',
        text:   data.text,
        table:  data.table,
        intent: data.intent,
        type:   data.type,
        ts:     new Date(),
      }]);
    } catch {
      setMsgs(p => [...p, { id: uid(), role: 'bot',
        text: '⚠️ Cannot reach the chatbot server. Is it running?', type: 'error', ts: new Date() }]);
    } finally {
      setLoading(false);
      taRef.current?.focus();
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes blink { 0%,100%{opacity:.25;transform:scale(.85)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#1e3050;border-radius:4px}
      `}</style>

      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%', minHeight: 600,
        background: '#07101c', border: '1px solid #1a2e45',
        borderRadius: 14, overflow: 'hidden',
        fontFamily: "'DM Sans', sans-serif", color: '#c9d1d9',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 20px', background: '#0a1624',
          borderBottom: '1px solid #1a2e45', flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'linear-gradient(135deg,#00d9a6,#0096ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>📊</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#e6edf3' }}>Invoice Assistant</div>
            <div style={{ fontSize: 11, color: '#4a7a9b', fontFamily: "'DM Mono',monospace", marginTop: 1 }}>
              Trained on your PostgreSQL data · 100% offline
            </div>
          </div>
          <div style={{
            marginLeft: 'auto', fontSize: 10, fontFamily: "'DM Mono',monospace",
            padding: '3px 9px', borderRadius: 4,
            background: '#0a2a1e', border: '1px solid #00d9a630', color: '#00d9a6',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d9a6',
              animation: 'blink 2s infinite' }}/>
            LIVE
          </div>
        </div>

        {/* ── Messages ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 8px',
          display: 'flex', flexDirection: 'column', gap: 16 }}>

          {msgs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3', marginBottom: 8 }}>
                Ask me about your invoices
              </div>
              <div style={{ fontSize: 13, color: '#4a7a9b', marginBottom: 24, lineHeight: 1.6 }}>
                I query your PostgreSQL database directly using ML models.<br/>
                No internet. No API. Your data stays private.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {CHIPS.map(c => (
                  <button key={c} onClick={() => send(c)} style={{
                    background: '#0d1f33', border: '1px solid #1e3a55',
                    borderRadius: 8, padding: '7px 13px', fontSize: 12,
                    color: '#5b9bd5', cursor: 'pointer', transition: 'all .15s',
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = '#00d9a6')}
                  onMouseOut={e  => (e.currentTarget.style.borderColor = '#1e3a55')}
                  >{c}</button>
                ))}
              </div>
            </div>
          )}

          {msgs.map(m => (
            <div key={m.id} style={{
              display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
              gap: 10, alignItems: 'flex-start',
              animation: 'fadeUp .2s ease',
            }}>
              {/* Avatar */}
              <div style={{
                width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono',monospace",
                background: m.role === 'user' ? '#0d2a44' : '#0a2a1e',
                border: `1px solid ${m.role === 'user' ? '#1a4a6a' : '#00d9a640'}`,
                color: m.role === 'user' ? '#5b9bd5' : '#00d9a6',
              }}>
                {m.role === 'user' ? 'YOU' : 'AI'}
              </div>

              {/* Bubble */}
              <div style={{ maxWidth: '80%' }}>
                <div style={{
                  padding: '11px 15px',
                  background: m.role === 'user' ? '#0d2a44'
                    : m.type === 'error' ? '#1a0810' : '#0f1e30',
                  border: `1px solid ${
                    m.role === 'user' ? '#1a4060'
                    : m.type === 'error' ? '#5a1520' : '#1a3050'
                  }`,
                  borderRadius: 10,
                  borderTopLeftRadius:  m.role === 'user' ? 10 : 3,
                  borderTopRightRadius: m.role === 'user' ? 3  : 10,
                  fontSize: 13.5, lineHeight: 1.7, color: '#c9d1d9',
                }}>
                  <RichText text={m.text} />
                  {m.table && <DataTable rows={m.table} />}
                </div>
                <div style={{
                  fontSize: 10, color: '#2a4a6a', marginTop: 4,
                  fontFamily: "'DM Mono',monospace",
                  textAlign: m.role === 'user' ? 'right' : 'left',
                }}>
                  {m.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {m.intent && m.intent !== 'unknown' && ` · ${m.intent.replace(/_/g,' ')}`}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 30, height: 30, borderRadius: 7, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: '#0a2a1e', border: '1px solid #00d9a640',
                color: '#00d9a6', fontSize: 11, fontFamily: "'DM Mono',monospace", fontWeight: 600,
              }}>AI</div>
              <Dots />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input ── */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid #1a2e45',
          background: '#0a1624', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={taRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask about your invoices… e.g. 'who should pay tomorrow?'"
              rows={1}
              disabled={loading}
              style={{
                flex: 1, background: '#0d1f33', border: '1px solid #1a3050',
                borderRadius: 9, padding: '10px 14px', resize: 'none', outline: 'none',
                fontFamily: "'DM Sans',sans-serif", fontSize: 13.5,
                color: '#c9d1d9', lineHeight: 1.55, minHeight: 42, maxHeight: 130,
                transition: 'border-color .15s',
              }}
              onFocus={e  => (e.target.style.borderColor = '#00d9a650')}
              onBlur={e   => (e.target.style.borderColor = '#1a3050')}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              style={{
                width: 42, height: 42, borderRadius: 9, border: 'none',
                background: loading || !input.trim() ? '#1a3050' : '#00d9a6',
                color: loading || !input.trim() ? '#4a7a9b' : '#07101c',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all .15s', fontSize: 18,
              }}
            >➤</button>
          </div>
          <div style={{
            fontSize: 10, color: '#2a4a6a', textAlign: 'center',
            marginTop: 7, fontFamily: "'DM Mono',monospace",
          }}>
            Queries your PostgreSQL DB directly · ML-powered · No internet required
          </div>
        </div>
      </div>
    </>
  );
}
