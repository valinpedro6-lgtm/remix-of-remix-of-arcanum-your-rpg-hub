import { supabase } from '@/integrations/supabase/client';
import { userData, setOwnerToken, clearOwnerToken } from '@/lib/userData';
import { invokeResilient } from '@/lib/network';

export const GRANT_KEY = 'arcanum-access-granted';
export const MASTER_KEY = 'arcanum-master-key';
export const LOCK_KEY = 'arcanum-access-lock';
export const DEVICE_KEY = 'arcanum-device-id';
export const EMAIL_KEY = 'arcanum-access-email';
export const TEST_UNTIL_KEY = 'arcanum-test-until';

export interface GateResponse {
  ok?: boolean;
  locked?: boolean;
  master?: boolean;
  test?: boolean;
  token?: string;
  ticket?: string;
  accessUntil?: number | string;
  retryAfter?: number;
  remaining?: number;
  error?: string;
  currentCode?: string;
  testCode?: string;
  testExpiresAt?: string | null;
  usesLeft?: number;
  maxUses?: number;
  sessions?: Array<{ device_id: string; label: string; first_seen: string; last_seen: string }>;
  total?: number;
  active?: number;
  [key: string]: unknown;
}

/** Acesso temporário (código teste): expira sozinho e volta pra tela do código. */
export const grantTestAccess = (until: number, token: string) => {
  setOwnerToken(token);
  localStorage.setItem(TEST_UNTIL_KEY, String(until));
  localStorage.setItem(GRANT_KEY, 'true');
};
export const testAccessLeft = () => {
  const v = Number(localStorage.getItem(TEST_UNTIL_KEY) ?? 0);
  return v > Date.now() ? Math.ceil((v - Date.now()) / 1000) : 0;
};
export const expireTestAccess = () => {
  localStorage.removeItem(TEST_UNTIL_KEY);
  logout();
};

export const deviceId = () => {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
};

export const callGate = async (payload: Record<string, unknown>) => {
  const { data, error } = await invokeResilient<GateResponse>('access-gate', payload, { attempts: 4 });
  if (error) throw error;
  return data as GateResponse;
};

export const isMaster = () => !!localStorage.getItem(MASTER_KEY);

/** Guarda a senha de mestre neste aparelho e assume as fichas/mapas antigos sem dono. */
export const becomeMaster = async (password: string, token?: string) => {
  if (token) setOwnerToken(token);
  localStorage.setItem(MASTER_KEY, password);
  localStorage.setItem(GRANT_KEY, 'true');
  window.dispatchEvent(new Event('arcanum-master-change'));
  await userData({ action: 'claim', master: password }).catch(() => {});
};

export const leaveMaster = () => {
  localStorage.removeItem(MASTER_KEY);
  window.dispatchEvent(new Event('arcanum-master-change'));
};

/** Sai da conta neste aparelho: volta para a tela do código. */
export const logout = () => {
  [GRANT_KEY, MASTER_KEY, EMAIL_KEY].forEach(k => localStorage.removeItem(k));
  clearOwnerToken();
  window.location.hash = '#/';
  window.location.reload();
};
