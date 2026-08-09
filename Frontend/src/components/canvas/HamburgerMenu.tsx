import { useState, useRef } from 'react';
import { Menu, FolderOpen, Save, Moon, Sun, LogIn, LogOut, Plus, Download, Image } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface HamburgerMenuProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onClear: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
}

export function HamburgerMenu({ theme, onThemeToggle, onClear, onExportPNG, onExportSVG }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const isDark = theme === 'dark';
  const bg = isDark ? '#232329' : '#ffffff';
  const border = isDark ? '#3a3a44' : '#e2e2e2';
  const text = isDark ? '#c5c5d2' : '#1e1e2e';
  const hoverBg = isDark ? '#3d3d4a' : '#f1f3f5';

  const MenuItem = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) => (
    <button
      onClick={() => { onClick?.(); setIsOpen(false); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: '10px 16px', border: 'none', background: 'transparent',
        color: text, fontSize: 14, fontWeight: 500, cursor: 'pointer',
        textAlign: 'left'
      }}
      onMouseEnter={e => e.currentTarget.style.background = hoverBg}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div style={{ position: 'fixed', top: 12, left: 16, zIndex: 300 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 40, height: 40, borderRadius: 8,
          background: bg, border: `1px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: text, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
      >
        <Menu size={20} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute', top: 48, left: 0, width: 260,
            background: bg, border: `1px solid ${border}`, borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '8px 0',
            display: 'flex', flexDirection: 'column'
          }}
        >
          <MenuItem icon={<FolderOpen size={16} />} label="Open" />
          <MenuItem icon={<Save size={16} />} label="Save to..." />
          <MenuItem icon={<Image size={16} />} label="Export as PNG" onClick={onExportPNG} />
          <MenuItem icon={<Download size={16} />} label="Export as SVG" onClick={onExportSVG} />
          <div style={{ height: 1, background: border, margin: '8px 0' }} />
          <MenuItem icon={<Plus size={16} />} label="Reset the canvas" onClick={onClear} />
          <div style={{ height: 1, background: border, margin: '8px 0' }} />
          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: text }}>Theme</span>
            <div style={{ display: 'flex', gap: 4, background: isDark ? '#191920' : '#f1f3f5', padding: 4, borderRadius: 8 }}>
              <button
                onClick={onThemeToggle}
                style={{
                  border: 'none', background: !isDark ? '#ffffff' : 'transparent',
                  padding: 6, borderRadius: 6, color: text, cursor: 'pointer',
                  boxShadow: !isDark ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Sun size={14} />
              </button>
              <button
                onClick={onThemeToggle}
                style={{
                  border: 'none', background: isDark ? '#3d3d4a' : 'transparent',
                  padding: 6, borderRadius: 6, color: text, cursor: 'pointer',
                  boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Moon size={14} />
              </button>
            </div>
          </div>
          <div style={{ height: 1, background: border, margin: '8px 0' }} />
          {user ? (
            <MenuItem icon={<LogOut size={16} />} label="Log out" onClick={() => { logout(); }} />
          ) : (
            <MenuItem icon={<LogIn size={16} />} label="Sign up / Log in" onClick={() => navigate('/auth')} />
          )}
        </div>
      )}
    </div>
  );
}
