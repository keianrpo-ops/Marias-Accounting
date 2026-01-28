
import React, { useMemo, useEffect, useState } from 'react';
import { ShoppingBag, Zap, Clock, TrendingUp, Package, ChevronRight, Star, Heart, TrendingDown, DollarSign, Activity, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRICING_TIERS, PRODUCTS } from '../constants';
import { useLanguage } from '../context/LanguageContext';

const DistributorPortal: React.FC = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  useEffect(() => {
    const loadData = () => {
      const savedOrders = localStorage.getItem('mdc_invoices');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders).filter((i: any) => i.isWholesale));
      }
      const savedNotifs = localStorage.getItem('mdc_notifications');
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs).filter((n: any) => n.targetRole === 'distributor' || n.targetRole === 'all'));
      }
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    const points = Math.floor(totalSpent / 10);
    const unitsThisMonth = orders.reduce((sum, o) => sum + o.items.reduce((s: number, i: any) => s + i.quantity, 0), 0);
    
    let totalMargin = 0;
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const product = PRODUCTS.find(p => p.name === item.description);
        if (product) {
          totalMargin += (product.basePrice - item.unitPrice) * item.quantity;
        }
      });
    });

    let currentTier = PRICING_TIERS[0];
    for (const tier of [...PRICING_TIERS].reverse()) {
      if (unitsThisMonth >= tier.min) { currentTier = tier; break; }
    }

    return { totalSpent, points, unitsThisMonth, currentTier, totalMargin };
  }, [orders]);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <span className="px-5 py-1.5 bg-teal-50 text-[#20B2AA] text-[10px] font-black uppercase rounded-full tracking-[0.3em] border border-teal-100">Partner Autorizado</span>
             <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">{t('distributor_panel').split(' ')[0]} <span className="text-[#FF6B9D]">{t('distributor_panel').split(' ')[2]}</span></h2>
          <p className="text-slate-500 font-medium italic text-xl">Tu central de operaciones B2B Maria's Dog Corner.</p>
        </div>
        <Link to="/catalog" className="bg-[#20B2AA] text-white px-12 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl flex items-center gap-3 hover:-translate-y-1 transition-all">
          <ShoppingBag size={20} /> Nueva Compra Stock
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <CardStat title={t('distributor_tier')} value={stats.currentTier.name} sub={`${(stats.currentTier.discount * 100)}% ${t('discount')}`} icon={Star} color="indigo" />
        <CardStat title={t('earned_margin')} value={`£${stats.totalMargin.toLocaleString(undefined, {minimumFractionDigits: 2})}`} sub="Margen Retail Generado" icon={DollarSign} color="emerald" />
        <CardStat title={t('accumulated_points')} value={stats.points.toLocaleString()} sub="Puntos Disponibles" icon={Zap} color="amber" />
        <CardStat title="Actividad Reciente" value={notifications.length.toString()} sub="Alertas de cuenta" icon={Bell} color="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Historial de Movimientos Integrado */}
        <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4"><Activity className="text-[#20B2AA]" /> Movimientos de Cuenta</h3>
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
            {notifications.length === 0 && orders.length === 0 ? (
              <p className="text-slate-400 italic text-center py-10 font-bold uppercase tracking-widest text-[10px]">Sin actividad registrada</p>
            ) : (
              <>
                {/* Combinamos órdenes y notificaciones para un feed real */}
                {notifications.slice(0, 5).map(n => (
                  <div key={n.id} className="p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-slate-100 transition-all flex items-start gap-5">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm"><Bell size={16} className="text-amber-500" /></div>
                    <div>
                      <p className="text-[11px] font-black text-slate-900 uppercase">{n.title}</p>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">{n.message}</p>
                      <p className="text-[8px] font-black text-slate-300 uppercase mt-2">{n.timestamp}</p>
                    </div>
                  </div>
                ))}
                {orders.map(o => (
                  <div key={o.id} className="p-6 bg-teal-50/30 rounded-[2rem] border border-teal-100/50 flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#20B2AA] shadow-sm"><Package size={18}/></div>
                      <div>
                        <p className="font-black text-slate-900 uppercase text-[11px]">Compra Stock {o.invoiceNumber}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{o.date}</p>
                      </div>
                    </div>
                    <p className="font-black text-[#20B2AA] text-sm">£{o.total.toFixed(2)}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-3xl flex flex-col justify-between">
           <div className="space-y-6">
              <h3 className="font-black uppercase tracking-[0.4em] text-[11px] text-[#C6FF00]">MDC B2B Tiers</h3>
              <p className="text-4xl font-black tracking-tighter">Beneficio por Volumen</p>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">Cuantas más unidades muevas al mes, más barato compras y mayor es tu margen de ganancia al vender al PVP sugerido.</p>
           </div>
           <div className="pt-10 space-y-4">
              {PRICING_TIERS.map(tier => (
                <div key={tier.name} className={`flex items-center justify-between p-6 rounded-3xl border ${stats.currentTier.name === tier.name ? 'bg-[#C6FF00]/10 border-[#C6FF00]' : 'bg-white/5 border-white/5 opacity-50'}`}>
                   <div>
                     <span className="font-black text-xs uppercase block">{tier.name}</span>
                     <span className="text-[9px] font-bold text-slate-400 uppercase">{tier.min}+ unidades</span>
                   </div>
                   <span className="font-black text-[#C6FF00] text-xl">-{tier.discount * 100}%</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const CardStat = ({ title, value, sub, icon: Icon, color }: any) => {
  const colorMap: any = { teal: 'bg-[#20B2AA]', indigo: 'bg-indigo-600', amber: 'bg-[#f59e0b]', emerald: 'bg-emerald-500' };
  return (
    <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 hover:-translate-y-2 transition-all">
       <div className={`w-14 h-14 rounded-[1.8rem] flex items-center justify-center text-white mb-6 shadow-2xl ${colorMap[color]}`}><Icon size={26} /></div>
       <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em] mb-2">{title}</p>
       <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
       <p className="text-slate-400 text-[10px] mt-2 font-bold italic">{sub}</p>
    </div>
  );
};

export default DistributorPortal;
