
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Eye, Trash2, Clock, Calendar as CalendarIcon, FilterX, 
  FileText, CreditCard, TrendingUp, DollarSign, Users, 
  ArrowUpRight, BarChart3, AreaChart as AreaIcon, PieChart as PieIcon 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { InvoiceStatus, Invoice, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../services/supabase';

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.CLIENT);

  const loadData = async () => {
    const data = await db.invoices.getAll();
    setInvoices(data);
    const role = localStorage.getItem('userRole') as UserRole;
    setUserRole(role);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const isAdmin = userRole === UserRole.ADMIN;

  const deleteInvoice = async (id: string) => {
    if (!isAdmin) return;
    if (confirm('¿Eliminar registro de venta permanentemente? Esta acción es irreversible para la auditoría.')) {
      const updated = invoices.filter(inv => inv.id !== id);
      setInvoices(updated);
      localStorage.setItem('mdc_invoices', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = inv.clientName.toLowerCase().includes(search.toLowerCase()) || 
                           inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
      const invoiceDate = new Date(inv.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      let matchesDate = true;
      if (start && invoiceDate < start) matchesDate = false;
      if (end && invoiceDate > end) matchesDate = false;
      return matchesSearch && matchesDate;
    });
  }, [invoices, search, startDate, endDate]);

  const stats = useMemo(() => {
    const total = filteredInvoices.reduce((sum, i) => sum + i.total, 0);
    const avgTicket = filteredInvoices.length > 0 ? total / filteredInvoices.length : 0;
    const paidCount = filteredInvoices.filter(i => i.status === InvoiceStatus.PAID).length;
    const collectionRate = filteredInvoices.length > 0 ? (paidCount / filteredInvoices.length) * 100 : 0;

    const timeData = [...filteredInvoices]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(inv => ({ date: inv.date, amount: inv.total }));

    return { total, avgTicket, collectionRate, timeData, count: filteredInvoices.length };
  }, [filteredInvoices]);

  const resetFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{t('sales')} & <span className="text-[#FF6B9D]">{t('sales_income').split(' ')[2]}</span></h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 italic">{t('business_intelligence')}</p>
        </div>
        {isAdmin && (
          <button onClick={() => navigate('/invoices/new')} className="bg-[#20B2AA] text-white px-8 py-4 rounded-full font-black uppercase text-[10px] shadow-2xl tracking-widest hover:scale-105 transition-all flex items-center gap-3">
            {t('register_operation')} <ArrowUpRight size={16}/>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title={t('total_income')} value={`£${stats.total.toLocaleString()}`} icon={DollarSign} color="teal" sub={`${stats.count} ${t('transactions')}`} />
          <KPICard title={t('avg_ticket')} value={`£${stats.avgTicket.toFixed(2)}`} icon={Users} color="rose" sub={t('per_client')} />
          <KPICard title={t('collection_rate')} value={`${stats.collectionRate.toFixed(1)}%`} icon={TrendingUp} color="indigo" sub={t('paid_invoices')} />
        </div>
        <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase text-teal-400 tracking-widest mb-4">{t('income_trend')}</p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.timeData}>
                <Area type="monotone" dataKey="amount" stroke="#20B2AA" fill="#20B2AA33" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 refined-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/20">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-wider outline-none focus:ring-4 focus:ring-teal-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center bg-white p-1.5 rounded-2xl border border-slate-200">
             <div className="flex items-center gap-2 px-3">
                <CalendarIcon size={14} className="text-slate-400" />
                <input type="date" className="bg-transparent border-none text-[10px] font-black uppercase outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
             </div>
             <span className="text-slate-200 font-light">|</span>
             <div className="flex items-center gap-2 px-3">
                <input type="date" className="bg-transparent border-none text-[10px] font-black uppercase outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
             </div>
             {(startDate || endDate || search) && (
               <button onClick={resetFilters} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><FilterX size={16} /></button>
             )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">{t('operation')}</th>
                <th className="px-8 py-5">{t('counterparty')}</th>
                <th className="px-8 py-5">{t('date')}</th>
                <th className="px-8 py-5 text-right">{t('net_amount')}</th>
                <th className="px-8 py-5 text-center">{t('status')}</th>
                <th className="px-8 py-5 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={6} className="py-24 text-center text-slate-300 text-[11px] font-black uppercase tracking-widest italic">{t('no_records')}</td></tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                       <p className="text-[12px] font-black text-slate-900 tracking-tight">{inv.invoiceNumber}</p>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">{inv.paymentMethod || 'Secure Card'}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 ${inv.isWholesale ? 'bg-teal-50 text-[#20B2AA]' : 'bg-pink-50 text-[#FF6B9D]'} rounded-xl flex items-center justify-center font-black text-[11px]`}>{inv.clientName.charAt(0)}</div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs leading-none uppercase">{inv.clientName}</p>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-1.5 inline-block ${inv.isWholesale ? 'bg-teal-100/50 text-teal-600' : 'bg-pink-100/50 text-pink-600'}`}>{inv.isWholesale ? t('wholesale') : t('retail')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-slate-500 text-[11px] font-bold uppercase">{inv.date}</td>
                    <td className="px-8 py-6 text-right font-black text-slate-900 text-[15px] tracking-tight">£{inv.total.toFixed(2)}</td>
                    <td className="px-8 py-6 text-center">
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                         inv.status === InvoiceStatus.PAID ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                       }`}>
                         {inv.status}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button onClick={() => navigate(`/invoices/edit/${inv.id}`)} className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-[#20B2AA] transition-all"><FileText size={16}/></button>
                        {isAdmin && (
                          <button onClick={() => deleteInvoice(inv.id)} className="p-2.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, color, sub }: any) => {
  const colors: any = { 
    teal: 'bg-[#20B2AA] text-white', 
    rose: 'bg-[#FF6B9D] text-white', 
    indigo: 'bg-indigo-600 text-white' 
  };
  return (
    <div className="bg-white p-7 rounded-[2.5rem] border border-slate-200 flex items-center gap-6 shadow-sm hover:shadow-md transition-all">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl ${colors[color]}`}><Icon size={24} /></div>
      <div>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-none mb-1.5">{title}</p>
        <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</h4>
        {sub && <p className="text-[9px] font-black text-slate-300 uppercase mt-1.5">{sub}</p>}
      </div>
    </div>
  );
};

export default Invoices;
