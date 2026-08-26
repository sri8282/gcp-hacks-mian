import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-medium border transition-colors cursor-pointer ${
        theme === 'dark'
          ? 'bg-neutral-900 text-neutral-200 border-neutral-700 hover:bg-neutral-800 hover:text-white'
          : 'bg-neutral-100 text-neutral-800 border-neutral-300 hover:bg-neutral-200 hover:text-black shadow-xs'
      } ${className}`}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 text-emerald-400" />
          {showLabel && <span className="font-semibold">Light</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-neutral-800" />
          {showLabel && <span className="font-semibold">Dark</span>}
        </>
      )}
    </button>
  );
};
