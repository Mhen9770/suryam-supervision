import { Auth } from './auth.js';
import { canView } from './permissions.js';

export class Router {
  constructor(routes, { protectedRoutes = [] } = {}) { this.routes = routes; this.protectedRoutes = new Set(protectedRoutes); window.addEventListener('hashchange', () => this.resolve()); }
  async start(){ await Auth.restore(); this.resolve(); }
  async resolve(){ const path = location.hash.replace('#/','') || ''; const page = path.split('/')[0] || 'home'; const handler = this.routes[page] || this.routes.notFound || this.#notFound; if (this.protectedRoutes.has(page) && !Auth.hasSession()) { location.hash = '#/login'; return; } if (this.protectedRoutes.has(page) && !canView(page)) { await (this.routes.forbidden || this.#forbidden)(path); return; } await handler(path); }
  async #notFound(){ document.getElementById('app').innerHTML = '<section class="p-8"><h1 class="text-3xl font-black">404</h1><p>Page not found.</p></section>'; }
  async #forbidden(){ document.getElementById('app').innerHTML = '<section class="p-8"><h1 class="text-3xl font-black">Access denied</h1><p>You do not have permission to view this module.</p></section>'; }
}
