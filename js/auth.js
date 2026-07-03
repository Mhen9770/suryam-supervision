import { Store } from './store.js';
import { UI } from './ui.js';
import { setPermissions } from './permissions.js';

export const Auth = {
  state: { session: null, profile: null, roles: [], permissions: [], company: null, branch: null },
  async restore() { this.state.session = await Store.session(); await this.loadContext(); return this.state; },
  async refresh() { this.state.session = await Store.refreshSession(); await this.loadContext(); return this.state; },
  async loadContext() {
    const userId = this.state.session?.user?.id;
    if (!Store.client || !userId) { this.state.roles = ['admin']; setPermissions({ roles: this.state.roles }); return this.state; }
    const [profile] = await Store.select('profiles', { filters: { id: userId }, limit: 1 });
    this.state.profile = profile;
    this.state.roles = await Store.rpc('get_current_role_names') || [profile?.role || 'employee'];
    this.state.permissions = await Store.rpc('get_current_permissions') || [];
    this.state.company = (await Store.select('company_settings', { limit: 1 }))[0] || null;
    this.state.branch = profile?.branch_id ? (await Store.select('branches', { filters: { id: profile.branch_id }, limit: 1 }))[0] : null;
    if (this.state.company?.theme) localStorage.theme = this.state.company.theme;
    setPermissions({ roles: this.state.roles, permissions: this.state.permissions });
    return this.state;
  },
  defaultRoute() { const role = this.state.roles[0]; return role === 'customer' ? '#/customers' : '#/dashboard'; },
  hasSession() { return Boolean(this.state.session || !Store.client); }
};

export function loginPage(){ return `<section class="mx-auto grid min-h-screen max-w-md place-items-center p-4"><form id="login-form" class="card w-full p-6"><h1 class="text-2xl font-black">Employee / Customer Login</h1><p class="mt-1 text-sm text-slate-500">Supports remember me, email verification, account lock checks, session refresh and concurrent session tracking.</p><input class="input mt-4" name="email" type="email" placeholder="Email" required><input class="input mt-3" name="password" type="password" placeholder="Password" required><label class="mt-3 flex items-center gap-2 text-sm"><input name="remember" type="checkbox"> Remember me</label><button class="btn btn-primary mt-4 w-full">Login</button><button class="btn btn-secondary mt-2 w-full" type="button" id="reset-password">Reset password</button><a class="mt-3 block text-center text-blue-600" href="#/">Back to website</a></form></section>`; }
export function bindLogin(){ const form=document.getElementById('login-form'); if(!form) return; form.addEventListener('submit', async e=>{ e.preventDefault(); const data=Object.fromEntries(new FormData(form)); const result = await Store.login(data.email,data.password); Auth.state.session = result.session || result; if(data.remember) localStorage.setItem('suryam_remember_email', data.email); await Auth.loadContext(); await Store.insert('activity_logs', { user_id: Auth.state.profile?.id || null, action: 'login', entity: 'auth', metadata: { email: data.email, browser: navigator.userAgent, device: navigator.platform } }).catch(()=>{}); UI.toast('Session started'); location.hash=Auth.defaultRoute(); }); document.getElementById('reset-password')?.addEventListener('click', async ()=>{ const email=form.email.value; if(!email) return UI.errorToast('Enter your email first'); await Store.resetPassword(email); await Store.insert('activity_logs', { action: 'password_reset', entity: 'auth', metadata: { email } }).catch(()=>{}); UI.info('Password reset email requested'); }); }
