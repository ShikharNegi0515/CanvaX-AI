import { motion } from 'framer-motion';
import { PenTool, Layout, Layers, Cpu, Sparkles, Users, ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const C = {
  bg: '#080c14',
  surface: 'rgba(13,21,38,0.7)',
  border: 'rgba(6,182,212,0.12)',
  text: '#e2f4fb',
  muted: '#6ba8c4',
  primary: '#06b6d4',
  primaryGrad: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  secondary: '#10b981',
};

function App() {
  const workspaces = [
    {
      title: 'Design Studio',
      description: 'Create professional designs, social media posts, and marketing materials with AI-powered tools.',
      icon: <Layers style={{ width: '28px', height: '28px', color: '#06b6d4' }} />,
      accent: 'rgba(6,182,212,0.08)',
      accentBorder: 'rgba(6,182,212,0.2)',
      dot: '#06b6d4',
    },
    {
      title: 'Infinite Whiteboard',
      description: 'Brainstorm, plan, and diagram on an endless canvas with real-time collaboration.',
      icon: <Users style={{ width: '28px', height: '28px', color: '#3b82f6' }} />,
      accent: 'rgba(59,130,246,0.08)',
      accentBorder: 'rgba(59,130,246,0.2)',
      dot: '#3b82f6',
    },
    {
      title: 'UI/UX Designer',
      description: 'Design and prototype beautiful web and mobile interfaces with component libraries.',
      icon: <Layout style={{ width: '28px', height: '28px', color: '#10b981' }} />,
      accent: 'rgba(16,185,129,0.08)',
      accentBorder: 'rgba(16,185,129,0.2)',
      dot: '#10b981',
    },
    {
      title: 'Drawing Studio',
      description: 'Express your creativity with advanced digital art and illustration tools.',
      icon: <PenTool style={{ width: '28px', height: '28px', color: '#f59e0b' }} />,
      accent: 'rgba(245,158,11,0.08)',
      accentBorder: 'rgba(245,158,11,0.2)',
      dot: '#f59e0b',
    },
  ];

  const features = [
    { icon: <Sparkles style={{ width: '22px', height: '22px', color: '#06b6d4' }} />, label: 'AI-Powered', desc: 'Generate diagrams, UI, and artwork from text prompts instantly.' },
    { icon: <Zap style={{ width: '22px', height: '22px', color: '#10b981' }} />, label: 'Lightning Fast', desc: 'Built on a performant canvas engine designed for infinite scale.' },
    { icon: <Users style={{ width: '22px', height: '22px', color: '#3b82f6' }} />, label: 'Real-Time Collab', desc: 'Invite your team and work together live, with no delays.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        background: 'rgba(8,12,20,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #10b981 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(6,182,212,0.4)',
            }}>
              <Cpu style={{ width: '18px', height: '18px', color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>CanvasX AI</span>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', fontSize: '0.875rem', fontWeight: 500, color: C.muted }}>
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}>Features</a>
            <a href="#workspaces" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}>Workspaces</a>
            <a href="#ai" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}>AI Magic</a>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/auth" style={{ fontSize: '0.875rem', fontWeight: 500, color: C.muted, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}>
              Log in
            </Link>
            <Link
              to="/dashboard"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px',
                background: C.primaryGrad,
                borderRadius: '9999px',
                fontSize: '0.875rem', fontWeight: 600, color: '#fff',
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(6,182,212,0.35)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 32px rgba(6,182,212,0.5)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 20px rgba(6,182,212,0.35)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', paddingTop: '160px', paddingBottom: '120px', paddingLeft: '24px', paddingRight: '24px' }}>
        {/* Orbs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '10%', left: '15%', width: '700px', height: '700px', borderRadius: '9999px', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 65%)', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', top: '20%', right: '10%', width: '500px', height: '500px', borderRadius: '9999px', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 65%)', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: '0', left: '40%', width: '400px', height: '400px', borderRadius: '9999px', background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 65%)', filter: 'blur(60px)' }} />
          {/* Grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div style={{ position: 'relative', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px',
              background: 'rgba(6,182,212,0.08)',
              border: '1px solid rgba(6,182,212,0.2)',
              borderRadius: '9999px',
              fontSize: '0.8rem', fontWeight: 500, color: C.primary,
              marginBottom: '28px',
            }}
          >
            <Sparkles style={{ width: '14px', height: '14px' }} />
            The All-in-One AI Design Platform
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            style={{
              fontSize: 'clamp(2.8rem, 6vw, 5rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
              marginBottom: '24px',
              color: C.text,
            }}
          >
            Design, brainstorm &amp; create
            <br />
            <span style={{
              backgroundImage: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 45%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              without limits.
            </span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ fontSize: '1.1rem', color: C.muted, maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.7 }}
          >
            CanvasX AI combines Figma, Canva, Miro, and advanced AI into a single infinite canvas.
            Experience the future of collaborative visual creation.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
          >
            <Link
              to="/dashboard"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 28px',
                background: C.primaryGrad,
                borderRadius: '9999px',
                fontSize: '1rem', fontWeight: 700, color: '#fff',
                textDecoration: 'none',
                boxShadow: '0 8px 40px rgba(6,182,212,0.4)',
                transition: 'all 0.25s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 16px 56px rgba(6,182,212,0.5)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 40px rgba(6,182,212,0.4)'; }}
            >
              Start Designing Free
              <ArrowRight style={{ width: '18px', height: '18px' }} />
            </Link>
            <button style={{
              padding: '14px 28px',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${C.border}`,
              borderRadius: '9999px',
              fontSize: '1rem', fontWeight: 600, color: C.text,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(6,182,212,0.06)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(6,182,212,0.3)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
            >
              Watch Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Features strip ── */}
      <section id="features" style={{ padding: '64px 24px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '16px',
                padding: '28px',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: '18px',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '13px',
                background: 'rgba(6,182,212,0.08)', border: `1px solid rgba(6,182,212,0.15)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: C.text, marginBottom: '6px' }}>{f.label}</h3>
                <p style={{ fontSize: '0.875rem', color: C.muted, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Workspaces ── */}
      <section id="workspaces" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.03em', color: C.text, marginBottom: '12px' }}>
              Four Workspaces. One Infinite Canvas.
            </h2>
            <p style={{ fontSize: '1rem', color: C.muted, maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
              Seamlessly switch between specialized tools sharing the same powerful foundation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {workspaces.map((ws, i) => (
              <motion.div
                key={ws.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                style={{
                  padding: '32px',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: '22px',
                  position: 'relative', overflow: 'hidden',
                  transition: 'border-color 0.25s, box-shadow 0.25s',
                  cursor: 'default',
                  backdropFilter: 'blur(12px)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = ws.accentBorder;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 48px ${ws.accent.replace('0.08', '0.15')}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = C.border;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                {/* Corner glow */}
                <div style={{
                  position: 'absolute', top: '-40px', right: '-40px',
                  width: '160px', height: '160px', borderRadius: '9999px',
                  background: `radial-gradient(circle, ${ws.accent} 0%, transparent 70%)`,
                  filter: 'blur(20px)',
                }} />

                {/* Dot indicator */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  marginBottom: '20px',
                }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '9999px', background: ws.dot, boxShadow: `0 0 8px ${ws.dot}` }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: ws.dot, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Workspace</span>
                </div>

                <div style={{
                  width: '54px', height: '54px', borderRadius: '15px',
                  background: ws.accent,
                  border: `1px solid ${ws.accentBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '18px',
                }}>
                  {ws.icon}
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: C.text, marginBottom: '10px', letterSpacing: '-0.01em' }}>{ws.title}</h3>
                <p style={{ fontSize: '0.875rem', color: C.muted, lineHeight: 1.65 }}>{ws.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI CTA banner ── */}
      <section id="ai" style={{ padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.93 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              padding: '72px 48px',
              background: 'linear-gradient(135deg, rgba(6,182,212,0.10) 0%, rgba(13,21,38,0.95) 40%, rgba(16,185,129,0.08) 100%)',
              border: '1px solid rgba(6,182,212,0.2)',
              borderRadius: '28px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Inner glow orbs */}
            <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '9999px', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '9999px', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '18px',
                background: 'linear-gradient(135deg, #06b6d4, #10b981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 8px 32px rgba(6,182,212,0.4)',
              }}>
                <Sparkles style={{ width: '28px', height: '28px', color: '#fff' }} />
              </div>

              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', color: C.text, marginBottom: '16px' }}>
                Powered by Advanced AI
              </h2>
              <p style={{ fontSize: '1rem', color: C.muted, maxWidth: '520px', margin: '0 auto 36px', lineHeight: 1.7 }}>
                Generate images, build complete UI layouts, design presentations, and create diagrams instantly using natural language prompts.
              </p>
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 32px',
                background: C.primaryGrad,
                border: 'none', borderRadius: '9999px',
                fontSize: '1rem', fontWeight: 700, color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 8px 40px rgba(6,182,212,0.4)',
                transition: 'all 0.25s',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 16px 56px rgba(6,182,212,0.5)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 40px rgba(6,182,212,0.4)'; }}
              >
                Explore AI Features
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 24px', borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #06b6d4, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Cpu style={{ width: '14px', height: '14px', color: '#fff' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: C.text }}>CanvasX AI</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: C.muted }}>© 2026 CanvasX AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
