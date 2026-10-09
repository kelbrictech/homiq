import type {Pool} from 'pg';
import {generateOffers} from './dispatch.js';
export async function sweepAndRedispatch(pool:Pool){
 const expired=await pool.query("UPDATE dispatch_offers SET status='expired' WHERE status='pending' AND expires_at<=now()");
 const candidates=await pool.query("SELECT b.id FROM bookings b WHERE b.status IN ('requested','matching') AND b.starts_at>now() AND b.category_code<>'personal_assistance' AND NOT EXISTS (SELECT 1 FROM dispatch_offers o WHERE o.booking_id=b.id AND o.status='pending' AND o.expires_at>now()) ORDER BY b.created_at LIMIT 100");
 let offersCreated=0;
 for(const row of candidates.rows){const result=await generateOffers(pool,row.id);offersCreated+=result.offersCreated;}
 return {expired:expired.rowCount||0,bookingsChecked:candidates.rowCount||0,offersCreated};
}
