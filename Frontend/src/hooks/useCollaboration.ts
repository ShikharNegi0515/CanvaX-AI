import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

export interface RemoteCursor {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

export interface Collaborator {
  userId: string;
  name: string;
  color: string;
}

interface UseCollaborationOptions {
  canvasId: string | null;
  token: string | null;
  onRemotePatch: (elements: unknown[]) => void;
  onCursorMove: (cursor: RemoteCursor) => void;
  onUserJoined: (user: Collaborator) => void;
  onUserLeft: (userId: string) => void;
  onCollaboratorsUpdate: (collaborators: Collaborator[]) => void;
}

export function useCollaboration({
  canvasId,
  token,
  onRemotePatch,
  onCursorMove,
  onUserJoined,
  onUserLeft,
  onCollaboratorsUpdate,
}: UseCollaborationOptions) {
  const socketRef = useRef<Socket | null>(null);
  const patchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!canvasId || !token) return;

    const socket = io(`${WS_URL}/collab`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('room:join', { canvasId });
    });

    socket.on('room:joined', ({ collaborators }: { userId: string; name: string; color: string; collaborators: Collaborator[] }) => {
      onCollaboratorsUpdate(collaborators);
    });

    socket.on('user:joined', (user: Collaborator) => {
      onUserJoined(user);
    });

    socket.on('user:left', ({ userId }: { userId: string }) => {
      onUserLeft(userId);
    });

    socket.on('canvas:patch', ({ elements }: { userId: string; elements: unknown[] }) => {
      onRemotePatch(elements);
    });

    socket.on('cursor:move', (cursor: RemoteCursor) => {
      onCursorMove(cursor);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      if (patchDebounceRef.current) clearTimeout(patchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasId, token]);

  /** Emit a canvas patch (debounced 300ms to avoid flooding) */
  const broadcastPatch = useCallback((elements: unknown[]) => {
    if (!socketRef.current?.connected) return;
    if (patchDebounceRef.current) clearTimeout(patchDebounceRef.current);
    patchDebounceRef.current = setTimeout(() => {
      socketRef.current?.emit('canvas:patch', { elements });
    }, 300);
  }, []);

  /** Emit cursor position (raw, high-frequency — throttled server-side per client) */
  const broadcastCursor = useCallback((x: number, y: number) => {
    socketRef.current?.emit('cursor:move', { x, y });
  }, []);

  return { broadcastPatch, broadcastCursor };
}
