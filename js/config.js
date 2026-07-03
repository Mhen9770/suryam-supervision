export const AppConfig = Object.freeze({
  company: {
    name: 'Suryam Supervision', legalName: 'Suryam Supervision Security Solutions', phone: '+91 98765 43210', whatsapp: '919876543210', email: 'sales@suryamsupervision.com', city: 'Ahmedabad, Gujarat', tagline: 'CCTV, security automation and reliable field service under one roof.'
  },
  supabase: { url: window.SURYAM_SUPABASE_URL || '', anonKey: window.SURYAM_SUPABASE_ANON_KEY || '' },
  roles: ['admin','manager','sales_executive','installation_engineer','service_engineer','store_manager','hr','accountant','employee','customer','read_only'],
  modules: ['dashboard','crm','customers','inventory','installation','service','amc','employees','accounts','reports','settings']
});
