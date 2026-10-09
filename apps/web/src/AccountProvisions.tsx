import {useState} from 'react';
export default function AccountProvisions(){
 const [view,setView]=useState<'menu'|'register'|'terms'|'privacy'|'topup'>('menu');
 const [role,setRole]=useState<'customer'|'provider'>('customer');
 const [ack,setAck]=useState(false);
 const legal={terms:'/legal/terms',privacy:'/legal/privacy'};
 return <section className="panel" aria-label="Account and billing provisions">
 <h2>Account & billing</h2>
 {view!=='menu'&&<button className="back" onClick={()=>setView('menu')}>← Account menu</button>}
 {view==='menu'&&<div className="account-actions">
 <button className="secondary-action" onClick={()=>setView('register')}>Create an account</button>
 <button className="secondary-action" onClick={()=>setView('topup')}>Top up wallet · Coming soon</button>
 <button className="secondary-action" onClick={()=>setView('terms')}>Terms of Service</button>
 <button className="secondary-action" onClick={()=>setView('privacy')}>Privacy Policy</button>
 </div>}
 {view==='register'&&<div><h3>Create an account</h3><p className="note">Registration preview only. Secure sign-up and identity verification are not enabled. Do not submit personal details yet.</p><label>Account type<select value={role} onChange={e=>setRole(e.target.value as 'customer'|'provider')}><option value="customer">Customer</option><option value="provider">Service provider</option></select></label><label><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/> I have read the draft Terms of Service and Privacy Policy</label><p className="note">Selected: {role}. This preview does not create an account or record consent.</p><button className="primary" disabled>Registration opens after secure authentication is implemented</button></div>}
 {view==='topup'&&<div><h3>Wallet top-up</h3><p className="note">Coming soon. GCash, Maya and other methods are planned but not connected. No deposits are accepted, and this screen cannot change wallet balances.</p><button className="primary" disabled>Top-up unavailable</button></div>}
 {(view==='terms'||view==='privacy')&&<div><h3>{view==='terms'?'Terms of Service':'Privacy Policy'}</h3><p className="note">Draft for Philippine legal review. Not yet an operative public policy.</p><a href={legal[view]} target="_blank" rel="noreferrer">Open full draft document ↗</a></div>}
 </section>;
}
