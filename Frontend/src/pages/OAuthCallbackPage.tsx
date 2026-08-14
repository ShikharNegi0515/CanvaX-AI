import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2 } from 'lucide-react';

export const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuth(user, token);
        navigate('/');
      } catch (err) {
        console.error('Failed to parse user from OAuth callback', err);
        navigate('/auth?error=oauth_failed');
      }
    } else {
      navigate('/auth?error=missing_token');
    }
  }, [searchParams, navigate, setAuth]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#080c14',
      color: '#06b6d4'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <Loader2 style={{ width: '48px', height: '48px', animation: 'spin 1s linear infinite' }} />
        <h2 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 500 }}>Authenticating...</h2>
      </div>
    </div>
  );
};
