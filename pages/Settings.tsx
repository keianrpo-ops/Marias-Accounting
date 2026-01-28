
import React, { useState, useEffect } from 'react';
import { 
  Save, Building2, CreditCard, CheckCircle, ExternalLink, Key, 
  Landmark, Info, Banknote, Mail, Phone, MapPin, 
  Activity, ShieldAlert, Database, Download, LifeBuoy, Terminal, 
  ShieldCheck, AlertTriangle, FileWarning, Zap, Clock, Fingerprint, Copy, Check
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BusinessSettings {
  accountName: string;
  bankName: string;
  accountNumber: string;
  sortCode: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  stripePublicKey: string;
  stripeSecretKey: string;
}

const Settings: React.FC = () => {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'Negocio' | 'Integraciones' | 'Auditoría'>('Negocio');
  const [auditLogs, setAuditLogs] = useState<{time: string, action: string, type: 'info' | 'warning' | 'success'}[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<BusinessSettings>({
    accountName: "MARIA'S DOG CORNER",
    bankName: "Monzo Bank Business UK",
    accountNumber: "30716413",
    sortCode: "04-03-33",
    address: "87 Portview, Avonmouth, Bristol, BS11 9JE",
    phone: "07594 562 00",
    email: "info@mariasdogcorner.co.uk",
    website: "www.mariasdogcorner.co.uk",
    stripePublicKey: "",
    stripeSecretKey: ""
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('mdc_business_settings');
    if (savedSettings) setSettings(prev => ({...prev, ...JSON.parse(savedSettings)}));

    const invoices = JSON.parse(localStorage.getItem('mdc_invoices') || '[]');
    const inventory = JSON.parse(localStorage.getItem('mdc_inventory') || '[]');
    
    const logs: any[] = invoices.slice(0, 3).map((inv: any) => ({
      time: inv.date,
      action: `Asiento contable registrado: Factura ${inv.invoiceNumber} por £${inv.total}.`,
      type: 'success'
    }));

    inventory.forEach((item: any) => {
      if (item.quantity <= item.reorderLevel) {
        logs.unshift({
          time: 'ALERTA ACTUAL',
          action: `Quiebre de stock inminente detectado en: ${item.name}.`,
          type: 'warning'
        });
      }
    });

    setAuditLogs(logs.length > 0 ? logs : [{time: 'SINC', action: 'Centro de datos verificado y saludable.', type: 'info'}]);
  }, []);

  const handleSave = () => {
    localStorage.setItem('mdc_business_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleBackup = () => {
    const data = {
      settings,
      invoices: JSON.parse(localStorage.getItem('mdc_invoices') || '[]'),
      inventory: JSON.parse(localStorage.getItem('mdc_inventory') || '[]'),
      expenses: JSON.parse(localStorage.getItem('mdc_expenses') || '[]'),
      clients: JSON.parse(localStorage.getItem('mdc_clients') || '[]')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MDC_MAESTRO_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="space-y-1">
        <h2 className="text-4xl font-black text-slate-900 font-heading uppercase tracking-tighter leading-none">{t('core_settings_title').split(' ')[0]} <span className="text-[#20B2AA]">{t('core_settings_title').split(' ')[1]}</span></h2>
        <p className="text-slate-500 font-medium italic text-sm">{t('integrity_desc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <nav className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-2 sticky top-6">
            <TabButton active={activeTab === 'Negocio'} onClick={() => setActiveTab('Negocio')} icon={Building2} label={t('business_bacs').split(' ')[0]} desc={t('hmrc_compliance')} />
            <TabButton active={activeTab === 'Integraciones'} onClick={() => setActiveTab('Integraciones')} icon={Zap} label={t('integrations')} desc="Pasarelas y APIs" />
            <TabButton active={activeTab === 'Auditoría'} onClick={() => setActiveTab('Auditoría')} icon={ShieldCheck} label={t('audit_center')} desc={t('optimal')} />
          </nav>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden min-h-[680px] flex flex-col">
            <div className="p-8 md:p-14 flex-1">
              {activeTab === 'Negocio' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                  <SectionHeader title={t('bacs_title')} badge="UK Compliant" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputField label={t('beneficiary')} value={settings.accountName} onChange={(v: string) => setSettings({...settings, accountName: v})} />
                    <InputField label="Bank Name" value={settings.bankName} onChange={(v: string) => setSettings({...settings, bankName: v})} />
                  </div>
                  <div className="bg-slate-900 p-12 rounded-[2.5rem] text-white relative overflow-hidden group border border-white/5">
                    <Landmark className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform" size={160} />
                    <div className="flex items-center gap-3 mb-10">
                       <Fingerprint className="text-[#C6FF00]" size={22} />
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">{t('unique_id')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-12">
                      <div className="group">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest flex justify-between items-center">Account Number <button onClick={() => handleCopy(settings.accountNumber, 'acc')} className="text-white hover:text-[#FF6B9D]">{copiedField === 'acc' ? <Check size={12}/> : <Copy size={12}/>}</button></p>
                        <input className="bg-transparent text-3xl font-black text-[#C6FF00] w-full outline-none focus:ring-1 focus:ring-white/20 rounded px-1" value={settings.accountNumber} onChange={e => setSettings({...settings, accountNumber: e.target.value})} />
                      </div>
                      <div className="group">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest flex justify-between items-center">Sort Code <button onClick={() => handleCopy(settings.sortCode, 'sort')} className="text-white hover:text-[#FF6B9D]">{copiedField === 'sort' ? <Check size={12}/> : <Copy size={12}/>}</button></p>
                        <input className="bg-transparent text-3xl font-black text-[#C6FF00] w-full outline-none focus:ring-1 focus:ring-white/20 rounded px-1" value={settings.sortCode} onChange={e => setSettings({...settings, sortCode: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <SectionHeader title={t('clients')} icon={Mail} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputField label={t('contact_email')} value={settings.email} onChange={(v: string) => setSettings({...settings, email: v})} icon={Mail} />
                    <InputField label="WhatsApp / Phone" value={settings.phone} onChange={(v: string) => setSettings({...settings, phone: v})} icon={Phone} />
                    <div className="md:col-span-2">
                       <InputField label="Address" value={settings.address} onChange={(v: string) => setSettings({...settings, address: v})} isTextArea />
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'Integraciones' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-top-4">
                  <SectionHeader title={t('payment_infra')} badge="PCI-DSS Ready" />
                  <div className="bg-indigo-600 p-14 rounded-[3.5rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10"><Zap size={140}/></div>
                    <div className="space-y-8 relative z-10">
                       <div><h4 className="text-4xl font-black tracking-tighter">Stripe Ecosystem</h4><p className="text-indigo-100 text-base mt-2 max-w-md font-medium leading-relaxed opacity-80">{t('api_keys_desc')}</p></div>
                       <div className="grid grid-cols-1 gap-6">
                          <InputField label="Public API Key" value={settings.stripePublicKey} onChange={(v: string) => setSettings({...settings, stripePublicKey: v})} placeholder="pk_live_..." dark />
                          <InputField label="Secret API Key" type="password" value={settings.stripeSecretKey} onChange={(v: string) => setSettings({...settings, stripeSecretKey: v})} placeholder="sk_live_..." dark />
                       </div>
                       <div className="flex items-center gap-6 pt-4"><a href="https://dashboard.stripe.com/apikeys" target="_blank" className="bg-white text-indigo-600 px-10 py-5 rounded-full font-black uppercase text-[11px] tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-3">Stripe Dashboard <ExternalLink size={16}/></a><div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-200"><ShieldCheck size={14}/> TLS 1.3 Encryption</div></div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'Auditoría' && (
                <div className="space-y-14 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-8">
                        <SectionHeader title={t('audit_trail')} icon={Activity} />
                        <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-4">
                           {auditLogs.map((log, i) => (
                             <div key={i} className={`p-6 rounded-3xl border-2 flex items-start gap-5 transition-all hover:scale-[1.02] ${log.type === 'warning' ? 'bg-amber-50 border-amber-100' : log.type === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                                <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${log.type === 'warning' ? 'bg-amber-500' : log.type === 'success' ? 'bg-emerald-500' : 'bg-slate-400'} shadow-sm`} />
                                <div><p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${log.type === 'warning' ? 'text-amber-600' : log.type === 'success' ? 'text-emerald-600' : 'text-slate-500'}`}>{log.time}</p><p className="text-[12px] font-bold text-slate-800 leading-tight">{log.action}</p></div>
                             </div>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-8">
                        <SectionHeader title={t('operative_sop')} icon={LifeBuoy} />
                        <div className="space-y-4">
                           <SOPCard title="Stripe Payment Incident" action="Check event ID in Stripe. If failure persists, mark as Cancelled and regenerate." color="indigo" />
                           <SOPCard title="Data Integrity" action="If stock discrepancies appear, use Backup button and Flush cache." color="amber" />
                        </div>
                     </div>
                  </div>
                  <div className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-200 shadow-inner"><div className="flex items-center gap-4 mb-10"><Terminal size={24} className="text-slate-400" /><h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500">{t('health_diagnostic')}</h4></div><div className="grid grid-cols-2 md:grid-cols-4 gap-8"><HealthStat label="Database" value={t('optimal')} color="emerald" /><HealthStat label="Latency" value="24ms" color="teal" /><HealthStat label="Encryption" value="AES-256" color="indigo" /><HealthStat label="Sync" value="100%" color="emerald" /></div></div>
                  <div className="flex flex-col md:flex-row items-center justify-between p-12 bg-[#20B2AA] rounded-[3.5rem] text-white shadow-3xl"><div className="flex items-center gap-8 mb-6 md:mb-0"><div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-2xl"><Database size={32}/></div><div><h5 className="font-black text-2xl tracking-tighter">{t('data_resilience')}</h5><p className="text-[10px] font-bold text-teal-50 uppercase tracking-[0.2em] mt-2 italic opacity-80">Full ecosystem export (.JSON)</p></div></div><button onClick={handleBackup} className="bg-white text-[#20B2AA] px-10 py-5 rounded-full font-black uppercase text-[11px] tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">{t('download_master')}</button></div>
                </div>
              )}
            </div>
            <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex justify-end"><button onClick={handleSave} className="bg-slate-900 text-white px-14 py-5 rounded-full font-black uppercase tracking-[0.3em] text-[11px] flex items-center gap-4 hover:bg-[#20B2AA] shadow-2xl transition-all active:scale-95">{saved ? <CheckCircle size={22}/> : <Save size={22} />}{saved ? t('optimal') : t('save')}</button></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label, desc }: any) => (
  <button onClick={onClick} className={`flex items-center gap-5 w-full px-7 py-6 rounded-[2.2rem] transition-all group text-left ${active ? 'bg-[#20B2AA] text-white shadow-2xl' : 'text-slate-500 hover:bg-slate-50'}`}><div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-white'}`}><Icon size={22} /></div><div className="overflow-hidden"><p className="text-[11px] font-black uppercase tracking-[0.15em] leading-none mb-1.5">{label}</p><p className={`text-[9px] font-medium truncate ${active ? 'text-teal-100' : 'text-slate-400'}`}>{desc}</p></div></button>
);

const SectionHeader = ({ title, badge, icon: Icon }: any) => (
  <div className="flex justify-between items-center border-b border-slate-100 pb-6"><div className="flex items-center gap-4">{Icon && <Icon size={24} className="text-[#20B2AA]" />}<h3 className="font-black text-slate-900 text-3xl uppercase tracking-tighter leading-none">{title}</h3></div>{badge && <span className="bg-slate-900 text-teal-400 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">{badge}</span>}</div>
);

const SOPCard = ({ title, action, color }: any) => {
  const colors: any = { indigo: 'border-indigo-100 hover:border-indigo-400 bg-indigo-50/30', amber: 'border-amber-100 hover:border-amber-400 bg-amber-50/30', rose: 'border-rose-100 hover:border-rose-400 bg-rose-50/30' };
  return (
    <div className={`p-6 border-2 rounded-[2.5rem] transition-all group cursor-help ${colors[color]}`}><div className="flex items-center gap-4 mb-4"><ShieldAlert size={18} className="text-slate-900" /><p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{title}</p></div><p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">{action}</p></div>
  );
};

const HealthStat = ({ label, value, color }: any) => {
  const colors: any = { emerald: 'text-emerald-500', teal: 'text-teal-500', indigo: 'text-indigo-500' };
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">{label}</p><p className={`text-sm font-black uppercase ${colors[color]}`}>{value}</p></div>
  );
};

const InputField = ({ label, value, onChange, icon: Icon, isTextArea, type = "text", dark, placeholder }: any) => (
  <div className="space-y-3">
    <label className={`text-[11px] font-black uppercase tracking-widest px-3 ${dark ? 'text-indigo-200' : 'text-slate-400'}`}>{label}</label>
    <div className="relative group">
      {Icon && <Icon className={`absolute left-6 top-1/2 -translate-y-1/2 ${dark ? 'text-indigo-300' : 'text-slate-300'}`} size={18} />}
      {isTextArea ? (
        <textarea value={value} onChange={(e: any) => onChange?.(e.target.value)} placeholder={placeholder} className={`w-full px-8 py-6 rounded-[2.2rem] text-[13px] font-bold outline-none transition-all resize-none shadow-sm ${dark ? 'bg-indigo-900/50 border-indigo-400/30 text-white placeholder:text-indigo-300/50 focus:ring-4 focus:ring-white/10' : 'bg-slate-50 border-slate-200 focus:ring-4 focus:ring-teal-50'}`} rows={3} />
      ) : (
        <input type={type} value={value} placeholder={placeholder} onChange={(e: any) => onChange?.(e.target.value)} className={`w-full ${Icon ? 'pl-16' : 'px-8'} py-6 rounded-[2.2rem] text-[13px] font-bold transition-all shadow-sm outline-none ${dark ? 'bg-indigo-900/50 border-indigo-400/30 text-white placeholder:text-indigo-300/50 focus:ring-4 focus:ring-white/10' : 'bg-slate-50 border-slate-200 focus:ring-4 focus:ring-teal-50'}`} />
      )}
    </div>
  </div>
);

export default Settings;
