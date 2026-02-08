import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, Phone, Mail, MapPin, X, ShoppingBag, 
  Trash2, Dog, User, Globe, Stethoscope, ShieldCheck,
  Edit, CheckCircle, Lock, Eye, EyeOff
} from 'lucide-react';
import { Client, UserRole, PetDetails } from '../types';
import { supabase } from '../services/supabase';

const Clients: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Estado para visibilidad de contraseña
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [clientType, setClientType] = useState<UserRole>(UserRole.CLIENT);
  const [baseData, setBaseData] = useState({
    id: '', 
    name: '', email: '', phone: '', addressLine1: '', city: '', postcode: '',
    businessName: '', businessType: 'Retail Store', emergencyContactName: '', emergencyContactPhone: '',
    vetInfo: '', visible_password: '' 
  });

  const [pets, setPets] = useState<PetDetails[]>([]);

  // Cargar datos al inicio
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    // 1. Intentar cargar de Supabase
    if (supabase) {
      const { data, error } = await supabase.from('clients').select('*');
      
      if (!error && data) {
        // --- CORRECCIÓN: LIMPIEZA DE DATOS (Sanitization) ---
        // Rellenamos los nulls con valores por defecto para evitar caídas
        const sanitizedData: Client[] = data.map((item: any) => ({
             ...item,
             name: item.name || 'Sin Nombre',
             email: item.email || '',
             role: item.role || UserRole.CLIENT, // Si es null, lo tratamos como cliente
             status: item.status || 'pending',
             pets: item.pets || [], // Array vacío si es null
             businessName: item.businessName || '',
             visible_password: item.visible_password || ''
        }));

        const approved = sanitizedData.filter(c => c.status === 'approved');
        const pending = sanitizedData.filter(c => c.status === 'pending');
        
        setClients(approved);
        setPendingRequests(pending);
        return; 
      }
    }

    // 2. Fallback a LocalStorage
    const localClients = JSON.parse(localStorage.getItem('mdc_clients') || '[]');
    const localPending = JSON.parse(localStorage.getItem('mdc_pending_requests') || '[]');
    setClients(localClients);
    setPendingRequests(localPending);
  };

  const handleEdit = (client: Client) => {
    setBaseData({
      id: client.id,
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      addressLine1: client.addressLine1 || '',
      city: client.city || '',
      postcode: client.postcode || '',
      businessName: client.businessName || '',
      businessType: client.businessType || 'Retail Store',
      emergencyContactName: client.emergencyContactName || '',
      emergencyContactPhone: client.emergencyContactPhone || '',
      vetInfo: client.vetInfo || '',
      visible_password: client.visible_password || '' 
    });
    setClientType(client.role || UserRole.CLIENT);
    setPets(client.pets || []); // Protección contra null
    setIsModalOpen(true);
    setShowPassword(false);
  };

  const handleAddNew = () => {
    setBaseData({
      id: '',
      name: '', email: '', phone: '', addressLine1: '', city: '', postcode: '',
      businessName: '', businessType: 'Retail Store', emergencyContactName: '', emergencyContactPhone: '',
      vetInfo: '', visible_password: ''
    });
    setClientType(UserRole.CLIENT);
    setPets([]);
    setIsModalOpen(true);
    setShowPassword(false);
  };

  const handleSaveClient = async () => {
    const isEditing = !!baseData.id;
    const newId = isEditing ? baseData.id : Math.random().toString(36).substr(2, 9);
    
    const clientPayload: Client = {
      id: newId,
      createdAt: new Date().toISOString(),
      status: 'approved',
      invoicesSent: 0,
      role: clientType,
      name: baseData.name || 'Nuevo Cliente', // Evitar guardar nombres vacíos
      email: baseData.email,
      phone: baseData.phone,
      addressLine1: baseData.addressLine1,
      city: baseData.city,
      postcode: baseData.postcode,
      businessName: clientType === UserRole.DISTRIBUTOR ? baseData.businessName : undefined,
      businessType: clientType === UserRole.DISTRIBUTOR ? baseData.businessType : undefined,
      emergencyContactName: baseData.emergencyContactName,
      emergencyContactPhone: baseData.emergencyContactPhone,
      vetInfo: baseData.vetInfo,
      pets: pets || [],
      visible_password: baseData.visible_password 
    };

    if (supabase) {
      if (isEditing) {
        await supabase.from('clients').update(clientPayload).eq('id', newId);
      } else {
        await supabase.from('clients').insert([clientPayload]);
      }
    }

    if (isEditing) {
       setClients(prev => prev.map(c => c.id === newId ? clientPayload : c));
       // Actualizar vista detallada si está seleccionada
       if (selectedClient?.id === newId) setSelectedClient(clientPayload);
    } else {
       setClients(prev => [...prev, clientPayload]);
    }

    setIsModalOpen(false);
    fetchClients();
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm('Are you sure?')) return;
    
    if (supabase) {
      await supabase.from('clients').delete().eq('id', id);
    }
    
    setClients(clients.filter(c => c.id !== id));
    setPendingRequests(pendingRequests.filter(c => c.id !== id));
    setSelectedClient(null);
  };

  const approveRequest = async (request: Client) => {
    const approvedClient: Client = { ...request, status: 'approved' };
    
    if (supabase) {
      await supabase.from('clients').update({ status: 'approved' }).eq('id', request.id);
    }

    setClients([...clients, approvedClient]);
    setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
  };

  // --- CORRECCIÓN: FILTRADO SEGURO ---
  // Usamos (variable || '') antes de .toLowerCase() para que no rompa si es null
  const filteredClients = clients.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.businessName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">
            {activeTab === 'approved' ? 'Client Database' : 'New Applications'}
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            {activeTab === 'approved' ? 'Manage Relationships & Data' : 'Review & Approve Access'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-white p-2 rounded-full shadow-sm flex gap-2">
              <button onClick={() => setActiveTab('approved')} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'approved' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                 Active Database
              </button>
              <button onClick={() => setActiveTab('pending')} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-[#20B2AA] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                 Requests
                 {pendingRequests.length > 0 && <span className="bg-rose-500 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full">{pendingRequests.length}</span>}
              </button>
           </div>
           {activeTab === 'approved' && (
             <button onClick={handleAddNew} className="bg-slate-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:bg-[#20B2AA] hover:scale-110 transition-all">
               <UserPlus size={20} />
             </button>
           )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
        
        {/* Left List */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col">
           <div className="p-6 border-b border-slate-50">
             <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  className="w-full bg-slate-50 py-4 pl-14 pr-6 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-100 transition-all" 
                  placeholder="Search database..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {(activeTab === 'approved' ? filteredClients : pendingRequests).map(client => (
                <div 
                  key={client.id} 
                  onClick={() => setSelectedClient(client)}
                  className={`p-5 rounded-[2rem] cursor-pointer transition-all border-2 group relative overflow-hidden ${selectedClient?.id === client.id ? 'border-slate-900 bg-slate-50' : 'border-transparent hover:bg-slate-50'}`}
                >
                   <div className="flex justify-between items-start mb-3 relative z-10">
                      <div>
                         {/* Fallback de nombre por seguridad */}
                         <h3 className="font-black text-slate-900 uppercase tracking-tight">{client.businessName || client.name || 'Sin Nombre'}</h3>
                         {client.businessName && <p className="text-xs font-bold text-slate-400">{client.name}</p>}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${client.role === UserRole.DISTRIBUTOR ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-700'}`}>
                        {client.role === UserRole.DISTRIBUTOR ? 'Wholesale' : 'Client'}
                      </span>
                   </div>
                   <div className="flex items-center gap-4 text-xs font-bold text-slate-400 relative z-10">
                      <span className="flex items-center gap-1"><Mail size={12}/> {(client.email || '').split('@')[0]}...</span>
                      <span className="flex items-center gap-1"><MapPin size={12}/> {client.city || 'N/A'}</span>
                   </div>
                </div>
              ))}
              
              {(activeTab === 'approved' ? filteredClients : pendingRequests).length === 0 && (
                <div className="text-center py-20 opacity-30">
                   <User size={48} className="mx-auto mb-4" />
                   <p className="font-black uppercase tracking-widest text-xs">No records found</p>
                </div>
              )}
           </div>
        </div>

        {/* Right Details */}
        <div className="lg:col-span-2">
           {selectedClient ? (
             <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 h-full overflow-hidden flex flex-col relative animate-in slide-in-from-right-8 duration-500">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50 to-transparent z-0"/>
                
                <div className="p-10 relative z-10 overflow-y-auto custom-scrollbar">
                   <div className="flex justify-between items-start mb-10">
                      <div className="flex items-center gap-6">
                         <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-xl rotate-3 ${selectedClient.role === UserRole.DISTRIBUTOR ? 'bg-slate-900' : 'bg-[#FF6B9D]'}`}>
                            {selectedClient.role === UserRole.DISTRIBUTOR ? <ShoppingBag size={32}/> : <Dog size={32}/>}
                         </div>
                         <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">{selectedClient.businessName || selectedClient.name}</h2>
                            <div className="flex items-center gap-3">
                               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                 <Globe size={14}/> {selectedClient.city || 'No City'}, {selectedClient.postcode || ''}
                               </p>
                               <span className="w-1 h-1 rounded-full bg-slate-300"/>
                               <p className="text-sm font-bold text-[#20B2AA] uppercase tracking-widest">Active Member</p>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex gap-2">
                         {activeTab === 'pending' ? (
                           <>
                             <button onClick={() => handleDelete(selectedClient.id)} className="p-4 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                               <X size={16}/> Reject
                             </button>
                             <button onClick={() => approveRequest(selectedClient)} className="p-4 rounded-2xl bg-slate-900 text-white hover:bg-[#20B2AA] transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl">
                               <CheckCircle size={16}/> Approve Access
                             </button>
                           </>
                         ) : (
                           <>
                             <button onClick={() => handleDelete(selectedClient.id)} className="w-12 h-12 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:border-rose-100 transition-all">
                                <Trash2 size={18}/>
                             </button>
                             <button onClick={() => handleEdit(selectedClient)} className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-[#20B2AA] transition-all">
                                <Edit size={18}/>
                             </button>
                           </>
                         )}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                         <SectionTitle icon={User} title="Contact Profile" />
                         <div className="space-y-4">
                            <InfoRow label="Full Name" value={selectedClient.name || '-'} />
                            <InfoRow label="Email Address" value={selectedClient.email || '-'} />
                            <InfoRow label="Phone" value={selectedClient.phone || '-'} />
                            <InfoRow label="Address" value={`${selectedClient.addressLine1 || ''}, ${selectedClient.city || ''}`} />
                         </div>

                         {selectedClient.role === UserRole.DISTRIBUTOR && (
                           <>
                             <SectionTitle icon={ShoppingBag} title="Business Details" />
                             <div className="space-y-4">
                                <InfoRow label="Company Name" value={selectedClient.businessName || '-'} />
                                <InfoRow label="VAT Number" value={selectedClient.vatNumber || 'Not Registered'} />
                                <InfoRow label="Sector" value={selectedClient.businessType || 'Retail'} />
                             </div>
                           </>
                         )}

                         {/* SECCIÓN PASSWORD EDITABLE ESTILIZADA */}
                         <SectionTitle icon={Lock} title="Security & Access" />
                         <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-[#20B2AA]/30 transition-all">
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Password</p>
                               <div className="flex items-center gap-3">
                                  <p className="font-mono text-slate-900 font-bold text-lg">
                                     {selectedClient.visible_password || '••••••••'}
                                  </p>
                                  {!selectedClient.visible_password && <span className="text-[9px] text-rose-400 font-bold">(Not Saved)</span>}
                               </div>
                            </div>
                            <div className="px-3 py-1 bg-white rounded-lg text-[9px] font-black text-slate-300 uppercase border border-slate-100 shadow-sm">
                               Admin View
                            </div>
                         </div>
                      </div>

                      <div className="space-y-8">
                         {/* Fallback de Role por si es null */}
                         {(selectedClient.role || UserRole.CLIENT) === UserRole.CLIENT && (
                           <>
                              <SectionTitle icon={Dog} title="Pet Dossier" />
                              <div className="space-y-4">
                                 {/* CORRECCIÓN: ARRAY SEGURO PARA MASCOTAS */}
                                 {(selectedClient.pets || []).map((pet, idx) => (
                                   <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] flex items-center gap-6">
                                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm overflow-hidden">
                                         {pet.photoUrl ? (
                                            <img src={pet.photoUrl} className="w-full h-full object-cover" alt={pet.name}/>
                                         ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-200"><Dog size={24}/></div>
                                         )}
                                      </div>
                                      <div>
                                         <h4 className="font-black text-slate-900 text-lg">{pet.name}</h4>
                                         <p className="text-xs font-bold text-slate-400">{pet.breed} • {pet.age}</p>
                                      </div>
                                   </div>
                                 ))}
                                 {(!selectedClient.pets || selectedClient.pets.length === 0) && (
                                   <p className="text-slate-400 italic text-sm">No pets registered in dossier.</p>
                                 )}
                              </div>

                              <SectionTitle icon={Stethoscope} title="Medical / Emergency" />
                              <div className="space-y-4">
                                 <InfoRow label="Vet Practice" value={selectedClient.vetInfo || '-'} />
                                 <InfoRow label="Emergency Contact" value={`${selectedClient.emergencyContactName || '-'} (${selectedClient.emergencyContactPhone || '-'})`} />
                              </div>
                           </>
                         )}
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <div className="h-full bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                <ShieldCheck size={64} className="mb-6 opacity-50"/>
                <p className="font-black uppercase tracking-widest text-sm">Select a file to view details</p>
             </div>
           )}
        </div>
      </div>

      {/* MODAL EDIT / ADD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{baseData.id ? 'Edit Profile' : 'New Entry'}</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Modify database record</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-full transition-all"><X size={20}/></button>
              </div>
              
              <div className="p-10 space-y-8">
                 {/* Role Switcher */}
                 <div className="flex bg-slate-100 p-2 rounded-[2rem]">
                    <button onClick={() => setClientType(UserRole.CLIENT)} className={`flex-1 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all ${clientType === UserRole.CLIENT ? 'bg-white shadow-lg text-slate-900' : 'text-slate-400'}`}>Private Client</button>
                    <button onClick={() => setClientType(UserRole.DISTRIBUTOR)} className={`flex-1 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all ${clientType === UserRole.DISTRIBUTOR ? 'bg-white shadow-lg text-slate-900' : 'text-slate-400'}`}>Distributor</button>
                 </div>

                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                       <InputField label="Full Name" value={baseData.name} onChange={v => setBaseData({...baseData, name: v})} />
                       <InputField label="Email" value={baseData.email} onChange={v => setBaseData({...baseData, email: v})} type="email" />
                    </div>
                    
                    {/* SECCIÓN PASSWORD EDITABLE ESTILIZADA */}
                    <div className="p-6 bg-teal-50/50 rounded-[2rem] border border-teal-100/50 space-y-4">
                       <div className="flex items-center gap-3 text-teal-600 mb-2">
                          <Lock size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Access Credentials</span>
                       </div>
                       <div className="space-y-2 w-full">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Password</label>
                          <div className="relative">
                             <input 
                               type={showPassword ? "text" : "password"}
                               className="w-full px-6 py-5 bg-white rounded-[2rem] border-none font-bold outline-none focus:ring-4 focus:ring-teal-100 transition-all text-slate-800 shadow-sm"
                               value={baseData.visible_password}
                               onChange={e => setBaseData({...baseData, visible_password: e.target.value})}
                               placeholder="Enter password..."
                             />
                             <button 
                               type="button"
                               onClick={() => setShowPassword(!showPassword)}
                               className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors"
                             >
                               {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                             </button>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <InputField label="Phone" value={baseData.phone} onChange={v => setBaseData({...baseData, phone: v})} />
                       <InputField label="City" value={baseData.city} onChange={v => setBaseData({...baseData, city: v})} />
                    </div>
                    <InputField label="Address Line 1" value={baseData.addressLine1} onChange={v => setBaseData({...baseData, addressLine1: v})} />
                    
                    {clientType === UserRole.DISTRIBUTOR && (
                      <div className="space-y-6 pt-4 border-t border-slate-100">
                         <h4 className="text-sm font-black text-slate-900 uppercase">Business Info</h4>
                         <div className="grid grid-cols-2 gap-6">
                            <InputField label="Business Name" value={baseData.businessName} onChange={v => setBaseData({...baseData, businessName: v})} />
                            <InputField label="VAT Number" value={baseData.businessType} onChange={v => setBaseData({...baseData, businessType: v})} />
                         </div>
                      </div>
                    )}
                 </div>

                 <button onClick={handleSaveClient} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-[#20B2AA] transition-all shadow-xl">
                   Save Record
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title }: any) => (
  <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
     <Icon size={22} className="text-[#20B2AA]" />
     <h4 className="text-2xl font-black uppercase tracking-tight text-slate-900">{title}</h4>
  </div>
);

const InputField = ({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (v: string) => void, type?: string }) => (
  <div className="space-y-2 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label>
    <input required type={type} className="w-full px-6 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all shadow-inner" value={value || ''} onChange={e => onChange(e.target.value)} />
  </div>
);

const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
     <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</span>
     <span className="text-sm font-black text-slate-800 text-right">{value || '-'}</span>
  </div>
);

export default Clients;