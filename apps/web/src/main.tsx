import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import ProviderApp from './ProviderApp';
import AdminApp from './AdminApp';
import './style.css';
function Shell(){const [role,setRole]=useState<'customer'|'provider'|'admin'>('customer');return <><div className="role-switch"><button aria-pressed={role==='customer'} onClick={()=>setRole('customer')}>Customer</button><button aria-pressed={role==='provider'} onClick={()=>setRole('provider')}>Provider</button><button aria-pressed={role==='admin'} onClick={()=>setRole('admin')}>Admin (dev)</button></div>{role==='customer'?<App/>:role==='provider'?<ProviderApp onCustomer={()=>setRole('customer')}/>:<AdminApp/>}</>}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Shell/></React.StrictMode>);
