import React from 'react';
import { NavLink } from 'react-router-dom';
import { Mic, Compass, History, Heart, Globe, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Navbar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Desktop Top Bar (Strict 3-zone contract) */}
      <header className="fixed top-0 left-0 right-0 z-40 hidden md:flex items-center justify-between gap-8 h-16 px-8 glass border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl">
        {/* Zone 1: Wordmark */}
        <NavLink to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-[var(--text-main)] hover:opacity-80 transition-opacity whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white shadow-sm">
            <Mic className="w-4 h-4 text-white fill-current" />
          </div>
          <span>melodisnap</span>
        </NavLink>

        {/* Zone 2: Navigation Links (Discover, History, Identity primary centered, Saved, Connect) */}
        <nav className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)]">
          <NavLink
            to="/discover"
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 font-bold shadow-sm'
                  : 'hover:text-[var(--text-main)] hover:bg-[var(--subtle-btn-bg)]'
              }`
            }
          >
            Discover
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 font-bold shadow-sm'
                  : 'hover:text-[var(--text-main)] hover:bg-[var(--subtle-btn-bg)]'
              }`
            }
          >
            History
          </NavLink>

          {/* Centered Primary Action Button on Desktop - Circular with prominence */}
          <div className="flex flex-col items-center justify-center px-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 shadow-lg border-2 ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-white border-transparent shadow-[0_0_20px_rgba(0,122,255,0.4)] scale-110'
                    : 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)] hover:text-white hover:scale-105'
                }`
              }
              title="Identify Music"
            >
              <Mic className="w-5 h-5 fill-current" />
            </NavLink>
          </div>

          <NavLink
            to="/favourites"
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 font-bold shadow-sm'
                  : 'hover:text-[var(--text-main)] hover:bg-[var(--subtle-btn-bg)]'
              }`
            }
          >
            Saved
          </NavLink>
          <NavLink
            to="/connect"
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 font-bold shadow-sm'
                  : 'hover:text-[var(--text-main)] hover:bg-[var(--subtle-btn-bg)]'
              }`
            }
          >
            Connect
          </NavLink>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--subtle-btn-bg)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"
            aria-label="Toggle Night/Day mode"
          >
            {theme === 'night' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-[var(--accent-primary)]" />}
          </button>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex md:hidden items-center justify-between h-14 px-5 glass border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl">
        <NavLink to="/" className="flex items-center gap-2 font-bold text-base text-[var(--text-main)]">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white shadow-sm">
            <Mic className="w-3.5 h-3.5 text-white fill-current" />
          </div>
          <span>melodisnap</span>
        </NavLink>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-[var(--text-muted)] hover:bg-[var(--subtle-btn-bg)]"
          aria-label="Toggle Night/Day mode"
        >
          {theme === 'night' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-[var(--accent-primary)]" />}
        </button>
      </div>

      {/* Mobile Bottom Tab Bar (TikTok / YouTube / Shazam style centered primary button) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass border-t border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-2xl">
        <div className="grid grid-cols-5 items-center h-16 px-1 relative">
          {/* 1. Discover */}
          <MobileNavItem to="/discover" icon={<Compass />} label="Discover" />
          
          {/* 2. History */}
          <MobileNavItem to="/history" icon={<History />} label="History" />

          {/* 3. Centered Primary Circled Identify Button (Raised, Glowing, Elevated) */}
          <div className="flex flex-col items-center justify-center -translate-y-4 z-10 relative">
            {/* Animated Ambient Outer Glow */}
            <div className="absolute inset-0 w-16 h-16 bg-[var(--accent-primary)] rounded-full blur-xl opacity-20 animate-pulse pointer-events-none" />
            
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `w-15 h-15 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 shadow-2xl border-[5px] border-[var(--bg-primary)] ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-white shadow-[0_0_30px_rgba(0,122,255,0.7)] scale-110'
                    : 'bg-[var(--accent-primary)] text-white shadow-[0_8px_20px_rgba(0,122,255,0.4)] hover:scale-110'
                }`
              }
              aria-label="Identify music"
            >
              <Mic className="w-6.5 h-6.5 text-white fill-current" />
            </NavLink>
            <span className="text-[10px] font-bold tracking-tight text-[var(--accent-primary)] mt-1.5 bg-[var(--bg-primary)] px-2 py-0.5 rounded-full shadow-sm border border-[var(--glass-border)]">
              Identify
            </span>
          </div>

          {/* 4. Saved */}
          <MobileNavItem to="/favourites" icon={<Heart />} label="Saved" />

          {/* 5. Connect */}
          <MobileNavItem to="/connect" icon={<Globe />} label="Connect" />
        </div>
      </nav>
    </>
  );
};

const MobileNavItem = ({ to, icon, label, end }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
        isActive ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
      }`
    }
  >
    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
    <span className="text-[10px] tracking-tight mt-0.5">{label}</span>
  </NavLink>
);
