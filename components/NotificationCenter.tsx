
import React, { useState, useEffect } from 'react';
import { Bell, ShoppingBag, CreditCard, AlertTriangle, UserPlus, Zap, X, Check } from 'lucide-react';
import { AppNotification, UserRole } from '../types';

interface NotificationCenterProps {
  role: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ role }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const loadNotifications = () => {
      const saved = JSON.parse(localStorage.getItem('mdc_notifications') || '[]');
      // Filtrar por rol
      const filtered = saved.filter((n: AppNotification) => n.targetRole === role || n.targetRole === 'all');
      setNotifications(filtered.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    };

    loadNotifications();
    // Escuchar eventos de storage para actualizar entre pestañas/componentes
    window.addEventListener('storage', loadNotifications);
    const interval = setInterval(loadNotifications, 3000); // Polling simple para demo

    return () => {
      window.removeEventListener('storage', loadNotifications);
      clearInterval(interval);
    };
  }, [role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    const all = JSON.parse(localStorage.getItem('mdc_notifications') || '[]');
    const updated = all.map((n: AppNotification) => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem('mdc_notifications', JSON.stringify(updated));
    setNotifications(updated.filter((n: any) => n.targetRole === role || n.targetRole === 'all'));
  };

  const clearAll = () => {
    const all = JSON.parse(localStorage.getItem('mdc_notifications') || '[]');
    const updated = all.map((n: AppNotification) => 
      (n.targetRole === role || n.targetRole === 'all') ? { ...n, read: true } : n
    );
    localStorage.setItem('mdc_notifications', JSON.stringify(updated));
    setNotifications(updated.filter((n: any) => n.targetRole === role || n.targetRole === 'all'));
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'order': return <ShoppingBag size={14} className="text-[#20B2AA]" />;
      case 'payment': return <CreditCard size={14} className="text-emerald-500" />;
      case 'stock': return <AlertTriangle size={14} className="text-amber-500" />;
      case 'client': return <UserPlus size={14} className="text-pink-500" />;
      default: return <Zap size={14} className="text-indigo-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all hover:shadow-md"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6B9D] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[140]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] border border-slate-200 shadow-2xl z-[150] overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Notificaciones</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Centro de Control MDC</p>
              </div>
              <button onClick={clearAll} className="text-[9px] font-black text-[#20B2AA] uppercase hover:underline">Limpiar</button>
            </div>

            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <Bell size={32} className="mx-auto text-slate-200 mb-4 opacity-50" />
                  <p className="text-[10px] font-black text-slate-400 uppercase">Sin novedades por ahora</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-5 border-b border-slate-50 flex gap-4 hover:bg-slate-50 transition-colors relative group ${!n.read ? 'bg-teal-50/20' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-[10px] font-black uppercase tracking-tight leading-none truncate pr-4 ${!n.read ? 'text-slate-900' : 'text-slate-500'}`}>{n.title}</p>
                        {!n.read && (
                          <button onClick={() => markAsRead(n.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500">
                            <Check size={12}/>
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 leading-tight line-clamp-2">{n.message}</p>
                      <p className="text-[8px] font-black text-slate-300 uppercase mt-2 tracking-tighter">{n.timestamp}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 bg-slate-50 text-center">
                <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">Ver todas las actividades</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
