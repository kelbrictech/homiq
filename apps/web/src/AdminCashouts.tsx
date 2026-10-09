import {useEffect,useState} from 'react';
type Request={id:string;display_name:string;amount_cents:string;method:string;destination_label:string;status:string;created_at:string;decision_note:string|null};
export default function AdminCashouts({adminKey}:{adminKey:string}){
 const [requests,setRequests]=useState<Request[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[note,setNote]=useState('');
 async function load(){const r=await fetch('/api/dev/admin/cashouts',{headers:{'x-dev-admin-key':adminKey}});const j=await r.json();if(!r.ok)throw new Error(j.error||'Cash-outs unavailable');setRequests(j)}
 useEffect(()=>{setRequests([]);setError('');if(adminKey)void load().catch(e=>setError(e.message))},[adminKey]);
 async function decide(id:string,decision:'approve'|'reject'){setBusy(true);setError('');try{const r=await fetch('/api/dev/admin/cashouts/'+id+'/decision',{method:'POST',headers:{'Content-Type':'application/json','x-dev-admin-key':adminKey},body:JSON.stringify({decision,note})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Decision failed');await load();setNote('')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <section className="panel"><h2>Simulated provider cash-outs</h2><p className="note">Admin decisions update fictional balances only. Approval is not a real payout.</p><button className="secondary-action" disabled={busy||!adminKey} onClick={()=>void load().catch(e=>setError(e.message))}>Refresh cash-outs</button>
 <label>Decision note (optional)<input value={note} maxLength={500} onChange={e=>setNote(e.target.value)}/></label>
 {error&&<p role="alert" className="warning">{error}</p>}
 {requests.map(q=><div className="booking" key={q.id}><strong>{q.display_name} · ₱{(Number(q.amount_cents)/100).toLocaleString('en-PH',{minimumFractionDigits:2})}</strong><p>{q.method.toUpperCase()} · {q.destination_label} · {q.status}</p>{q.status==='pending'&&<div className="offer-actions"><button className="primary" disabled={busy} onClick={()=>decide(q.id,'approve')}>Approve simulated payout</button><button className="secondary-action" disabled={busy} onClick={()=>decide(q.id,'reject')}>Reject & release credits</button></div>}</div>)}
 {!requests.length&&<p className="note">No cash-out requests loaded.</p>}</section>;
}
