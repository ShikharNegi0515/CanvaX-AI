import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Cpu, LogOut, PenLine,
  Clock, LayoutGrid, Search, ChevronRight, Loader2,
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
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

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
      navigate('/canvas');
    } catch {
      setCreating(false);
    }
  };

  const handleOpen = (id: string) => {
    localStorage.setItem('canvax_last_canvas_id', id);
    navigate('/canvas');
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
              <div style={{
                width: '32px', height: '32px', borderRadius: '9999px',
                background: 'linear-gradient(135deg, #06b6d4, #10b981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase',
                boxShadow: '0 2px 12px rgba(6,182,212,0.3)',
              }}>
                {user?.name?.[0] ?? '?'}
              </div>
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
              width: '64px', height: '64px', borderRadius: '18px',
              background: 'rgba(6,182,212,0.08)', border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <LayoutGrid style={{ width: '28px', height: '28px', color: C.muted }} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: C.text, marginBottom: '8px' }}>
              {search ? 'No canvases found' : 'No canvases yet'}
            </h3>
            <p style={{ color: C.muted, fontSize: '0.875rem', marginBottom: '24px' }}>
              {search ? 'Try a different search term' : 'Create your first canvas to get started'}
            </p>
            {!search && (
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px',
                  background: C.primaryGrad,
                  border: 'none', borderRadius: '12px',
                  color: '#fff', fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer', boxShadow: '0 4px 24px rgba(6,182,212,0.35)',
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Create Canvas
              </button>
            )}
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {/* New Canvas Card */}
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={creating}
              className="group"
              style={{
                height: '192px',
                background: 'rgba(6,182,212,0.03)',
                border: `2px dashed ${C.border}`,
                borderRadius: '18px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '12px',
                cursor: creating ? 'not-allowed' : 'pointer',
                opacity: creating ? 0.6 : 1,
                transition: 'all 0.25s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = 'rgba(6,182,212,0.4)';
                el.style.background = 'rgba(6,182,212,0.06)';
                el.style.boxShadow = '0 8px 40px rgba(6,182,212,0.12)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = C.border;
                el.style.background = 'rgba(6,182,212,0.03)';
                el.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'rgba(6,182,212,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}>
                {creating
                  ? <Loader2 style={{ width: '24px', height: '24px', color: C.primary, animation: 'spin 1s linear infinite' }} />
                  : <Plus style={{ width: '24px', height: '24px', color: C.primary }} />
                }
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: C.muted }}>New Canvas</span>
            </motion.button>

            {/* Canvas Cards */}
            <AnimatePresence>
              {filtered.map((canvas, i) => (
                <motion.div
                  key={canvas.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleOpen(canvas.id)}
                  className="group"
                  style={{
                    height: '192px',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: '18px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.25s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = 'rgba(6,182,212,0.35)';
                    el.style.boxShadow = '0 12px 48px rgba(6,182,212,0.12)';
                    el.style.background = C.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = C.border;
                    el.style.boxShadow = 'none';
                    el.style.background = C.surface;
                  }}
                >
                  {/* Thumbnail preview or dot-grid placeholder */}
                  {canvas.thumbnail ? (
                    <img
                      src={canvas.thumbnail}
                      alt={canvas.name}
                      style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        opacity: 0.85,
                        borderRadius: '18px 18px 0 0',
                      }}
                    />
                  ) : (
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: 'radial-gradient(rgba(6,182,212,0.3) 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                      opacity: 0.07,
                    }} />
                  )}

                  {/* Gradient overlay top-right */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, transparent 60%, rgba(16,185,129,0.04) 100%)',
                  }} />

                  {/* Top accent line */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})`,
                    opacity: 0,
                    transition: 'opacity 0.3s',
                  }} className="group-hover:opacity-100" />

                  {/* Content */}
                  <div style={{ position: 'relative', height: '100%', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(16,185,129,0.1))',
                        border: `1px solid rgba(6,182,212,0.2)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <PenLine style={{ width: '18px', height: '18px', color: C.primary }} />
                      </div>

                      <button
                        onClick={(e) => handleDelete(e, canvas.id)}
                        disabled={deletingId === canvas.id}
                        style={{
                          opacity: 0,
                          padding: '6px', borderRadius: '8px',
                          background: 'transparent', border: 'none',
                          color: C.muted, cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        className="group-hover:opacity-100"
                        title="Delete canvas"
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)';
                          (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          (e.currentTarget as HTMLButtonElement).style.color = C.muted;
                        }}
                      >
                        {deletingId === canvas.id
                          ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                          : <Trash2 style={{ width: '16px', height: '16px' }} />
                        }
                      </button>
                    </div>

                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: '0.95rem', color: C.text, marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {canvas.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: C.muted }}>
                          <Clock style={{ width: '11px', height: '11px' }} />
                          {formatDate(canvas.updatedAt)}
                        </div>
                        <ChevronRight style={{ width: '14px', height: '14px', color: C.muted, opacity: 0, transform: 'translateX(0)', transition: 'all 0.2s' }} className="group-hover:opacity-100 group-hover:translate-x-0.5" />
                      </div>
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
        .group-hover\\:opacity-100 { opacity: 0; transition: opacity 0.2s; }
        .group:hover .group-hover\\:opacity-100 { opacity: 1; }
      `}</style>
    </div>
  );
};
