import { motion, AnimatePresence } from 'framer-motion';
import { History, X, RotateCcw, CheckCircle2 } from 'lucide-react';
import { type CanvasElement } from '../../store/useCanvasStore';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  past: CanvasElement[][];
  future: CanvasElement[][];
  currentElements: CanvasElement[];
  onRestoreState: (elements: CanvasElement[]) => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  past,
  currentElements,
  onRestoreState,
}: HistoryDrawerProps) {
  if (!isOpen) return null;

  const allSnapshots = [...past, currentElements];

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 150,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ x: 340, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 340, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 320,
            height: '100vh',
            background: '#0d1526',
            borderLeft: '1px solid rgba(6,182,212,0.2)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <History color="#06b6d4" size={20} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#e2f4fb', fontWeight: 700 }}>
                Visual History Stack
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#6ba8c4', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {allSnapshots.map((snap, idx) => {
              const isCurrent = idx === allSnapshots.length - 1;
              return (
                <div
                  key={idx}
                  onClick={() => onRestoreState(snap)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: isCurrent ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isCurrent ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2f4fb' }}>
                      Revision #{idx + 1}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6ba8c4' }}>
                      {snap.length} Canvas Element{snap.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {isCurrent ? (
                    <CheckCircle2 color="#06b6d4" size={18} />
                  ) : (
                    <RotateCcw color="#6ba8c4" size={16} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
