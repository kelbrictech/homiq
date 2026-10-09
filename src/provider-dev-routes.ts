import type {Express} from 'express';
import type {Pool} from 'pg';
export function providerDevRoutes(app:Express,pool:Pool){
 app.use('/api/provider',(req,res,next)=>{if(process.env.NODE_ENV==='production'||process.env.ALLOW_INSECURE_DEV_AUTH!=='true'||process.env.ENABLE_DEMO_ROUTES!=='true')return res.status(404).json({error:'Development route unavailable'});next();});
 app.use('/api/dev/providers',(req,res,next)=>{if(process.env.NODE_ENV==='production'||process.env.ALLOW_INSECURE_DEV_AUTH!=='true'||process.env.ENABLE_DEMO_ROUTES!=='true')return res.status(404).json({error:'Development route unavailable'});next();});
 app.get('/api/provider/jobs',async(req,res)=>{
  const id=req.header('x-dev-user-id');if(!id)return res.status(401).json({error:'actor required'});
  try{const q=await pool.query("SELECT b.id,b.category_code,b.status,b.starts_at,b.ends_at,b.address_text,b.intake FROM bookings b JOIN assignments a ON a.booking_id=b.id JOIN providers p ON p.id=a.provider_id WHERE p.user_id=$1 ORDER BY b.starts_at DESC LIMIT 100",[id]);res.json(q.rows)}catch{res.status(500).json({error:'jobs unavailable'})}
 });
 app.get('/api/dev/providers',async(_req,res)=>{
  try{const r=await pool.query("SELECT u.id,u.display_name FROM users u JOIN providers p ON p.user_id=u.id WHERE u.email LIKE 'provider%@example.test' ORDER BY u.display_name");res.json(r.rows)}
  catch{res.status(500).json({error:'provider lookup failed'})}
 });
 app.get('/api/provider/offers',async(req,res)=>{
  const id=req.header('x-dev-user-id');if(!id)return res.status(401).json({error:'actor required'});
  try{const r=await pool.query("SELECT o.id,o.booking_id,o.status,o.expires_at,b.category_code,b.starts_at,CASE WHEN o.status='accepted' THEN b.intake ELSE '{}'::jsonb END AS intake,CASE WHEN o.status='accepted' THEN b.address_text ELSE '[Address hidden until acceptance]' END AS address_text FROM dispatch_offers o JOIN providers p ON p.id=o.provider_id JOIN bookings b ON b.id=o.booking_id WHERE p.user_id=$1 AND o.status='pending' AND o.expires_at>now() ORDER BY b.created_at DESC LIMIT 100",[id]);res.json(r.rows)}
  catch{res.status(500).json({error:'offer lookup failed'})}
 });
 app.get('/api/provider/availability',async(req,res)=>{const id=req.header('x-dev-user-id');if(!id)return res.status(401).json({error:'actor required'});try{const q=await pool.query("SELECT a.id,a.starts_at,a.ends_at FROM availability a JOIN providers p ON p.id=a.provider_id WHERE p.user_id=$1 AND a.ends_at>now() ORDER BY a.starts_at LIMIT 100",[id]);res.json(q.rows)}catch{res.status(500).json({error:'Availability unavailable'})}});
 app.post('/api/provider/availability',async(req,res)=>{const id=req.header('x-dev-user-id');if(!id)return res.status(401).json({error:'actor required'});const start=new Date(req.body?.startsAt),end=new Date(req.body?.endsAt);if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||start<=new Date()||end<=start||end.getTime()-start.getTime()>8*3600000)return res.status(400).json({error:'Invalid availability window'});try{const q=await pool.query("INSERT INTO availability(provider_id,starts_at,ends_at) SELECT p.id,$2,$3 FROM providers p WHERE p.user_id=$1 AND p.active=true AND NOT EXISTS(SELECT 1 FROM availability a WHERE a.provider_id=p.id AND a.starts_at<$3 AND a.ends_at>$2) RETURNING id,starts_at,ends_at",[id,start.toISOString(),end.toISOString()]);if(!q.rowCount)return res.status(409).json({error:'Provider unavailable or overlapping slot'});res.status(201).json(q.rows[0])}catch{res.status(500).json({error:'Availability creation failed'})}});
 app.delete('/api/provider/availability/:id',async(req,res)=>{const id=req.header('x-dev-user-id');if(!id)return res.status(401).json({error:'actor required'});try{const q=await pool.query("DELETE FROM availability a USING providers p WHERE a.id=$1 AND a.provider_id=p.id AND p.user_id=$2 AND NOT EXISTS(SELECT 1 FROM assignments x JOIN bookings b ON b.id=x.booking_id WHERE x.provider_id=p.id AND b.status IN ('confirmed','in_progress') AND b.starts_at<a.ends_at AND b.ends_at>a.starts_at) RETURNING a.id",[req.params.id,id]);if(!q.rowCount)return res.status(409).json({error:'Slot not found or assigned booking overlaps'});res.json({removed:true})}catch{res.status(500).json({error:'Availability removal failed'})}});
 app.get('/api/provider/qualifications',async(req,res)=>{
  const id=req.header('x-dev-user-id');if(!id)return res.status(401).json({error:'actor required'});
  try{const r=await pool.query("SELECT pc.category_code,pc.status,pc.expires_at FROM provider_categories pc JOIN providers p ON p.id=pc.provider_id WHERE p.user_id=$1 ORDER BY pc.category_code",[id]);res.json(r.rows)}
  catch{res.status(500).json({error:'qualification lookup failed'})}
 });
 app.post('/api/provider/offers/:id/decline',async(req,res)=>{
  const id=req.header('x-dev-user-id');if(!id)return res.status(401).json({error:'actor required'});
  try{
   const q=await pool.query("UPDATE dispatch_offers o SET status='declined' FROM providers p WHERE o.id=$1 AND o.provider_id=p.id AND p.user_id=$2 AND o.status='pending' AND o.expires_at>now() RETURNING o.id",[req.params.id,id]);
   if(!q.rowCount)return res.status(409).json({error:'Offer unavailable'});
   await pool.query("INSERT INTO booking_events(booking_id,actor_user_id,event_type,detail) SELECT booking_id,$2,'offer_declined',jsonb_build_object('offerId',$1::text) FROM dispatch_offers WHERE id=$1",[req.params.id,id]);
   res.json({status:'declined'});
  }catch{res.status(500).json({error:'decline failed'});}
 });
}
