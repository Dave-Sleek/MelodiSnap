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

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 text-sm font-medium text-[var(--text-muted)]">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/5 font-semibold'
                  : 'hover:text-[var(--text-main)] hover:bg-[var(--subtle-btn-bg)]'
              }`
            }
          >
            Identify
          </NavLink>
          <NavLink
            to="/discover"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/5 font-semibold'
                  : 'hover:text-[var(--text-main)] hover:bg-[var(--subtle-btn-bg)]'
              }`
            }
          >
            Discover
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/5 font-semibold'
                  : 'hover:text-[var(--text-main)] hover:bg-[var(--subtle-btn-bg)]'
              }`
            }
          >
            History
          </NavLink>
          <NavLink
            to="/favourites"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/5 font-semibold'
                  : 'hover:text-[var(--text-main)] hover:bg-[var(--subtle-btn-bg)]'
              }`
            }
          >
            Saved
          </NavLink>
          <NavLink
            to="/connect"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/5 font-semibold'
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
            {theme === 'night' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex md:hidden items-center justify-between h-14 px-5 glass border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl">
        <NavLink to="/" className="flex items-center gap-2 font-bold text-base text-[var(--text-main)]">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white">
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

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass border-t border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="grid grid-cols-5 items-center h-16 px-1">
          <MobileNavItem to="/" icon={<Mic />} label="Identify" end />
          <MobileNavItem to="/discover" icon={<Compass />} label="Discover" />
          <MobileNavItem to="/history" icon={<History />} label="History" />
          <MobileNavItem to="/favourites" icon={<Heart />} label="Saved" />
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
