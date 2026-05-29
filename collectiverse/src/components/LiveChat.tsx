'use client';

import { useState, useEffect, useRef } from 'react';

export default function LiveChat({ eventId, isLive }: { eventId: string; isLive: boolean }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const lastTimestamp = useRef<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadMessages = async () => {
    const params = lastTimestamp.current ? `?after=${encodeURIComponent(lastTimestamp.current)}` : '';
    const res = await fetch(`/api/live-events/${eventId}/messages${params}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.messages?.length > 0) {
      setMessages(prev => [...prev, ...data.messages]);
      lastTimestamp.current = data.messages[data.messages.length - 1].createdAt;
    }
  };

  useEffect(() => {
    loadMessages();
    if (isLive) {
      pollRef.current = setInterval(loadMessages, 4000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [eventId, isLive]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    const res = await fetch(`/api/live-events/${eventId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      setInput('');
    }
    setSending(false);
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'CLAIM': return 'bg-amber-400/10 text-amber-400 border-l-2 border-amber-400';
      case 'SYSTEM': return 'bg-electric/10 text-electric border-l-2 border-electric';
      case 'SELLER_UPDATE': return 'bg-purple-400/10 text-purple-300 border-l-2 border-purple-400';
      default: return '';
    }
  };

  return (
    <div className="card-surface flex flex-col h-[400px]">
      <div className="p-3 border-b border-silver/10">
        <p className="text-xs font-semibold text-silver uppercase tracking-wider">Live Chat</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && <p className="text-xs text-silver text-center py-4">No messages yet</p>}
        {messages.map((msg: any) => (
          <div key={msg.id} className={`px-2 py-1.5 rounded text-xs ${getMessageStyle(msg.messageType)}`}>
            {msg.messageType === 'CHAT' && <span className="font-medium text-white">{msg.displayName}: </span>}
            {msg.messageType === 'SELLER_UPDATE' && <span className="font-medium">🎙️ {msg.displayName}: </span>}
            {msg.messageType === 'CLAIM' && <span className="font-medium">🏷️ </span>}
            {msg.messageType === 'SYSTEM' && <span className="font-medium">⚡ </span>}
            <span className={msg.messageType === 'CHAT' ? 'text-silver' : ''}>{msg.message}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-2 border-t border-silver/10 flex gap-2">
        <input className="input-field text-xs flex-1 py-1.5" placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} maxLength={500} />
        <button type="submit" disabled={sending || !input.trim()} className="px-3 py-1.5 rounded text-xs font-medium bg-electric/20 text-electric hover:bg-electric/30 disabled:opacity-50 transition-colors">Send</button>
      </form>
    </div>
  );
}
