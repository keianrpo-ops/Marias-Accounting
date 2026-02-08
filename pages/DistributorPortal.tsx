import React, { useMemo, useEffect, useState, useRef } from 'react';
import { 
  ShoppingBag, Zap, Package, Star, DollarSign, Activity, 
  Building2, MapPin, User, ShieldCheck, Save, X, Camera, Loader2, LogOut, ChevronDown, Mail, FileText, Eye, EyeOff, Key
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PRICING_TIERS, PRODUCTS } from '../constants';
import { db, supabase } from '../services/supabase';
import { Order } from '../types';

const DistributorPortal: React.FC = () => {
  const navigate = useNavigate();
  
  // --- ESTADOS ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de UI
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Estados para contraseña
  const [passwordData, setPasswordData] = useState(''); 
  
  // Datos de Sesión
  const [sessionEmail, setSessionEmail] = useState('');

  // ESTADO DEL PERFIL
  const [profile, setProfile] = useState<any>({
    id: '',
    business_name: '',
    name: '',
    phone: '',
    address_line1: '',
    city: '',
    postcode: '',
    vat_number: '',
    business_type: '',
    image: null,
    password_hint: '' 
  });

  const [editForm, setEditForm] = useState<any>({});

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const loadSessionAndData = async () => {
        try {
            setLoading(true);
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !user) {
                navigate('/'); 
                return;
            }

            const myEmail = user.email || '';
            setSessionEmail(myEmail);

            const { data: clientData } = await supabase
                .from('clients')
                .select('*')
                .eq('id', user.id)
                .single();

            if (clientData) {
                setProfile(clientData);
                setEditForm(clientData);
                // Cargar contraseña si existe
                if (clientData.password_hint) {
                    setPasswordData(clientData.password_hint);
                } else {
                    setPasswordData(''); 
                }
            } else {
                const fallback = { 
                    id: user.id,
                    email: myEmail, 
                    name: user.user_metadata?.name || '',
                    business_name: '' 
                };
                setProfile(fallback);
                setEditForm(fallback);
            }

            const allOrders = await db.orders.getAll();
            const myOrders = (Array.isArray(allOrders) ? allOrders : []).filter((o: any) => {
                return Boolean(o?.isWholesale) && String(o?.clientEmail).toLowerCase() === myEmail.toLowerCase();
            });
            setOrders(myOrders);

        } catch (err) {
            console.error('Error cargando portal:', err);
        } finally {
            setLoading(false);
        }
    };

    loadSessionAndData();

    function handleClickOutside(event: any) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [navigate]);

  // --- FUNCIONES ---

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingPhoto(true);
    try {
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${editForm.id || 'unknown'}-${Date.now()}.${fileExt}`;
        const filePath = `profiles/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('images').getPublicUrl(filePath);
        setEditForm((prev: any) => ({ ...prev, image: data.publicUrl }));
    } catch (error: any) {
        alert(`Error uploading photo: ${error.message}`);
    } finally {
        setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
        let passwordChanged = false;
        
        // Si hay datos en el campo password y son diferentes a lo guardado
        if (passwordData && passwordData !== profile.password_hint) {
             if (passwordData.length < 6) {
                alert("Password must be at least 6 characters.");
                setIsSaving(false); return;
             }
             const { error: passError } = await supabase.auth.updateUser({ password: passwordData });
             if (passError) throw passError;
             passwordChanged = true;
        }

        const dataToUpdate = {
            ...editForm,
            password_hint: passwordData, // Guardamos para visualización futura
            email: sessionEmail
            // updated_at ELIMINADO PORQUE NO EXISTE EN TU DB
        };

        const { error: dbError } = await supabase.from('clients').upsert(dataToUpdate);
        if (dbError) throw dbError;

        setProfile(dataToUpdate);
        setIsProfileOpen(false);
        alert(passwordChanged ? "Profile & Password updated successfully." : "Profile updated successfully.");

    } catch (error: any) {
        console.error("Save error:", error);
        alert(`Failed to save: ${error.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      localStorage.clear();
      navigate('/');
  };

  // Stats Logic
  const stats = useMemo(() => {
    if (orders.length === 0) return { totalSpent: 0, points: 0, unitsThisMonth: 0, currentTier: PRICING_TIERS[0], totalMargin: 0 };
    const totalSpent = orders.reduce((sum, o) => sum + (Number(o?.total) || 0), 0);
    const points = Math.floor(totalSpent / 10);
    const unitsThisMonth = orders.reduce((sum, o) => {
      const items = Array.isArray((o as any)?.items) ? (o as any).items : [];
      return sum + items.reduce((s: number, i: any) => s + (Number(i?.quantity) || 0), 0);
    }, 0);
    let totalMargin = 0;
    orders.forEach((order: any) => {
        const items = Array.isArray(order?.items) ? order.items : [];
        items.forEach((item: any) => {
            const product = PRODUCTS.find((p) => p.name === item?.description);
            if (product) totalMargin += (product.basePrice - (Number(item?.unitPrice) || 0)) * (Number(item?.quantity) || 0);
        });
    });
    let currentTier = PRICING_TIERS[0];
    for (const tier of [...PRICING_TIERS].reverse()) {
        if (unitsThisMonth >= tier.min) { currentTier = tier; break; }
    }
    return { totalSpent, points, unitsThisMonth, currentTier, totalMargin };
  }, [orders]);

  const displayName = profile.business_name || profile.name || "Valued Partner";

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-[#20B2AA]" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      
      {/* ================= HEADER ================= */}
      <header className="bg-white sticky top-0 z-30 border-b border-slate-100 px-8 py-4 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-[#20B2AA] rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                 <Building2 className="text-white" size={20}/>
             </div>
             <div>
                 <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">{displayName}</h1>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <p className="text-xs text-slate-500 font-medium">Verified Distributor</p>
                 </div>
             </div>
         </div>

         <div className="flex items-center gap-6">
             <Link to="/catalog" className="hidden md:flex bg-[#20B2AA] hover:bg-[#1a908a] text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] shadow-md flex items-center gap-2 transition-all hover:-translate-y-0.5">
                <ShoppingBag size={16} /> Place Order
             </Link>
             
             {/* MENU PERFIL */}
             <div className="relative" ref={profileMenuRef}>
                 <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 pl-2 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200 transition-all group">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm overflow-hidden flex items-center justify-center relative">
                        {profile.image ? <img src={profile.image} alt="Profile" className="w-full h-full object-cover"/> : <User className="text-slate-300" size={20}/>}
                    </div>
                    <div className="text-left hidden md:block">
                        <p className="text-xs font-bold text-slate-900 leading-tight">My Account</p>
                        <p className="text-[9px] text-slate-400 font-medium">Settings</p>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}/>
                 </button>

                 {/* ====== MODAL FLOTANTE (MENÚ) ====== */}
                 {isProfileOpen && (
                    <div className="absolute right-0 mt-4 w-[420px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-5">
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                            <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2"><User size={16} className="text-[#20B2AA]"/> Account Profile</h3>
                            <button onClick={() => setIsProfileOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={18}/></button>
                        </div>
                        
                        <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar space-y-8">
                            
                            {/* Editor Foto */}
                            <div className="flex flex-col items-center justify-center">
                                <div className="relative w-28 h-28 rounded-full border-4 border-slate-50 shadow-inner overflow-hidden group bg-slate-100">
                                    {editForm.image ? <img src={editForm.image} className="w-full h-full object-cover"/> : <Building2 className="text-slate-300 m-auto mt-6" size={40}/>}
                                    <label className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center cursor-pointer">
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload}/>
                                        {uploadingPhoto ? <Loader2 className="text-white animate-spin" size={24}/> : <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24}/>}
                                    </label>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wide">Update Logo</p>
                            </div>

                            {/* CREDENCIALES */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                    <ShieldCheck size={14} className="text-[#20B2AA]"/>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Credentials</span>
                                </div>
                                <div className="relative group">
                                    <Mail size={16} className="absolute left-4 top-3.5 text-slate-400"/>
                                    <input disabled value={sessionEmail} className="w-full pl-12 pr-4 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs border border-transparent cursor-not-allowed"/>
                                </div>
                                
                                {/* INPUT PASSWORD LIMPIO */}
                                <div className="relative group">
                                    <Key size={16} className="absolute left-4 top-3.5 text-slate-400"/>
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        value={passwordData} 
                                        onChange={(e) => setPasswordData(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-[#20B2AA] outline-none transition-all placeholder:text-slate-400"
                                        placeholder="Enter your password"
                                    />
                                    <button 
                                        onClick={() => setShowPassword(!showPassword)} 
                                        className="absolute right-4 top-3.5 text-slate-400 hover:text-[#20B2AA] transition-colors"
                                        title={showPassword ? "Hide Password" : "Show Password"}
                                    >
                                        {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                                    </button>
                                </div>
                                <div className="flex items-start gap-2 px-2">
                                    <div className="min-w-[4px] h-[4px] rounded-full bg-[#20B2AA] mt-1.5"></div>
                                    <p className="text-[9px] text-slate-400 leading-relaxed">
                                        View or update your account password here.
                                    </p>
                                </div>
                            </div>

                            {/* Info de Negocio */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                    <FileText size={14} className="text-[#20B2AA]"/>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Info</span>
                                </div>
                                <input value={editForm.business_name || ''} onChange={(e) => setEditForm({...editForm, business_name: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#20B2AA]" placeholder="Business Name"/>
                                <div className="grid grid-cols-2 gap-3">
                                    <input value={editForm.vat_number || ''} onChange={(e) => setEditForm({...editForm, vat_number: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#20B2AA]" placeholder="VAT ID"/>
                                    <input value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#20B2AA]" placeholder="Contact Name"/>
                                </div>
                            </div>
                            
                            {/* Dirección */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                    <MapPin size={14} className="text-[#20B2AA]"/>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</span>
                                </div>
                                <input value={editForm.phone || ''} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#20B2AA]" placeholder="Phone"/>
                                <input value={editForm.address_line1 || ''} onChange={(e) => setEditForm({...editForm, address_line1: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#20B2AA]" placeholder="Address"/>
                                <div className="grid grid-cols-2 gap-3">
                                    <input value={editForm.city || ''} onChange={(e) => setEditForm({...editForm, city: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#20B2AA]" placeholder="City"/>
                                    <input value={editForm.postcode || ''} onChange={(e) => setEditForm({...editForm, postcode: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#20B2AA]" placeholder="Postcode"/>
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer Modal */}
                        <div className="p-4 bg-white border-t border-slate-100 flex gap-3 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                            <button onClick={handleLogout} className="px-4 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors flex items-center justify-center gap-2 flex-1 font-bold text-[10px] uppercase tracking-wider">
                                <LogOut size={14}/> Sign Out
                            </button>
                            <button onClick={handleSaveProfile} disabled={isSaving || uploadingPhoto} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#20B2AA] transition-all flex-[2] shadow-lg shadow-slate-200">
                                {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                 )}
             </div>
         </div>
      </header>

      {/* DASHBOARD CONTENT (Limpio) */}
      <div className="max-w-7xl mx-auto p-8 space-y-12 animate-in fade-in duration-700">
        
        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <CardStat title="Profit Margin" value={`£${stats.totalMargin.toFixed(0)}`} sub="Estimated Revenue" icon={DollarSign} color="emerald" />
            <CardStat title="Points Balance" value={stats.points.toLocaleString()} sub="Redeemable" icon={Zap} color="amber" />
            <CardStat title="Monthly Units" value={stats.unitsThisMonth.toString()} sub="Volume Progress" icon={Package} color="indigo" />
            <CardStat title="Total Orders" value={orders.length.toString()} sub="Lifetime History" icon={Activity} color="teal" />
        </div>

        {/* HISTORIAL Y NIVELES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de pedidos */}
            <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3"><ShoppingBag className="text-[#20B2AA]" size={20}/> Recent Orders</h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {orders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem] opacity-70">
                        <Package size={32} className="text-slate-300 mb-4" />
                        <p className="text-slate-900 font-black uppercase text-xs tracking-widest text-center">No orders yet</p>
                        <Link to="/catalog" className="mt-4 text-[#20B2AA] text-xs font-bold uppercase tracking-widest hover:underline">Start first order</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((o: any) => (
                        <div key={o?.id || Math.random()} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center hover:bg-white hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#20B2AA] border border-slate-200"><Package size={20}/></div>
                            <div>
                                <p className="font-black text-slate-900 uppercase text-xs tracking-wide">{o?.orderNumber || 'PENDING'}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{o?.date || 'Today'}</p>
                            </div>
                            </div>
                            <div className="text-right">
                            <p className="font-black text-slate-900 text-sm">£{Number(o?.total).toFixed(2)}</p>
                            <span className="text-[8px] uppercase font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 mt-1 inline-block">{o?.status || 'Processing'}</span>
                            </div>
                        </div>
                        ))}
                    </div>
                )}
                </div>
            </div>

            {/* Tarjeta oscura de niveles */}
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10"><Star size={180}/></div>
                <div className="relative z-10 mb-8">
                    <h3 className="text-[#C6FF00] font-black uppercase tracking-[0.3em] text-[10px] mb-2 flex items-center gap-2"><ShieldCheck size={14}/> Partner Tiers</h3>
                    <p className="text-3xl font-black tracking-tighter leading-none">Volume <br/>Discounts</p>
                </div>
                <div className="space-y-3 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
                {PRICING_TIERS.map((tier) => (
                    <div key={tier.name} className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${stats.currentTier.name === tier.name ? 'bg-[#C6FF00] border-[#C6FF00] text-slate-900 shadow-lg shadow-[#C6FF00]/20' : 'border-white/10 bg-white/5 opacity-60'}`}>
                    <div>
                        <span className="font-black text-xs uppercase block flex items-center gap-2">{tier.name} {stats.currentTier.name === tier.name && <div className="w-2 h-2 bg-slate-900 rounded-full animate-pulse"/>}</span>
                        <span className="text-[8px] uppercase font-bold opacity-70">{tier.min}+ units/mo</span>
                    </div>
                    <span className="font-black text-lg">-{tier.discount * 100}%</span>
                    </div>
                ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const CardStat = ({ title, value, sub, icon: Icon, color }: any) => {
  const colorMap: any = { teal: 'bg-[#20B2AA]', indigo: 'bg-indigo-600', amber: 'bg-[#f59e0b]', emerald: 'bg-emerald-500' };
  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:-translate-y-1 transition-all hover:shadow-md">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg ${colorMap[color]}`}><Icon size={20}/></div>
      <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.25em] mb-1">{title}</p>
      <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h4>
      <p className="text-slate-400 text-[9px] mt-1 font-bold italic opacity-60">{sub}</p>
    </div>
  );
};

export default DistributorPortal;