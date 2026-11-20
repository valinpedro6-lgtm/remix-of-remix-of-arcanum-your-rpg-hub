import { Check, Palette } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { THEMES } from '@/lib/themes';

export const ThemeSwitcher = ({ className = '' }: { className?: string }) => {
  const { activeTheme, setTheme } = useTheme();

  return (
    <div className={`theme-picker ${className}`}>
      <div className="theme-picker-heading"><span className="theme-picker-title"><Palette className="h-3.5 w-3.5" /> Paleta</span><span className="theme-picker-active">{activeTheme.label}</span></div>
      <div className="theme-picker-options" role="group" aria-label="Escolher paleta visual">
        {THEMES.map(item => {
          const selected = activeTheme.id === item.id;
          return <button key={item.id} type="button" onClick={() => setTheme(item.id)} title={`Usar paleta ${item.label}`} aria-label={`Usar paleta ${item.label}`} aria-pressed={selected} className={`theme-option ${selected ? 'is-selected' : ''}`}><span className={`theme-swatch ${item.tone}`} aria-hidden="true">{selected && <Check className="h-3 w-3" />}</span><span>{item.label}</span></button>;
        })}
      </div>
    </div>
  );
};
