import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import ProviderApp from './ProviderApp';
import './style.css';
function Shell(){const [role,setRole]=useState<'customer'|'provider'>('customer');return <><div className="role-switch"><button aria-pressed={role==='customer'} onClick={()=>setRole('customer')}>Customer</button><button aria-pressed={role==='provider'} onClick={()=>setRole('provider')}>Provider</button></div>{role==='customer'?<App/>:<ProviderApp onCustomer={()=>setRole('customer')}/>}</>}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Shell/></React.StrictMode>);
