import 'dotenv/config';
import {providerDevRoutes} from './provider-dev-routes.js';
import {generateOffers} from './dispatch.js';
import express from 'express';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import pg from 'pg';
import {z} from 'zod';
import {acceptOffer,categoryCodes,validateIntake} from './engine.js';
if(process.env.NODE_ENV==='production') throw new Error('Production deployment blocked: secure authentication and authorization are not implemented.');
const app=express();app.use(express.json({limit:'100kb'}));
const demoPath=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public/demo.html');
app.get('/demo',(_req,res)=>res.sendFile(demoPath));
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
const bookingInput=z.object({category:z.enum(categoryCodes),startsAt:z.string().datetime({offset:true}),endsAt:z.string().datetime({offset:true}),address:z.string().min(5),intake:z.record(z.unknown())});
// DEVELOPMENT ONLY. No public deployment until verified authentication is implemented.
const actor=(req:express.Request)=>req.header('x-dev-user-id');
app.get('/health',(_req,res)=>res.json({ok:true}));
app.get('/api/services',async(_req,res)=>{try{const r=await pool.query('SELECT code,label FROM categories ORDER BY label');res.json(r.rows);}catch{res.status(500).json({error:'database unavailable'});}});
app.post('/api/bookings',async(req,res)=>{const userId=actor(req);if(!userId)return res.status(401).json({error:'dev actor required'});const parsed=bookingInput.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:parsed.error.flatten()});const b=parsed.data;const missing=validateIntake(b.category,b.intake);if(missing.length)return res.status(400).json({missing});if(new Date(b.endsAt)<=new Date(b.startsAt)||new Date(b.startsAt)<=new Date())return res.status(400).json({error:'invalid booking time'});try{const r=await pool.query('INSERT INTO bookings(customer_id,category_code,starts_at,ends_at,address_text,intake) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,status',[userId,b.category,b.startsAt,b.endsAt,b.address,JSON.stringify(b.intake)]);let dispatch={offersCreated:0};try{dispatch=await generateOffers(pool,r.rows[0].id)}catch(e){console.error('Dispatch failed for booking',r.rows[0].id,e)}res.status(201).json({...r.rows[0],...dispatch,status:dispatch.offersCreated?'matching':'requested'});}catch{res.status(500).json({error:'booking creation failed'});}});
app.get('/api/bookings/:id',async(req,res)=>{const userId=actor(req);if(!userId)return res.status(401).json({error:'dev actor required'});try{const r=await pool.query('SELECT * FROM bookings WHERE id=$1 AND customer_id=$2',[req.params.id,userId]);if(!r.rowCount)return res.status(404).json({error:'not found'});res.json(r.rows[0]);}catch{res.status(500).json({error:'query failed'});}});
app.post('/api/offers/:id/accept',async(req,res)=>{const userId=actor(req);if(!userId)return res.status(401).json({error:'dev actor required'});try{res.json(await acceptOffer(pool,req.params.id,userId));}catch(e){res.status(409).json({error:(e as Error).message});}});

// Development fixtures only. Never enable these endpoints in a public deployment.
if(process.env.ENABLE_DEMO_ROUTES==='true' && process.env.NODE_ENV!=='production'){
  providerDevRoutes(app,pool);
  app.get('/api/dev/customers',async(_req,res)=>{try{const q=await pool.query("SELECT id,display_name FROM users WHERE email LIKE 'customer%@example.test' ORDER BY display_name");res.json(q.rows);}catch{res.status(500).json({error:'demo customer query failed'});}});
  app.get('/api/dev/bookings',async(req,res)=>{const id=actor(req);if(!id)return res.status(401).json({error:'demo actor required'});try{const q=await pool.query('SELECT id,category_code,status,starts_at,address_text FROM bookings WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 100',[id]);res.json(q.rows);}catch{res.status(500).json({error:'demo booking query failed'});}});
}
app.listen(Number(process.env.PORT||3000),()=>console.log('HOMIQ MVP API listening'));
