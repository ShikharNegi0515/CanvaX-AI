import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Wand2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { aiApi } from '../../lib/api';
import { useCanvasStore, type CanvasElement } from '../../store/useCanvasStore';

const QUICK_PROMPTS = [
  'Login and signup flow',
  'Microservices architecture',
  'User authentication flowchart',
  'E-commerce checkout process',
  'CI/CD pipeline diagram',
  'REST API design',
];

interface AIPanelProps {
  theme: 'light' | 'dark';
}

export function AIPanel({ theme }: AIPanelProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addElement, setSelectedIds, commit } = useCanvasStore();

  const isDark = theme === 'dark';
  const bg = isDark ? '#1a1a24' : '#ffffff';
  const surface = isDark ? '#252531' : '#f8f9ff';
  const border = isDark ? '#3a3a4a' : '#e2e2f0';
  const text = isDark ? '#e2e2f0' : '#1e1e2e';
  const muted = isDark ? '#888899' : '#6b6b80';
  const accent = '#6965db';
  const accentLight = isDark ? 'rgba(105,101,219,0.15)' : 'rgba(105,101,219,0.08)';

  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await aiApi.generate(prompt.trim());
      const elements = res.elements as CanvasElement[];

      if (!elements || elements.length === 0) {
        setError('No elements were generated. Try a different prompt.');
        return;
      }

      // Place generated diagram at a clean offset on canvas
      const ids: string[] = [];
      elements.forEach(el => {
        const id = crypto.randomUUID();
        ids.push(id);
        addElement({ ...el, id });
      });

      setSelectedIds(ids);
      commit();
      setSuccess(true);
      setPrompt('');
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerate();
    }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        id="ai-panel-trigger"
        title="Generate diagram with AI"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          borderRadius: 100,
          border: 'none',
          cursor: 'pointer',
          background: `linear-gradient(135deg, ${accent}, #9c67e0)`,
          color: '#fff',
          fontWeight: 600,
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 4px 20px rgba(105,101,219,0.45)',
          transition: 'all 0.2s ease',
          letterSpacing: 0.2,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        <Wand2 size={16} />
        AI Generate
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 78,
            right: 24,
            zIndex: 300,
            width: 360,
            borderRadius: 16,
            background: bg,
            border: `1px solid ${border}`,
            boxShadow: isDark
              ? '0 20px 60px rgba(0,0,0,0.6)'
              : '0 20px 60px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            fontFamily: 'Inter, sans-serif',
            animation: 'slideUp 0.2s ease',
          }}
        >
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(12px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .ai-quick-chip:hover {
              background: ${accentLight} !important;
              border-color: ${accent} !important;
              color: ${accent} !important;
            }
          `}</style>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 12px',
            borderBottom: `1px solid ${border}`,
            background: `linear-gradient(135deg, ${accentLight}, transparent)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: `linear-gradient(135deg, ${accent}, #9c67e0)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={14} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: text }}>AI Diagram Generator</div>
                <div style={{ fontSize: 11, color: muted }}>Powered by Gemini</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: muted, padding: 4, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: 16 }}>
            {/* Prompt input */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKey}
                rows={3}
                maxLength={1000}
                disabled={loading}
                style={{
                  width: '100%',
                  background: surface,
                  border: `1.5px solid ${prompt.trim() ? accent : border}`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 13,
                  color: text,
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.6,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                  caretColor: accent,
                }}
                placeholder="Describe a diagram... e.g. 'User authentication flowchart with JWT'"
              />
              <div style={{
                position: 'absolute', bottom: 8, right: 10,
                fontSize: 10, color: muted,
              }}>
                {prompt.length}/1000
              </div>
            </div>

            {/* Quick prompts */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Quick Prompts
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {QUICK_PROMPTS.map(qp => (
                  <button
                    key={qp}
                    className="ai-quick-chip"
                    onClick={() => setPrompt(qp)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      border: `1px solid ${border}`,
                      background: surface,
                      color: muted,
                      fontSize: 11,
                      fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {qp}
                  </button>
                ))}
              </div>
            </div>

            {/* Error / Success message */}
            {error && (
              <div style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 10,
                background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)',
                fontSize: 12, color: '#e05555',
              }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 10,
                background: 'rgba(80,200,120,0.1)', border: '1px solid rgba(80,200,120,0.3)',
                fontSize: 12, color: '#38a169',
              }}>
                ✅ Diagram generated successfully!
              </div>
            )}

            {/* Generate button */}
            <button
              id="ai-generate-btn"
              onClick={handleGenerate}
              disabled={!prompt.trim() || loading}
              style={{
                width: '100%',
                padding: '11px 0',
                borderRadius: 10,
                border: 'none',
                background: !prompt.trim() || loading
                  ? (isDark ? '#333344' : '#e8e8f0')
                  : `linear-gradient(135deg, ${accent}, #9c67e0)`,
                color: !prompt.trim() || loading ? muted : '#fff',
                fontWeight: 600,
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                cursor: !prompt.trim() || loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s',
                boxShadow: !prompt.trim() || loading
                  ? 'none'
                  : '0 4px 12px rgba(105,101,219,0.35)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  Generating...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Generate Diagram
                  <span style={{ fontSize: 10, opacity: 0.7 }}>⌘↵</span>
                </>
              )}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: muted }}>
              Elements will be added to your current canvas
            </div>
          </div>
        </div>
      )}
    </>
  );
}
