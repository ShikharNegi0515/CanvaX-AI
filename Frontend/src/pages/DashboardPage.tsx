import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Monitor, LogOut, PenLine,
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

export const DashboardPage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [canvases, setCanvases] = useState<CanvasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Load canvases on mount
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
      // If we deleted the last-opened canvas, clear the ref
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
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Background ambient */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      {/* Top Navigation */}
      <nav className="border-b border-border/50 glass backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg group-hover:shadow-primary/30 transition-shadow">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">CanvasX <span className="text-primary">AI</span></span>
          </Link>

          {/* User */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-xs font-bold uppercase">
                {user?.name?.[0] ?? '?'}
              </div>
              <span className="font-medium text-foreground">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Log out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              My Canvases
            </h1>
            <p className="text-muted-foreground text-sm">
              {canvases.length} workspace{canvases.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-primary/25 active:scale-95 disabled:opacity-70 self-start sm:self-auto"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            New Canvas
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-8 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search canvases…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Canvas Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-32 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {search ? 'No canvases found' : 'No canvases yet'}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {search ? 'Try a different search term' : 'Create your first canvas to get started'}
            </p>
            {!search && (
              <button
                onClick={handleCreate}
                disabled={creating}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm transition-all hover:bg-primary/90 shadow-lg hover:shadow-primary/25"
              >
                <Plus className="w-4 h-4" />
                Create Canvas
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {/* New Canvas Card */}
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={creating}
              className="group relative h-48 glass border-2 border-dashed border-border/60 hover:border-primary/50 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:shadow-xl hover:shadow-primary/10 disabled:opacity-60"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                {creating ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <Plus className="w-6 h-6 text-primary" />}
              </div>
              <span className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">New Canvas</span>
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
                  className="group relative h-48 glass border border-border/50 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all"
                >
                  {/* Canvas preview area */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0"
                    style={{
                      backgroundImage: 'radial-gradient(var(--muted-foreground) 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                      opacity: 0.06,
                    }}
                  />

                  {/* Card Content */}
                  <div className="relative h-full p-5 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <PenLine className="w-5 h-5 text-primary" />
                      </div>
                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDelete(e, canvas.id)}
                        disabled={deletingId === canvas.id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                        title="Delete canvas"
                      >
                        {deletingId === canvas.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    </div>

                    <div>
                      <h3 className="font-semibold text-base mb-1 truncate">{canvas.name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(canvas.updatedAt)}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};
