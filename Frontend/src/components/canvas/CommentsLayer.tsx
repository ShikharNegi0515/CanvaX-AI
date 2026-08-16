import { useState } from 'react';
import { MessageSquare, Check, Send, X } from 'lucide-react';
import { type CanvasElement, type CommentReply } from '../../store/useCanvasStore';

interface CommentsLayerProps {
  elements: CanvasElement[];
  zoom: number;
  pan: { x: number; y: number };
  currentUser?: { name?: string; email?: string; avatarUrl?: string };
  onUpdateElement: (id: string, attrs: Partial<CanvasElement>) => void;
}

export function CommentsLayer({
  elements,
  zoom,
  pan,
  currentUser,
  onUpdateElement,
}: CommentsLayerProps) {
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const commentElements = elements.filter((el) => el.type === 'comment' && el.comment);

  if (commentElements.length === 0) return null;

  const handleAddReply = (el: CanvasElement) => {
    if (!replyText.trim() || !el.comment) return;
    const newReply: CommentReply = {
      id: crypto.randomUUID(),
      authorName: currentUser?.name || currentUser?.email?.split('@')[0] || 'User',
      authorAvatar: currentUser?.avatarUrl,
      text: replyText.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedReplies = [...(el.comment.replies || []), newReply];
    onUpdateElement(el.id, {
      comment: {
        ...el.comment,
        replies: updatedReplies,
      },
    });
    setReplyText('');
  };

  const handleToggleResolve = (el: CanvasElement) => {
    if (!el.comment) return;
    onUpdateElement(el.id, {
      comment: {
        ...el.comment,
        resolved: !el.comment.resolved,
      },
    });
  };

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 95 }}>
      {commentElements.map((el) => {
        const screenX = el.x * zoom + pan.x;
        const screenY = el.y * zoom + pan.y;
        const isOpen = activeCommentId === el.id;
        const comment = el.comment!;

        return (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: screenX,
              top: screenY,
              pointerEvents: 'auto',
            }}
          >
            {/* Comment Pin Marker */}
            <div
              onClick={() => setActiveCommentId(isOpen ? null : el.id)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: comment.resolved
                  ? '#64748b'
                  : 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                border: '2px solid #ffffff',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: comment.resolved ? 0.6 : 1,
              }}
              title={`Comment by ${comment.authorName}`}
            >
              <MessageSquare size={16} color="#ffffff" />
            </div>

            {/* Comment Thread Popover */}
            {isOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 38,
                  left: 0,
                  width: 280,
                  background: '#0d1526',
                  border: '1px solid rgba(6,182,212,0.3)',
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                  color: '#e2f4fb',
                  fontSize: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#06b6d4' }}>
                    {comment.authorName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => handleToggleResolve(el)}
                      style={{
                        background: comment.resolved ? '#16a34a' : 'rgba(255,255,255,0.06)',
                        border: 'none',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Check size={12} /> {comment.resolved ? 'Resolved' : 'Resolve'}
                    </button>
                    <button
                      onClick={() => setActiveCommentId(null)}
                      style={{ background: 'none', border: 'none', color: '#6ba8c4', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', padding: 10, borderRadius: 8 }}>
                  {comment.text}
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    {comment.replies.map((r) => (
                      <div key={r.id} style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6ba8c4' }}>
                          {r.authorName}
                        </div>
                        <div style={{ fontSize: '0.8rem' }}>{r.text}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input */}
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddReply(el)}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      padding: '6px 10px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => handleAddReply(el)}
                    style={{
                      background: '#06b6d4',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      padding: '6px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
