import {useEffect,useState} from 'react';
type Request={id:string;amount_cents:string;method:string;destination_label:string;status:string;created_at:string;decision_note:string|null};
export default function ProviderCashout({actor,onBalanceChange}:{actor:string;onBalanceChange:()=>Promise<void>}){
 const [requests,setRequests]=useState<Request[]>([]),[amount,setAmount]=useState(''),[method,setMethod]=useState('gcash'),[destination,setDestination]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(id:string){const response=await fetch('/api/provider/cashouts',{headers:{'x-dev-user-id':id}});if(!response.ok)throw new Error('Cash-out history unavailable');setRequests(await response.json())}
 useEffect(()=>{setRequests([]);setError('');setAmount('');setDestination('');if(actor)void load(actor).catch(e=>setError(e.message))},[actor]);
 async function submit(){setBusy(true);setError('');try{
  const cents=Math.round(Number(amount)*100);
  if(!Number.isSafeInteger(cents)||cents<100)throw new Error('Enter at least ₱1');
  if(destination.trim().length<2)throw new Error('Enter a destination label for this simulation');
  const response=await fetch('/api/provider/cashouts',{method:'POST',headers:{'Content-Type':'application/json','x-dev-user-id':actor},body:JSON.stringify({amountCents:cents,method,destinationLabel:destination.trim()})});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Request failed');
  setAmount('');setDestination('');await load(actor);await onBalanceChange();
 }catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <section className="panel" aria-label="Fictional provider cash out">
  <h2>Cash out · Simulation</h2><p className="note">Demo credits only. No GCash, Maya or bank transfer will occur. Requests reserve credits until an admin approves or rejects them.</p>
  <label>Amount in PHP<input type="number" min="1" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
  <label>Test payout method<select value={method} onChange={e=>setMethod(e.target.value)}><option value="gcash">GCash (test only)</option><option value="maya">Maya (test only)</option><option value="bank">Bank transfer (test only)</option></select></label>
  <label>Destination nickname (no real account numbers)<input value={destination} maxLength={120} onChange={e=>setDestination(e.target.value)} placeholder="e.g. My test GCash"/></label>
  <button className="primary" disabled={busy||!actor} onClick={submit}>{busy?'Submitting…':'Request simulated cash out'}</button>
  {error&&<p className="warning" role="alert">{error}</p>}
  <h3>Cash-out history</h3>{requests.length?requests.map(q=><div className="booking" key={q.id}><strong>₱{(Number(q.amount_cents)/100).toLocaleString('en-PH',{minimumFractionDigits:2})}</strong><p>{q.method.toUpperCase()} · {q.destination_label} · {q.status}</p><small>{new Date(q.created_at).toLocaleString()}</small>{q.decision_note&&<p>{q.decision_note}</p>}</div>):<p className="note">No simulated cash-out requests yet.</p>}
 </section>;
}
