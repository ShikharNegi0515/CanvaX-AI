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
      navigate('/');
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

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => window.location.href = 'http://localhost:3000/auth/google'}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          
          <button
            onClick={() => window.location.href = 'http://localhost:3000/auth/github'}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ color: '#6ba8c4', fontSize: '0.85rem' }}>or</span>
          <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.1)' }} />
        </div>

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
