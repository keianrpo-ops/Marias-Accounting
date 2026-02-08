import React, { useState } from 'react';
import { 
  Dog, ArrowLeft, Send, CheckCircle, ShieldCheck, ShoppingBag, 
  Heart, Plus, Trash2, User, MapPin, Lock, Stethoscope, Camera, Loader2, X, Building2, Phone 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole, PetDetails } from '../types';
import { supabase } from '../services/supabase';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [type, setType] = useState<UserRole>(UserRole.DISTRIBUTOR);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estado para la carga de imágenes
  const [uploadingImg, setUploadingImg] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);

  // Estados para autenticación
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');

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
    vetName: '',  // Separado: Nombre del veterinario
    vetPhone: '', // Separado: Teléfono del veterinario
  });

  const [pets, setPets] = useState<PetDetails[]>([
    {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      age: '',
      breed: '',
      gender: 'male',
      isNeutered: false,
      medicalConditions: '',
      allergies: '',
      microchip: '',
      vaccinationExpiry: '',
      image: undefined
    }
  ]);

  // --- FUNCIÓN PARA SUBIR IMAGEN ---
  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images') 
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleUserImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingImg(true);
    const file = e.target.files[0];
    const url = await handleImageUpload(file);
    if (url) setUserImage(url);
    setUploadingImg(false);
  };

  const handlePetImageChange = async (petId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const url = await handleImageUpload(file);
    
    if (url) {
      setPets(pets.map(p => p.id === petId ? { ...p, image: url } : p));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (password !== confirmPassword) {
      setAuthError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setAuthError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      // 1. Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: password,
        options: {
          data: {
            full_name: type === UserRole.DISTRIBUTOR ? formData.businessName : formData.name,
            role: type === UserRole.DISTRIBUTOR ? 'distributor' : 'client',
            avatar_url: userImage
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Error al crear usuario");

      // 2. Guardar datos en la tabla 'clients'
      // Concatenamos la info del veterinario para guardarla junta si no tienes campo separado
      const vetFullInfo = `Dr/Clínica: ${formData.vetName} - Tel: ${formData.vetPhone}`;

      const clientPayload = {
        id: authData.user.id,
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        address_line1: formData.addressLine1,
        address_line2: formData.addressLine2,
        city: formData.city,
        postcode: formData.postcode,
        role: type === UserRole.DISTRIBUTOR ? 'distributor' : 'client',
        image: userImage,
        password_hint: password, // ✅ GUARDAMOS CONTRASEÑA VISIBLE
        
        ...(type === UserRole.DISTRIBUTOR ? {
            business_name: formData.businessName,
            vat_number: formData.vatNumber,
            business_type: formData.businessType
        } : {
            emergency_contact_name: formData.emergencyContactName,
            emergency_contact_phone: formData.emergencyContactPhone,
            vet_info: vetFullInfo // Guardamos nombre y teléfono del vet
        })
      };

      const { error: dbError } = await supabase
        .from('clients')
        .insert([clientPayload]);

      if (dbError) throw dbError;

      // 3. Guardar mascotas
      if (type === UserRole.CLIENT && pets.length > 0) {
          const validPets = pets.filter(p => p.name.trim() !== '');
          
          if (validPets.length > 0) {
              const petsPayload = validPets.map(p => ({
                  owner_id: authData.user!.id,
                  name: p.name,
                  breed: p.breed,
                  age: p.age,
                  gender: p.gender,
                  image: p.image,
                  microchip: p.microchip,
                  medical_conditions: p.medicalConditions,
                  allergies: p.allergies,
                  is_neutered: p.isNeutered,
                  is_vaccinated: true
              }));

              const { error: petsError } = await supabase.from('pets').insert(petsPayload);
              if (petsError) console.error("Error guardando mascotas:", petsError);
          }
      }

      setSubmitted(true);
      
      setTimeout(() => {
         navigate(type === UserRole.DISTRIBUTOR ? '/' : '/');
      }, 2000);

    } catch (err: any) {
      console.error("Registration error:", err);
      setAuthError(err.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
         <div className="w-24 h-24 bg-[#20B2AA] rounded-full flex items-center justify-center shadow-xl mb-8 animate-bounce">
            <CheckCircle size={48} className="text-white" />
         </div>
         <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter text-center">SOLICITUD RECIBIDA</h2>
         <p className="text-slate-500 font-medium text-center max-w-md">
            Tu perfil ha sido creado exitosamente. Redirigiendo a tu portal...
         </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-8 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <button onClick={() => navigate('/')} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
           <ArrowLeft size={20} className="text-slate-900"/>
        </button>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-full">
            <button 
              onClick={() => setType(UserRole.DISTRIBUTOR)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${type === UserRole.DISTRIBUTOR ? 'bg-[#20B2AA] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
               Distribuidor B2B
            </button>
            <button 
              onClick={() => setType(UserRole.CLIENT)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${type === UserRole.CLIENT ? 'bg-[#FF6B9D] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
               Cliente Particular
            </button>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full p-6 md:p-12 pb-32">
         <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-4">
               {type === UserRole.DISTRIBUTOR ? 'REGISTRO B2B' : 'NUEVO MIEMBRO'}
            </h1>
            <p className="text-slate-500 font-medium text-lg">
               {type === UserRole.DISTRIBUTOR 
                 ? 'Únete a nuestra red de distribuidores certificados.' 
                 : 'Registra tus datos y crea el expediente médico de tus mascotas.'}
            </p>
         </div>

         {authError && (
             <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-xs uppercase tracking-wide">
                 <X size={16}/> {authError}
             </div>
         )}

         <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* SECCIÓN 1: FOTO */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <Camera className={type === UserRole.DISTRIBUTOR ? "text-[#20B2AA]" : "text-[#FF6B9D]"} size={24}/>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                        {type === UserRole.DISTRIBUTOR ? 'Logo Empresa' : 'Foto Perfil'}
                    </h3>
                </div>
                
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 hover:bg-slate-100 transition-colors relative group">
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleUserImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {userImage ? (
                        <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-lg border-4 border-white">
                             <img src={userImage} alt="Preview" className="w-full h-full object-cover" />
                             {uploadingImg && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>}
                        </div>
                    ) : (
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-4 ${type === UserRole.DISTRIBUTOR ? 'bg-teal-100 text-teal-500' : 'bg-pink-100 text-pink-500'}`}>
                            {uploadingImg ? <Loader2 className="animate-spin" size={32}/> : (type === UserRole.DISTRIBUTOR ? <Building2 size={32}/> : <User size={32}/>)}
                        </div>
                    )}
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                        {userImage ? 'Clic para cambiar' : 'Clic para subir imagen'}
                    </p>
                </div>
            </div>

            {/* SECCIÓN 2: CUENTA */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <Lock className={type === UserRole.DISTRIBUTOR ? "text-[#20B2AA]" : "text-[#FF6B9D]"} size={24}/>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Credenciales</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Email</label>
                     <input type="email" required className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:ring-2 ring-slate-200 transition-all" placeholder="usuario@ejemplo.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre Completo</label>
                     <input type="text" required className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:ring-2 ring-slate-200 transition-all" placeholder="Tu Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Contraseña</label>
                     <input type="password" required className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:ring-2 ring-slate-200 transition-all" placeholder="******" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Confirmar Contraseña</label>
                     <input type="password" required className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:ring-2 ring-slate-200 transition-all" placeholder="******" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
               </div>
            </div>

            {/* SECCIÓN 3: DETALLES ESPECÍFICOS */}
            {type === UserRole.DISTRIBUTOR ? (
               <div className="space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-500">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                     <ShoppingBag className="text-[#20B2AA]" size={24}/>
                     <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Datos del Negocio</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre Legal Empresa</label>
                        <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border border-slate-100 font-bold outline-none shadow-sm" placeholder="Empresa S.A." value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Negocio</label>
                        <select className="w-full px-8 py-5 bg-white rounded-[2rem] border border-slate-100 font-bold outline-none shadow-sm appearance-none" value={formData.businessType} onChange={e => setFormData({...formData, businessType: e.target.value})}>
                           <option>Tienda Retail</option>
                           <option>Clínica Veterinaria</option>
                           <option>Peluquería Canina</option>
                           <option>Tienda Online</option>
                           <option>Distribuidor</option>
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">NIT / RUT / VAT</label>
                        <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border border-slate-100 font-bold outline-none shadow-sm" placeholder="123456789" value={formData.vatNumber} onChange={e => setFormData({...formData, vatNumber: e.target.value})} />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Teléfono</label>
                        <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border border-slate-100 font-bold outline-none shadow-sm" placeholder="+57 300 000 0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                     </div>
                  </div>
                  
                  <div className="space-y-3 pt-4">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Dirección de Facturación</label>
                      <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border border-slate-100 font-bold outline-none shadow-sm mb-3" placeholder="Dirección Línea 1" value={formData.addressLine1} onChange={e => setFormData({...formData, addressLine1: e.target.value})} />
                      <input className="w-full px-8 py-5 bg-white rounded-[2rem] border border-slate-100 font-bold outline-none shadow-sm mb-3" placeholder="Línea 2 (Opcional)" value={formData.addressLine2} onChange={e => setFormData({...formData, addressLine2: e.target.value})} />
                      <div className="grid grid-cols-2 gap-4">
                         <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border border-slate-100 font-bold outline-none shadow-sm" placeholder="Ciudad" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                         <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border border-slate-100 font-bold outline-none shadow-sm" placeholder="Código Postal" value={formData.postcode} onChange={e => setFormData({...formData, postcode: e.target.value})} />
                      </div>
                  </div>
               </div>
            ) : (
               <div className="space-y-12 animate-in slide-in-from-bottom-10 fade-in duration-500">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                       <User className="text-[#FF6B9D]" size={24}/>
                       <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Detalles del Propietario</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Teléfono Móvil</label>
                           <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm" placeholder="+57 300 000 0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Contacto Emergencia</label>
                           <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm" placeholder="Nombre y Relación" value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Teléfono Emergencia</label>
                           <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm" placeholder="Número Emergencia" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Dirección Domicilio</label>
                        <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm mb-3" placeholder="Dirección Completa" value={formData.addressLine1} onChange={e => setFormData({...formData, addressLine1: e.target.value})} />
                        <div className="grid grid-cols-2 gap-4">
                             <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm" placeholder="Ciudad" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                             <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm" placeholder="Cod. Postal" value={formData.postcode} onChange={e => setFormData({...formData, postcode: e.target.value})} />
                        </div>
                    </div>
                  </div>

                  {/* MASCOTAS */}
                  <div className="space-y-8">
                     <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <Dog className="text-[#FF6B9D]" size={24}/>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Expediente Mascotas</h3>
                     </div>
                     
                     {pets.map((pet, index) => (
                        <div key={pet.id} className="p-8 bg-pink-50/50 rounded-[3rem] border border-pink-100 space-y-6 relative group">
                            <div className="absolute top-8 right-8">
                               {index > 0 && (
                                   <button type="button" onClick={() => setPets(pets.filter(p => p.id !== pet.id))} className="p-3 bg-white text-red-400 rounded-full shadow-sm hover:bg-red-50 transition-colors">
                                       <Trash2 size={18}/>
                                   </button>
                               )}
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* FOTO MASCOTA */}
                                <div className="shrink-0">
                                   <div className="relative w-32 h-32 bg-white rounded-[2rem] flex items-center justify-center border-2 border-dashed border-pink-200 overflow-hidden cursor-pointer hover:border-pink-400 transition-colors">
                                       {pet.image ? (
                                           <img src={pet.image} className="w-full h-full object-cover"/>
                                       ) : (
                                           <div className="text-center p-4">
                                               <Camera className="mx-auto text-pink-300 mb-1" size={24}/>
                                               <span className="text-[8px] font-black uppercase text-pink-300 block">Subir Foto</span>
                                           </div>
                                       )}
                                       <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handlePetImageChange(pet.id, e)} />
                                   </div>
                                </div>

                                <div className="flex-1 space-y-4 w-full">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre</label>
                                            <input required className="w-full px-6 py-4 bg-white rounded-[1.5rem] border-none font-bold outline-none shadow-sm" placeholder="Nombre Mascota" value={pet.name} onChange={e => {
                                                const newPets = [...pets];
                                                newPets[index].name = e.target.value;
                                                setPets(newPets);
                                            }} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Raza</label>
                                            <input required className="w-full px-6 py-4 bg-white rounded-[1.5rem] border-none font-bold outline-none shadow-sm" placeholder="Raza" value={pet.breed} onChange={e => {
                                                const newPets = [...pets];
                                                newPets[index].breed = e.target.value;
                                                setPets(newPets);
                                            }} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Edad</label>
                                            <input className="w-full px-6 py-4 bg-white rounded-[1.5rem] border-none font-bold outline-none shadow-sm" placeholder="Edad" value={pet.age} onChange={e => {
                                                const newPets = [...pets];
                                                newPets[index].age = e.target.value;
                                                setPets(newPets);
                                            }} />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Género & Esterilizado</label>
                                            <div className="flex gap-2">
                                                <select className="flex-1 px-6 py-4 bg-white rounded-[1.5rem] border-none font-bold outline-none shadow-sm" value={pet.gender} onChange={e => {
                                                    const newPets = [...pets];
                                                    newPets[index].gender = e.target.value as 'male' | 'female';
                                                    setPets(newPets);
                                                }}>
                                                    <option value="male">Macho</option>
                                                    <option value="female">Hembra</option>
                                                </select>
                                                <div className={`flex-1 px-4 py-4 rounded-[1.5rem] border-2 cursor-pointer flex items-center justify-center gap-2 transition-all ${pet.isNeutered ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-pink-100 text-slate-400'}`}
                                                     onClick={() => {
                                                        const newPets = [...pets];
                                                        newPets[index].isNeutered = !newPets[index].isNeutered;
                                                        setPets(newPets);
                                                     }}>
                                                    <span className="text-[9px] font-black uppercase">Esterilizado</span>
                                                    {pet.isNeutered && <CheckCircle size={12}/>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-pink-200/50">
                                         <div className="flex items-center gap-2 mb-3">
                                             <Stethoscope size={14} className="text-pink-400"/>
                                             <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest">Información Médica</span>
                                         </div>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <input className="w-full px-6 py-4 bg-white rounded-[1.5rem] border-none font-bold outline-none shadow-sm text-sm" placeholder="Condiciones Médicas (Opcional)" value={pet.medicalConditions} onChange={e => {
                                                const newPets = [...pets];
                                                newPets[index].medicalConditions = e.target.value;
                                                setPets(newPets);
                                             }} />
                                             <input className="w-full px-6 py-4 bg-white rounded-[1.5rem] border-none font-bold outline-none shadow-sm text-sm" placeholder="Alergias (Opcional)" value={pet.allergies} onChange={e => {
                                                const newPets = [...pets];
                                                newPets[index].allergies = e.target.value;
                                                setPets(newPets);
                                             }} />
                                         </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                     ))}
                     
                     <button type="button" onClick={() => setPets([...pets, {
                        id: Math.random().toString(36).substr(2, 9),
                        name: '', age: '', breed: '', gender: 'male', isNeutered: false, medicalConditions: '', allergies: '', microchip: '', vaccinationExpiry: '', image: undefined
                     }])} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-black uppercase text-[10px] tracking-widest hover:border-[#FF6B9D] hover:text-[#FF6B9D] transition-colors flex items-center justify-center gap-2">
                        <Plus size={16}/> Registrar Otra Mascota
                     </button>

                     <div className="pt-6">
                       <div className="flex items-center gap-3 mb-4">
                          <Stethoscope className="text-[#FF6B9D]" size={20}/>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Veterinario de Contacto</h4>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-3">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre Clínica / Dr.</label>
                              <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm" placeholder="Ej: Clínica Vet. San Jorge" value={formData.vetName} onChange={e => setFormData({...formData, vetName: e.target.value})} />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Teléfono Veterinario</label>
                              <input required className="w-full px-8 py-5 bg-white rounded-[2rem] border-none font-bold outline-none shadow-sm" placeholder="Ej: +57 300 123 4567" value={formData.vetPhone} onChange={e => setFormData({...formData, vetPhone: e.target.value})} />
                           </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            <div className="pt-12 border-t border-slate-100">
               <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[12px] flex items-center justify-center gap-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:bg-[#20B2AA] hover:-translate-y-2 transition-all active:scale-95 disabled:opacity-50">
                 {loading ? 'Procesando...' : 'Completar Registro Profesional'} <Send size={20}/>
               </button>
               <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mt-10 flex items-center justify-center gap-3">
                  <ShieldCheck size={18}/> Datos protegidos y encriptados
               </p>
            </div>
         </form>
      </div>
    </div>
  );
};

export default Register;