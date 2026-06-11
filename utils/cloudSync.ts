import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CREDS_KEY = 'supabase_creds';
const DEVICE_ID_KEY = 'zenith_device_id';
const LAST_SYNC_KEY = 'last_sync_at';

export interface SyncCreds {
  url: string;
  anonKey: string;
  syncKey?: string; // optional shared key for cross-device sync (phone + web)
}

let _client: SupabaseClient | null = null;

const getDeviceId = async (): Promise<string> => {
  const creds = await loadSyncCreds();
  if (creds?.syncKey?.trim()) return creds.syncKey.trim();
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
};

export const saveSyncCreds = async (creds: SyncCreds) => {
  await AsyncStorage.setItem(CREDS_KEY, JSON.stringify(creds));
  _client = null; // reset so next call rebuilds with new creds
};

export const loadSyncCreds = async (): Promise<SyncCreds | null> => {
  const raw = await AsyncStorage.getItem(CREDS_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const clearSyncCreds = async () => {
  await AsyncStorage.removeItem(CREDS_KEY);
  await AsyncStorage.removeItem(LAST_SYNC_KEY);
  _client = null;
};

const getClient = async (): Promise<SupabaseClient> => {
  if (_client) return _client;
  const creds = await loadSyncCreds();
  if (!creds?.url || !creds?.anonKey) throw new Error('No sync credentials configured');
  _client = createClient(creds.url, creds.anonKey);
  return _client;
};

export const pushToCloud = async (dataJson: string): Promise<void> => {
  const client = await getClient();
  const deviceId = await getDeviceId();

  const { error } = await client
    .from('zenith_sync')
    .upsert({ device_id: deviceId, data_json: dataJson, synced_at: new Date().toISOString() }, { onConflict: 'device_id' });

  if (error) throw new Error(error.message);
  await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
};

export const pullFromCloud = async (): Promise<string | null> => {
  const client = await getClient();
  const deviceId = await getDeviceId();

  const { data, error } = await client
    .from('zenith_sync')
    .select('data_json, synced_at')
    .eq('device_id', deviceId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data?.data_json ?? null;
};

export const getLastSyncTime = async (): Promise<string | null> => {
  return AsyncStorage.getItem(LAST_SYNC_KEY);
};

export const hasSyncCreds = async (): Promise<boolean> => {
  const creds = await loadSyncCreds();
  return !!(creds?.url && creds?.anonKey);
};

export const getDeviceIdPublic = getDeviceId;

// SQL to run in Supabase SQL editor to create the required table:
export const SETUP_SQL = `
create table if not exists zenith_sync (
  device_id text primary key,
  data_json text not null,
  synced_at timestamp with time zone default now()
);

-- Optional: enable Row Level Security so only the device can read its own data
-- alter table zenith_sync enable row level security;
-- create policy "device access" on zenith_sync using (true);
`.trim();
