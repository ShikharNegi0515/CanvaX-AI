import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Server, GitMerge, BrainCircuit, Columns, X, Sparkles } from 'lucide-react';
import { type CanvasElement } from '../../store/useCanvasStore';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (elements: CanvasElement[]) => void;
}

export function TemplateModal({ isOpen, onClose, onSelectTemplate }: TemplateModalProps) {
  if (!isOpen) return null;

  const templates: {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    getElements: () => CanvasElement[];
  }[] = [
    {
      id: 'architecture',
      title: 'Software System Architecture',
      description: 'Frontend client, API gateway, authentication service, database, and Redis cache.',
      icon: Server,
      color: '#06b6d4',
      getElements: () => [
        { id: '1', type: 'rectangle', x: 100, y: 220, width: 160, height: 80, text: 'Web App Client\n(React/Next.js)', backgroundColor: '#e0f2fe', strokeColor: '#0284c7', fillStyle: 'solid', roughness: 0 },
        { id: '2', type: 'arrow', x: 260, y: 260, points: [0, 0, 80, 0], endArrowhead: 'arrow', strokeColor: '#0284c7' },
        { id: '3', type: 'diamond', x: 340, y: 220, width: 140, height: 80, text: 'API Gateway', backgroundColor: '#fef08a', strokeColor: '#ca8a04', fillStyle: 'solid', roughness: 0 },
        { id: '4', type: 'arrow', x: 480, y: 260, points: [0, 0, 80, -60], endArrowhead: 'arrow', strokeColor: '#ca8a04' },
        { id: '5', type: 'arrow', x: 480, y: 260, points: [0, 0, 80, 60], endArrowhead: 'arrow', strokeColor: '#ca8a04' },
        { id: '6', type: 'rectangle', x: 560, y: 170, width: 160, height: 60, text: 'Auth Service', backgroundColor: '#dcfce7', strokeColor: '#16a34a', fillStyle: 'solid', roughness: 0 },
        { id: '7', type: 'rectangle', x: 560, y: 290, width: 160, height: 60, text: 'Core DB (Postgres)', backgroundColor: '#fae8ff', strokeColor: '#c026d3', fillStyle: 'solid', roughness: 0 },
      ],
    },
    {
      id: 'flowchart',
      title: 'User Journey Flowchart',
      description: 'Landing page onboarding, login authentication, decision checkpoint, and dashboard.',
      icon: GitMerge,
      color: '#10b981',
      getElements: () => [
        { id: 'f1', type: 'ellipse', x: 100, y: 230, width: 120, height: 60, text: 'Start', backgroundColor: '#dcfce7', strokeColor: '#16a34a', fillStyle: 'solid', roughness: 0 },
        { id: 'f2', type: 'arrow', x: 220, y: 260, points: [0, 0, 60, 0], endArrowhead: 'arrow', strokeColor: '#16a34a' },
        { id: 'f3', type: 'rectangle', x: 280, y: 220, width: 150, height: 80, text: 'Landing Page\nVisit', backgroundColor: '#e0f2fe', strokeColor: '#0284c7', fillStyle: 'solid', roughness: 0 },
        { id: 'f4', type: 'arrow', x: 430, y: 260, points: [0, 0, 60, 0], endArrowhead: 'arrow', strokeColor: '#0284c7' },
        { id: 'f5', type: 'diamond', x: 490, y: 220, width: 140, height: 80, text: 'Has Account?', backgroundColor: '#fef08a', strokeColor: '#ca8a04', fillStyle: 'solid', roughness: 0 },
        { id: 'f6', type: 'arrow', x: 630, y: 260, points: [0, 0, 70, 0], endArrowhead: 'arrow', strokeColor: '#ca8a04' },
        { id: 'f7', type: 'rectangle', x: 700, y: 220, width: 150, height: 80, text: 'Dashboard\nWorkspace', backgroundColor: '#dcfce7', strokeColor: '#16a34a', fillStyle: 'solid', roughness: 0 },
      ],
    },
    {
      id: 'mindmap',
      title: 'Brainstorming Mind Map',
      description: 'Central product concept node connected to feature ideas and roadmap branches.',
      icon: BrainCircuit,
      color: '#8b5cf6',
      getElements: () => [
        { id: 'm1', type: 'mindmap', isRootMindmap: true, x: 400, y: 250, width: 180, height: 80, text: 'CanvaX AI\nNext Version', backgroundColor: '#8b5cf6', strokeColor: '#7c3aed', fillStyle: 'solid', roughness: 0 },
        { id: 'm2', type: 'mindmap', parentId: 'm1', x: 150, y: 150, width: 150, height: 60, text: 'Realtime Collab', backgroundColor: '#dcfce7', strokeColor: '#16a34a', fillStyle: 'solid', roughness: 0 },
        { id: 'm3', type: 'mindmap', parentId: 'm1', x: 650, y: 150, width: 150, height: 60, text: 'AI Auto-Layout', backgroundColor: '#e0f2fe', strokeColor: '#0284c7', fillStyle: 'solid', roughness: 0 },
        { id: 'm4', type: 'mindmap', parentId: 'm1', x: 150, y: 350, width: 150, height: 60, text: 'Templates Hub', backgroundColor: '#fef08a', strokeColor: '#ca8a04', fillStyle: 'solid', roughness: 0 },
        { id: 'm5', type: 'mindmap', parentId: 'm1', x: 650, y: 350, width: 150, height: 60, text: 'Comment Pins', backgroundColor: '#fae8ff', strokeColor: '#c026d3', fillStyle: 'solid', roughness: 0 },
      ],
    },
    {
      id: 'kanban',
      title: 'Sprint Kanban Grid',
      description: '3 columns (To Do, In Progress, Done) with color-coded task sticky notes.',
      icon: Columns,
      color: '#f59e0b',
      getElements: () => [
        { id: 'k1', type: 'frame', x: 100, y: 150, width: 220, height: 420, label: 'To Do', strokeColor: '#64748b', backgroundColor: 'transparent' },
        { id: 'k2', type: 'sticky', x: 120, y: 200, width: 180, height: 100, text: 'Integrate WebSockets', backgroundColor: '#fef08a', strokeColor: '#ca8a04' },
        { id: 'k3', type: 'sticky', x: 120, y: 320, width: 180, height: 100, text: 'Design Minimap', backgroundColor: '#fef08a', strokeColor: '#ca8a04' },

        { id: 'k4', type: 'frame', x: 360, y: 150, width: 220, height: 420, label: 'In Progress', strokeColor: '#0284c7', backgroundColor: 'transparent' },
        { id: 'k5', type: 'sticky', x: 380, y: 200, width: 180, height: 100, text: 'Custom Color Picker', backgroundColor: '#bae6fd', strokeColor: '#0284c7' },

        { id: 'k6', type: 'frame', x: 620, y: 150, width: 220, height: 420, label: 'Done', strokeColor: '#16a34a', backgroundColor: 'transparent' },
        { id: 'k7', type: 'sticky', x: 640, y: 200, width: 180, height: 100, text: 'OAuth Integration', backgroundColor: '#bbf7d0', strokeColor: '#16a34a' },
      ],
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 720,
          maxWidth: '90vw',
          background: '#0d1526',
          border: '1px solid rgba(6,182,212,0.3)',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles color="#06b6d4" size={24} />
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#e2f4fb', fontWeight: 800 }}>
              Pre-built Templates Library
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6ba8c4', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {templates.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.id}
                onClick={() => {
                  onSelectTemplate(t.getElements());
                  onClose();
                }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = t.color;
                  e.currentTarget.style.background = 'rgba(6,182,212,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `rgba(255,255,255,0.06)`,
                      border: `1px solid ${t.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon color={t.color} size={20} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#e2f4fb', fontWeight: 700 }}>
                    {t.title}
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6ba8c4', lineHeight: 1.4 }}>
                  {t.description}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
