import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { aiApi } from '../../lib/api';
import { type CanvasElement } from '../../store/useCanvasStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  elementsCreated?: number;
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  canvasElements: CanvasElement[];
  onAddElements: (elements: CanvasElement[]) => void;
}

export function AIChatDrawer({
  isOpen,
  onClose,
  canvasElements,
  onAddElements,
}: AIChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I am CanvaX Copilot. I can analyze your canvas, generate new diagrams, or summarize shapes into sticky notes. What would you like to build?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input.trim();
    if (!promptToSend || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: promptToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: promptToSend });

      const res = await aiApi.chat(history, canvasElements);

      if (res.newElements && res.newElements.length > 0) {
        onAddElements(res.newElements as CanvasElement[]);
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.text || 'I have updated your canvas!',
        elementsCreated: res.newElements?.length,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, I ran into an error connecting to AI services.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Generate microservices architecture',
    'Summarize canvas into sticky notes',
    'Create user onboarding flowchart',
    'Suggest missing database connections',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          style={{
            position: 'fixed',
            top: 70,
            right: 16,
            width: 360,
            height: 'calc(100vh - 90px)',
            background: '#0d1526',
            border: '1px solid rgba(6,182,212,0.25)',
            borderRadius: 16,
            zIndex: 120,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(6,182,212,0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid rgba(6,182,212,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(6,182,212,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(6,182,212,0.4)',
                }}
              >
                <Bot size={18} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#e2f4fb', fontWeight: 700 }}>
                  CanvaX Copilot
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#6ba8c4' }}>AI Canvas Assistant</span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#6ba8c4',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 6,
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages body */}
          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background:
                    m.role === 'user'
                      ? 'linear-gradient(135deg, #06b6d4, #0891b2)'
                      : 'rgba(255,255,255,0.04)',
                  border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: m.role === 'user' ? '#fff' : '#e2f4fb',
                  padding: '10px 14px',
                  borderRadius: 12,
                  fontSize: '0.875rem',
                  lineHeight: 1.4,
                  boxShadow: m.role === 'user' ? '0 4px 12px rgba(6,182,212,0.3)' : 'none',
                }}
              >
                {m.content}
                {m.elementsCreated && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: '0.75rem',
                      color: '#10b981',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Sparkles size={12} /> Created {m.elementsCreated} canvas shapes!
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255,255,255,0.04)',
                  padding: '8px 12px',
                  borderRadius: 12,
                  color: '#6ba8c4',
                  fontSize: '0.8rem',
                }}
              >
                <Loader2 size={14} className="animate-spin" />
                Thinking & generating canvas components...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
            }}
          >
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                style={{
                  whiteSpace: 'nowrap',
                  background: 'rgba(6,182,212,0.08)',
                  border: '1px solid rgba(6,182,212,0.2)',
                  borderRadius: 20,
                  padding: '4px 10px',
                  color: '#06b6d4',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: 12,
              borderTop: '1px solid rgba(6,182,212,0.15)',
              display: 'flex',
              gap: 8,
              background: '#080c14',
            }}
          >
            <input
              type="text"
              placeholder="Ask Copilot or command a layout..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(6,182,212,0.2)',
                borderRadius: 10,
                padding: '8px 12px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
