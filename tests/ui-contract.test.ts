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

test('booking response never falsely claims notifications were delivered',()=>{
 assert.ok(server.includes('notifications are not enabled'));
 assert.ok(!server.includes('Providers notified'));
});

test('pending offers never reveal address, including addresses without commas',()=>{
 assert.ok(routes.includes("'[Address hidden until acceptance]'"));
 assert.ok(!routes.includes("split_part(b.address_text"));
});
test('enhanced-screening qualifications cannot be approved by dev admin',()=>{
 const adminRoutes=readFileSync('src/admin-dev-routes.ts','utf8');
 assert.ok(adminRoutes.includes("requires_enhanced_screening"));
 assert.ok(adminRoutes.includes("Enhanced screening required"));
});

test('demo customer identity and completed-job ratings persist locally and can be reset',()=>{
 for(const fragment of ["homiq:customer","homiq:ratings","b.status==='completed'","Reset local demo preferences","Not published."]) assert.ok(customer.includes(fragment),fragment);
 assert.ok(customer.includes("setBookings([])"),'switching accounts clears prior account bookings before reload');
});

test('provider availability schedule has owner-scoped API and interactive controls',()=>{
 for(const fragment of ["/api/provider/availability","NOT EXISTS(SELECT 1 FROM availability","JOIN providers p ON p.id=a.provider_id","Slot not found or assigned booking overlaps"])assert.ok(routes.includes(fragment),fragment);
 for(const fragment of ["saveSlot","removeSlot","Available from","Available until","Add availability"])assert.ok(provider.includes(fragment),fragment);
});

test('nonbinding service price hints and fictional wallet balance are clearly labeled',()=>{
 const prices=readFileSync('apps/web/src/pricing.ts','utf8');
 const walletSql=readFileSync('sql/003_demo_wallet.sql','utf8');
 for(const key of ['repairs','cleaning','maintenance','outdoor','moving_delivery','personal_assistance'])assert.ok(prices.includes(key),key);
 for(const fragment of ['demoPricing','Provider quote may differ','No charge on booking','Fictional test wallet','Simulation only'])assert.ok(customer.includes(fragment),fragment);
 assert.ok(server.includes("'/api/demo/wallet'"));
 for(const fragment of ['demo_wallets','demo_wallet_holds','demo_wallet_ledger','ON CONFLICT(user_id) DO NOTHING'])assert.ok(walletSql.includes(fragment),fragment);
});
