import { supabase } from '@/integrations/supabase/client';
import { EMAIL_KEY } from '@/lib/access';
import { currentOwnerToken } from '@/lib/userData';

export type CommunityTopic = 'geral' | 'mesas' | 'ordem' | 'homebrew' | 'duvidas';

export interface CommunityPost {
  id: string;
  parent_id: string | null;
  username: string;
  topic: CommunityTopic | string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface PrivateMessage {
  id: string;
  sender_email: string;
  recipient_email: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

const identity = () => ({
  email: localStorage.getItem(EMAIL_KEY) ?? '',
  token: currentOwnerToken(),
});

const call = async <T,>(payload: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('community', { body: { ...payload, ...identity() } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
};

export const listCommunityPosts = async () =>
  (await call<{ posts: CommunityPost[] }>({ action: 'list' })).posts;

export const createCommunityPost = async (body: string, topic: CommunityTopic, parentId?: string) =>
  (await call<{ post: CommunityPost }>({ action: 'create', body, topic, parentId })).post;

export const deleteCommunityPost = async (id: string) => {
  await call({ action: 'delete', id });
};

export const listCommunityContacts = async () =>
  (await call<{ contacts: string[] }>({ action: 'contacts' })).contacts;

export const listPrivateMessages = async (withEmail: string) =>
  (await call<{ messages: PrivateMessage[] }>({ action: 'private-list', withEmail })).messages;

export const sendPrivateMessage = async (recipientEmail: string, body: string) =>
  (await call<{ message: PrivateMessage }>({ action: 'private-send', recipientEmail, body })).message;
