import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Table as TableIcon } from 'lucide-react';
import { useBusinessContext } from '@/shared/contexts/BusinessContext';

import { apiPost } from '@/shared/lib/apiClient';

type MessageRole = 'user' | 'bot';

interface TableData {
  headers: string[];
  rows: string[][];
}

interface Message {
  id: string;
  role: MessageRole;
  text: string;
  type?: 'text' | 'error' | 'table';
  table?: TableData | null;
  timestamp: Date;
}

async function sendChatMessage(message: string): Promise<{ text: string; type: string; table?: TableData | null }> {
  return apiPost('/invoices/chat', { message });
}

function DataTable({ table }: { table: TableData }) {
  if (!table || !Array.isArray(table.headers) || !Array.isArray(table.rows)) {
    return null;
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-indigo-200 dark:border-indigo-800">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-indigo-50 dark:bg-indigo-900/40">
            {table.headers.map((h, i) => (
              <th key={i} className="px-4 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr
              key={ri}
              className={ri % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-indigo-50/50 dark:bg-indigo-900/20'}
            >
              {Array.isArray(row) && row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2 text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isError = message.type === 'error';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl shadow-md ${
          isUser
            ? 'bg-gradient-to-br from-indigo-600 to-violet-600'
            : isError
            ? 'bg-gradient-to-br from-red-500 to-rose-500'
            : 'bg-gradient-to-br from-slate-700 to-slate-900'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'rounded-tr-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
              : isError
              ? 'rounded-tl-md border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400'
              : 'rounded-tl-md border border-border bg-card text-foreground'
          }`}
        >
          {message.text}
          {message.table && <DataTable table={message.table} />}
        </div>
        <span className="px-2 text-[11px] text-muted-foreground">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  'Show me all unpaid invoices',
  'Which clients owe the most?',
  'Summarize revenue this month',
  'What invoices are overdue by more than 30 days?',
];

export function InvoiceChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: '👋 Hello! I\'m your **Invoice AI Assistant**. Ask me anything about your invoices, clients, revenue, or payments — I\'ll analyze your data and give you instant insights.',
      type: 'text',
      table: null,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: message,
      type: 'text',
      table: null,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await sendChatMessage(message);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        text: data.text,
        type: (data.type as any) || 'text',
        table: data.table ?? null,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'bot',
          text: '⚠️ Failed to connect to the Invoice AI. Please make sure the AI service is running and try again.',
          type: 'error',
          table: null,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 shadow-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Invoice AI Chatbot</h2>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <p className="text-xs text-white/80">Online · Ask anything about your invoices</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
          <span className="text-xs font-semibold text-white">AI Powered</span>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 space-y-5 overflow-y-auto bg-background px-4 py-6 sm:px-6"
        aria-live="polite"
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-md">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-2 rounded-3xl rounded-tl-md border border-border bg-card px-4 py-3 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              <span className="text-sm text-muted-foreground">Analyzing your invoices…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 border-t border-border bg-muted/30 px-4 py-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={loading}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-4">
        <div className="flex items-end gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 shadow-inner transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/20">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about invoices, clients, revenue…"
            aria-label="Chat input"
            disabled={loading}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none disabled:opacity-50"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Press <kbd className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono">Enter</kbd> to send · <kbd className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
