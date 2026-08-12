import { useState } from 'react';
import { GitBranch, X, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { parseMermaid } from '../../lib/mermaid-parser';
import { useCanvasStore } from '../../store/useCanvasStore';

const EXAMPLE = `flowchart LR
  A([Start]) --> B{Has Account?}
  B -->|Yes| C[Login Page]
  B -->|No| D[Sign Up Page]
  D --> C
  C --> E{Valid Credentials?}
  E -->|Yes| F[Dashboard]
  E -->|No| G[Show Error]
  G --> C`;

interface MermaidPanelProps {
  theme: 'light' | 'dark';
}

export function MermaidPanel({ theme }: MermaidPanelProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { addElement, setSelectedIds, commit } = useCanvasStore();

  const isDark = theme === 'dark';
  const bg     = isDark ? '#1a1a24' : '#ffffff';
  const surface= isDark ? '#252531' : '#f8f9ff';
  const border = isDark ? '#3a3a4a' : '#e2e2f0';
  const text   = isDark ? '#e2e2f0' : '#1e1e2e';
  const muted  = isDark ? '#888899' : '#6b6b80';
  const accent = '#10b981'; // emerald green

  const handleImport = () => {
    setError(null);
    setSuccess(false);
    try {
      const raw = code.trim() || EXAMPLE;
      const elements = parseMermaid(raw);
      if (elements.length === 0) {
        setError('No elements found. Check your Mermaid syntax.');
        return;
      }
      const ids: string[] = [];
      elements.forEach(el => {
        ids.push(el.id);
        addElement(el);
      });
      setSelectedIds(ids);
      commit();
      setSuccess(true);
      setCode('');
      setTimeout(() => { setSuccess(false); setOpen(false); }, 1200);
    } catch (e: any) {
      setError(e.message ?? 'Failed to parse Mermaid code.');
    }
  };

  return (
    <>
      <button
        id="mermaid-panel-trigger"
        title="Import Mermaid diagram"
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 180, zIndex: 300,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 100, border: 'none',
          cursor: 'pointer',
          background: `linear-gradient(135deg, ${accent}, #059669)`,
          color: '#fff', fontWeight: 600, fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        <GitBranch size={15} />
        Mermaid
        {open ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
      </button>

      {open && (
        <div style={{
          position: 'fixed', bottom: 78, right: 180, zIndex: 300,
          width: 400, borderRadius: 16,
          background: bg, border: `1px solid ${border}`,
          boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(0,0,0,0.12)',
          overflow: 'hidden', fontFamily: 'Inter, sans-serif',
          animation: 'slideUpM 0.2s ease',
        }}>
          <style>{`@keyframes slideUpM { from { opacity:0;transform:translateY(12px); } to { opacity:1;transform:translateY(0); } }`}</style>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 12px',
            borderBottom: `1px solid ${border}`,
            background: `linear-gradient(135deg, rgba(16,185,129,0.1), transparent)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: `linear-gradient(135deg, ${accent}, #059669)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <GitBranch size={14} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: text }}>Mermaid Import</div>
                <div style={{ fontSize: 11, color: muted }}>Paste flowchart syntax → canvas</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background:'none', border:'none', cursor:'pointer', color: muted, padding:4, borderRadius:6, display:'flex' }}>
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: 16 }}>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              rows={9}
              placeholder={EXAMPLE}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: surface, border: `1.5px solid ${code.trim() ? accent : border}`,
                borderRadius: 10, padding: '10px 12px',
                fontSize: 12, color: text, resize: 'vertical',
                outline: 'none', fontFamily: '"Courier New", monospace',
                lineHeight: 1.6, transition: 'border-color 0.15s',
                caretColor: accent,
              }}
            />

            <div style={{ fontSize: 11, color: muted, marginBottom: 12 }}>
              Supports: <code style={{ background: surface, padding: '1px 4px', borderRadius: 3 }}>flowchart LR/TD</code>, nodes <code style={{ background: surface, padding: '1px 4px', borderRadius: 3 }}>[ ] ( ) {'{ }'} ([ ]) (( ))</code>, arrows <code style={{ background: surface, padding: '1px 4px', borderRadius: 3 }}>--&gt;</code> with <code style={{ background: surface, padding: '1px 4px', borderRadius: 3 }}>|labels|</code>
            </div>

            {error && (
              <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 10, background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', fontSize: 12, color: '#e05555' }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', fontSize: 12, color: '#10b981' }}>
                ✅ Diagram imported!
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setCode(EXAMPLE)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  border: `1px solid ${border}`, background: surface,
                  color: muted, fontSize: 12, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                }}
              >
                Load Example
              </button>
              <button
                id="mermaid-import-btn"
                onClick={handleImport}
                style={{
                  flex: 2, padding: '10px 0', borderRadius: 10, border: 'none',
                  background: `linear-gradient(135deg, ${accent}, #059669)`,
                  color: '#fff', fontWeight: 600, fontSize: 13,
                  fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                }}
              >
                <Play size={13} /> Import to Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
