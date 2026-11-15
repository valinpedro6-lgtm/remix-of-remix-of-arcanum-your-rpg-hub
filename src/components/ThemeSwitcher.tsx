import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Check, Palette } from 'lucide-react';
import { useEffect } from 'react';

const THEMES = [
  { id: 'blue', label: 'Arcano', tone: 'theme-swatch-arcane' },
  { id: 'cyan', label: 'Gelo', tone: 'theme-swatch-ice' },
  { id: 'gold', label: 'Âmbar', tone: 'theme-swatch-amber' },
  { id: 'green', label: 'Musgo', tone: 'theme-swatch-moss' },
  { id: 'purple', label: 'Sombra', tone: 'theme-swatch-shadow' },
  { id: 'red', label: 'Sangue', tone: 'theme-swatch-blood' },
] as const;

export const ThemeSwitcher = () => {
  const [theme, setTheme] = useLocalStorage<string>('arcanum-theme', 'blue');
  const activeTheme = THEMES.find(item => item.id === theme) ?? THEMES[0];

  useEffect(() => {
    const refreshKey = 'arcanum-visual-refresh-v1';
    if (!localStorage.getItem(refreshKey)) {
      localStorage.setItem(refreshKey, '1');
      setTheme('blue');
      return;
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme, setTheme]);

  return (
    <div className="theme-picker">
      <div className="theme-picker-heading"><span className="theme-picker-title"><Palette className="h-3.5 w-3.5" /> Paleta</span><span className="theme-picker-active">{activeTheme.label}</span></div>
      <div className="theme-picker-options" role="group" aria-label="Escolher paleta visual">
        {THEMES.map(item => {
          const selected = theme === item.id;
          return <button key={item.id} type="button" onClick={() => setTheme(item.id)} title={`Usar paleta ${item.label}`} aria-label={`Usar paleta ${item.label}`} aria-pressed={selected} className={`theme-option ${selected ? 'is-selected' : ''}`}><span className={`theme-swatch ${item.tone}`} aria-hidden="true">{selected && <Check className="h-3 w-3" />}</span><span>{item.label}</span></button>;
        })}
      </div>
    </div>
  );
};
