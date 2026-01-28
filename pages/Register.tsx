
import React, { useState } from 'react';
import { Dog, ArrowLeft, Send, CheckCircle, ShieldCheck, ShoppingBag, Heart, Plus, Trash2, User, MapPin, Phone, Mail, Stethoscope, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole, Client, PetDetails } from '../types';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [type, setType] = useState<UserRole>(UserRole.DISTRIBUTOR);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    businessName: '',
    vatNumber: '',
    businessType: 'Retail Store',
    emergencyContactName: '',
    emergencyContactPhone: '',
    vetInfo: '',
  });

  const [pets, setPets] = useState<PetDetails[]>([
    {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      age: '',
      breed: '',
      gender: 'male',
      isNeutered: false,
      isVaccinated: true,
      allergies: '',
      behaviorWithDogs: '',
      medicalNotes: ''
    }
  ]);

  const addPet = () => {
    if (pets.length >= 2) return;
    setPets([...pets, {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      age: '',
      breed: '',
      gender: 'male',
      isNeutered: false,
      isVaccinated: true,
      allergies: '',
      behaviorWithDogs: '',
      medicalNotes: ''
    }]);
  };

  const removePet = (id: string) => {
    if (pets.length <= 1) return;
    setPets(pets.filter(p => p.id !== id));
  };

  const updatePet = (id: string, field: keyof PetDetails, value: any) => {
    setPets(pets.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const pendingRequests = JSON.parse(localStorage.getItem('mdc_pending_requests') || '[]');
    const newRequest: Client = {
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      role: type,
      invoicesSent: 0,
      createdAt: new Date().toISOString(),
      ...formData,
      pets: type === UserRole.CLIENT ? pets : []
    };

    setTimeout(() => {
      localStorage.setItem('mdc_pending_requests', JSON.stringify([...pendingRequests, newRequest]));
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white p-12 rounded-[3.5rem] shadow-2xl text-center space-y-8 animate-in zoom-in-95">
          <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Application Received</h2>
          <p className="text-slate-500 font-medium">Maria's team will review your dossier and contact you shortly. Please check your email for confirmation.</p>
          <button onClick={() => navigate('/info')} className="w-full bg-slate-900 text-white py-5 rounded-full font-black uppercase tracking-widest text-[11px]">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/info')} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest mb-12 transition-all">
          <ArrowLeft size={16}/> Back to Home
        </button>

        <div className="text-center mb-16">
           <div className="inline-flex w-20 h-20 bg-[#20B2AA] rounded-3xl items-center justify-center text-white shadow-2xl mb-8 rotate-3">
              <Dog size={40} />
           </div>
           <h1 className="text-6xl font-black text-slate-900 tracking-tighter">Registration <span className="text-[#20B2AA]">Portal</span></h1>
           <p className="text-slate-500 mt-3 font-medium text-lg italic">Join the Maria's Dog Corner professional ecosystem.</p>
        </div>

        <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 mb-20">
          <div className="flex bg-slate-50 p-3">
            <button onClick={() => setType(UserRole.DISTRIBUTOR)} className={`flex-1 py-7 rounded-[3.5rem] font-black uppercase text-[12px] tracking-widest transition-all flex items-center justify-center gap-4 ${type === UserRole.DISTRIBUTOR ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-600'}`}>
              <ShoppingBag size={20}/> Wholesale Partner
            </button>
            <button onClick={() => setType(UserRole.CLIENT)} className={`flex-1 py-7 rounded-[3.5rem] font-black uppercase text-[12px] tracking-widest transition-all flex items-center justify-center gap-4 ${type === UserRole.CLIENT ? 'bg-[#FF6B9D] text-white shadow-2xl' : 'text-slate-400 hover:text-slate-600'}`}>
              <Heart size={20}/> Daycare Client
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-10 md:p-20 space-y-16">
            
            {/* Section 1: Basic Information */}
            <div className="space-y-10">
               <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <User className="text-[#20B2AA]" />
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Contact Information</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Legal Name</label>
                    <input required className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:ring-4 focus:ring-teal-50 transition-all shadow-inner" placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                    <input required type="email" className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:ring-4 focus:ring-teal-50 transition-all shadow-inner" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone Number</label>
                    <input required className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:ring-4 focus:ring-teal-50 transition-all shadow-inner" placeholder="07XXX XXXXXX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  {type === UserRole.DISTRIBUTOR && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Business Type</label>
                      <select className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none cursor-pointer focus:ring-4 focus:ring-teal-50" value={formData.businessType} onChange={e => setFormData({...formData, businessType: e.target.value})}>
                        <option>Retail Store</option>
                        <option>Pet Shop</option>
                        <option>Vet Clinic</option>
                        <option>Distributor</option>
                      </select>
                    </div>
                  )}
               </div>

               {type === UserRole.DISTRIBUTOR && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Registered Business Name</label>
                      <input required className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:ring-4 focus:ring-teal-50 transition-all shadow-inner" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">VAT Number (Optional)</label>
                      <input className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:ring-4 focus:ring-teal-50 transition-all shadow-inner" value={formData.vatNumber} onChange={e => setFormData({...formData, vatNumber: e.target.value})} />
                    </div>
                  </div>
               )}
            </div>

            {/* Section 2: Address */}
            <div className="space-y-10">
               <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <MapPin className="text-[#20B2AA]" />
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Location Details</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Address Line 1</label>
                    <input required className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:ring-4 focus:ring-teal-50 transition-all shadow-inner" value={formData.addressLine1} onChange={e => setFormData({...formData, addressLine1: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">City</label>
                    <input required className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:ring-4 focus:ring-teal-50 transition-all shadow-inner" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Postcode</label>
                    <input required className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:ring-4 focus:ring-teal-50 transition-all shadow-inner uppercase" value={formData.postcode} onChange={e => setFormData({...formData, postcode: e.target.value})} />
                  </div>
               </div>
            </div>

            {/* Section 3: Pet Details (Daycare Only) */}
            {type === UserRole.CLIENT && (
              <div className="space-y-12">
                 <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-4">
                       <Dog className="text-[#FF6B9D]" />
                       <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Pet Dossier</h3>
                    </div>
                    <button type="button" onClick={addPet} disabled={pets.length >= 2} className="px-6 py-3 bg-[#FF6B9D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 disabled:opacity-30">
                       <Plus size={16}/> Add Pet (Max 2)
                    </button>
                 </div>

                 {pets.map((pet, idx) => (
                   <div key={pet.id} className="p-10 bg-slate-50/50 rounded-[3rem] border border-slate-200 space-y-10 relative animate-in slide-in-from-right-4 duration-500">
                      <div className="absolute top-8 right-8">
                         {pets.length > 1 && (
                           <button type="button" onClick={() => removePet(pet.id)} className="p-3 bg-white text-rose-500 rounded-xl shadow-sm hover:bg-rose-50"><Trash2 size={18}/></button>
                         )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                         <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm">{idx + 1}</span>
                         <h4 className="text-xl font-black text-slate-900 uppercase">Pet Information</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Pet's Name</label>
                           <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm" value={pet.name} onChange={e => updatePet(pet.id, 'name', e.target.value)} />
                         </div>
                         <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Breed</label>
                           <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm" value={pet.breed} onChange={e => updatePet(pet.id, 'breed', e.target.value)} />
                         </div>
                         <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Age / Birthday</label>
                           <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm" value={pet.age} onChange={e => updatePet(pet.id, 'age', e.target.value)} />
                         </div>
                         <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Gender</label>
                           <div className="bg-white p-2 rounded-full flex shadow-sm">
                              <button type="button" onClick={() => updatePet(pet.id, 'gender', 'male')} className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase transition-all ${pet.gender === 'male' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Male</button>
                              <button type="button" onClick={() => updatePet(pet.id, 'gender', 'female')} className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase transition-all ${pet.gender === 'female' ? 'bg-[#FF6B9D] text-white' : 'text-slate-400'}`}>Female</button>
                           </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-200">
                         <div className="space-y-4">
                            <label className="flex items-center gap-4 cursor-pointer group">
                               <input type="checkbox" className="w-6 h-6 rounded-lg accent-[#20B2AA]" checked={pet.isVaccinated} onChange={e => updatePet(pet.id, 'isVaccinated', e.target.checked)} />
                               <div className="flex flex-col">
                                  <span className="text-[11px] font-black uppercase text-slate-700">Vaccinations up to date</span>
                                  <span className="text-[9px] text-slate-400 font-bold">Proof will be required upon visit</span>
                               </div>
                            </label>
                            <label className="flex items-center gap-4 cursor-pointer group">
                               <input type="checkbox" className="w-6 h-6 rounded-lg accent-[#20B2AA]" checked={pet.isNeutered} onChange={e => updatePet(pet.id, 'isNeutered', e.target.checked)} />
                               <div className="flex flex-col">
                                  <span className="text-[11px] font-black uppercase text-slate-700">Spayed / Neutered</span>
                                  <span className="text-[9px] text-slate-400 font-bold">Recommended for daycare</span>
                               </div>
                            </label>
                         </div>
                         <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Behavior with other dogs</label>
                           <select className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm cursor-pointer" value={pet.behaviorWithDogs} onChange={e => updatePet(pet.id, 'behaviorWithDogs', e.target.value)}>
                              <option value="">Select Level...</option>
                              <option>Very Friendly</option>
                              <option>Shy but Sweet</option>
                              <option>Selective</option>
                              <option>Active / High Energy</option>
                           </select>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Dietary Allergies</label>
                           <textarea className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm resize-none" rows={3} placeholder="List any allergies..." value={pet.allergies} onChange={e => updatePet(pet.id, 'allergies', e.target.value)} />
                         </div>
                         <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">General Medical Notes</label>
                           <textarea className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm resize-none" rows={3} placeholder="Past injuries, medication, etc..." value={pet.medicalNotes} onChange={e => updatePet(pet.id, 'medicalNotes', e.target.value)} />
                         </div>
                      </div>
                   </div>
                 ))}

                 {/* Emergency Details */}
                 <div className="p-10 bg-rose-50/50 rounded-[3rem] border border-rose-100 space-y-8">
                    <div className="flex items-center gap-4">
                       <Stethoscope className="text-rose-500" />
                       <h3 className="text-xl font-black text-slate-900 uppercase">Emergency & Vet Info</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Emergency Contact</label>
                          <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm" placeholder="Name" value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Emergency Phone</label>
                          <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm" placeholder="Phone" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Vet Practice Name</label>
                          <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm" placeholder="Practice & Address" value={formData.vetInfo} onChange={e => setFormData({...formData, vetInfo: e.target.value})} />
                       </div>
                    </div>
                 </div>
              </div>
            )}

            <div className="pt-12 border-t border-slate-100">
               <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[12px] flex items-center justify-center gap-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:bg-[#20B2AA] hover:-translate-y-2 transition-all active:scale-95 disabled:opacity-50">
                 {loading ? 'Processing Dossier...' : 'Submit Professional Application'} <Send size={20}/>
               </button>
               <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mt-10 flex items-center justify-center gap-3">
                  <ShieldCheck size={18}/> Compliance & Data Protection GDPR UK
               </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
