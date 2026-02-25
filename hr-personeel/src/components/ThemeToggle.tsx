import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Schakel naar ${isDark ? 'licht' : 'donker'} thema`}
      title={`Schakel naar ${isDark ? 'licht' : 'donker'} thema`}
    >
      <div className="theme-toggle-track">
        <div className={`theme-toggle-thumb ${isDark ? 'dark' : 'light'}`}>
          {isDark ? <Moon size={14} /> : <Sun size={14} />}
        </div>
        <div className="theme-toggle-icons">
          <Sun size={12} className="icon-sun" />
          <Moon size={12} className="icon-moon" />
        </div>
      </div>
    </button>
  );
}
