
import React from 'react';
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
  Globe
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';

interface LayoutProps {
  onLogout: () => void;
  role: UserRole;
}

const Layout: React.FC<LayoutProps> = ({ onLogout, role }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  const adminMenu = [
    { name: t('dashboard'), icon: LayoutDashboard, path: '/' },
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
    { name: 'Tienda B2B', icon: ShoppingBag, path: '/catalog' },
    { name: t('messages'), icon: MessageSquare, path: '/messages' },
    { name: 'Pedidos', icon: FileText, path: '/orders' },
  ];

  const menuItems = role === UserRole.ADMIN ? adminMenu : distributorMenu;

  return (
    <div className="flex h-screen overflow-hidden no-print flex-col md:flex-row font-sans bg-[#F1F1E6]">
      <aside className="hidden md:flex w-72 bg-[#E2E2D8] border-r border-[#D8D8CF] flex-col shrink-0 z-50">
        <div className="p-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-[#20B2AA] rounded-[1.6rem] flex items-center justify-center text-white shadow-2xl rotate-3 border-2 border-white/20">
             <Dog size={30} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">MDC <span className="text-[#FF6B9D]">PRO</span></h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">SAAS ENGINE</p>
          </div>
        </div>

        <nav className="flex-1 px-5 space-y-4 mt-12">
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
        </nav>

        <div className="p-10">
          <button 
            onClick={() => { onLogout(); navigate('/login'); }} 
            className="flex w-full items-center gap-5 px-7 py-5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[1.5rem] transition-all group border border-transparent hover:border-rose-100"
          >
            <LogOut size={20} className="transition-transform group-hover:translate-x-1" />
            <span className="text-[11px] font-black uppercase tracking-widest">{t('logout')}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 md:p-14 scrollbar-hide bg-[#F8F9FA] relative">
        <header className="flex justify-between items-center mb-10 no-print">
          <div className="flex items-center gap-6">
             <button onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} className="flex items-center gap-3 bg-white border border-slate-200 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-[#20B2AA] transition-all shadow-sm">
                <Globe size={14} className="text-[#20B2AA]"/> {language === 'en' ? 'ES' : 'EN'}
             </button>
             <div className="flex items-center gap-4 bg-white border border-slate-200 px-6 py-2.5 rounded-full shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-[#C6FF00] animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-900">NODE: UK_SOUTH_1</span>
             </div>
          </div>
          <NotificationCenter role={role} />
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
