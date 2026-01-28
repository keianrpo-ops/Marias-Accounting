
import React, { useState, useMemo, useEffect } from 'react';
import { 
  UserPlus, Search, Phone, Mail, MapPin, X, ShoppingBag, 
  Plus, Trash2, Dog, User, Globe, Stethoscope, Activity, Heart, ShieldCheck,
  FileText, ArrowRight, Calendar, Info, BadgeCheck, AlertTriangle
} from 'lucide-react';
import { Client, UserRole, PetDetails } from '../types';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form State
  const [clientType, setClientType] = useState<UserRole>(UserRole.CLIENT);
  const [baseData, setBaseData] = useState({
    name: '', email: '', phone: '', addressLine1: '', city: '', postcode: '',
    businessName: '', businessType: 'Retail Store', emergencyContactName: '', emergencyContactPhone: ''
  });

  const [pets, setPets] = useState<PetDetails[]>([
    {
      id: Math.random().toString(36).substr(2, 9),
      name: '', age: '', breed: '', gender: 'male',
      isNeutered: false, isVaccinated: true, allergies: '',
      behaviorWithDogs: '', medicalNotes: ''
    }
  ]);

  useEffect(() => {
    const savedClients = JSON.parse(localStorage.getItem('mdc_clients') || '[]');
    const savedPending = JSON.parse(localStorage.getItem('mdc_pending_requests') || '[]');
    setClients(savedClients);
    setPendingRequests(savedPending);
  }, []);

  const handleApprove = (client: Client) => {
    const approvedClient = { ...client, status: 'approved' as const };
    const updatedClients = [...clients, approvedClient];
    const updatedPending = pendingRequests.filter(c => c.id !== client.id);
    setClients(updatedClients);
    setPendingRequests(updatedPending);
    localStorage.setItem('mdc_clients', JSON.stringify(updatedClients));
    localStorage.setItem('mdc_pending_requests', JSON.stringify(updatedPending));
  };

  const handleReject = (id: string) => {
    if (confirm('¿Desea rechazar esta solicitud?')) {
      const updatedPending = pendingRequests.filter(c => c.id !== id);
      setPendingRequests(updatedPending);
      localStorage.setItem('mdc_pending_requests', JSON.stringify(updatedPending));
    }
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    const client: Client = {
      id: Math.random().toString(36).substr(2, 9),
      status: 'approved',
      invoicesSent: 0,
      createdAt: new Date().toISOString(),
      role: clientType,
      ...baseData,
      pets: clientType === UserRole.CLIENT ? pets : []
    } as Client;

    const updated = [...clients, client];
    setClients(updated);
    localStorage.setItem('mdc_clients', JSON.stringify(updated));
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setBaseData({ name: '', email: '', phone: '', addressLine1: '', city: '', postcode: '', businessName: '', businessType: 'Retail Store', emergencyContactName: '', emergencyContactPhone: '' });
    setPets([{ id: Math.random().toString(36).substr(2, 9), name: '', age: '', breed: '', gender: 'male', isNeutered: false, isVaccinated: true, allergies: '', behaviorWithDogs: '', medicalNotes: '' }]);
  };

  const startSale = (client: Client) => {
    navigate('/invoices/new', { state: { client } });
  };

  const filteredClients = useMemo(() => {
    const source = activeTab === 'approved' ? clients : pendingRequests;
    return source.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.businessName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [clients, pendingRequests, activeTab, search]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">CRM <span className="text-[#20B2AA]">Audit</span></h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Managing {clients.length} Approved & {pendingRequests.length} Pending</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white p-1.5 rounded-full border border-slate-200 flex shadow-sm">
              <button onClick={() => setActiveTab('approved')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'approved' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Approved</button>
              <button onClick={() => setActiveTab('pending')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'pending' ? 'bg-[#FF6B9D] text-white shadow-lg' : 'text-slate-400'}`}>
                Queue
                {pendingRequests.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white">{pendingRequests.length}</span>}
              </button>
           </div>
           <button onClick={() => setIsModalOpen(true)} className="bg-[#20B2AA] text-white px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 transition-all">
             <UserPlus size={16} /> Register Client
           </button>
        </div>
      </header>

      <div className="bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center px-8 focus-within:ring-4 focus-within:ring-teal-50 transition-all">
        <Search className="text-slate-300" size={18} />
        <input className="flex-1 p-4 bg-transparent outline-none text-xs font-bold uppercase tracking-widest" placeholder="Search by name, business or dossier content..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center font-black text-2xl shadow-inner ${client.role === UserRole.DISTRIBUTOR ? 'bg-teal-50 text-[#20B2AA]' : 'bg-pink-50 text-[#FF6B9D]'}`}>
                  {client.name.charAt(0)}
                </div>
                {activeTab === 'approved' && (
                  <button onClick={() => startSale(client)} className="p-4 bg-slate-900 text-[#C6FF00] rounded-2xl shadow-xl hover:scale-110 transition-transform group/sale relative">
                    <ShoppingBag size={20} />
                    <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover/sale:opacity-100 transition-opacity whitespace-nowrap">START SALE</span>
                  </button>
                )}
              </div>

              <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none truncate">{client.businessName || client.name}</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{client.role === UserRole.DISTRIBUTOR ? 'Wholesale Partner' : 'Daycare Owner'}</p>

              <div className="mt-8 space-y-3 opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase"><Mail size={16} className="text-slate-300"/> {client.email}</div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase"><Phone size={16} className="text-slate-300"/> {client.phone}</div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase"><MapPin size={16} className="text-slate-300"/> {client.postcode}</div>
              </div>
            </div>

            {activeTab === 'pending' ? (
              <div className="flex gap-4 mt-10 pt-8 border-t border-slate-50">
                <button onClick={() => handleApprove(client)} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#20B2AA] transition-all shadow-xl">Approve</button>
                <button onClick={() => handleReject(client.id)} className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all">Reject</button>
              </div>
            ) : (
              <button onClick={() => setSelectedClient(client)} className="w-full mt-10 pt-8 border-t border-slate-50 text-[10px] font-black text-[#20B2AA] uppercase tracking-widest hover:underline transition-all text-center flex items-center justify-center gap-2">
                <FileText size={14}/> Open Full Dossier
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Manual Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-4xl rounded-[4rem] p-12 shadow-3xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar border border-white">
              <div className="flex justify-between items-start mb-10">
                 <div>
                    <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Manual <span className="text-[#20B2AA]">Registration</span></h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Official Admin Dossier Creation v5.0</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"><X size={24}/></button>
              </div>

              <form onSubmit={handleAddClient} className="space-y-16">
                 {/* Role Switcher */}
                 <div className="bg-slate-50 p-3 rounded-full flex shadow-inner border border-slate-100 max-w-md mx-auto">
                    <button type="button" onClick={() => setClientType(UserRole.DISTRIBUTOR)} className={`flex-1 py-4 rounded-full text-[12px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${clientType === UserRole.DISTRIBUTOR ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400'}`}>
                      <ShoppingBag size={18}/> Wholesale
                    </button>
                    <button type="button" onClick={() => setClientType(UserRole.CLIENT)} className={`flex-1 py-4 rounded-full text-[12px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${clientType === UserRole.CLIENT ? 'bg-[#FF6B9D] text-white shadow-2xl' : 'text-slate-400'}`}>
                      <Heart size={18}/> Pet Owner
                    </button>
                 </div>

                 <div className="space-y-10">
                    <SectionTitle icon={User} title="Identity & Contacts" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <InputField label="Full Contact Name" value={baseData.name} onChange={(v: string) => setBaseData({...baseData, name: v})} />
                        <InputField label="Email Address" type="email" value={baseData.email} onChange={(v: string) => setBaseData({...baseData, email: v})} />
                        <InputField label="Primary Phone" value={baseData.phone} onChange={(v: string) => setBaseData({...baseData, phone: v})} />
                    </div>
                 </div>

                 <div className="space-y-10">
                    <SectionTitle icon={Globe} title="Location Details" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="md:col-span-2"><InputField label="Address Line 1" value={baseData.addressLine1} onChange={(v: string) => setBaseData({...baseData, addressLine1: v})} /></div>
                       <InputField label="City" value={baseData.city} onChange={(v: string) => setBaseData({...baseData, city: v})} />
                       <InputField label="Postcode" value={baseData.postcode} onChange={(v: string) => setBaseData({...baseData, postcode: v})} />
                    </div>
                 </div>

                 {clientType === UserRole.CLIENT && (
                   <div className="space-y-12">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                        <SectionTitle icon={Dog} title="Pet Professional Dossier" />
                        <button type="button" onClick={() => pets.length < 2 && setPets([...pets, { id: Math.random().toString(36).substr(2, 9), name: '', age: '', breed: '', gender: 'male', isNeutered: false, isVaccinated: true, allergies: '', behaviorWithDogs: '', medicalNotes: '' }])} className="bg-[#FF6B9D] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl flex items-center gap-2">
                           <Plus size={18}/> Add Pet
                        </button>
                      </div>
                      {pets.map((pet, idx) => (
                        <div key={pet.id} className="p-10 bg-slate-50/50 rounded-[3.5rem] border border-slate-200 space-y-10 relative">
                           {pets.length > 1 && <button type="button" onClick={() => setPets(pets.filter(p => p.id !== pet.id))} className="absolute top-8 right-8 text-rose-500"><Trash2 size={20}/></button>}
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                              <InputField label="Pet Name" value={pet.name} onChange={(v: string) => setPets(pets.map(p => p.id === pet.id ? {...p, name: v} : p))} />
                              <InputField label="Age" value={pet.age} onChange={(v: string) => setPets(pets.map(p => p.id === pet.id ? {...p, age: v} : p))} />
                              <InputField label="Breed" value={pet.breed} onChange={(v: string) => setPets(pets.map(p => p.id === pet.id ? {...p, breed: v} : p))} />
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Gender</label>
                                <div className="bg-white p-2 rounded-full flex shadow-sm border border-slate-100">
                                   <button type="button" onClick={() => setPets(pets.map(p => p.id === pet.id ? {...p, gender: 'male' as const} : p))} className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase transition-all ${pet.gender === 'male' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Male</button>
                                   <button type="button" onClick={() => setPets(pets.map(p => p.id === pet.id ? {...p, gender: 'female' as const} : p))} className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase transition-all ${pet.gender === 'female' ? 'bg-[#FF6B9D] text-white' : 'text-slate-400'}`}>Female</button>
                                </div>
                              </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-200">
                              <div className="space-y-4">
                                 <Checkbox label="Vaccinations Verified" checked={pet.isVaccinated} onChange={(v: boolean) => setPets(pets.map(p => p.id === pet.id ? {...p, isVaccinated: v} : p))} />
                                 <Checkbox label="Spayed / Neutered" checked={pet.isNeutered} onChange={(v: boolean) => setPets(pets.map(p => p.id === pet.id ? {...p, isNeutered: v} : p))} />
                              </div>
                              <select className="w-full px-8 py-5 bg-white rounded-[2rem] border border-slate-200 font-bold outline-none" value={pet.behaviorWithDogs} onChange={e => setPets(pets.map(p => p.id === pet.id ? {...p, behaviorWithDogs: e.target.value} : p))}>
                                 <option value="">Behavior...</option>
                                 <option>Friendly</option><option>Selective</option><option>Shy</option>
                              </select>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}

                 <button className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[12px] shadow-3xl hover:bg-[#20B2AA] transition-all">Submit Approved Record</button>
              </form>
           </div>
        </div>
      )}

      {/* Selected Client Dossier Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
           <div className="bg-white w-full max-w-5xl rounded-[4rem] shadow-3xl animate-in zoom-in-95 overflow-hidden border border-white flex flex-col max-h-[90vh]">
              <div className="bg-slate-900 p-12 flex justify-between items-center text-white shrink-0">
                 <div className="flex items-center gap-8">
                    <div className="w-24 h-24 bg-[#20B2AA] rounded-[2.5rem] flex items-center justify-center shadow-2xl">
                       <User size={48} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.5em] mb-3">Master Dossier Record</p>
                       <h3 className="text-5xl font-black tracking-tighter uppercase">{selectedClient.businessName || selectedClient.name}</h3>
                    </div>
                 </div>
                 <button onClick={() => setSelectedClient(null)} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><X size={28}/></button>
              </div>

              <div className="p-12 overflow-y-auto no-scrollbar grid grid-cols-1 lg:grid-cols-3 gap-12">
                 <div className="space-y-10 lg:border-r lg:border-slate-100 lg:pr-12">
                    <SectionTitle icon={Globe} title="Location & Contact" dark />
                    <div className="space-y-6">
                       <InfoItem label="Email" value={selectedClient.email} icon={Mail} />
                       <InfoItem label="Phone" value={selectedClient.phone} icon={Phone} />
                       <InfoItem label="Address" value={`${selectedClient.addressLine1}, ${selectedClient.city}`} icon={MapPin} />
                       <InfoItem label="Postcode" value={selectedClient.postcode} icon={ShieldCheck} />
                    </div>
                    <button onClick={() => startSale(selectedClient)} className="w-full bg-[#20B2AA] text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all">
                       <ShoppingBag size={20}/> New Sale Record
                    </button>
                 </div>

                 <div className="lg:col-span-2 space-y-10">
                    <SectionTitle icon={Dog} title="Pet Assets & Medical Dossier" dark />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {selectedClient.pets && selectedClient.pets.length > 0 ? selectedClient.pets.map(pet => (
                         <div key={pet.id} className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 space-y-8">
                            <div className="flex justify-between items-center">
                               <h5 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{pet.name}</h5>
                               <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${pet.gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>{pet.gender}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                               <DossierBadge label="Breed" value={pet.breed} />
                               <DossierBadge label="Age" value={pet.age} />
                            </div>
                            <div className="pt-6 border-t border-slate-200 space-y-4">
                               <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-slate-400 uppercase">Vaccines</span>
                                  {pet.isVaccinated ? <BadgeCheck className="text-emerald-500" size={20}/> : <AlertTriangle className="text-rose-500" size={20}/>}
                               </div>
                               <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-slate-400 uppercase">Neutered/Spayed</span>
                                  <span className="text-[10px] font-black">{pet.isNeutered ? 'YES ✅' : 'NO ⚠️'}</span>
                               </div>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-slate-100">
                               <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2"><Activity size={12}/> Behavior</p>
                               <p className="text-xs font-bold text-slate-600">"{pet.behaviorWithDogs || 'No notes'}"</p>
                            </div>
                            {pet.allergies && (
                              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                 <p className="text-[9px] font-black text-rose-400 uppercase mb-2 flex items-center gap-2"><Stethoscope size={12}/> Allergy Alert</p>
                                 <p className="text-xs font-black text-rose-600">{pet.allergies}</p>
                              </div>
                            )}
                         </div>
                       )) : (
                         <div className="col-span-2 py-20 bg-slate-50 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                            <ShoppingBag className="mx-auto text-slate-200 mb-4" size={48} />
                            <p className="font-black text-slate-300 uppercase tracking-widest text-xs">No Pet Data Registered for B2B Partner</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title, dark }: any) => (
  <div className={`flex items-center gap-4 border-b pb-6 ${dark ? 'border-slate-100' : 'border-slate-100'}`}>
     <Icon size={22} className="text-[#20B2AA]" />
     <h4 className={`text-2xl font-black uppercase tracking-tight ${dark ? 'text-slate-900' : 'text-slate-900'}`}>{title}</h4>
  </div>
);

const InputField = ({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (v: string) => void, type?: string }) => (
  <div className="space-y-2 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label>
    <input required type={type} className="w-full px-6 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all shadow-inner" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

const Checkbox = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-4 cursor-pointer group">
     <input type="checkbox" className="w-6 h-6 rounded-lg accent-[#20B2AA]" checked={checked} onChange={e => onChange(e.target.checked)} />
     <span className="text-[12px] font-black uppercase text-slate-700">{label}</span>
  </label>
);

const InfoItem = ({ label, value, icon: Icon }: any) => (
  <div className="flex items-start gap-4">
     <div className="p-3 bg-slate-50 rounded-xl text-slate-400"><Icon size={18}/></div>
     <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value}</p>
     </div>
  </div>
);

const DossierBadge = ({ label, value }: any) => (
  <div className="text-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
     <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{label}</p>
     <p className="text-sm font-black text-slate-900">{value || 'N/A'}</p>
  </div>
);

export default Clients;
