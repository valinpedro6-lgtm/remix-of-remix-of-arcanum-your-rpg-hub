import { supabase } from '@/integrations/supabase/client';

export type ConnectionState = 'online' | 'retrying' | 'offline';

// O site publicado pode não receber variáveis Vite configuradas na Vercel.
// Mantemos a variável como override, mas o fluxo principal deve continuar
// apontando para o Worker Cloudflare mesmo quando ela estiver ausente.
const DEFAULT_API_BASE_URL = 'https://arcanum-neon-api.arcanumrpg.workers.dev';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type InvokeResult<T> = { data: T | null; error: Error | null };

async function postJson<T>(baseUrl: string, name: string, body: Record<string, unknown>): Promise<InvokeResult<T>> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${baseUrl}/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null) as T | null;
    if (data === null) return { data: null, error: new Error(`Resposta vazia (${response.status})`) };
    if (!response.ok) {
      const detail = typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error?: unknown }).error ?? '')
        : '';
      return { data, error: new Error(detail || `HTTP ${response.status}`) };
    }
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  } finally {
    window.clearTimeout(timeout);
  }
}

/**
 * Chamadas usam o Worker Cloudflare por padrão; VITE_API_BASE_URL permite
 * trocar o endereço sem alterar o código em ambientes de teste.
 * Criações devem passar attempts: 1 para não duplicar registros após timeout.
 */
export async function invokeResilient<T = unknown>(
  name: string,
  body: Record<string, unknown>,
  options: { attempts?: number; onRetry?: (attempt: number) => void } = {},
): Promise<InvokeResult<T>> {
  const attempts = Math.max(1, Math.min(2, options.attempts ?? 3));
  let lastError: Error | null = null;
  const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

  if (apiBaseUrl) {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const result = await postJson<T>(apiBaseUrl, name, body);
      if (!result.error) return result;
      lastError = result.error;
      // A resposta chegou: erros de validação/autorização/servidor não devem ser repetidos.
      if (result.data !== null || !isNetworkError(result.error)) return result;
      if (attempt < attempts) {
        options.onRetry?.(attempt);
        await wait(350 * 2 ** (attempt - 1));
      }
    }
    return { data: null, error: lastError ?? new Error('Falha de conexão') };
  }

  // Transporte legado durante a transição: mantém a aplicação atual intacta
  // até que a nova API seja configurada explicitamente no ambiente de produção.
  const baseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
  const publishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '');
  if (baseUrl && publishableKey) {
    const direct = await postLegacy<T>(baseUrl, name, body, publishableKey, true);
    if (!direct.error) return direct;
    lastError = direct.error;
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

  if (baseUrl && publishableKey) {
    const fallback = await postLegacy<T>(baseUrl, name, body, publishableKey, false);
    if (!fallback.error) return fallback;
    lastError = fallback.error;
  }

  return { data: null, error: lastError ?? new Error('Falha de conexão') };
}

async function postLegacy<T>(
  baseUrl: string,
  name: string,
  body: Record<string, unknown>,
  publishableKey: string,
  includeAuthorization: boolean,
): Promise<InvokeResult<T>> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const headers: Record<string, string> = {
      apikey: publishableKey,
      'Content-Type': 'application/json',
    };
    if (includeAuthorization) headers.Authorization = `Bearer ${publishableKey}`;
    const response = await fetch(`${baseUrl}/functions/v1/${name}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null) as T | null;
    if (data !== null) return { data, error: null };
    return { data: null, error: new Error(`Resposta vazia (${response.status})`) };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  } finally {
    window.clearTimeout(timeout);
  }
}

export const isNetworkError = (error: unknown) => {
  const text = error instanceof Error ? error.message : String(error ?? '');
  return /fetch|network|timeout|failed|abort|conexão|warp|503|502|504/i.test(text);
};
