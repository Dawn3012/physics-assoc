import { supabase } from './supabase';
import { EventItem, EventInsert, EventUpdate } from './types';
import { DEFAULT_EVENTS } from '@/constants/events';

const LOCAL_STORAGE_KEY = 'pa_custom_events';

function getLocalEvents(): EventItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalEvents(events: EventItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
  } catch {}
}

export async function fetchAllEvents(onlyPublished = false): Promise<EventItem[]> {
  if (supabase) {
    try {
      let query = supabase.from('events').select('*').order('date', { ascending: false });
      if (onlyPublished) {
        query = query.eq('published', true);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data as EventItem[];
      }
    } catch {}
  }

  // Fallback to local storage (for local dev / demo testing)
  const local = getLocalEvents();
  return onlyPublished ? local.filter((e) => e.published) : local;
}

export async function fetchEventBySlug(slug: string, allowDraft = false): Promise<EventItem | null> {
  if (supabase) {
    try {
      let query = supabase.from('events').select('*').eq('slug', slug);
      if (!allowDraft) {
        query = query.eq('published', true);
      }
      const { data, error } = await query.single();
      if (!error && data) return data as EventItem;
    } catch {}
  }

  const local = getLocalEvents();
  const found = local.find((e) => e.slug === slug);
  if (!found) return null;
  if (!allowDraft && !found.published) return null;
  return found;
}

export async function fetchEventById(id: string): Promise<EventItem | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data as EventItem;
    } catch {}
  }

  const local = getLocalEvents();
  return local.find((e) => e.id === id) || null;
}

export async function insertEvent(item: EventInsert): Promise<{ error: Error | null; data?: EventItem }> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('events').insert(item).select().single();
      if (!error && data) return { error: null, data: data as EventItem };
      if (error && error.code !== '42P01') {
        // Return error if it's a real database error other than table not existing
        return { error: new Error(error.message) };
      }
    } catch {}
  }

  // Local storage fallback for testing
  const local = getLocalEvents();
  const newEvent: EventItem = {
    ...item,
    id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  saveLocalEvents([newEvent, ...local]);
  return { error: null, data: newEvent };
}

export async function updateEventById(id: string, updates: EventUpdate): Promise<{ error: Error | null }> {
  if (supabase) {
    try {
      const { error } = await supabase.from('events').update(updates).eq('id', id);
      if (!error) return { error: null };
      if (error && error.code !== '42P01') {
        return { error: new Error(error.message) };
      }
    } catch {}
  }

  const local = getLocalEvents();
  const updated = local.map((e) =>
    e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
  );
  saveLocalEvents(updated);
  return { error: null };
}

export async function deleteEventById(id: string): Promise<{ error: Error | null }> {
  if (supabase) {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (!error) return { error: null };
      if (error && error.code !== '42P01') {
        return { error: new Error(error.message) };
      }
    } catch {}
  }

  const local = getLocalEvents();
  const filtered = local.filter((e) => e.id !== id);
  saveLocalEvents(filtered);
  return { error: null };
}

export async function checkAdminSession(allowDemo = false): Promise<boolean> {
  if (allowDemo && typeof window !== 'undefined' && localStorage.getItem('demo_admin_auth') === 'true') {
    return true;
  }
  if (!supabase) return false;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch {
    return false;
  }
}
