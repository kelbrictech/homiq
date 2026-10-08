import type {Pool} from 'pg';
/** Creates category-qualified offers for a development booking. Idempotent per provider. */
export async function generateOffers(pool:Pool,bookingId:string){
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const booking=await client.query('SELECT * FROM bookings WHERE id=$1 FOR UPDATE',[bookingId]);
  if(!booking.rowCount)throw new Error('Booking not found');
  const b=booking.rows[0];
  if(!['requested','matching'].includes(b.status))throw new Error('Booking cannot be dispatched');
  const eligible=await client.query(`SELECT p.id FROM providers p JOIN provider_categories pc ON pc.provider_id=p.id
    WHERE p.active=true AND pc.category_code=$1 AND pc.status='approved'
    AND (pc.expires_at IS NULL OR pc.expires_at>now())
    AND EXISTS(SELECT 1 FROM availability a WHERE a.provider_id=p.id AND a.starts_at<=$2 AND a.ends_at>=$3)
    AND NOT EXISTS(SELECT 1 FROM assignments x JOIN bookings j ON j.id=x.booking_id
      WHERE x.provider_id=p.id AND j.status IN ('confirmed','in_progress') AND j.starts_at<$3 AND j.ends_at>$2)
    ORDER BY p.id LIMIT 5`,[b.category_code,b.starts_at,b.ends_at]);
  let count=0;
  for(const row of eligible.rows){
   const r=await client.query("INSERT INTO dispatch_offers(booking_id,provider_id,expires_at) VALUES($1,$2,now()+interval '15 minutes') ON CONFLICT(booking_id,provider_id) DO NOTHING RETURNING id",[bookingId,row.id]);
   count+=r.rowCount||0;
  }
  if(count)await client.query("UPDATE bookings SET status='matching' WHERE id=$1",[bookingId]);
  await client.query("INSERT INTO booking_events(booking_id,event_type,detail) VALUES($1,'offers_generated',$2)",[bookingId,JSON.stringify({count})]);
  await client.query('COMMIT');
  return {bookingId,offersCreated:count};
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
