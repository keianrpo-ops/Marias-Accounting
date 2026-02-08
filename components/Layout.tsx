import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut,
  Dog,
  Receipt,
  Package,
  ShoppingBag,
  MessageSquare,
  Globe,
  Truck,
  User,
  ChevronDown,
  ExternalLink,
  UserCog, // Icono para editar perfil
  Camera,
  X,
  Save,
  Loader
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { supabase } from '../services/supabase';

interface LayoutProps {
  onLogout: () => void;
  role: UserRole;
}

const Layout: React.FC<LayoutProps> = ({ onLogout, role }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState({ name: 'User', email: '', image: null as string | null, id: '' });

  // --- ESTADOS PARA EL MODAL DE EDICIÓN DE PERFIL ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const name = user.user_metadata?.full_name || 'Usuario';
            const image = user.user_metadata?.avatar_url || null;
            const email = user.email || '';
            
            setUserData({
                id: user.id,
                name: name,
                email: email,
                image: image
            });

            // Pre-llenar formulario de edición
            setEditForm({ fullName: name, email: email });
            setAvatarPreview(image);
        }
    };
    fetchUser();
  }, []);

  // --- LÓGICA DE EDICIÓN DE PERFIL ---
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let avatarUrl = userData.image;

      // 1. Subir imagen si existe
      if (avatarFile && userData.id) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userData.id}/${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        avatarUrl = publicUrl;
      }

      // 2. Actualizar Auth User
      const { error: updateError } = await supabase.auth.updateUser({
        email: editForm.email, // Nota: cambiar email suele requerir confirmación
        data: {
          full_name: editForm.fullName,
          avatar_url: avatarUrl
        }
      });

      if (updateError) throw updateError;

      // 3. Actualizar estado local
      setUserData(prev => ({
        ...prev,
        name: editForm.fullName,
        email: editForm.email,
        image: avatarUrl
      }));

      setIsEditModalOpen(false);
      setIsProfileOpen(false); // Cerrar dropdown también
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar perfil. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- MENÚS ---
  const adminMenu = [
    { name: t('dashboard'), icon: LayoutDashboard, path: '/' },
    { name: 'PEDIDOS', icon: Truck, path: '/orders' },
    { name: t('sales'), icon: FileText, path: '/invoices' },
    { name: t('messages'), icon: MessageSquare, path: '/messages' },
    { name: t('expenses'), icon: Receipt, path: '/expenses' },
    { name: t('inventory'), icon: Package, path: '/inventory' },
    { name: t('clients'), icon: Users, path: '/clients' },
    { name: t('reports'), icon: BarChart3, path: '/reports' },
    { name: t('settings'), icon: SettingsIcon, path: '/settings' },
  ];

  const distributorMenu = [
    { name: t('dashboard'), icon: LayoutDashboard, path: '/' },
    { name: 'CATÁLOGO B2B', icon: ShoppingBag, path: '/catalog' },
    { name: 'MIS FACTURAS', icon: FileText, path: '/orders' },
    { name: t('messages'), icon: MessageSquare, path: '/messages' },
  ];

  const clientMenu = [
    { name: 'INICIO', icon: LayoutDashboard, path: '/' },
    { name: 'TIENDA ONLINE', icon: ShoppingBag, path: '/catalog' },
    { name: 'MIS PEDIDOS', icon: Package, path: '/orders' },
    { name: 'MENSAJES', icon: MessageSquare, path: '/messages' },
  ];

  let menuItems = adminMenu;
  if (role === UserRole.DISTRIBUTOR) menuItems = distributorMenu;
  else if (role !== UserRole.ADMIN) menuItems = clientMenu;

  const isClient = role !== UserRole.ADMIN && role !== UserRole.DISTRIBUTOR;

  return (
    <div className="flex h-screen overflow-hidden no-print flex-col md:flex-row font-sans bg-[#F1F1E6]">
      
      {/* --- SIDEBAR --- */}
      <aside className="hidden md:flex w-72 bg-[#E2E2D8] border-r border-[#D8D8CF] flex-col shrink-0 z-50">
        
        {/* LOGO */}
        <div className="p-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-[#20B2AA] rounded-[1.6rem] flex items-center justify-center text-white shadow-2xl rotate-3 border-2 border-white/20">
             <Dog size={30} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">MDC <span className="text-[#FF6B9D]">PRO</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">
                {isClient ? 'PET LOVERS' : 'SAAS ENGINE'}
            </p>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 px-5 space-y-4 mt-8 overflow-y-auto no-scrollbar pb-10">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-5 px-7 py-5 rounded-[2rem] transition-all duration-500 group relative ${
                  isActive 
                  ? 'bg-white text-slate-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] font-black' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 w-1.5 h-10 bg-[#20B2AA] rounded-r-full shadow-[4px_0_15px_rgba(32,178,170,0.5)]" />
                )}
                <Icon size={20} className={`transition-all duration-500 ${isActive ? 'text-[#20B2AA] scale-125 rotate-3' : 'text-slate-400 group-hover:text-slate-900'}`} />
                <span className={`text-[11px] uppercase tracking-[0.2em] ${isActive ? 'translate-x-1' : ''}`}>{item.name}</span>
              </Link>
            );
          })}

          {isClient && (
             <div className="pt-6 mt-4 border-t border-slate-300/50 mx-2">
                <p className="px-5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Servicios</p>
                <a
                  href="https://www.mariasdogcorner.co.uk/#services"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-5 px-7 py-5 rounded-[2rem] text-slate-500 hover:text-[#FF6B9D] hover:bg-white/40 transition-all group"
                >
                  <Dog size={20} className="group-hover:text-[#FF6B9D] transition-colors" />
                  <span className="text-[11px] uppercase tracking-[0.2em] font-bold">Agendar Cuidado</span>
                  <ExternalLink size={14} className="ml-auto opacity-50"/>
                </a>
             </div>
          )}
        </nav>

        {/* --- FOOTER SIDEBAR LIMPIO --- */}
        <div className="p-5 mt-auto border-t border-[#D8D8CF]/50">
             <button 
                onClick={() => { onLogout(); navigate('/login'); }} 
                className="flex w-full items-center gap-5 px-7 py-4 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-[1.5rem] transition-all group"
             >
                <LogOut size={20} className="transition-transform group-hover:-translate-x-1" />
                <span className="text-[11px] font-black uppercase tracking-widest">{t('logout')}</span>
             </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto p-8 md:p-14 scrollbar-hide bg-[#F8F9FA] relative">
        <header className="flex justify-between items-center mb-10 no-print">
          
          <div className="flex items-center gap-6">
             <button onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} className="flex items-center gap-3 bg-white border border-slate-200 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-[#20B2AA] transition-all shadow-sm">
                <Globe size={14} className="text-[#20B2AA]"/> {language === 'en' ? 'ES' : 'EN'}
             </button>
             <div className="hidden md:flex items-center gap-4 bg-white border border-slate-200 px-6 py-2.5 rounded-full shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-[#C6FF00] animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-900">SYSTEM: ONLINE</span>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
              <NotificationCenter role={role} />
              
              {/* --- PERFIL PRINCIPAL (DROPDOWN) --- */}
              <div className="relative z-50">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 bg-white p-2 pl-4 rounded-full border border-slate-200 hover:border-[#20B2AA] transition-all shadow-sm hover:shadow-md group"
                  >
                      <span className="text-[10px] font-black uppercase text-slate-600 hidden sm:block group-hover:text-slate-900">
                          {userData.name.split(' ')[0]}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-100 flex items-center justify-center">
                          {userData.image ? (
                              <img src={userData.image} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                              <User size={18} className="text-slate-400" />
                          )}
                      </div>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}/>
                  </button>

                  {isProfileOpen && (
                      <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                          <div className="absolute right-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                              
                              {/* Header del Menú */}
                              <div className="flex items-center gap-4 p-4 border-b border-slate-50 mb-2">
                                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                                     {userData.image ? (
                                        <img src={userData.image} className="w-full h-full rounded-full object-cover"/>
                                     ) : (
                                        <User size={20} />
                                     )}
                                  </div>
                                  <div className="overflow-hidden">
                                      <p className="text-xs font-black text-slate-900 uppercase truncate">{userData.name}</p>
                                      <p className="text-[10px] text-slate-400 truncate">{userData.email}</p>
                                  </div>
                              </div>
                              
                              {/* --- MODIFICADO: BOTÓN QUE ABRE EL MODAL (EN VEZ DE LINK A SETTINGS) --- */}
                              <button 
                                onClick={() => {
                                    setIsEditModalOpen(true);
                                    setIsProfileOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-[#20B2AA] hover:bg-slate-50 rounded-xl transition-all text-left"
                              >
                                  <UserCog size={16} />
                                  <span className="text-[11px] font-bold uppercase tracking-wide">Editar Perfil & Foto</span>
                              </button>

                              <Link 
                                to="/" 
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-[#20B2AA] hover:bg-slate-50 rounded-xl transition-all"
                              >
                                  <LayoutDashboard size={16} />
                                  <span className="text-[11px] font-bold uppercase tracking-wide">Dashboard</span>
                              </Link>
                              
                              <div className="h-px bg-slate-100 my-2"></div>

                              <button 
                                onClick={() => { onLogout(); navigate('/login'); }} 
                                className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                              >
                                  <LogOut size={16} />
                                  <span className="text-[11px] font-bold uppercase tracking-wide">Cerrar Sesión</span>
                              </button>
                          </div>
                      </>
                  )}
              </div>
          </div>
        </header>
        
        {/* Renderizado de vistas hijas */}
        <Outlet />

        {/* --- MODAL DE EDICIÓN DE PERFIL (OVERLAY) --- */}
        {isEditModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsEditModalOpen(false)} />
                
                <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200">
                    <button 
                        onClick={() => setIsEditModalOpen(false)}
                        className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all"
                    >
                        <X size={18} />
                    </button>

                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-[#20B2AA]/10 text-[#20B2AA] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <UserCog size={32} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Editar Perfil</h2>
                        <p className="text-xs text-slate-400 mt-2 font-medium">Actualiza tu información personal</p>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        {/* Selector de Foto */}
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="relative group cursor-pointer">
                                <div className="w-28 h-28 rounded-full border-4 border-slate-50 shadow-inner overflow-hidden bg-slate-100 relative">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <User size={40} />
                                        </div>
                                    )}
                                    
                                    {/* Overlay al pasar mouse */}
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="text-white drop-shadow-md" size={24} />
                                    </div>
                                </div>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Click para cambiar foto</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre Completo</label>
                                <input 
                                    type="text" 
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] focus:bg-white transition-all"
                                    placeholder="Tu Nombre"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Correo Electrónico</label>
                                <input 
                                    type="email" 
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] focus:bg-white transition-all"
                                    placeholder="tu@email.com"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="w-full bg-[#20B2AA] hover:bg-[#1a9f97] text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-[#20B2AA]/30 flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader size={16} className="animate-spin" />
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        <span>Guardar Cambios</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default Layout;