
import React, { useMemo, useEffect, useState } from 'react';
import { Heart, Activity, MessageSquare, Camera, ShieldCheck, Dog, Calendar, Clock, Star, Bell, Stethoscope, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Client, PetDetails } from '../types';

const ClientPortal: React.FC = () => {
  const { t } = useLanguage();
  const [clientData, setClientData] = useState<Client | null>(null);
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    // Simulated active client with multiple pets
    const currentUser: Client = { 
        id: 'cl1',
        name: "Oliver Smith", 
        email: "oliver@example.com",
        phone: "07123 456789",
        addressLine1: "12 Barking Lane",
        city: "London",
        postcode: "E1 1AA",
        role: "client" as any,
        status: 'approved',
        invoicesSent: 2,
        createdAt: new Date().toISOString(),
        pets: [
            {
                id: 'p1',
                name: "Buddy",
                breed: "Golden Retriever",
                age: "2 Years",
                gender: 'male',
                isNeutered: true,
                isVaccinated: true,
                allergies: "Grain sensitive",
                behaviorWithDogs: "Extremely Friendly",
                medicalNotes: "N/A"
            },
            {
                id: 'p2',
                name: "Luna",
                breed: "Cocker Spaniel",
                age: "6 Months",
                gender: 'female',
                isNeutered: false,
                isVaccinated: true,
                allergies: "None",
                behaviorWithDogs: "Playful / Energetic",
                medicalNotes: "Puppy vaccines up to date"
            }
        ]
    };
    setClientData(currentUser);
    
    setUpdates([
      { id: 1, time: '10:30 AM', msg: 'Buddy & Luna just arrived and are making new friends!', type: 'info' },
      { id: 2, time: '12:45 PM', msg: 'Luna finished her puppy lunch. Buddy is sharing a salmon snack.', type: 'food' },
      { id: 3, time: '02:00 PM', msg: 'Photo update: Buddy taking his afternoon nap.', type: 'photo' }
    ]);
  }, []);

  if (!clientData) return null;

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <span className="px-5 py-1.5 bg-pink-50 text-[#FF6B9D] text-[10px] font-black uppercase rounded-full tracking-[0.3em] border border-pink-100">Daycare Member</span>
             <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">Welcome, <span className="text-[#20B2AA]">{clientData.name.split(' ')[0]}</span></h2>
          <p className="text-slate-500 font-medium italic text-xl">Managing dossiers for {clientData.pets.length} wonderful pets.</p>
        </div>
        <Link to="/messages" className="bg-[#FF6B9D] text-white px-12 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl flex items-center gap-3 hover:-translate-y-2 transition-all">
          <MessageSquare size={20} /> Open Secure Chat
        </Link>
      </header>

      {/* Pet Dossiers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {clientData.pets.map(pet => (
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
                   <p className="text-[10px] font-black text-emerald-500">VACCINATED</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-3xl">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Neutered</p>
                   <p className="text-[10px] font-black text-slate-900">{pet.isNeutered ? 'YES' : 'NO'}</p>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex items-center gap-4 text-slate-500">
                   <Activity size={18} className="text-[#20B2AA]" />
                   <p className="text-xs font-bold italic">“{pet.behaviorWithDogs}”</p>
                </div>
                {pet.allergies && (
                  <div className="flex items-center gap-4 text-rose-500">
                    <Stethoscope size={18} />
                    <p className="text-xs font-black uppercase tracking-tight">Allergy Alert: {pet.allergies}</p>
                  </div>
                )}
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-slate-900 p-12 rounded-[4rem] text-white shadow-3xl flex flex-col justify-between">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4 text-[#C6FF00]"><Activity size={24}/> Live Daily Feed</h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                 <Clock size={16} className="text-slate-400" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bristol Node 1</span>
              </div>
           </div>
           <div className="space-y-8">
              {updates.map(update => (
                <div key={update.id} className="flex gap-8 group">
                   <div className="text-[10px] font-black text-slate-500 uppercase pt-2 w-16">{update.time}</div>
                   <div className="flex-1 pb-10 border-l border-white/10 pl-10 relative">
                      <div className="absolute -left-1.5 top-2 w-3 h-3 rounded-full bg-[#C6FF00] shadow-[0_0_20px_rgba(198,255,0,0.6)] group-hover:scale-125 transition-transform"></div>
                      <p className="text-slate-200 text-base font-medium leading-relaxed">{update.msg}</p>
                      {update.type === 'photo' && (
                        <div className="mt-6 flex items-center gap-4 p-4 bg-white/5 rounded-[2rem] border border-white/10 group/photo cursor-pointer hover:bg-white/10 transition-all">
                           <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-teal-400"><Camera size={24} /></div>
                           <span className="text-[11px] font-black uppercase text-slate-300 tracking-widest">Maria shared a photo in chat</span>
                        </div>
                      )}
                   </div>
                </div>
              ))}
           </div>
           <div className="pt-10 flex items-center justify-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] border-t border-white/5 mt-10">
              <ShieldCheck size={16}/> MDC Safety Protocol v5.1
           </div>
        </div>

        {/* Support & Health Column */}
        <div className="space-y-10">
           <div className="bg-[#20B2AA] p-12 rounded-[4rem] text-white shadow-3xl flex flex-col justify-between h-full">
              <div className="space-y-6">
                 <h4 className="text-3xl font-black tracking-tighter uppercase leading-tight">Health <br/>Monitoring</h4>
                 <p className="text-teal-50 opacity-80 font-medium leading-relaxed">Continuous tracking of social interaction and physical welfare.</p>
              </div>
              <div className="space-y-6 mt-12">
                 <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10">
                    <p className="text-[10px] font-black uppercase text-teal-100 tracking-widest mb-2">Energy Index</p>
                    <p className="text-2xl font-black uppercase">Vibrant 🔥</p>
                 </div>
                 <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10">
                    <p className="text-[10px] font-black uppercase text-teal-100 tracking-widest mb-2">Hydration Level</p>
                    <p className="text-2xl font-black uppercase">Optimal 💧</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
