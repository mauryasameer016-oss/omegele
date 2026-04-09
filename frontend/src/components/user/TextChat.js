import React, { useState, useRef, useEffect } from 'react';

export default function TextChat({ messages, onSend, partnerName, disabled }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', height: '100%' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: partnerName ? 'var(--green)' : 'var(--text-muted)' }} />
        <span style={{ fontSize: 13.5, fontWeight: 500 }}>
          {partnerName ? `Chatting with ${partnerName}` : 'Not connected'}
        </span>
      </div>

      <div className="chat-messages" style={{ flex: 1 }}>
        {messages.length === 0 && (
          <div className="empty-state" style={{ flex: 1, justifyContent: 'center' }}>
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-title">Say hello!</div>
            <div className="empty-state-desc">Messages are only visible during this session</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.from === 'you' ? 'msg-you' : 'msg-them'}`}>
            <div className="msg-bubble">{m.text}</div>
            <div className="msg-time">{m.time}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          className="chat-input"
          rows={1}
          placeholder={disabled ? 'Connect to start chatting…' : 'Type a message…'}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
          style={{ maxHeight: 100 }}
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={disabled || !text.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
