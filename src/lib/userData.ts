import { supabase } from '@/integrations/supabase/client';

/** Chave secreta deste aparelho: tudo que a pessoa cria fica preso a ela. */
const OWNER_KEY = 'arcanum-owner-token';

export const ownerToken = () => {
  let t = localStorage.getItem(OWNER_KEY);
  if (!t) {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    t = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(OWNER_KEY, t);
  }
  return t;
};

export const setOwnerToken = (t: string) => { if (t) localStorage.setItem(OWNER_KEY, t); };
export const currentOwnerToken = () => localStorage.getItem(OWNER_KEY) ?? '';
export const clearOwnerToken = () => localStorage.removeItem(OWNER_KEY);

export async function userData<T = any>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('user-data', {
    body: { ...payload, token: ownerToken() },
  });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export type Table = 'sheets' | 'tabletops';

export const listRows = async <T,>(table: Table) => (await userData<{ rows: T[] }>({ action: 'list', table })).rows;
export const createRow = async <T,>(table: Table, values: Record<string, unknown>) =>
  (await userData<{ row: T }>({ action: 'create', table, values })).row;
export const updateRow = (table: Table, id: string, values: Record<string, unknown>) =>
  userData({ action: 'update', table, id, values });
export const deleteRow = (table: Table, id: string) => userData({ action: 'delete', table, id });
