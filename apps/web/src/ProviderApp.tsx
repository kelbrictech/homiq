import {useEffect,useState} from 'react';
import {BrandAsset} from './VisualAssets';
type Account={id:string;display_name:string};
type Offer={id:string;booking_id:string;status:string;expires_at:string;category_code:string;starts_at:string;address_text:string;intake:Record<string,unknown>};
type Job={id:string;category_code:string;status:string;starts_at:string;address_text:string};
type Qualification={category_code:string;status:string;expires_at:string|null};
const names:Record<string,string>={repairs:'Repairs',cleaning:'Cleaning',maintenance:'Maintenance',outdoor:'Outdoor',moving_delivery:'Moving & Delivery',personal_assistance:'Personal Assistance'};
async function api<T>(path:string,id?:string,method='GET'):Promise<T>{
 const r=await fetch('/api'+path,{method,headers:id?{'x-dev-user-id':id}:{}});
 const json=await r.json();if(!r.ok)throw new Error(typeof json.error==='string'?json.error:'Request failed');return json as T;
}
export default function ProviderApp({onCustomer}:{onCustomer:()=>void}){
 const [accounts,setAccounts]=useState<Account[]>([]),[actor,setActor]=useState('');
 const [offers,setOffers]=useState<Offer[]>([]),[skills,setSkills]=useState<Qualification[]>([]),[jobs,setJobs]=useState<Job[]>([]);
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[selected,setSelected]=useState<string|null>(null),[events,setEvents]=useState<{event_type:string;created_at:string}[]>([]);
 useEffect(()=>{api<Account[]>('/dev/providers').then(a=>{setAccounts(a);setActor(a[0]?.id||'')}).catch(e=>setMessage(e.message))},[]);
 async function refresh(id:string){try{const [o,s,j]=await Promise.all([api<Offer[]>('/provider/offers',id),api<Qualification[]>('/provider/qualifications',id),api<Job[]>('/provider/jobs',id)]);setOffers(o);setSkills(s);setJobs(j)}catch(e){setMessage((e as Error).message)}}
 useEffect(()=>{if(actor)void refresh(actor)},[actor]);
 async function accept(id:string){setBusy(true);setMessage('');try{await api('/offers/'+id+'/accept',actor,'POST');setMessage('Offer accepted. Booking confirmed.');await refresh(actor)}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 async function decline(id:string){setBusy(true);setMessage('');try{await api('/provider/offers/'+id+'/decline',actor,'POST');setMessage('Offer declined.');await refresh(actor)}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 async function viewActivity(id:string){setSelected(id);try{setEvents(await api<{event_type:string;created_at:string}[]>('/bookings/'+id+'/events',actor))}catch(e){setMessage((e as Error).message)}}
 async function transition(id:string,action:'start'|'complete'|'dispute'){setBusy(true);setMessage('');try{await fetch('/api/bookings/'+id+'/transition',{method:'POST',headers:{'Content-Type':'application/json','x-dev-user-id':actor},body:JSON.stringify({action})}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||'Transition failed')});setMessage('Job updated.');await refresh(actor)}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 return <div className="app"><header className="top"><BrandAsset/><span className="demo">PROVIDER · DEV</span></header><main className="content">
 <button className="back" onClick={onCustomer}>← Customer view</button><h1>Provider workspace</h1><p className="sub">Manage verified skills and incoming jobs.</p>
 <section className="panel"><label>Demo provider<select value={actor} onChange={e=>setActor(e.target.value)}>{accounts.map(a=><option key={a.id} value={a.id}>{a.display_name}</option>)}</select></label></section>
 <h2>Qualifications</h2><div className="qualification-grid">{skills.length?skills.map(s=><div className="qualification" key={s.category_code}><strong>{names[s.category_code]||s.category_code}</strong><span className={'qualification-state '+s.status}>{s.status}</span></div>):<p className="sub">No category qualifications found.</p>}</div>
 <h2>Assigned jobs</h2>{jobs.length?jobs.map(j=><article className="booking" key={j.id}><div className="row"><strong>{names[j.category_code]||j.category_code}</strong><span className="status">{j.status}</span></div><p>{new Date(j.starts_at).toLocaleString()}</p><p>{j.address_text}</p><button className="secondary-action" onClick={()=>viewActivity(j.id)}>View activity</button>{selected===j.id&&<section className="activity"><h3>Job activity</h3>{events.map((e,i)=><p key={i}>{e.event_type.replaceAll('_',' ')} · {new Date(e.created_at).toLocaleString()}</p>)}</section>}<div className="offer-actions">{j.status==='confirmed'&&<button className="primary" disabled={busy} onClick={()=>transition(j.id,'start')}>Start job</button>}{j.status==='in_progress'&&<button className="primary" disabled={busy} onClick={()=>transition(j.id,'complete')}>Complete job</button>}{['confirmed','in_progress','completed'].includes(j.status)&&<button className="secondary-action" disabled={busy} onClick={()=>transition(j.id,'dispute')}>Raise dispute</button>}</div></article>):<p className="sub">No assigned jobs yet.</p>}
 <h2>Job offers</h2>{message&&<p role="status" className="warning">{message}</p>}
 {offers.length?offers.map(o=><article className="booking" key={o.id}><div className="row"><strong>{names[o.category_code]||o.category_code}</strong><span className="status">{o.status}</span></div><p>Scheduled: {new Date(o.starts_at).toLocaleString()}</p><p>Area: {o.address_text||'Shared after assignment'}</p><p>Job details: {Object.entries(o.intake||{}).map(([k,v])=>`${k}: ${String(v)}`).join(' · ')}</p><p>Offer expires: {new Date(o.expires_at).toLocaleString()}</p>{o.status==='pending'&&<div className="offer-actions"><button disabled={busy||new Date(o.expires_at)<=new Date()} className="primary" onClick={()=>accept(o.id)}>Accept job</button><button disabled={busy||new Date(o.expires_at)<=new Date()} className="secondary-action" onClick={()=>decline(o.id)}>Decline</button></div>}</article>):<div className="empty"><h2>No offers</h2><p>Eligible jobs will appear here when the dispatch engine creates offers.</p></div>}
 <p className="note">Development account selector only. This interface must not be publicly deployed without authentication and authorization.</p>
 </main></div>;
}
