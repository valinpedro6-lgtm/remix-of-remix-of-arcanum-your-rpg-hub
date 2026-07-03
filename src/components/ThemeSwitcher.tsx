import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Palette } from 'lucide-react';
import { useEffect } from 'react';

const THEMES = [
  { id: 'red', label: 'Sangue', color: 'bg-red-500' },
  { id: 'orange', label: 'Brasa', color: 'bg-orange-500' },
  { id: 'gold', label: 'Ouro', color: 'bg-amber-400' },
  { id: 'green', label: 'Veneno', color: 'bg-green-500' },
  { id: 'cyan', label: 'Gelo', color: 'bg-cyan-400' },
  { id: 'blue', label: 'Arcano', color: 'bg-blue-500' },
  { id: 'purple', label: 'Sombra', color: 'bg-purple-500' },
  { id: 'pink', label: 'Feitiço', color: 'bg-pink-500' },
  { id: 'white', label: 'Prata', color: 'bg-white' },
] as const;

export const ThemeSwitcher = () => {
  const [theme, setTheme] = useLocalStorage<string>('arcanum-theme', 'red');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="flex items-start gap-2 px-3 py-1.5">
      <Palette className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex flex-wrap gap-1.5">
        {THEMES.map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={t.label}
            aria-label={`Tema ${t.label}`}
            className={`w-5 h-5 rounded-full ${t.color} border-2 transition-all ${
              theme === t.id ? 'border-foreground scale-110' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
