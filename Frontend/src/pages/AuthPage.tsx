import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Mail, Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = isLogin
        ? await authApi.login(email, password)
        : await authApi.register(name, email, password);

      setAuth(res.user, res.access_token);
      navigate('/canvas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div
      style={{ background: 'var(--background)' }}
      className="min-h-screen text-foreground flex items-center justify-center p-6 relative overflow-hidden"
    >
      {/* Animated background orbs */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
        style={{
          background: 'rgba(13, 21, 38, 0.7)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(6, 182, 212, 0.15)',
          borderRadius: '24px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(6,182,212,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
          padding: '40px',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.6), rgba(16,185,129,0.4), transparent)' }}
        />

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link
            to="/"
            className="group relative"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #10b981 100%)',
                boxShadow: '0 8px 32px rgba(6,182,212,0.4)',
              }}
            >
              <Cpu className="w-7 h-7 text-white" />
            </div>
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ boxShadow: '0 0 30px rgba(6,182,212,0.5)' }}
            />
          </Link>
        </div>

        {/* Heading */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? 'login-heading' : 'register-heading'}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="text-center mb-8"
          >
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: '#e2f4fb', letterSpacing: '-0.02em' }}
            >
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p style={{ color: '#6ba8c4', fontSize: '0.9rem' }}>
              {isLogin
                ? 'Enter your details to access your workspaces'
                : 'Sign up to start designing without limits'}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="flex items-center gap-3 px-4 py-3 text-sm"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '12px',
                color: '#f87171',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <InputField
                  icon={<User className="w-4 h-4" />}
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(v) => setName(v)}
                  required={!isLogin}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <InputField
            icon={<Mail className="w-4 h-4" />}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(v) => setEmail(v)}
            required
          />

          <InputField
            icon={<Lock className="w-4 h-4" />}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(v) => setPassword(v)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full group relative overflow-hidden font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: loading
                ? 'rgba(6,182,212,0.5)'
                : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              color: '#fff',
              padding: '14px 24px',
              borderRadius: '14px',
              marginTop: '8px',
              boxShadow: loading ? 'none' : '0 8px 32px rgba(6,182,212,0.35)',
              fontSize: '0.95rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {/* Shine sweep effect */}
            {!loading && (
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                }}
              />
            )}
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="mt-8 text-center text-sm" style={{ color: '#6ba8c4' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={switchMode}
            className="font-semibold transition-colors hover:underline"
            style={{ color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ── Shared Input Component ── */
function InputField({
  icon,
  type,
  placeholder,
  value,
  onChange,
  required,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className="relative flex items-center transition-all"
      style={{
        background: focused ? 'rgba(6,182,212,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${focused ? 'rgba(6,182,212,0.5)' : 'rgba(6,182,212,0.12)'}`,
        borderRadius: '13px',
        boxShadow: focused ? '0 0 0 3px rgba(6,182,212,0.12)' : 'none',
      }}
    >
      <span
        className="absolute left-4 flex items-center"
        style={{ color: focused ? '#06b6d4' : '#4b7a99', transition: 'color 0.2s' }}
      >
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          padding: '13px 16px 13px 44px',
          color: '#e2f4fb',
          fontSize: '0.9rem',
        }}
      />
    </div>
  );
}
