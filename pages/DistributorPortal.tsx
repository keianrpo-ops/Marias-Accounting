import React, { useMemo, useEffect, useState } from 'react';
import { ShoppingBag, Zap, Package, Star, DollarSign, Activity, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRICING_TIERS, PRODUCTS } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../services/supabase';
import { Order } from '../types';

const DistributorPortal: React.FC = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const allOrders = await db.orders.getAll();

        const myEmail = (localStorage.getItem('userEmail') || '').trim().toLowerCase();

        // ✅ DEBUG: ver qué está llegando realmente
        console.log('[DIST PORTAL] myEmail =>', myEmail);
        console.log('[DIST PORTAL] allOrders count =>', Array.isArray(allOrders) ? allOrders.length : 'NOT_ARRAY');
        if (Array.isArray(allOrders)) {
          console.log('[DIST PORTAL] sample(5) =>', allOrders.slice(0, 5));
          console.log(
            '[DIST PORTAL] wholesale emails(sample 10) =>',
            allOrders
              .filter((o: any) => o?.isWholesale)
              .slice(0, 10)
              .map((o: any) => ({ orderNumber: o?.orderNumber, clientEmail: o?.clientEmail, isWholesale: o?.isWholesale }))
          );
        }

        // ✅ Filtrar SOLO wholesale y SOLO del distribuidor actual (por email)
        // Importante: si myEmail está vacío, NO mostramos nada (evita fuga de datos)
        const wholesale = (Array.isArray(allOrders) ? allOrders : []).filter((o: any) => {
          const oEmail = String(o?.clientEmail || '').trim().toLowerCase();
          return Boolean(o?.isWholesale) && Boolean(myEmail) && oEmail === myEmail;
        });

        setOrders(wholesale);

        const savedNotifs = localStorage.getItem('mdc_notifications');
        if (savedNotifs) {
          try {
            const parsed = JSON.parse(savedNotifs);
            setNotifications(
              (Array.isArray(parsed) ? parsed : []).filter(
                (n: any) => n?.targetRole === 'distributor' || n?.targetRole === 'all'
              )
            );
          } catch {
            setNotifications([]);
          }
        }
      } catch (err) {
        console.error('[DIST PORTAL] loadData error =>', err);
        setOrders([]);
      }
    };

    loadData();

    // ✅ Cambios internos de la app (lo dispara el Catalog)
    const onDataChanged = () => loadData();

    // ✅ Cambios reales de localStorage (incluye __mdc_ping)
    const onStorage = (e: StorageEvent) => {
      // Opcional: si quieres filtrar, descomenta esto
      // if (e.key && !['__mdc_ping', 'mdc_orders', 'userEmail', 'mdc_notifications'].includes(e.key)) return;
      loadData();
    };

    window.addEventListener('mdc:datachanged', onDataChanged as any);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('mdc:datachanged', onDataChanged as any);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const stats = useMemo(() => {
    const safeOrders: any[] = Array.isArray(orders) ? orders : [];

    const totalSpent = safeOrders.reduce((sum, o) => sum + (Number(o?.total) || 0), 0);
    const points = Math.floor(totalSpent / 10);

    const unitsThisMonth = safeOrders.reduce((sum, o) => {
      const items = Array.isArray((o as any)?.items) ? (o as any).items : [];
      return sum + items.reduce((s: number, i: any) => s + (Number(i?.quantity) || 0), 0);
    }, 0);

    let totalMargin = 0;
    safeOrders.forEach((order: any) => {
      const items = Array.isArray(order?.items) ? order.items : [];
      items.forEach((item: any) => {
        const product = PRODUCTS.find((p) => p.name === item?.description);
        if (product) {
          totalMargin += (product.basePrice - (Number(item?.unitPrice) || 0)) * (Number(item?.quantity) || 0);
        }
      });
    });

    let currentTier = PRICING_TIERS[0];
    for (const tier of [...PRICING_TIERS].reverse()) {
      if (unitsThisMonth >= tier.min) {
        currentTier = tier;
        break;
      }
    }

    return { totalSpent, points, unitsThisMonth, currentTier, totalMargin };
  }, [orders]);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-5 py-1.5 bg-teal-50 text-[#20B2AA] text-[10px] font-black uppercase rounded-full tracking-[0.3em] border border-teal-100">
              Certified Partner
            </span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
            {t('distributor_panel').split(' ')[0]}{' '}
            <span className="text-[#FF6B9D]">{t('distributor_panel').split(' ')[2]}</span>
          </h2>

          <p className="text-slate-500 font-medium italic text-xl">Your B2B Central Operations Dashboard.</p>
        </div>

        <Link
          to="/catalog"
          className="bg-[#20B2AA] text-white px-12 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl flex items-center gap-3 hover:-translate-y-1 transition-all"
        >
          <ShoppingBag size={20} /> New Stock Order
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <CardStat
          title={t('distributor_tier')}
          value={stats.currentTier.name}
          sub={`${stats.currentTier.discount * 100}% Discount Applied`}
          icon={Star}
          color="indigo"
        />
        <CardStat
          title="Estimated Profit"
          value={`£${stats.totalMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          sub="Retail Margin Potential"
          icon={DollarSign}
          color="emerald"
        />
        <CardStat title="Partner Points" value={stats.points.toLocaleString()} sub="Redeemable Credits" icon={Zap} color="amber" />
        <CardStat
          title="Recent Activity"
          value={(notifications.length + orders.length).toString()}
          sub="Account Alerts"
          icon={Bell}
          color="teal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
              <Activity className="text-[#20B2AA]" /> Order History
            </h3>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
            {orders.length === 0 ? (
              <p className="text-slate-400 italic text-center py-10 font-bold uppercase tracking-widest text-[10px]">
                No historical data found
              </p>
            ) : (
              orders.map((o: any) => (
                <div
                  key={o?.id ?? o?.orderNumber ?? Math.random()}
                  className="p-6 bg-teal-50/30 rounded-[2rem] border border-teal-100/50 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#20B2AA] shadow-sm">
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 uppercase text-[11px]">{o?.orderNumber ?? '—'}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{o?.date ?? '—'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#20B2AA] text-sm">£{Number(o?.total ?? 0).toFixed(2)}</p>
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{o?.status ?? '—'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-3xl flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-black uppercase tracking-[0.4em] text-[11px] text-[#C6FF00]">MDC B2B Tiers</h3>
            <p className="text-4xl font-black tracking-tighter">Volume Incentives</p>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              The more units you move, the higher your partner discount becomes, maximizing your business ROI.
            </p>
          </div>

          <div className="pt-10 space-y-4">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`flex items-center justify-between p-6 rounded-3xl border ${
                  stats.currentTier.name === tier.name
                    ? 'bg-[#C6FF00]/10 border-[#C6FF00]'
                    : 'bg-white/5 border-white/5 opacity-50'
                }`}
              >
                <div>
                  <span className="font-black text-xs uppercase block">{tier.name}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{tier.min}+ units/mo</span>
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
  const colorMap: any = {
    teal: 'bg-[#20B2AA]',
    indigo: 'bg-indigo-600',
    amber: 'bg-[#f59e0b]',
    emerald: 'bg-emerald-500',
  };

  return (
    <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 hover:-translate-y-2 transition-all">
      <div className={`w-14 h-14 rounded-[1.8rem] flex items-center justify-center text-white mb-6 shadow-2xl ${colorMap[color]}`}>
        <Icon size={26} />
      </div>
      <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em] mb-2">{title}</p>
      <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
      <p className="text-slate-400 text-[10px] mt-2 font-bold italic">{sub}</p>
    </div>
  );
};

export default DistributorPortal;
