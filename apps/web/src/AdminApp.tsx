import {useState} from 'react';
import {BrandAsset} from './VisualAssets';
type Summary={bookings:{status:string;count:number}[];qualifications:{status:string;count:number}[];disputes:{id:string;category_code:string;customer_name:string}[]};
type Qualification={provider_id:string;category_code:string;status:string;display_name:string};
export default function AdminApp(){
 const [key,setKey]=useState(''),[summary,setSummary]=useState<Summary|null>(null),[rows,setRows]=useState<Qualification[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function request<T>(path:string,method='GET',body?:object):Promise<T>{
  const r=await fetch('/api/dev/admin'+path,{method,headers:{'x-dev-admin-key':key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  const j=await r.json();if(!r.ok)throw new Error(j.error||'Admin request failed');return j as T;
 }
 async function refresh(){setBusy(true);setError('');try{const [s,q]=await Promise.all([request<Summary>('/summary'),request<Qualification[]>('/qualifications')]);setSummary(s);setRows(q)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 async function resolve(id:string,outcome:'completed'|'canceled'){setBusy(true);setError('');try{await request('/disputes/'+encodeURIComponent(id)+'/resolve','POST',{outcome});await refresh()}catch(e){setError((e as Error).message);setBusy(false)}}
 async function decide(row:Qualification,status:'approved'|'rejected'|'suspended'){setBusy(true);setError('');try{await request('/qualifications/'+encodeURIComponent(row.provider_id)+'/'+encodeURIComponent(row.category_code),'POST',{status});await refresh()}catch(e){setError((e as Error).message);setBusy(false)}}
 return <div className="app"><header className="top"><BrandAsset/><span className="demo">ADMIN · LOCAL DEV</span></header><main className="content">
 <h1>Operations console</h1><p className="sub">Development-only oversight. Requires a locally configured admin key; this is not production authentication.</p>
 <section className="panel"><label>Local admin key<input type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} placeholder="DEV_ADMIN_KEY"/></label><button className="primary" disabled={!key||busy} onClick={refresh}>{busy?'Loading…':'Load operations'}</button></section>
 {error&&<p className="warning" role="alert">{error}</p>}
 {summary&&<><h2>Bookings</h2><div className="qualification-grid">{summary.bookings.map(b=><div className="qualification" key={b.status}><strong>{b.status}</strong><span>{b.count}</span></div>)}</div>
 <h2>Qualification status</h2><div className="qualification-grid">{summary.qualifications.map(q=><div className="qualification" key={q.status}><strong>{q.status}</strong><span>{q.count}</span></div>)}</div>
 <h2>Disputed bookings</h2>{summary.disputes.length?summary.disputes.map(d=><article className="booking" key={d.id}><strong>{d.category_code}</strong><p>{d.customer_name}</p><small>{d.id}</small><div className="offer-actions"><button className="primary" disabled={busy} onClick={()=>resolve(d.id,'completed')}>Resolve completed</button><button className="secondary-action" disabled={busy} onClick={()=>resolve(d.id,'canceled')}>Resolve canceled</button></div></article>):<p className="sub">No disputes recorded.</p>}
 <h2>Provider qualifications</h2>{rows.map(q=><article className="booking" key={q.provider_id+q.category_code}><div className="row"><strong>{q.display_name}</strong><span className="status">{q.status}</span></div><p>{q.category_code}</p><div className="offer-actions">{q.status!=='approved'&&<button className="primary" disabled={busy} onClick={()=>decide(q,'approved')}>Approve</button>}{q.status!=='rejected'&&<button className="secondary-action" disabled={busy} onClick={()=>decide(q,'rejected')}>Reject</button>}{q.status==='approved'&&<button className="secondary-action" disabled={busy} onClick={()=>decide(q,'suspended')}>Suspend</button>}</div></article>)}</>}
 </main></div>;
}
