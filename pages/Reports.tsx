
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, TrendingUp, Scale, Star, Activity, ShieldCheck, DollarSign, BarChart3, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PRODUCTS, SERVICES } from '../constants';
import { InvoiceStatus, Invoice, InvoiceItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

const COLORS = ['#20B2AA', '#FF6B9D', '#FFB347', '#6366f1', '#C6FF00'];

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    setInvoices(JSON.parse(localStorage.getItem('mdc_invoices') || '[]'));
    setExpenses(JSON.parse(localStorage.getItem('mdc_expenses') || '[]'));
  }, []);

  const financialStats = useMemo(() => {
    const paidInvoices = invoices.filter(i => i.status === InvoiceStatus.PAID || (i.status as any) === 'Pagada');
    
    let wholesaleIncome = 0;
    let retailSnackIncome = 0;
    let retailServiceIncome = 0;

    const saborPerformance: { [key: string]: number } = {};
    const servicePerformance: { [key: string]: number } = {};

    paidInvoices.forEach((inv: Invoice) => {
      inv.items.forEach((item: InvoiceItem) => {
        const isService = SERVICES.some(s => s.name === item.description);
        
        if (inv.isWholesale) {
          wholesaleIncome += item.total;
          saborPerformance[item.description] = (saborPerformance[item.description] || 0) + item.total;
        } else if (isService) {
          retailServiceIncome += item.total;
          servicePerformance[item.description] = (servicePerformance[item.description] || 0) + item.total;
        } else {
          retailSnackIncome += item.total;
          saborPerformance[item.description] = (saborPerformance[item.description] || 0) + item.total;
        }
      });
    });

    const totalIncome = wholesaleIncome + retailSnackIncome + retailServiceIncome;
    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;
    
    const taxProvision = netProfit > 12570 ? (netProfit - 12570) * 0.20 : 0;

    const saborData = Object.entries(saborPerformance)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      wholesaleIncome, retailSnackIncome, retailServiceIncome,
      totalIncome, totalExpenses, profit: netProfit,
      taxProvision: Math.max(0, taxProvision),
      saborData,
      servicePerformance
    };
  }, [invoices, expenses]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">REPORTE <span className="text-[#20B2AA]">ANUAL</span></h2>
          <p className="text-slate-500 font-medium italic text-lg flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#20B2AA]"/> Auditoría Financiera y Operativa Maria's Dog Corner.
          </p>
        </div>
        <button className="bg-slate-900 text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 shadow-2xl hover:bg-[#20B2AA] transition-all">
          <Download size={18} /> EXPORTAR LIBRO CONTABLE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <KPICard title="Provisión HMRC (Tax)" value={`£${financialStats.taxProvision.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={Scale} color="indigo" sub="Reserva para Self-Assessment anual" />
        <KPICard title="Revenue Snacks (Audit)" value={`£${(financialStats.wholesaleIncome + financialStats.retailSnackIncome).toLocaleString()}`} icon={Star} color="teal" sub="Total B2B + Retail B2C" />
        <KPICard title="Revenue Servicios" value={`£${financialStats.retailServiceIncome.toLocaleString()}`} icon={Activity} color="rose" sub="Cuidado de mascotas minorista" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-50 space-y-10">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter border-b-2 border-slate-50 pb-6 flex items-center gap-4">
              <DollarSign size={24} className="text-[#20B2AA]"/> ESTADO DE RESULTADOS (P&L)
            </h3>
            
            <section className="space-y-4">
               <ReportLine label="Ventas Mayoristas (Snacks B2B)" value={financialStats.wholesaleIncome} />
               <ReportLine label="Ventas Minoristas (Snacks B2C)" value={financialStats.retailSnackIncome} />
               <ReportLine label="Servicios Dog Care (B2C)" value={financialStats.retailServiceIncome} />
               <ReportLine label="Total Ingresos Brutos" value={financialStats.totalIncome} bold />
            </section>

            <section className="space-y-4 pt-6 border-t border-slate-100">
               <ReportLine label="Costos de Operación (Opex)" value={financialStats.totalExpenses} negative />
               <ReportLine label="Provisión Fiscal Estimada" value={financialStats.taxProvision} negative />
            </section>

            <div className="p-10 bg-slate-900 rounded-[3.5rem] flex justify-between items-center text-white border border-white/10 shadow-3xl">
               <div>
                  <p className="text-[11px] font-black text-teal-400 uppercase tracking-[0.4em] leading-none mb-4 italic">Resultado Neto Real</p>
                  <p className="text-6xl font-black tracking-tighter leading-none">£{(financialStats.profit - financialStats.taxProvision).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado Contable</p>
                  <p className="text-xl font-black text-[#C6FF00] uppercase mt-2">VIGENTE ✅</p>
               </div>
            </div>
         </div>

         <div className="bg-white p-12 rounded-[4rem] flex flex-col justify-between shadow-xl border border-slate-50 relative overflow-hidden">
            <div className="relative z-10">
               <h3 className="text-3xl font-black tracking-tighter mb-4 text-slate-900 uppercase leading-none">Rendimiento por Sabor</h3>
               <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm">Auditoría de los 5 productos que más contribuyen al flujo de caja.</p>
            </div>
            
            <div className="h-80 my-12 relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialStats.saborData} layout="vertical">
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                     <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'black', width: 150 }} />
                     <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                     <Bar dataKey="value" radius={[0, 15, 15, 0]} barSize={35}>
                        {financialStats.saborData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#20B2AA] shadow-sm"><BarChart3 /></div>
                  <div>
                     <p className="text-[11px] font-black text-slate-900 uppercase leading-none">Análisis de Mix</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Comparativa de líneas</p>
                  </div>
               </div>
               <button onClick={() => navigate('/')} className="text-[10px] font-black text-[#20B2AA] uppercase tracking-widest hover:underline flex items-center gap-2">
                  VER DASHBOARD <ChevronRight size={14}/>
               </button>
            </div>
         </div>
      </div>

      <div className="bg-white p-12 rounded-[4.5rem] shadow-2xl border border-slate-100">
         <div className="flex justify-between items-center mb-12">
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
              <Activity className="text-[#FF6B9D]"/> AUDITORÍA DE SERVICIOS
            </h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {SERVICES.map((service, idx) => (
              <div key={idx} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-[#FF6B9D] transition-all group">
                 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm group-hover:scale-110 transition-transform">{service.icon}</div>
                 <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-tight mb-2 leading-tight">{service.name}</h4>
                 <div className="flex justify-between items-end mt-6 pt-6 border-t border-slate-200">
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase">Facturado</p>
                       <p className="text-xl font-black text-slate-900">£{(financialStats.servicePerformance[service.name] || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-slate-400 italic">£{service.price}/u</p>
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

interface ReportLineProps {
  label: string;
  value: number;
  negative?: boolean;
  bold?: boolean;
}

const ReportLine: React.FC<ReportLineProps> = ({ label, value, negative, bold }) => (
  <div className={`flex justify-between items-center p-6 rounded-2xl transition-all ${bold ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 hover:bg-slate-100'}`}>
     <span className={`text-[12px] font-bold ${bold ? 'text-teal-400' : 'text-slate-700 uppercase'}`}>{label}</span>
     <span className={`text-[15px] font-black ${negative ? 'text-[#FF6B9D]' : bold ? 'text-white' : 'text-slate-900'}`}>
       {negative ? '-' : ''}£{Math.abs(value).toLocaleString(undefined, {minimumFractionDigits: 2})}
     </span>
  </div>
);

interface KPICardProps {
  title: string;
  value: string;
  icon: any;
  color: 'teal' | 'rose' | 'indigo';
  sub?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, color, sub }) => {
  const colorMap = { 
    teal: 'bg-[#20B2AA] shadow-teal-100', 
    rose: 'bg-[#FF6B9D] shadow-pink-100', 
    indigo: 'bg-indigo-600 shadow-indigo-100' 
  };
  return (
    <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-50 hover:-translate-y-2 transition-all group">
       <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 shadow-2xl transition-transform group-hover:scale-110 ${colorMap[color]}`}><Icon size={30}/></div>
       <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] mb-3 leading-none">{title}</p>
       <h4 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{value}</h4>
       {sub && <p className="text-[11px] font-bold text-slate-400 uppercase mt-5 italic tracking-tight">{sub}</p>}
    </div>
  );
};

export default Reports;
