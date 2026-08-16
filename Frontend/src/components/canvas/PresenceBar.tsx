import { Users } from 'lucide-react';

export interface Collaborator {
  userId: string;
  name: string;
  color: string;
}

interface PresenceBarProps {
  collaborators: Collaborator[];
  currentUser?: { name?: string; email?: string };
}

export function PresenceBar({ collaborators, currentUser }: PresenceBarProps) {
  if (collaborators.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: -6,
        padding: '4px 8px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '20px',
        backdropFilter: 'blur(8px)',
      }}
      title={`Active Collaborators: ${collaborators.length + 1}`}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginRight: 6,
          fontSize: '0.75rem',
          color: '#6ba8c4',
          fontWeight: 600,
        }}
      >
        <Users size={14} />
        <span>{collaborators.length + 1}</span>
      </div>

      {collaborators.map((c) => (
        <div
          key={c.userId}
          title={`${c.name} (Active)`}
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: c.color,
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #080c14',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            textTransform: 'uppercase',
          }}
        >
          {c.name?.[0] || 'U'}
        </div>
      ))}
    </div>
  );
}
