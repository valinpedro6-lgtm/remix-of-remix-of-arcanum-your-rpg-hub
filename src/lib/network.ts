import { supabase } from '@/integrations/supabase/client';

export type ConnectionState = 'online' | 'retrying' | 'offline';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Chamadas de leitura/atualização podem ser repetidas com segurança quando a
 * borda do Supabase acorda ou a rede oscila. Criações ficam fora desta função
 * para não correr o risco de duplicar registros após uma resposta perdida.
 */
export async function invokeResilient<T = unknown>(
  name: string,
  body: Record<string, unknown>,
  options: { attempts?: number; onRetry?: (attempt: number) => void } = {},
): Promise<{ data: T | null; error: Error | null }> {
  const attempts = Math.max(1, Math.min(2, options.attempts ?? 3));
  let lastError: Error | null = null;

  // A chamada HTTP direta é mais estável em Safari/iOS do que o transporte
  // de functions.invoke, especialmente quando o projeto acabou de acordar.
  const baseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
  const publishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '');
  if (baseUrl && publishableKey) {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      const response = await fetch(`${baseUrl}/functions/v1/${name}`, {
        method: 'POST',
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      const data = await response.json().catch(() => null) as T | null;
      if (data !== null) return { data, error: null };
      lastError = new Error(`Resposta vazia (${response.status})`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const { data, error } = await supabase.functions.invoke(name, { body });
      if (!error) return { data: data as T, error: null };
      lastError = error instanceof Error ? error : new Error(String(error));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    if (attempt < attempts) {
      options.onRetry?.(attempt);
      await wait(350 * 2 ** (attempt - 1));
    }
  }

  // Alguns navegadores móveis recusam a camada de invoke do SDK mesmo com a
  // API online. Tenta a mesma função pelo endpoint HTTP público antes de
  // devolver erro ao usuário.
  if (baseUrl && publishableKey) {
    try {
      const response = await fetch(`${baseUrl}/functions/v1/${name}`, {
        method: 'POST',
        headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null) as T | null;
      if (response.ok && data !== null) return { data, error: null };
      if (data !== null) return { data, error: null };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  return { data: null, error: lastError ?? new Error('Falha de conexão') };
}

export const isNetworkError = (error: unknown) => {
  const text = error instanceof Error ? error.message : String(error ?? '');
  return /fetch|network|timeout|failed|abort|conexão|warp|503|502|504/i.test(text);
};
