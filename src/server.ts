import 'dotenv/config';
import {adminDevRoutes} from './admin-dev-routes.js';
import {providerDevRoutes} from './provider-dev-routes.js';
import {generateOffers} from './dispatch.js';
import {sweepAndRedispatch} from './redispatch.js';
import {transitionBooking,TransitionRejected} from './lifecycle.js';
import express from 'express';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import pg from 'pg';
import {z} from 'zod';
import {acceptOffer,categoryCodes,validateIntake} from './engine.js';
if(process.env.NODE_ENV==='production') throw new Error('Production deployment blocked: secure authentication and authorization are not implemented.');
if(process.env.ALLOW_INSECURE_DEV_AUTH!=='true') throw new Error('Local-only dev identity requires ALLOW_INSECURE_DEV_AUTH=true.');
const app=express();app.use(express.json({limit:'100kb'}));
const demoPath=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public/demo.html');
app.get('/demo',(_req,res)=>res.sendFile(demoPath));
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
const bookingInput=z.object({category:z.enum(categoryCodes),startsAt:z.string().datetime({offset:true}),endsAt:z.string().datetime({offset:true}),address:z.string().trim().min(5).max(500),intake:z.record(z.unknown())});
// DEVELOPMENT ONLY. No public deployment until verified authentication is implemented.
const actor=(req:express.Request)=>{const value=req.header('x-dev-user-id');return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)?value:null;};
async function reconcileOffers(){await pool.query(`UPDATE dispatch_offers SET status='expired' WHERE status='pending' AND expires_at<=now()`);const changed=await pool.query(`UPDATE bookings b SET status='requested' WHERE b.status='matching' AND NOT EXISTS (SELECT 1 FROM dispatch_offers o WHERE o.booking_id=b.id AND o.status='pending' AND o.expires_at>now()) RETURNING b.id`);for(const row of changed.rows)await pool.query("INSERT INTO booking_events(booking_id,event_type,detail) VALUES($1,'matching_exhausted','{}'::jsonb)",[row.id]);}
app.get('/health',(_req,res)=>res.json({ok:true}));
app.get('/api/services',async(_req,res)=>{try{const r=await pool.query('SELECT code,label FROM categories ORDER BY label');res.json(r.rows);}catch{res.status(500).json({error:'database unavailable'});}});
app.post('/api/bookings',async(req,res)=>{const userId=actor(req);if(!userId)return res.status(401).json({error:'dev actor required'});const parsed=bookingInput.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Invalid booking fields',details:parsed.error.flatten()});const b=parsed.data;const missing=validateIntake(b.category,b.intake);if(missing.length)return res.status(400).json({error:'Invalid or missing service details',missing});if(b.category==='personal_assistance')return res.status(422).json({error:'Personal Assistance bookings are temporarily unavailable pending enhanced screening.'});if(new Date(b.endsAt)<=new Date(b.startsAt)||new Date(b.startsAt)<=new Date()||new Date(b.endsAt).getTime()-new Date(b.startsAt).getTime()>8*3600000||new Date(b.startsAt).getTime()-Date.now()>31*86400000)return res.status(400).json({error:'invalid booking time'});try{const r=await pool.query('INSERT INTO bookings(customer_id,category_code,starts_at,ends_at,address_text,intake) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,status',[userId,b.category,b.startsAt,b.endsAt,b.address,JSON.stringify(b.intake)]);let dispatch={offersCreated:0};try{dispatch=await generateOffers(pool,r.rows[0].id)}catch(e){console.error('Dispatch pending for booking',r.rows[0].id,e)}res.status(201).json({...r.rows[0],...dispatch,status:dispatch.offersCreated?'matching':'requested',message:dispatch.offersCreated?'Request matched to eligible providers; notifications are not enabled.':'Request saved; no available providers yet.'});}catch{res.status(500).json({error:'booking creation failed'});}});
app.get('/api/bookings/:id',async(req,res)=>{const userId=actor(req);if(!userId)return res.status(401).json({error:'dev actor required'});try{await reconcileOffers();const r=await pool.query('SELECT * FROM bookings WHERE id=$1 AND customer_id=$2',[req.params.id,userId]);if(!r.rowCount)return res.status(404).json({error:'not found'});res.json(r.rows[0]);}catch{res.status(500).json({error:'query failed'});}});

const bookingTransition=z.object({action:z.enum(['cancel','start','complete','dispute'])});
app.post('/api/bookings/:id/transition',async(req,res)=>{
 const userId=actor(req);if(!userId)return res.status(401).json({error:'dev actor required'});
 const parsed=bookingTransition.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:'Invalid action'});
 try{res.json(await transitionBooking(pool,req.params.id,userId,parsed.data.action));}
 catch(e){if(e instanceof TransitionRejected)return res.status(e.code).json({error:e.message});console.error('Booking transition failed',e);res.status(500).json({error:'Transition failed'});}
});
app.get('/api/bookings/:id/events',async(req,res)=>{
 const userId=actor(req);if(!userId)return res.status(401).json({error:'dev actor required'});
 try{const owner=await pool.query(`SELECT b.id FROM bookings b LEFT JOIN assignments a ON a.booking_id=b.id LEFT JOIN providers p ON p.id=a.provider_id WHERE b.id=$1 AND (b.customer_id=$2 OR p.user_id=$2)`,[req.params.id,userId]);if(!owner.rowCount)return res.status(404).json({error:'Booking not found'});const r=await pool.query('SELECT event_type,detail,created_at FROM booking_events WHERE booking_id=$1 ORDER BY id',[req.params.id]);res.json(r.rows);}catch{res.status(500).json({error:'Events unavailable'});}
});
app.post('/api/offers/:id/accept',async(req,res)=>{const userId=actor(req);if(!userId)return res.status(401).json({error:'dev actor required'});try{res.json(await acceptOffer(pool,req.params.id,userId));}catch(e){const msg=(e as Error).message;const known=['Offer not found','Booking unavailable','Provider not qualified','Provider not eligible','Offer expired or unavailable','Provider not available','Provider already booked'];res.status(known.includes(msg)?409:500).json({error:known.includes(msg)?msg:'Unable to process offer'});}});

// Development fixtures only. Never enable these endpoints in a public deployment.
providerDevRoutes(app,pool);
adminDevRoutes(app,pool);
if(process.env.ENABLE_DEMO_ROUTES==='true' && process.env.NODE_ENV!=='production'){
  app.get('/api/dev/customers',async(_req,res)=>{try{const q=await pool.query("SELECT id,display_name FROM users WHERE email LIKE 'customer%@example.test' ORDER BY display_name");res.json(q.rows);}catch{res.status(500).json({error:'demo customer query failed'});}});
  app.get('/api/dev/bookings',async(req,res)=>{const id=actor(req);if(!id)return res.status(401).json({error:'demo actor required'});try{await reconcileOffers();const q=await pool.query('SELECT id,category_code,status,starts_at,address_text FROM bookings WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 100',[id]);res.json(q.rows);}catch{res.status(500).json({error:'demo booking query failed'});}});
}
pool.on('error',err=>console.error('Database pool error',err));
app.use((err:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{console.error('Request error',err);res.status(400).json({error:'Invalid request body'});});
app.listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('HOMIQ local development API listening'));
let sweepRunning=false;
setInterval(async()=>{if(sweepRunning)return;sweepRunning=true;try{await sweepAndRedispatch(pool)}catch(e){console.error('Offer sweep failed',e)}finally{sweepRunning=false}},60_000).unref();
