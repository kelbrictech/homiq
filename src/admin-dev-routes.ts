import type {Express} from 'express';
import type {Pool} from 'pg';

// Local development only. Production remains blocked by server startup guard.
export function adminDevRoutes(app:Express,pool:Pool){
 const enabled=()=>process.env.ALLOW_INSECURE_DEV_AUTH==='true'&&process.env.ENABLE_DEMO_ROUTES==='true'&&process.env.NODE_ENV!=='production';
 const guard=(req:any,res:any,next:any)=>{if(!enabled())return res.status(404).json({error:'Not available'});if(req.header('x-dev-admin-key')!==process.env.DEV_ADMIN_KEY||!process.env.DEV_ADMIN_KEY)return res.status(403).json({error:'Admin access denied'});next();};
 app.get('/api/dev/admin/summary',guard,async(_req,res)=>{try{
  const [bookings,providers,disputes]=await Promise.all([
   pool.query('SELECT status,COUNT(*)::int AS count FROM bookings GROUP BY status ORDER BY status'),
   pool.query('SELECT status,COUNT(*)::int AS count FROM provider_categories GROUP BY status ORDER BY status'),
   pool.query("SELECT b.id,b.category_code,b.created_at,u.display_name AS customer_name FROM bookings b JOIN users u ON u.id=b.customer_id WHERE b.status='disputed' ORDER BY b.created_at DESC LIMIT 50")
  ]);res.json({bookings:bookings.rows,qualifications:providers.rows,disputes:disputes.rows});
 }catch{res.status(500).json({error:'Admin summary unavailable'});}});
 app.get('/api/dev/admin/qualifications',guard,async(_req,res)=>{try{const q=await pool.query("SELECT pc.provider_id,pc.category_code,pc.status,u.display_name FROM provider_categories pc JOIN providers p ON p.id=pc.provider_id JOIN users u ON u.id=p.user_id ORDER BY CASE WHEN pc.status='pending' THEN 0 ELSE 1 END,u.display_name LIMIT 150");res.json(q.rows)}catch{res.status(500).json({error:'Qualifications unavailable'});}});
 app.post('/api/dev/admin/qualifications/:providerId/:category',guard,async(req,res)=>{const status=req.body?.status;if(!['approved','rejected','suspended'].includes(status))return res.status(400).json({error:'Invalid status'});try{const q=await pool.query("UPDATE provider_categories SET status=$3,approved_at=CASE WHEN $3='approved' THEN now() ELSE NULL END WHERE provider_id=$1 AND category_code=$2 RETURNING provider_id,category_code,status",[req.params.providerId,req.params.category,status]);if(!q.rowCount)return res.status(404).json({error:'Qualification not found'});res.json(q.rows[0])}catch{res.status(500).json({error:'Qualification update failed'});}});
 app.post('/api/dev/admin/disputes/:bookingId/resolve',guard,async(req,res)=>{
  const outcome=req.body?.outcome;
  if(!['completed','canceled'].includes(outcome))return res.status(400).json({error:'Invalid resolution'});
  const client=await pool.connect();
  try{
   await client.query('BEGIN');
   const q=await client.query("UPDATE bookings SET status=$2 WHERE id=$1 AND status='disputed' RETURNING id,status",[req.params.bookingId,outcome]);
   if(!q.rowCount){await client.query('ROLLBACK');return res.status(409).json({error:'Booking is not disputed'});}
   await client.query("INSERT INTO booking_events(booking_id,event_type,detail) VALUES($1,'admin_dispute_resolved',$2::jsonb)",[req.params.bookingId,JSON.stringify({outcome})]);
   await client.query('COMMIT');res.json(q.rows[0]);
  }catch{await client.query('ROLLBACK');res.status(500).json({error:'Resolution failed'});}
  finally{client.release();}
 });
}
