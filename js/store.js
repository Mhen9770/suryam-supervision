import { AppConfig } from './config.js';
import { readLocal, saveLocal, uid } from './utils.js';

export class Store {
  static client = AppConfig.supabase.url && AppConfig.supabase.anonKey && window.supabase ? window.supabase.createClient(AppConfig.supabase.url, AppConfig.supabase.anonKey) : null;
  static offlineKey = 'suryam_offline_store_v1';

  static async select(table, { filters = {}, order = 'created_at', limit = 100 } = {}) {
    if (!this.client) return this.#offline(table).filter(row => Object.entries(filters).every(([k,v]) => row[k] === v)).slice(0, limit);
    let query = this.client.from(table).select('*').limit(limit);
    Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
    if (order) query = query.order(order, { ascending: false });
    return this.#unwrap(await query);
  }
  static async insert(table, payload) {
    if (!this.client) { const rows = this.#offline(table); const row = { id: uid(table), ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; rows.unshift(row); this.#persist(table, rows); return row; }
    return this.#unwrap(await this.client.from(table).insert(payload).select().single());
  }
  static async update(table, id, payload) {
    if (!this.client) { const rows = this.#offline(table).map(row => row.id === id ? { ...row, ...payload, updated_at: new Date().toISOString() } : row); this.#persist(table, rows); return rows.find(row => row.id === id); }
    return this.#unwrap(await this.client.from(table).update(payload).eq('id', id).select().single());
  }
  static async delete(table, id) { return this.update(table, id, { deleted_at: new Date().toISOString() }); }
  static async rpc(name, args = {}) { if (!this.client) return null; return this.#unwrap(await this.client.rpc(name, args)); }
  static async upload(bucket, path, file) { if (!this.client) throw new Error('Supabase is required for secure file uploads.'); return this.#unwrap(await this.client.storage.from(bucket).upload(path, file, { upsert: true })); }
  static async login(email, password) { if (!this.client) return { user: { email, role: 'admin' } }; return this.#unwrap(await this.client.auth.signInWithPassword({ email, password })); }
  static async logout() { if (this.client) await this.client.auth.signOut(); }
  static #unwrap({ data, error }) { if (error) throw error; return data; }
  static #db() { return readLocal(this.offlineKey, {}); }
  static #offline(table) { return this.#db()[table] || []; }
  static #persist(table, rows) { const db = this.#db(); db[table] = rows; saveLocal(this.offlineKey, db); }
}
