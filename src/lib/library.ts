import { supabase } from '@/integrations/supabase/client';
import { currentOwnerToken } from '@/lib/userData';
import { MASTER_KEY } from '@/lib/access';

export interface LibraryItem {
  id: string;
  title: string;
  file_name: string;
  size_bytes: number;
  created_at: string;
}

const call = async <T,>(payload: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('library', { body: { ...payload, token: currentOwnerToken() } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
};

export const listLibrary = async () => (await call<{ items: LibraryItem[] }>({ action: 'list' })).items;
export const openLibraryItem = async (id: string) => (await call<{ url: string }>({ action: 'open', id })).url;

export const uploadLibraryPdf = async (file: File, title: string) => {
  const form = new FormData();
  form.set('file', file);
  form.set('title', title);
  form.set('master', localStorage.getItem(MASTER_KEY) ?? '');
  const { data, error } = await supabase.functions.invoke('library', { body: form });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.item as LibraryItem;
};

export const deleteLibraryItem = async (id: string) => {
  const { data, error } = await supabase.functions.invoke('library', { body: { action: 'delete', id, master: localStorage.getItem(MASTER_KEY) ?? '' } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
};
