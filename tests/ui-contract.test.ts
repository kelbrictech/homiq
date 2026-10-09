import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const customer=readFileSync('apps/web/src/App.tsx','utf8');
const provider=readFileSync('apps/web/src/ProviderApp.tsx','utf8');
const server=readFileSync('src/server.ts','utf8');
const routes=readFileSync('src/provider-dev-routes.ts','utf8');
test('customer workflow has booking, cancellation, dispute and event history wiring',()=>{
 for(const fragment of ["'/bookings'","'/dev/bookings'","'/bookings/'+id+'/events'","action:'cancel'","action:'dispute'"]) assert.ok(customer.includes(fragment),fragment);
 for(const fragment of ["/api/bookings/:id/transition","/api/bookings/:id/events","/api/bookings"]) assert.ok(server.includes(fragment),fragment);
});
test('provider workflow has offers, jobs and lifecycle wiring',()=>{
 for(const fragment of ["'/provider/offers'","'/provider/jobs'","'/provider/qualifications'","'/offers/'+id+'/accept'","'/provider/offers/'+id+'/decline'","transition(j.id,'start')","transition(j.id,'complete')"]) assert.ok(provider.includes(fragment),fragment);
 for(const fragment of ["/api/provider/jobs","/api/provider/offers","/api/provider/qualifications","/api/provider/offers/:id/decline"]) assert.ok(routes.includes(fragment),fragment);
});
test('UI labels development identity clearly',()=>{
 assert.ok(customer.includes('Development identity selection is not authentication'));
 assert.ok(provider.includes('Development account selector only'));
});

test('admin console supports guarded oversight, qualification decisions and dispute resolution',()=>{
 const admin=readFileSync('apps/web/src/AdminApp.tsx','utf8');
 const routes=readFileSync('src/admin-dev-routes.ts','utf8');
 const shell=readFileSync('apps/web/src/main.tsx','utf8');
 for(const path of ['/summary','/qualifications','/disputes/'])assert.ok(admin.includes(path),path);
 for(const path of ['/api/dev/admin/summary','/api/dev/admin/qualifications','/api/dev/admin/disputes/:bookingId/resolve'])assert.ok(routes.includes(path),path);
 assert.ok(routes.includes("x-dev-admin-key"));
 assert.ok(routes.includes("ENABLE_DEMO_ROUTES"));
 assert.ok(routes.includes("admin_dispute_resolved"));
 assert.ok(server.includes('adminDevRoutes(app,pool)'));
 assert.ok(shell.includes('<AdminApp/>'));
});

test('provider development routes are gated and pending offers redact customer intake',()=>{
 assert.ok(routes.includes("app.use('/api/provider'"));
 assert.ok(routes.includes("ENABLE_DEMO_ROUTES"));
 assert.ok(routes.includes("ALLOW_INSECURE_DEV_AUTH"));
 assert.ok(routes.includes("ELSE '{}'::jsonb END AS intake"));
});
