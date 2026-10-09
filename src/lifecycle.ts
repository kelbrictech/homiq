import type {Pool} from 'pg';
export type BookingAction='cancel'|'start'|'complete'|'dispute';
export class TransitionRejected extends Error {constructor(public code:404|409,message:string){super(message);}}
export async function transitionBooking(pool:Pool,bookingId:string,userId:string,action:BookingAction){
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const r=await client.query(`SELECT b.id,b.status,b.customer_id,p.user_id AS provider_user_id
    FROM bookings b LEFT JOIN assignments a ON a.booking_id=b.id LEFT JOIN providers p ON p.id=a.provider_id
    WHERE b.id=$1 FOR UPDATE OF b`,[bookingId]);
  if(!r.rowCount)throw new TransitionRejected(404,'Booking not found');
  const b=r.rows[0];
  const isCustomer=b.customer_id===userId,isProvider=b.provider_user_id===userId;
  const allowed=action==='cancel'?isCustomer&&['requested','matching','confirmed'].includes(b.status)
    :action==='start'?isProvider&&b.status==='confirmed'
    :action==='complete'?isProvider&&b.status==='in_progress'
    :(isCustomer||isProvider)&&['confirmed','in_progress','completed'].includes(b.status);
  if(!allowed)throw new TransitionRejected(409,'Action not permitted for this actor or booking state');
  const next=action==='cancel'?'canceled':action==='start'?'in_progress':action==='complete'?'completed':'disputed';
  await client.query('UPDATE bookings SET status=$2 WHERE id=$1',[bookingId,next]);
  if(next==='canceled')await client.query("UPDATE dispatch_offers SET status='expired' WHERE booking_id=$1 AND status='pending'",[bookingId]);
  await client.query('INSERT INTO booking_events(booking_id,actor_user_id,event_type,detail) VALUES($1,$2,$3,$4)',[bookingId,userId,action,JSON.stringify({from:b.status,to:next})]);
  await client.query('COMMIT');
  return {bookingId,status:next};
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
