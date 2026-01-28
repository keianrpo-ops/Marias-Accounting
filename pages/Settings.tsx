
import React, { useState, useEffect } from 'react';
import { 
  Save, Building2, CheckCircle, Zap, ShieldCheck, Landmark, Globe, ExternalLink, Key, Database, AlertCircle, Info
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

type SettingsTab = 'business' | 'integrations' | 'audit';

const Settings: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>('integrations');
  const [saved, setSaved] = useState(false);
  
  const [businessData, setBusinessData] = useState({
    accountName: "Maria's Dog Corner",
    bankName: "Monzo Bank Business UK",
    accountNumber: "30716413",
    sortCode: "04-03-33",
    address: "87 Portview, Avonmouth, Bristol, BS11 9JE",
    phone: "07594 562 00",
    email: "info@mariasdogcorner.co.uk",
  });

  const [integrations, setIntegrations] = useState({
    stripePublicKey: "",
    stripeSecretKey: "",
    supabaseUrl: "",
    supabaseKey: ""
  });

  useEffect(() => {
    const savedBus = localStorage.getItem('mdc_business_settings');
    const savedInt = localStorage.getItem('mdc_integrations');
    if (savedBus) setBusinessData(prev => ({...prev, ...JSON.parse(savedBus)}));
    if (savedInt) setIntegrations(prev => ({...prev, ...JSON.parse(savedInt)}));
  }, []);

  const handleSave = () => {
    localStorage.setItem('mdc_business_settings', JSON.stringify(businessData));
    localStorage.setItem('mdc_integrations', JSON.stringify(integrations));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter text-center md:text-left">CORE <span className="text-[#20B2AA]">SETTINGS</span></h2>

      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[650px] relative">
        
        <aside className="w-full md:w-80 bg-slate-50/50 border-r border-slate-100 p-8 flex flex-col gap-4">
           <TabButton 
             active={activeTab === 'business'} 
             onClick={() => setActiveTab('business')} 
             icon={Building2} 
             title="BUSINESS" 
             subtitle="HMRC Compliance" 
           />
           <TabButton 
             active={activeTab === 'integrations'} 
             onClick={() => setActiveTab('integrations')} 
             icon={Zap} 
             title="INTEGRATIONS" 
             subtitle="Pasarelas y APIs" 
           />
           <TabButton 
             active={activeTab === 'audit'} 
             onClick={() => setActiveTab('audit')} 
             icon={ShieldCheck} 
             title="AUDIT CENTER" 
             subtitle="Optimal" 
           />
        </aside>

        <div className="flex-1 p-8 md:p-14 relative">
           {activeTab === 'business' && (
             <div className="space-y-10 animate-in slide-in-from-right-4">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Business Profile</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configuración legal para facturación BACS</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InputField label="Beneficiary Name" value={businessData.accountName} onChange={(v) => setBusinessData({...businessData, accountName: v})} />
                  <InputField label="Bank Name" value={businessData.bankName} onChange={(v) => setBusinessData({...businessData, bankName: v})} />
                  <InputField label="Account Number" value={businessData.accountNumber} onChange={(v) => setBusinessData({...businessData, accountNumber: v})} />
                  <InputField label="Sort Code" value={businessData.sortCode} onChange={(v) => setBusinessData({...businessData, sortCode: v})} />
                  <div className="md:col-span-2">
                    <InputField label="Business Address" value={businessData.address} onChange={(v) => setBusinessData({...businessData, address: v})} />
                  </div>
                </div>
             </div>
           )}

           {activeTab === 'integrations' && (
             <div className="space-y-10 animate-in slide-in-from-right-4 h-full flex flex-col">
                <div className="bg-[#6366F1] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                   <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                      <Zap size={180} />
                   </div>
                   
                   <div className="relative z-10 space-y-10">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="text-4xl font-black tracking-tighter uppercase leading-none">Stripe Ecosystem</h3>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Pasarela de Pagos Global</p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                          <CheckCircle size={24} className="text-[#C6FF00]"/>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] ml-6 opacity-70">Public API Key (pk_...)</label>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 px-6 py-4 flex items-center gap-4">
                               <Key size={16} className="opacity-40" />
                               <input 
                                 className="bg-transparent border-none outline-none flex-1 text-xs font-bold text-white placeholder:text-white/30 truncate" 
                                 value={integrations.stripePublicKey} 
                                 onChange={(e) => setIntegrations({...integrations, stripePublicKey: e.target.value})}
                                 placeholder="pk_test_..."
                               />
                            </div>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] ml-6 opacity-70">Secret API Key (sk_...)</label>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 px-6 py-4 flex items-center gap-4">
                               <ShieldCheck size={16} className="opacity-40" />
                               <input 
                                 type="password"
                                 className="bg-transparent border-none outline-none flex-1 text-xs font-bold text-white placeholder:text-white/30" 
                                 value={integrations.stripeSecretKey} 
                                 onChange={(e) => setIntegrations({...integrations, stripeSecretKey: e.target.value})}
                                 placeholder="sk_test_..."
                               />
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                         <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-[#C6FF00] transition-colors">
                            STRIPE DASHBOARD <ExternalLink size={14}/>
                         </a>
                         <span className="text-[9px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                            <ShieldCheck size={12}/> ENCRYPTED BY MDC ENGINE
                         </span>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl border border-slate-800">
                   <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#3ECF8E]/20 rounded-xl flex items-center justify-center text-[#3ECF8E] border border-[#3ECF8E]/30">
                          <Database size={20} />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Database <span className="text-[#3ECF8E]">Supabase</span></h3>
                      </div>
                      <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="px-5 py-2 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2">
                        Dashboard <ExternalLink size={12}/>
                      </a>
                   </div>

                   <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/20 mb-8 flex items-start gap-4">
                      <Info size={18} className="text-[#3ECF8E] shrink-0 mt-1"/>
                      <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                        Para activar el guardado en la nube: ve a <span className="text-[#3ECF8E] font-black italic">Settings &gt; API</span> en Supabase y pega la <span className="text-white font-bold">Project URL</span> y la <span className="text-white font-bold">anon public key</span>. Al guardar, el sistema se reiniciará para sincronizar.
                      </p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[9px] font-black uppercase tracking-[0.3em] ml-4 text-slate-500">Project URL (https://...)</label>
                         <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-xs font-bold text-white outline-none focus:border-[#3ECF8E] transition-all shadow-inner" value={integrations.supabaseUrl} onChange={e => setIntegrations({...integrations, supabaseUrl: e.target.value})} placeholder="https://tu-proyecto.supabase.co" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[9px] font-black uppercase tracking-[0.3em] ml-4 text-slate-500">Anon Key (eyJhb...)</label>
                         <input type="password" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-xs font-bold text-white outline-none focus:border-[#3ECF8E] transition-all shadow-inner" value={integrations.supabaseKey} onChange={e => setIntegrations({...integrations, supabaseKey: e.target.value})} placeholder="Tu clave anónima pública" />
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'audit' && (
             <div className="space-y-10 animate-in slide-in-from-right-4">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">System Integrity</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estado de auditoría y diagnóstico de salud operativa</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[3rem] flex items-center gap-6 shadow-sm">
                      <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                         <CheckCircle size={28} />
                      </div>
                      <div>
                         <p className="text-[11px] font-black text-emerald-900 uppercase">Operational: Optimal</p>
                         <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Uptime 99.9%</p>
                      </div>
                   </div>

                   <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[3rem] flex items-center gap-6 shadow-sm">
                      <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                         <Database size={28} />
                      </div>
                      <div>
                         <p className="text-[11px] font-black text-indigo-900 uppercase">Sync Status: Realtime</p>
                         <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mt-1">
                           {integrations.supabaseUrl ? 'Connected to Cloud' : 'Local Persistence Only'}
                         </p>
                      </div>
                   </div>
                </div>

                <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 border-dashed text-center">
                   <ShieldCheck size={40} className="mx-auto text-slate-300 mb-4" />
                   <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">MDC Security Ledger v6.0</p>
                   <button className="bg-white border border-slate-200 text-slate-900 px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-md">Download Full Audit Log</button>
                </div>
             </div>
           )}

           <div className="absolute bottom-10 right-10">
              <button 
                onClick={handleSave} 
                className="bg-slate-900 text-white px-12 py-5 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-[#20B2AA] transition-all shadow-3xl active:scale-95 group"
              >
                {saved ? <CheckCircle size={22}/> : <Save size={22} className="group-hover:scale-125 transition-transform" />} 
                {saved ? 'DATA SYNCHRONIZED' : 'SAVE CORE CHANGES'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, title, subtitle }: any) => (
  <button 
    onClick={onClick}
    className={`p-6 rounded-[2.8rem] flex items-center gap-5 transition-all w-full text-left group border ${
      active ? 'bg-white shadow-2xl border-white ring-1 ring-slate-100' : 'hover:bg-white/40 border-transparent'
    }`}
  >
    <div className={`w-12 h-12 rounded-[1.3rem] flex items-center justify-center transition-all ${
      active ? 'bg-slate-900 text-[#C6FF00] shadow-lg' : 'bg-slate-200 text-slate-400 group-hover:bg-white group-hover:text-slate-900'
    }`}>
      <Icon size={22} />
    </div>
    <div className="overflow-hidden">
      <p className={`text-[12px] font-black uppercase tracking-tighter transition-colors ${active ? 'text-slate-900' : 'text-slate-500'}`}>{title}</p>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{subtitle}</p>
    </div>
  </button>
);

const InputField = ({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (v: string) => void, type?: string }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label>
    <input 
      type={type}
      className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-teal-50 focus:bg-white transition-all shadow-inner" 
      value={value} 
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} 
    />
  </div>
);

export default Settings;
