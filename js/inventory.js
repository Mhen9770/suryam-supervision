import { UI } from './ui.js';
export function inventoryPage() {
  const title = 'inventory'.replace(/_/g, ' ');
  return UI.shell(
    '<div class="card p-6"><h2 class="text-2xl font-black capitalize">' + title + '</h2><p class="mt-2 text-slate-600 dark:text-slate-300">Manage CCTV business ' + title + ' workflows with role-aware records, documents, reminders, audit history and reports.</p></div>',
    'inventory'
  );
}
