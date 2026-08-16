import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Cpu, LogOut,
  LayoutGrid, Search, ChevronRight, Loader2, Users, Check, X,
} from 'lucide-react';
import { canvasApi, type CanvasData } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/* Palette used throughout this page */
const C = {
  bg: '#080c14',
  surface: 'rgba(13,21,38,0.8)',
  surfaceHover: 'rgba(13,21,38,0.95)',
  border: 'rgba(6,182,212,0.12)',
  borderHover: 'rgba(6,182,212,0.35)',
  text: '#e2f4fb',
  muted: '#6ba8c4',
  primary: '#06b6d4',
  primaryGrad: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  secondary: '#10b981',
  cardGrad: 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(16,185,129,0.04) 100%)',
};

export const DashboardPage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [canvases, setCanvases] = useState<CanvasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    canvasApi.list().then((list) => {
      setCanvases(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const canvas = await canvasApi.create('Untitled Canvas');
      localStorage.setItem('canvax_last_canvas_id', canvas.id);
      navigate(`/canvas/${canvas.id}`);
    } catch {
      setCreating(false);
    }
  };

  const handleOpen = (id: string) => {
    localStorage.setItem('canvax_last_canvas_id', id);
    navigate(`/canvas/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await canvasApi.delete(id);
      setCanvases((prev) => prev.filter((c) => c.id !== id));
      if (localStorage.getItem('canvax_last_canvas_id') === id) {
        localStorage.removeItem('canvax_last_canvas_id');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const startRename = (e: React.MouseEvent, canvas: CanvasData) => {
    e.stopPropagation();
    setRenamingId(canvas.id);
    setRenameValue(canvas.name);
    setTimeout(() => renameInputRef.current?.select(), 50);
  };

  const commitRename = async (id: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === canvases.find(c => c.id === id)?.name) {
      setRenamingId(null);
      return;
    }
    try {
      await canvasApi.rename(id, trimmed);
      setCanvases(prev => prev.map(c => c.id === id ? { ...c, name: trimmed } : c));
    } finally {
      setRenamingId(null);
    }
  };

  const filtered = canvases.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'Inter, sans-serif' }}>

      {/* Background ambient glows */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-160px', left: '-160px',
          width: '600px', height: '600px', borderRadius: '9999px',
          background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-120px', right: '-120px',
          width: '500px', height: '500px', borderRadius: '9999px',
          background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(6,182,212,0.025) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(6,182,212,0.025) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(8,12,20,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #10b981 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(6,182,212,0.35)',
            }}>
              <Cpu style={{ width: '18px', height: '18px', color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', color: C.text }}>
              CanvasX <span style={{ color: C.primary }}>AI</span>
            </span>
          </Link>

          {/* User + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  style={{ width: '32px', height: '32px', borderRadius: '9999px', objectFit: 'cover', boxShadow: '0 2px 12px rgba(6,182,212,0.3)' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #06b6d4, #10b981)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase',
                  boxShadow: '0 2px 12px rgba(6,182,212,0.3)',
                }}>
                  {user?.name?.[0] ?? '?'}
                </div>
              )}
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: C.text }}>{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(6,182,212,0.06)', border: `1px solid ${C.border}`,
                color: C.muted, fontSize: '0.8rem', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = C.text;
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(6,182,212,0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = C.muted;
                (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
              }}
            >
              <LogOut style={{ width: '14px', height: '14px' }} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: C.text, marginBottom: '4px' }}>
              My Canvases
            </h1>
            <p style={{ color: C.muted, fontSize: '0.875rem' }}>
              {canvases.length} workspace{canvases.length !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px',
              background: C.primaryGrad,
              border: 'none',
              borderRadius: '12px',
              color: '#fff', fontWeight: 600, fontSize: '0.875rem',
              cursor: creating ? 'not-allowed' : 'pointer',
              opacity: creating ? 0.7 : 1,
              boxShadow: '0 4px 24px rgba(6,182,212,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { if (!creating) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 40px rgba(6,182,212,0.5)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(6,182,212,0.35)'; }}
          >
            {creating ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <Plus style={{ width: '16px', height: '16px' }} />}
            New Canvas
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '32px', maxWidth: '320px' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: searchFocused ? C.primary : C.muted, transition: 'color 0.2s' }} />
          <input
            type="text"
            placeholder="Search canvases…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: '100%',
              background: searchFocused ? 'rgba(6,182,212,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${searchFocused ? 'rgba(6,182,212,0.4)' : C.border}`,
              borderRadius: '12px',
              padding: '10px 16px 10px 42px',
              color: C.text,
              fontSize: '0.875rem',
              outline: 'none',
              boxShadow: searchFocused ? '0 0 0 3px rgba(6,182,212,0.12)' : 'none',
              transition: 'all 0.2s',
            }}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '128px 0', color: C.muted }}>
            <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '128px 0' }}
          >
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <LayoutGrid style={{ width: '28px', height: '28px', color: C.muted }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#fff', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              {search ? 'No results found' : 'No canvases yet'}
            </h3>
            <p style={{ color: '#8892b0', fontSize: '0.95rem', marginBottom: '32px' }}>
              {search ? 'Try a different search term' : 'Create your first canvas to get started'}
            </p>
            {!search && (
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '12px 24px',
                  background: '#fff',
                  border: 'none', borderRadius: '8px',
                  color: '#000', fontWeight: 600, fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 14px rgba(255,255,255,0.15)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(255,255,255,0.15)';
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Create Canvas
              </button>
            )}
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '32px' }}>
            {/* New Canvas Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              onClick={handleCreate}
              className="group"
              style={{
                cursor: creating ? 'not-allowed' : 'pointer',
                opacity: creating ? 0.6 : 1,
                display: 'flex', flexDirection: 'column', gap: '12px',
              }}
            >
              <div style={{
                aspectRatio: '16/10',
                background: 'rgba(255,255,255,0.02)',
                border: `1.5px dashed rgba(255,255,255,0.15)`,
                borderRadius: '12px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '12px',
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {creating
                    ? <Loader2 style={{ width: '20px', height: '20px', color: '#fff', animation: 'spin 1s linear infinite' }} />
                    : <Plus style={{ width: '20px', height: '20px', color: '#fff' }} />
                  }
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#a1a1aa' }}>New canvas</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '4px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#e4e4e7', visibility: 'hidden' }}>Spacer</span>
                <span style={{ fontSize: '0.8rem', color: '#71717a', visibility: 'hidden' }}>Spacer</span>
              </div>
            </motion.div>

            {/* Canvas Cards */}
            <AnimatePresence>
              {filtered.map((canvas, i) => (
                <motion.div
                  key={canvas.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  onClick={() => handleOpen(canvas.id)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative',
                  }}
                  onMouseEnter={() => setHoveredId(canvas.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* ── Preview Container ── */}
                  <div style={{
                    aspectRatio: '16/10',
                    background: '#ffffff',
                    borderRadius: '12px',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: hoveredId === canvas.id
                      ? '0 12px 32px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.2)'
                      : '0 4px 12px rgba(0,0,0,0.2)',
                    transform: hoveredId === canvas.id ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
                  }}>
                    {/* Pattern if no thumbnail to make it look nice */}
                    {!canvas.thumbnail && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)`,
                        backgroundSize: '20px 20px',
                      }} />
                    )}

                    {canvas.thumbnail ? (
                      <img
                        src={canvas.thumbnail}
                        alt={canvas.name}
                        style={{
                          width: '100%', height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <LayoutGrid style={{ width: '32px', height: '32px', color: '#cbd5e1' }} />
                      </div>
                    )}

                    {/* Shared badge overlay */}
                    {canvas.userId !== user?.id && (
                      <span style={{
                        position: 'absolute', top: 12, left: 12,
                        fontSize: '0.65rem', padding: '4px 8px',
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        color: '#fff', borderRadius: '6px',
                        fontWeight: 600, letterSpacing: '0.02em',
                      }}>Shared</span>
                    )}

                    {/* Delete button overlay */}
                    {canvas.userId === user?.id && (
                      <button
                        onClick={(e) => handleDelete(e, canvas.id)}
                        disabled={deletingId === canvas.id}
                        style={{
                          position: 'absolute', top: 12, right: 12,
                          padding: '8px', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.9)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          opacity: hoveredId === canvas.id ? 1 : 0,
                          transform: hoveredId === canvas.id ? 'scale(1)' : 'scale(0.9)',
                          pointerEvents: hoveredId === canvas.id ? 'auto' : 'none',
                          transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        title="Delete canvas"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.9)';
                        }}
                      >
                        {deletingId === canvas.id
                          ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                          : <Trash2 style={{ width: '16px', height: '16px' }} />
                        }
                      </button>
                    )}
                  </div>

                  {/* ── Text Footer (Outside Card) ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      {renamingId === canvas.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }} onClick={e => e.stopPropagation()}>
                          <input
                            ref={renameInputRef}
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') commitRename(canvas.id); if (e.key === 'Escape') setRenamingId(null); }}
                            autoFocus
                            style={{
                              flex: 1, background: 'rgba(6,182,212,0.08)',
                              border: '1px solid rgba(6,182,212,0.4)', borderRadius: '6px',
                              color: '#f4f4f5', fontSize: '0.9rem', padding: '2px 8px', outline: 'none',
                            }}
                          />
                          <button onClick={() => commitRename(canvas.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: '2px' }}><Check size={14} /></button>
                          <button onClick={() => setRenamingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px' }}><X size={14} /></button>
                        </div>
                      ) : (
                        <h3
                          onDoubleClick={e => canvas.userId === user?.id && startRename(e, canvas)}
                          title={canvas.userId === user?.id ? 'Double-click to rename' : undefined}
                          style={{
                            margin: 0, fontWeight: 500, fontSize: '0.95rem', color: '#f4f4f5',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                            cursor: canvas.userId === user?.id ? 'text' : 'default',
                          }}
                        >
                          {canvas.name}
                        </h3>
                      )}
                      {renamingId !== canvas.id && (
                        <ChevronRight style={{
                          width: '16px', height: '16px', flexShrink: 0,
                          color: hoveredId === canvas.id ? '#fff' : 'transparent',
                          transform: hoveredId === canvas.id ? 'translateX(0)' : 'translateX(-4px)',
                          transition: 'all 0.2s',
                        }} />
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: '#a1a1aa' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {formatDate(canvas.updatedAt)}
                      </span>
                      {(canvas.collaborators && canvas.collaborators.length > 0) && (
                        <span
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          title={`Shared with ${canvas.collaborators.map(c => c.user.name || c.user.email).join(', ')}`}
                        >
                          <Users style={{ width: '12px', height: '12px' }} />
                          {canvas.collaborators.length}
                        </span>
                      )}
                      {(canvas.userId !== user?.id && canvas.user) && (
                        <span>
                          by {canvas.user.name || canvas.user.email?.split('@')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
