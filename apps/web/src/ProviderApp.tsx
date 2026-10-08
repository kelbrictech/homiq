import {useEffect,useState} from 'react';
import {BrandAsset} from './VisualAssets';
type Account={id:string;display_name:string};
type Offer={id:string;booking_id:string;status:string;expires_at:string;category_code:string;starts_at:string;address_text:string};
type Qualification={category_code:string;status:string;expires_at:string|null};
const names:Record<string,string>={repairs:'Repairs',cleaning:'Cleaning',maintenance:'Maintenance',outdoor:'Outdoor',moving_delivery:'Moving & Delivery',personal_assistance:'Personal Assistance'};
async function api<T>(path:string,id?:string,method='GET'):Promise<T>{
 const r=await fetch('/api'+path,{method,headers:id?{'x-dev-user-id':id}:{}});
 const json=await r.json();if(!r.ok)throw new Error(typeof json.error==='string'?json.error:'Request failed');return json as T;
}
export default function ProviderApp({onCustomer}:{onCustomer:()=>void}){
 const [accounts,setAccounts]=useState<Account[]>([]),[actor,setActor]=useState('');
 const [offers,setOffers]=useState<Offer[]>([]),[skills,setSkills]=useState<Qualification[]>([]);
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{api<Account[]>('/dev/providers').then(a=>{setAccounts(a);setActor(a[0]?.id||'')}).catch(e=>setMessage(e.message))},[]);
 async function refresh(id:string){try{const [o,s]=await Promise.all([api<Offer[]>('/dev/offers',id),api<Qualification[]>('/dev/qualifications',id)]);setOffers(o);setSkills(s)}catch(e){setMessage((e as Error).message)}}
 useEffect(()=>{if(actor)void refresh(actor)},[actor]);
 async function accept(id:string){setBusy(true);setMessage('');try{await api('/offers/'+id+'/accept',actor,'POST');setMessage('Offer accepted. Booking confirmed.');await refresh(actor)}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 async function decline(id:string){setBusy(true);setMessage('');try{await api('/dev/offers/'+id+'/decline',actor,'POST');setMessage('Offer declined.');await refresh(actor)}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 return <div className="app"><header className="top"><BrandAsset/><span className="demo">PROVIDER · DEV</span></header><main className="content">
 <button className="back" onClick={onCustomer}>← Customer view</button><h1>Provider workspace</h1><p className="sub">Manage verified skills and incoming jobs.</p>
 <section className="panel"><label>Demo provider<select value={actor} onChange={e=>setActor(e.target.value)}>{accounts.map(a=><option key={a.id} value={a.id}>{a.display_name}</option>)}</select></label></section>
 <h2>Qualifications</h2><div className="qualification-grid">{skills.length?skills.map(s=><div className="qualification" key={s.category_code}><strong>{names[s.category_code]||s.category_code}</strong><span className={'qualification-state '+s.status}>{s.status}</span></div>):<p className="sub">No category qualifications found.</p>}</div>
 <h2>Job offers</h2>{message&&<p role="status" className="warning">{message}</p>}
 {offers.length?offers.map(o=><article className="booking" key={o.id}><div className="row"><strong>{names[o.category_code]||o.category_code}</strong><span className="status">{o.status}</span></div><p>Scheduled: {new Date(o.starts_at).toLocaleString()}</p><p>Address: {o.address_text}</p><p>Offer expires: {new Date(o.expires_at).toLocaleString()}</p>{o.status==='pending'&&<div className="offer-actions"><button disabled={busy||new Date(o.expires_at)<=new Date()} className="primary" onClick={()=>accept(o.id)}>Accept job</button><button disabled={busy||new Date(o.expires_at)<=new Date()} className="secondary-action" onClick={()=>decline(o.id)}>Decline</button></div>}</article>):<div className="empty"><h2>No offers</h2><p>Eligible jobs will appear here when the dispatch engine creates offers.</p></div>}
 <p className="note">Development account selector only. This interface must not be publicly deployed without authentication and authorization.</p>
 </main></div>;
}
