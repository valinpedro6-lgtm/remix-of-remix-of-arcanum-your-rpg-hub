import { supabase } from '@/integrations/supabase/client';
import { userData } from '@/lib/userData';

export const GRANT_KEY = 'arcanum-access-granted';
export const MASTER_KEY = 'arcanum-master-key';
export const LOCK_KEY = 'arcanum-access-lock';
export const DEVICE_KEY = 'arcanum-device-id';
export const EMAIL_KEY = 'arcanum-access-email';

export const deviceId = () => {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
};

export const callGate = async (payload: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('access-gate', { body: payload });
  if (error) throw error;
  return data as any;
};

export const isMaster = () => !!localStorage.getItem(MASTER_KEY);

/** Guarda a senha de mestre neste aparelho e assume as fichas/mapas antigos sem dono. */
export const becomeMaster = async (password: string) => {
  localStorage.setItem(MASTER_KEY, password);
  localStorage.setItem(GRANT_KEY, 'true');
  window.dispatchEvent(new Event('arcanum-master-change'));
  await userData({ action: 'claim', master: password }).catch(() => {});
};

export const leaveMaster = () => {
  localStorage.removeItem(MASTER_KEY);
  window.dispatchEvent(new Event('arcanum-master-change'));
};
