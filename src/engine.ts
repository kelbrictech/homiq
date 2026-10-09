import type { Pool, PoolClient } from 'pg';
export const categoryCodes = ['repairs','cleaning','maintenance','outdoor','moving_delivery','personal_assistance'] as const;
export type Category = typeof categoryCodes[number];
export function validateIntake(category: Category, data: Record<string, unknown>): string[] {
  const required: Record<Category,string[]> = {
    repairs:['problemType','description'],
    cleaning:['propertyType','cleaningLevel','suppliesProvidedBy'],
    maintenance:['workType','description'],
    outdoor:['serviceType','propertyType'],
    moving_delivery:['itemDescription','pickupAddress','dropoffAddress'],
    personal_assistance:['assistanceType','description']
  };
  return required[category].filter(key => typeof data[key] !== 'string' || !(data[key] as string).trim() || (data[key] as string).trim().length > 1000);
}
export async function acceptOffer(pool: Pool, offerId: string, actorUserId: string) {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT booking_id FROM dispatch_offers WHERE id=$1', [offerId]);
    if (!found.rowCount) throw new Error('Offer not found');
    const bookingId = found.rows[0].booking_id;
    const booking = await client.query('SELECT * FROM bookings WHERE id=$1 FOR UPDATE', [bookingId]);
    if (!booking.rowCount || !['requested','matching'].includes(booking.rows[0].status)) throw new Error('Booking unavailable');
    const offer = await client.query(`SELECT o.*, p.user_id, p.active, pc.status AS qualification_status, pc.expires_at AS qualification_expires_at
      FROM dispatch_offers o JOIN providers p ON p.id=o.provider_id
      JOIN provider_categories pc ON pc.provider_id=p.id AND pc.category_code=$2
      WHERE o.id=$1 FOR UPDATE OF o`, [offerId,booking.rows[0].category_code]);
    if (!offer.rowCount) throw new Error('Provider not qualified');
    const o=offer.rows[0];
    if (o.user_id!==actorUserId || !o.active || o.qualification_status!=='approved' || (o.qualification_expires_at && new Date(o.qualification_expires_at)<=new Date())) throw new Error('Provider not eligible');
    if (o.status!=='pending' || new Date(o.expires_at)<=new Date()) throw new Error('Offer expired or unavailable');
    if(booking.rows[0].category_code==='personal_assistance') throw new Error('Enhanced screening required');
    const avail = await client.query(`SELECT 1 FROM availability WHERE provider_id=$1 AND starts_at<=$2 AND ends_at>=$3 LIMIT 1`,[o.provider_id,booking.rows[0].starts_at,booking.rows[0].ends_at]);
    if (!avail.rowCount) throw new Error('Provider not available');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[o.provider_id]);
    const clash=await client.query(`SELECT 1 FROM assignments a JOIN bookings b ON b.id=a.booking_id WHERE a.provider_id=$1 AND b.status IN ('confirmed','in_progress') AND b.starts_at<$3 AND b.ends_at>$2 LIMIT 1`,[o.provider_id,booking.rows[0].starts_at,booking.rows[0].ends_at]);
    if (clash.rowCount) throw new Error('Provider already booked');
    await client.query('INSERT INTO assignments(booking_id,provider_id) VALUES ($1,$2)',[bookingId,o.provider_id]);
    await client.query("UPDATE bookings SET status='confirmed' WHERE id=$1",[bookingId]);
    await client.query("UPDATE dispatch_offers SET status=CASE WHEN id=$2 THEN 'accepted' ELSE 'expired' END WHERE booking_id=$1 AND status='pending'",[bookingId,offerId]);
    await client.query('INSERT INTO booking_events(booking_id,actor_user_id,event_type,detail) VALUES($1,$2,$3,$4)',[bookingId,actorUserId,'assigned',JSON.stringify({providerId:o.provider_id})]);
    await client.query('COMMIT');
    return {bookingId,providerId:o.provider_id,status:'confirmed'};
  } catch (e) {await client.query('ROLLBACK');throw e;} finally {client.release();}
}
