
import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, ChevronRight, Activity, Star, BarChart3, Dog, Zap, 
  Award, Flame, Filter, ShoppingBag, Briefcase, Calendar, 
  ChevronDown, ArrowUpRight, Target, Clock, RefreshCw, Plus
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { VAT_THRESHOLD, InvoiceStatus, Invoice } from '../types';
import { PRODUCTS, SERVICES } from '../constants';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const COLORS = ['#20B2AA', '#FF6B9D', '#6366f1', '#C6FF00', '#FFB347'];

type CategoryFilter = 'all' | 'snack' | 'service';
type DatePreset = 'today' | '7d' | '30d' | 'thisMonth' | 'all';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');

  useEffect(() => {
    const loadData = () => {
      setInvoices(JSON.parse(localStorage.getItem('mdc_invoices') || '[]'));
      setExpenses(JSON.parse(localStorage.getItem('mdc_expenses') || '[]'));
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return invoices.filter(inv => {
      const invDate = new Date(inv.date);
      if (datePreset === 'all') return true;
      if (datePreset === 'today') return invDate >= today;
      if (datePreset === '7d') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return invDate >= weekAgo;
      }
      if (datePreset === '30d') {
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        return invDate >= monthAgo;
      }
      if (datePreset === 'thisMonth') {
        return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [invoices, datePreset]);

  const stats = useMemo(() => {
    const paidInvoices = filteredInvoices.filter(i => 
      i.status === InvoiceStatus.PAID || 
      (i.status as any) === 'Pagada' || 
      (i.status as any) === 'PAID'
    );
    
    let wholesaleIncome = 0;
    let retailSnackIncome = 0;
    let retailServiceIncome = 0;

    const salesData: { [key: string]: { qty: number, revenue: number } } = {};

    paidInvoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!salesData[item.description]) salesData[item.description] = { qty: 0, revenue: 0 };
        salesData[item.description].qty += Number(item.quantity);
        salesData[item.description].revenue += Number(item.total);

        const isService = SERVICES.some(s => s.name === item.description);
        if (inv.isWholesale) wholesaleIncome += item.total;
        else if (isService) retailServiceIncome += item.total;
        else retailSnackIncome += item.total;
      });
    });

    const allItems = [
      ...PRODUCTS.map(p => ({ ...p, type: 'snack', revenue: salesData[p.name]?.revenue || 0, qty: salesData[p.name]?.qty || 0 })),
      ...SERVICES.map(s => ({ ...s, name: s.name, basePrice: s.price, type: 'service', revenue: salesData[s.name]?.revenue || 0, qty: salesData[s.name]?.qty || 0 }))
    ].sort((a, b) => b.revenue - a.revenue);

    const totalIncome = wholesaleIncome + retailSnackIncome + retailServiceIncome;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const compositionData = [
      { name: 'B2B Wholesale', value: wholesaleIncome },
      { name: 'Retail Snacks', value: retailSnackIncome },
      { name: 'Dog Care Services', value: retailServiceIncome },
    ].filter(d => d.value > 0);

    return { 
      totalIncome, totalExpenses, profit: totalIncome - totalExpenses,
      wholesaleIncome, retailSnackIncome, retailServiceIncome,
      allItems, compositionData
    };
  }, [filteredInvoices, expenses]);

  const displayedItems = useMemo(() => {
    if (activeCategory === 'all') return stats.allItems;
    return stats.allItems.filter(item => item.type === activeCategory);
  }, [stats.allItems, activeCategory]);

  const vatPercentage = Math.min((stats.totalIncome / VAT_THRESHOLD) * 100, 100);

  const dateLabels: Record<DatePreset, string> = {
    all: 'All Time',
    today: 'Today',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    thisMonth: 'This Month'
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24">
      
      {/* SaaS SUPER HEADER */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-[#C6FF00] shadow-2xl">
            <Activity size={32}/>
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">
              AUDIT<span className="text-[#20B2AA]">PRO</span>
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {t('operating_status')}: {t('healthy')}
              </span>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                Node: UK_SOUTH_1
              </p>
            </div>
          </div>
        </div>

        {/* DATE RANGE FILTER BAR */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-[2rem] border border-slate-200 shadow-inner">
          {(Object.keys(dateLabels) as DatePreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => setDatePreset(preset)}
              className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                datePreset === preset 
                ? 'bg-slate-900 text-white shadow-lg scale-105' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {dateLabels[preset]}
            </button>
          ))}
          <div className="h-6 w-[1px] bg-slate-200 mx-2 hidden md:block" />
          <button 
            onClick={() => navigate('/invoices/new')}
            className="bg-[#20B2AA] text-white px-8 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-teal-600 transition-all shadow-xl"
          >
            <Plus size={14}/> {t('register_sale')}
          </button>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-2 bg-slate-900 p-12 rounded-[4.5rem] text-white shadow-3xl relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transition-transform duration-1000 group-hover:rotate-12">
            <TrendingUp size={300}/>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-teal-400 text-[11px] font-black uppercase tracking-[0.4em]">Period Revenue</h3>
               <div className="px-4 py-1.5 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                 {dateLabels[datePreset]}
               </div>
            </div>
            <p className="text-8xl font-black tracking-tighter">£{stats.totalIncome.toLocaleString()}</p>
            
            <div className="grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-white/5">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Wholesale B2B</p>
                <p className="text-2xl font-black text-teal-400">£{stats.wholesaleIncome.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Retail Snacks</p>
                <p className="text-2xl font-black text-amber-400">£{stats.retailSnackIncome.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Dog Services</p>
                <p className="text-2xl font-black text-[#FF6B9D]">£{stats.retailServiceIncome.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl flex flex-col items-center">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 text-center">Revenue Mix</h3>
          {stats.compositionData.length > 0 ? (
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={stats.compositionData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value">
                        {stats.compositionData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                     </Pie>
                     <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 text-center px-10">
              <BarChart3 size={40} className="mb-4 opacity-20" />
              <p className="italic text-[10px] font-bold uppercase tracking-widest leading-relaxed">Awaiting First Transactions</p>
            </div>
          )}
        </div>

        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl flex flex-col justify-between group">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{t('vat_threshold')}</h3>
            <p className="text-4xl font-black text-slate-900 tracking-tighter">£{stats.totalIncome.toLocaleString()}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-3 italic tracking-widest">Annual Limit: £90,000</p>
          </div>
          <div className="space-y-6 pt-10 border-t border-slate-50">
            <div className="flex justify-between items-end">
              <span className="text-4xl font-black text-slate-900">{vatPercentage.toFixed(1)}%</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Used</span>
            </div>
            <div className="h-6 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1.5 shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${vatPercentage > 80 ? 'bg-rose-500' : 'bg-[#20B2AA]'}`} 
                style={{ width: `${vatPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* PERFORMANCE MASTER SECTION WITH TABS */}
      <div className="bg-white rounded-[4.5rem] border border-slate-100 shadow-3xl overflow-hidden">
        <div className="p-12 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row justify-between items-center gap-10">
          <div>
             <h3 className="text-[16px] font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-4">
               <Star size={24} className="text-amber-400 fill-amber-400"/> PERFORMANCE CATALOG
             </h3>
             <p className="text-[11px] font-bold text-slate-400 uppercase mt-2 tracking-widest flex items-center gap-2">
               <Clock size={14}/> Tracking 11 Strategic Assets for {dateLabels[datePreset]}
             </p>
          </div>

          {/* CATEGORY TABS */}
          <div className="bg-white p-2 rounded-full border border-slate-200 flex items-center shadow-sm">
            <button 
              onClick={() => setActiveCategory('all')}
              className={`px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                activeCategory === 'all' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Filter size={14}/> All (11)
            </button>
            <button 
              onClick={() => setActiveCategory('snack')}
              className={`px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                activeCategory === 'snack' ? 'bg-[#20B2AA] text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ShoppingBag size={14}/> Snacks (6)
            </button>
            <button 
              onClick={() => setActiveCategory('service')}
              className={`px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                activeCategory === 'service' ? 'bg-[#FF6B9D] text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Briefcase size={14}/> Services (5)
            </button>
          </div>
        </div>

        <div className="p-12">
          <div className="grid grid-cols-1 gap-8">
            {displayedItems.map((item, idx) => {
              const isService = item.type === 'service';
              const share = stats.totalIncome > 0 ? (item.revenue / stats.totalIncome) * 100 : 0;
              const isTop = idx === 0 && item.revenue > 0;
              
              return (
                <div key={idx} className="flex flex-col md:flex-row items-center gap-12 p-8 bg-white rounded-[3.5rem] border border-slate-100 hover:border-slate-300 hover:shadow-2xl transition-all group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-64 h-64 opacity-[0.02] pointer-events-none transition-all duration-700 group-hover:scale-125 group-hover:opacity-[0.06] ${isService ? 'bg-pink-500' : 'bg-teal-500'} blur-[100px] rounded-full`} />

                  {/* FIXED: Added overflow-visible to the parent and moved the badge to be correctly visible */}
                  <div className="w-32 h-32 relative shrink-0">
                    <div className="w-full h-full rounded-[2.5rem] bg-slate-50 overflow-hidden border border-slate-100 flex items-center justify-center shadow-inner group-hover:shadow-md transition-all">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                      ) : (
                        <span className="text-5xl">{item.icon}</span>
                      )}
                    </div>
                    {/* Badge moved here to avoid being cut by overflow-hidden */}
                    <div className="absolute -top-2 -left-2 w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xs shadow-xl ring-4 ring-white z-10">
                      {idx + 1}
                    </div>
                  </div>

                  <div className="flex-1 space-y-5 w-full">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                           <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none group-hover:text-[#20B2AA] transition-colors">{item.name}</h4>
                           <div className="flex items-center gap-3 mt-4">
                              <span className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${isService ? 'bg-pink-50 text-pink-500 border-pink-100' : 'bg-teal-50 text-teal-500 border-teal-100'}`}>
                                {isService ? 'Dog Care Asset' : 'Gourmet Snack'}
                              </span>
                              {isTop && <span className="px-5 py-1.5 bg-amber-400 text-slate-900 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-100"><Flame size={12} fill="currentColor"/> Performance Leader</span>}
                           </div>
                        </div>
                        <div className="text-left md:text-right">
                           <p className="text-4xl font-black text-slate-900 leading-none">£{item.revenue.toLocaleString()}</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">{item.qty} Sales Record</p>
                        </div>
                     </div>
                     
                     <div className="relative pt-4">
                        <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5 shadow-inner">
                           <div className={`h-full rounded-full transition-all duration-1000 ease-out ${isService ? 'bg-[#FF6B9D]' : 'bg-[#20B2AA]'}`} style={{ width: `${stats.allItems[0].revenue > 0 ? (item.revenue / stats.allItems[0].revenue) * 100 : 0}%` }} />
                        </div>
                        <div className="flex justify-between mt-3 px-1">
                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Volume Share: {share.toFixed(1)}%</span>
                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Base Rate: £{item.basePrice.toFixed(2)}</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="shrink-0">
                     <button onClick={() => navigate('/reports')} className="w-16 h-16 bg-white border border-slate-200 rounded-[1.5rem] flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-[#20B2AA] hover:bg-teal-50 transition-all hover:shadow-xl group/btn active:scale-95">
                        <ArrowUpRight size={24} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform"/>
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex items-center justify-center gap-3">
          <RefreshCw size={14} className="text-slate-300 animate-spin-slow" />
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Audit Synchronization Active</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
