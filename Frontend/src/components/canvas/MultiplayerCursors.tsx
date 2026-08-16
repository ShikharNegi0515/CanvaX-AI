import { motion } from 'framer-motion';

export interface UserCursor {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

interface MultiplayerCursorsProps {
  cursors: UserCursor[];
  zoom: number;
  pan: { x: number; y: number };
}

export function MultiplayerCursors({ cursors, zoom, pan }: MultiplayerCursorsProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 90,
        overflow: 'hidden',
      }}
    >
      {cursors.map((c) => {
        // Convert canvas coordinates to screen coordinates
        const screenX = c.x * zoom + pan.x;
        const screenY = c.y * zoom + pan.y;

        return (
          <motion.div
            key={c.userId}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1, x: screenX, y: screenY }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Custom SVG cursor arrow */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={c.color}
              stroke="#ffffff"
              strokeWidth="2"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
            >
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>

            {/* Name pill */}
            <div
              style={{
                background: c.color,
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              }}
            >
              {c.name}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
