import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useERP();
  const isDark = theme === 'dark';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTheme();
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`relative p-2 rounded-xl cursor-pointer select-none transition-all duration-200 border shadow-xs active:scale-95 z-10 flex items-center justify-center ${
        isDark
          ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700 hover:text-amber-300'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
      } ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
    >
      {isDark ? (
        <Sun className="w-4.5 h-4.5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4.5 h-4.5 text-slate-700 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
};
