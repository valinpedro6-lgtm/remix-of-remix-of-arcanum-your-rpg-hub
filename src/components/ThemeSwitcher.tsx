import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Palette } from 'lucide-react';
import { useEffect } from 'react';

const THEMES = [
  { id: 'red', label: 'Sangue', color: 'bg-red-500' },
  { id: 'white', label: 'Prata', color: 'bg-white' },
  { id: 'green', label: 'Veneno', color: 'bg-green-500' },
] as const;

export const ThemeSwitcher = () => {
  const [theme, setTheme] = useLocalStorage<string>('arcanum-theme', 'red');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <Palette className="w-3.5 h-3.5 text-muted-foreground" />
      <div className="flex gap-1.5">
        {THEMES.map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={t.label}
            className={`w-4 h-4 rounded-full ${t.color} border-2 transition-all ${
              theme === t.id ? 'border-foreground scale-125' : 'border-transparent opacity-50 hover:opacity-80'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
