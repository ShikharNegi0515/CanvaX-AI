import { useState } from 'react';
import { Sparkles, LayoutGrid, FileText, GitFork, Loader2 } from 'lucide-react';
import { aiApi } from '../../lib/api';
import { type CanvasElement } from '../../store/useCanvasStore';

interface AISelectionToolbarProps {
  selectedElements: CanvasElement[];
  onReplaceElements: (newElements: CanvasElement[]) => void;
  onAddElements: (newElements: CanvasElement[]) => void;
}

export function AISelectionToolbar({
  selectedElements,
  onReplaceElements,
  onAddElements,
}: AISelectionToolbarProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (selectedElements.length === 0) return null;

  const handleBeautify = async () => {
    setLoadingAction('beautify');
    try {
      const res = await aiApi.beautify(selectedElements);
      if (res.elements && res.elements.length > 0) {
        onReplaceElements(res.elements as CanvasElement[]);
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTransform = async (actionKey: string, prompt: string) => {
    setLoadingAction(actionKey);
    try {
      const res = await aiApi.transform(selectedElements, prompt);
      if (res.elements && res.elements.length > 0) {
        onAddElements(res.elements as CanvasElement[]);
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(13, 21, 38, 0.95)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: 14,
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 110,
        boxShadow: '0 12px 32px rgba(0,0,0,0.5), 0 0 20px rgba(6,182,212,0.2)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 8, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
        <Sparkles size={16} color="#06b6d4" />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2f4fb' }}>AI Copilot</span>
      </div>

      <button
        onClick={handleBeautify}
        disabled={!!loadingAction}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: 8,
          color: '#e2f4fb',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {loadingAction === 'beautify' ? <Loader2 size={14} className="animate-spin" /> : <LayoutGrid size={14} color="#06b6d4" />}
        Auto-Layout
      </button>

      <button
        onClick={() => handleTransform('sticky', 'Summarize these selected shapes into color-coded sticky notes')}
        disabled={!!loadingAction}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: 8,
          color: '#e2f4fb',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {loadingAction === 'sticky' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} color="#eab308" />}
        Summarize Notes
      </button>

      <button
        onClick={() => handleTransform('flowchart', 'Convert these selected elements into a structured flowchart')}
        disabled={!!loadingAction}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 8,
          color: '#e2f4fb',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {loadingAction === 'flowchart' ? <Loader2 size={14} className="animate-spin" /> : <GitFork size={14} color="#10b981" />}
        Convert Flowchart
      </button>
    </div>
  );
}
