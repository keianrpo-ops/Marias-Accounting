
import React, { useMemo, useEffect, useState } from 'react';
import { Heart, Activity, MessageSquare, Camera, ShieldCheck, Dog, Calendar, Clock, Star, Bell, Stethoscope, Info, Package, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Client, PetDetails, Order } from '../types';
import { db } from '../services/supabase';

const ClientPortal: React.FC = () => {
  const { t } = useLanguage();
  const [clientData, setClientData] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
  const loadPortalData = async () => {
    const currentEmail = localStorage.getItem('userEmail') || '';
    const currentName = localStorage.getItem('userName') || 'Client';

    // 1) Intentar encontrar el cliente por email
    const allClients = JSON.parse(localStorage.getItem('mdc_clients') || '[]');
    const matchedClient = allClients.find((c: Client) => (c?.email || '') === currentEmail) || null;

    // 2) Si no existe el cliente en mdc_clients, igual mostramos portal básico
    setClientData(
      matchedClient || ({
        id: 'session-client',
        name: currentName,
        email: currentEmail,
        phone: '',
        addressLine1: '',
        city: '',
        postcode: '',
        pets: [],
        role: undefined as any
      } as Client)
    );

    // 3) Pedidos del usuario logueado (NO del “Oliver”)
    const allOrders = await db.orders.getAll();
    const clientOrders = allOrders.filter((o: Order) => (o?.clientEmail || '') === currentEmail);
    setOrders(clientOrders);

    setUpdates([
      { id: 1, time: '10:30 AM', msg: 'Your pets just arrived and are making new friends!', type: 'info' },
      { id: 2, time: '12:45 PM', msg: 'Care session completed. Buddy shared a pure beef snack.', type: 'food' },
      { id: 3, time: '02:00 PM', msg: 'Photo update: Buddy taking his afternoon nap.', type: 'photo' }
    ]);
  };

  loadPortalData();
  window.addEventListener('storage', loadPortalData as any);
  return () => window.removeEventListener('storage', loadPortalData as any);
}, []);


  if (!clientData) return (
    <div className="h-96 flex items-center justify-center">
        <p className="text-slate-400 font-black uppercase tracking-widest">Loading Member Data...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <span className="px-5 py-1.5 bg-pink-50 text-[#FF6B9D] text-[10px] font-black uppercase rounded-full tracking-[0.3em] border border-pink-100">Daycare Member</span>
             <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">Welcome, <span className="text-[#20B2AA]">{clientData.name.split(' ')[0]}</span></h2>
          <p className="text-slate-500 font-medium italic text-xl">Managing dossiers for {clientData.pets?.length || 0} wonderful pets.</p>
        </div>
        <Link to="/messages" className="bg-[#FF6B9D] text-white px-12 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl flex items-center gap-3 hover:-translate-y-2 transition-all">
          <MessageSquare size={20} /> Open Secure Chat
        </Link>
      </header>

      {/* Pet Dossiers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {(clientData.pets || []).map(pet => (
          <div key={pet.id} className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-100 space-y-10 group hover:border-[#FF6B9D] transition-all">
             <div className="flex justify-between items-start">
                <div className="w-24 h-24 bg-pink-50 text-[#FF6B9D] rounded-[2.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                   <Dog size={50} />
                </div>
                <div className="text-right">
                   <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{pet.name}</h3>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">{pet.breed}</p>
                </div>
             </div>

             <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-50">
                <div className="text-center p-4 bg-slate-50 rounded-3xl">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Age</p>
                   <p className="text-sm font-black text-slate-900">{pet.age}</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-3xl">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Status</p>
                   <p className="text-[10px] font-black text-emerald-500">{pet.isVaccinated ? 'OK' : 'PENDING'}</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-3xl">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Gender</p>
                   <p className="text-[10px] font-black text-slate-900 uppercase">{pet.gender}</p>
                </div>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-slate-900 p-12 rounded-[4rem] text-white shadow-3xl flex flex-col justify-between">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4 text-[#C6FF00]"><Activity size={24}/> Real-time Daily Feed</h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                 <Clock size={16} className="text-slate-400" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Status</span>
              </div>
           </div>
           <div className="space-y-8">
              {updates.map(update => (
                <div key={update.id} className="flex gap-8 group">
                   <div className="text-[10px] font-black text-slate-500 uppercase pt-2 w-16">{update.time}</div>
                   <div className="flex-1 pb-10 border-l border-white/10 pl-10 relative">
                      <div className="absolute -left-1.5 top-2 w-3 h-3 rounded-full bg-[#C6FF00] shadow-[0_0_20px_rgba(198,255,0,0.6)] group-hover:scale-125 transition-transform"></div>
                      <p className="text-slate-200 text-base font-medium leading-relaxed">{update.msg}</p>
                   </div>
                </div>
              ))}
           </div>
           <div className="pt-10 flex items-center justify-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] border-t border-white/5 mt-10">
              <ShieldCheck size={16}/> Secure Member Session
           </div>
        </div>

        {/* Historico de Pedidos Reales */}
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl space-y-8">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
                <Package size={24} className="text-[#20B2AA]"/> My History
            </h3>
            <div className="space-y-4">
                {orders.length === 0 ? (
                    <p className="text-slate-300 italic text-sm py-10">No orders registered yet.</p>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="p-6 bg-slate-50 rounded-3xl border border-transparent hover:border-[#20B2AA]/20 transition-all flex justify-between items-center group">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">{order.date}</p>
                                <p className="text-sm font-black text-slate-900 mt-1">{order.orderNumber}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-slate-900">£{order.total.toFixed(2)}</p>
                                <span className="text-[8px] font-black text-emerald-500 uppercase">{order.status}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <button className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                Download PDF Records <ArrowUpRight size={14}/>
            </button>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
