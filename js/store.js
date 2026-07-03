import { AppConfig } from './config.js';
import { readLocal, saveLocal, uid } from './utils.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export class Store {
  static client = AppConfig.supabase.url && AppConfig.supabase.anonKey && window.supabase ? window.supabase.createClient(AppConfig.supabase.url, AppConfig.supabase.anonKey) : null;
  static offlineKey = 'suryam_offline_store_v1';
  static queueKey = 'suryam_offline_queue_v1';

  static async select(table, options = {}) {
    const { filters = {}, order = 'created_at', ascending = false, limit = 100, page = 1, search = '', searchColumns = [], columns = '*', count = false } = options;
    if (!this.client) return this.#offlineSelect(table, { filters, order, ascending, limit, page, search, searchColumns, count });
    let query = this.client.from(table).select(columns, { count: count ? 'exact' : undefined }).is('deleted_at', null);
    query = this.#applyFilters(query, filters);
    if (search && searchColumns.length) query = query.or(searchColumns.map(column => `${column}.ilike.%${search}%`).join(','));
    if (order) query = query.order(order, { ascending });
    const from = Math.max(0, (page - 1) * limit); query = query.range(from, from + limit - 1);
    return this.#unwrap(await query);
  }
  static async count(table, { filters = {} } = {}) { const result = await this.select(table, { filters, columns: 'id', limit: 1, count: true }); return result.count ?? result.length ?? 0; }
  static async insert(table, payload) { if (Array.isArray(payload)) return this.bulkInsert(table, payload); if (!this.client) return this.#offlineInsert(table, payload); return this.#unwrap(await this.client.from(table).insert(payload).select().single()); }
  static async bulkInsert(table, rows = []) { if (!this.client) return rows.map(row => this.#offlineInsert(table, row)); return this.#unwrap(await this.client.from(table).insert(rows).select()); }
  static async update(table, id, payload) { if (!this.client) return this.#offlineUpdate(table, id, payload); return this.#unwrap(await this.client.from(table).update(payload).eq('id', id).select().single()); }
  static async bulkUpdate(table, filters, payload) { if (!this.client) return this.#offlineBulkUpdate(table, filters, payload); let query = this.client.from(table).update(payload); query = this.#applyFilters(query, filters); return this.#unwrap(await query.select()); }
  static async delete(table, id) { return this.update(table, id, { deleted_at: new Date().toISOString() }); }
  static async bulkDelete(table, filters) { return this.bulkUpdate(table, filters, { deleted_at: new Date().toISOString() }); }
  static async transaction(operations = []) { const results = []; for (const operation of operations) results.push(await this[operation.type](operation.table, ...(operation.args || []))); return results; }
  static async rpc(name, args = {}) { if (!this.client) return null; return this.#unwrap(await this.client.rpc(name, args)); }
  static async upload(bucket, path, file, options = { upsert: true }) { if (!this.client) throw new Error('Supabase is required for secure file uploads.'); return this.#unwrap(await this.client.storage.from(bucket).upload(path, file, options)); }
  static async removeFile(bucket, paths = []) { if (!this.client) throw new Error('Supabase is required for secure file deletes.'); return this.#unwrap(await this.client.storage.from(bucket).remove(Array.isArray(paths) ? paths : [paths])); }
  static async login(email, password) { if (!this.client) return { user: { id: 'offline-admin', email, role: 'admin' }, session: { access_token: 'offline' } }; return this.#unwrap(await this.client.auth.signInWithPassword({ email, password })); }
  static async logout() { if (this.client) await this.client.auth.signOut(); }
  static async session() { if (!this.client) return null; return (await this.client.auth.getSession()).data.session; }
  static async refreshSession() { if (!this.client) return null; return this.#unwrap(await this.client.auth.refreshSession()); }
  static enqueue(operation) { const queue = readLocal(this.queueKey, []); queue.push({ id: uid('queue'), ...operation, attempts: 0, created_at: new Date().toISOString() }); saveLocal(this.queueKey, queue); }
  static async flushQueue(maxRetries = 3) { if (!this.client) return []; const queue = readLocal(this.queueKey, []); const remaining = []; const completed = []; for (const item of queue) { try { completed.push(await this[item.type](item.table, ...(item.args || []))); } catch (error) { if ((item.attempts || 0) + 1 < maxRetries) remaining.push({ ...item, attempts: (item.attempts || 0) + 1, last_error: error.message }); } await sleep(100); } saveLocal(this.queueKey, remaining); return completed; }

  static #applyFilters(query, filters) { Object.entries(filters || {}).forEach(([key, value]) => { if (Array.isArray(value)) query = query.in(key, value); else if (value && typeof value === 'object' && value.operator) query = query[value.operator](key, value.value); else query = query.eq(key, value); }); return query; }
  static #unwrap({ data, error, count }) { if (error) throw error; return count === null || count === undefined ? data : Object.assign(data || [], { count }); }
  static #db() { return readLocal(this.offlineKey, {}); }
  static #offline(table) { return this.#db()[table] || []; }
  static #persist(table, rows) { const db = this.#db(); db[table] = rows; saveLocal(this.offlineKey, db); }
  static #offlineSelect(table, { filters, order, ascending, limit, page, search, searchColumns, count }) { let rows = this.#offline(table).filter(row => !row.deleted_at && Object.entries(filters).every(([k,v]) => Array.isArray(v) ? v.includes(row[k]) : row[k] === v)); if (search && searchColumns.length) rows = rows.filter(row => searchColumns.some(column => String(row[column] || '').toLowerCase().includes(search.toLowerCase()))); if (order) rows.sort((a,b) => (a[order] > b[order] ? 1 : -1) * (ascending ? 1 : -1)); const total = rows.length; rows = rows.slice((page - 1) * limit, page * limit); return count ? Object.assign(rows, { count: total }) : rows; }
  static #offlineInsert(table, payload) { const rows = this.#offline(table); const row = { id: uid(table), ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; rows.unshift(row); this.#persist(table, rows); return row; }
  static #offlineUpdate(table, id, payload) { const rows = this.#offline(table).map(row => row.id === id ? { ...row, ...payload, updated_at: new Date().toISOString() } : row); this.#persist(table, rows); return rows.find(row => row.id === id); }
  static #offlineBulkUpdate(table, filters, payload) { const changed = []; const rows = this.#offline(table).map(row => Object.entries(filters).every(([k,v]) => row[k] === v) ? (changed.push({ ...row, ...payload }), { ...row, ...payload, updated_at: new Date().toISOString() }) : row); this.#persist(table, rows); return changed; }
}
