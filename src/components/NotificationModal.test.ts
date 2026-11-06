import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const app = fs.readFileSync(path.join(import.meta.dirname, '..', 'App.tsx'), 'utf8');
const modal = fs.readFileSync(path.join(import.meta.dirname, 'NotificationModal.tsx'), 'utf8');

test('notifications poll unread items and refresh when panel opens', () => {
  assert.match(app, /api\.notifications\.list\(undefined, 100, true\)/);
  assert.match(app, /window\.setInterval\(refreshUnreadNotifications, 30_000\)/);
  assert.match(app, /document\.addEventListener\('visibilitychange', refreshUnreadNotifications\)/);
  assert.match(app, /isNotificationModalOpen/);
  assert.match(app, /void loadAllNotifications\(locale\)/);
});

test('system notices have no dead action button', () => {
  assert.match(modal, /n\.actionType !== 'none' && \(/);
  assert.match(modal, /\(n\.actionType !== 'none' \|\| !n\.isRead\) && \(/);
});
