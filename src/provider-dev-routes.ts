import type {Express} from 'express';
import type {Pool} from 'pg';
export function providerDevRoutes(app:Express,pool:Pool){
 app.get('/api/dev/providers',async(_req,res)=>{
  try{const r=await pool.query("SELECT u.id,u.display_name FROM users u JOIN providers p ON p.user_id=u.id WHERE u.email LIKE 'provider%@example.test' ORDER BY u.display_name");res.json(r.rows)}
  catch{res.status(500).json({error:'provider lookup failed'})}
 });
 app.get('/api/dev/offers',async(req,res)=>{
  const id=req.header('x-dev-user-id');if(!id)return res.status(401).json({error:'actor required'});
  try{const r=await pool.query("SELECT o.id,o.booking_id,o.status,o.expires_at,b.category_code,b.starts_at,b.address_text FROM dispatch_offers o JOIN providers p ON p.id=o.provider_id JOIN bookings b ON b.id=o.booking_id WHERE p.user_id=$1 ORDER BY b.created_at DESC LIMIT 100",[id]);res.json(r.rows)}
  catch{res.status(500).json({error:'offer lookup failed'})}
 });
 app.get('/api/dev/qualifications',async(req,res)=>{
  const id=req.header('x-dev-user-id');if(!id)return res.status(401).json({error:'actor required'});
  try{const r=await pool.query("SELECT pc.category_code,pc.status,pc.expires_at FROM provider_categories pc JOIN providers p ON p.id=pc.provider_id WHERE p.user_id=$1 ORDER BY pc.category_code",[id]);res.json(r.rows)}
  catch{res.status(500).json({error:'qualification lookup failed'})}
 });
 app.post('/api/dev/offers/:id/decline',async(req,res)=>{
  const id=req.header('x-dev-user-id');if(!id)return res.status(401).json({error:'actor required'});
  try{
   const q=await pool.query("UPDATE dispatch_offers o SET status='declined' FROM providers p WHERE o.id=$1 AND o.provider_id=p.id AND p.user_id=$2 AND o.status='pending' AND o.expires_at>now() RETURNING o.id",[req.params.id,id]);
   if(!q.rowCount)return res.status(409).json({error:'Offer unavailable'});
   res.json({status:'declined'});
  }catch{res.status(500).json({error:'decline failed'});}
 });
}
