import { useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { THEMES } from '@/lib/themes';

export const useTheme = () => {
  const [storedTheme, setStoredTheme] = useLocalStorage<string>('arcanum-theme', 'blue');
  const activeTheme = THEMES.find(item => item.id === storedTheme) ?? THEMES[0];

  useEffect(() => {
    try {
      if (!localStorage.getItem('arcanum-visual-refresh-v1')) {
        localStorage.setItem('arcanum-visual-refresh-v1', '1');
      }
    } catch {
      // A paleta ainda pode ser aplicada à sessão mesmo quando o navegador bloqueia o armazenamento.
    }

    if (storedTheme !== activeTheme.id) setStoredTheme(activeTheme.id);
    document.documentElement.setAttribute('data-theme', activeTheme.id);
  }, [storedTheme, activeTheme.id, setStoredTheme]);

  return { activeTheme, setTheme: setStoredTheme };
};
