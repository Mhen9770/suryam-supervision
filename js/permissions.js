import { AppConfig } from './config.js';

export const PermissionActions = Object.freeze(['view','create','edit','delete','export','approve','print','upload','configure']);
export const PermissionModules = Object.freeze([...AppConfig.modules, 'assets', 'warehouse', 'audit', 'notifications', 'company_settings']);

const normalize = value => String(value || '').toLowerCase().replace(/\s+/g, '_');
const keyFor = (resource, action) => `${normalize(resource)}.${normalize(action)}`;

const roleDefaults = {
  admin: ['*.*'],
  manager: PermissionModules.flatMap(module => PermissionActions.map(action => keyFor(module, action))),
  sales: ['dashboard.view','crm.view','crm.create','crm.edit','customers.view','customers.create','customers.edit','assets.view','reports.view','reports.export'],
  sales_executive: ['dashboard.view','crm.view','crm.create','crm.edit','customers.view','customers.create','customers.edit','assets.view','reports.view','reports.export'],
  installation_engineer: ['dashboard.view','installation.view','installation.edit','assets.view','assets.edit','assets.upload','customers.view'],
  service_engineer: ['dashboard.view','service.view','service.edit','assets.view','assets.edit','assets.upload','customers.view','amc.view'],
  store_manager: ['dashboard.view','inventory.view','inventory.create','inventory.edit','inventory.delete','inventory.export','warehouse.view','warehouse.create','warehouse.edit','warehouse.delete','products.view'],
  hr: ['dashboard.view','employees.view','employees.create','employees.edit','employees.export','reports.view'],
  accounts: ['dashboard.view','accounts.view','accounts.create','accounts.edit','accounts.approve','accounts.print','accounts.export','customers.view','reports.view'],
  accountant: ['dashboard.view','accounts.view','accounts.create','accounts.edit','accounts.approve','accounts.print','accounts.export','customers.view','reports.view'],
  employee: ['dashboard.view','customers.view','assets.view'],
  customer: ['dashboard.view','customers.view','assets.view','service.view','amc.view'],
  viewer: PermissionModules.map(module => keyFor(module, 'view')),
  read_only: PermissionModules.map(module => keyFor(module, 'view'))
};

export class PermissionEngine {
  constructor({ roles = [], permissions = [] } = {}) {
    this.roles = roles.map(normalize);
    this.permissions = new Set(permissions.map(permission => typeof permission === 'string' ? normalize(permission) : keyFor(permission.resource || permission.module, permission.action)));
    this.roles.forEach(role => (roleDefaults[role] || []).forEach(permission => this.permissions.add(normalize(permission))));
  }
  can(resource, action) { return this.permissions.has('*.*') || this.permissions.has(`${normalize(resource)}.*`) || this.permissions.has(keyFor(resource, action)); }
  canView(resource) { return this.can(resource, 'view'); }
  canCreate(resource) { return this.can(resource, 'create'); }
  canEdit(resource) { return this.can(resource, 'edit'); }
  canDelete(resource) { return this.can(resource, 'delete'); }
  canApprove(resource) { return this.can(resource, 'approve'); }
  canExport(resource) { return this.can(resource, 'export'); }
  canPrint(resource) { return this.can(resource, 'print'); }
  canUpload(resource) { return this.can(resource, 'upload'); }
  canConfigure(resource) { return this.can(resource, 'configure'); }
}

let activeEngine = new PermissionEngine({ roles: ['viewer'] });
export function setPermissions(context = {}) { activeEngine = new PermissionEngine(context); return activeEngine; }
export function permissions() { return activeEngine; }
export const can = (resource, action) => activeEngine.can(resource, action);
export const canView = resource => activeEngine.canView(resource);
export const canCreate = resource => activeEngine.canCreate(resource);
export const canEdit = resource => activeEngine.canEdit(resource);
export const canDelete = resource => activeEngine.canDelete(resource);
export const canApprove = resource => activeEngine.canApprove(resource);
export const canExport = resource => activeEngine.canExport(resource);
export const canPrint = resource => activeEngine.canPrint(resource);
