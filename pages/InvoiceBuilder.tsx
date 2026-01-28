
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, ArrowLeft, CheckCircle, Search, AlertCircle, ShoppingBag, Zap, CreditCard, X, Dog, Sparkles, ShoppingCart, Activity } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { InvoiceItem, InvoiceStatus, Invoice, Client, UserRole } from '../types';
import { SERVICES, PRODUCTS, PRICING_TIERS } from '../constants';
import StripePayment from '../components/StripePayment';
import { useLanguage } from '../context/LanguageContext';

const InvoiceBuilder: React.FC = () => {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [isViewMode, setIsViewMode] = useState(false);
  const [clientType, setClientType] = useState<'retail' | 'wholesale'>('retail');
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [quickTab, setQuickTab] = useState<'snacks' | 'services'>('services');

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    cityPostcode: '',
    date: new Date().toISOString().split('T')[0],
    serviceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    invoiceNumber: ''
  });

  const generateInvoiceNumber = (type: 'retail' | 'wholesale') => {
    const prefix = type === 'wholesale' ? 'WHS' : 'MDC';
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setClientInfo(prev => ({ ...prev, invoiceNumber: `${prefix}-${year}-${randomNum}` }));
  };

  useEffect(() => {
    const savedClients = JSON.parse(localStorage.getItem('mdc_clients') || '[]');
    setAvailableClients(savedClients);
    
    // Check if client data was passed via navigation state
    if (location.state?.client) {
      const client = location.state.client as Client;
      selectClient(client);
    }

    if (editId) {
      const savedInvoices = JSON.parse(localStorage.getItem('mdc_invoices') || '[]');
      const inv = savedInvoices.find((i: Invoice) => i.id === editId);
      if (inv) {
        setClientInfo({
          name: inv.clientName,
          email: inv.clientEmail,
          phone: inv.clientPhone,
          address: inv.clientAddress,
          cityPostcode: inv.clientCityPostcode,
          date: inv.date,
          serviceDate: inv.serviceDate,
          dueDate: inv.dueDate,
          invoiceNumber: inv.invoiceNumber
        });
        setItems(inv.items);
        setClientType(inv.isWholesale ? 'wholesale' : 'retail');
        setIsViewMode(true);
      }
    } else {
      generateInvoiceNumber(clientType);
    }
  }, [editId, clientType, location.state]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
    let discount = 0;
    if (clientType === 'wholesale') {
      let activeTier = { discount: 0 };
      for (const tier of [...PRICING_TIERS].reverse()) {
        if (totalUnits >= tier.min) { activeTier = tier; break; }
      }
      discount = subtotal * activeTier.discount;
    }
    return { subtotal, discount, total: subtotal - discount };
  }, [items, clientType]);

  const selectClient = (client: Client) => {
    setClientInfo(prev => ({ 
      ...prev, 
      name: client.businessName || client.name, 
      email: client.email, 
      phone: client.phone, 
      address: client.addressLine1, 
      cityPostcode: client.postcode 
    }));
    setShowClientSearch(false);
    setError(null);
    if (client.role === UserRole.DISTRIBUTOR) setClientType('wholesale');
    else setClientType('retail');
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = (parseFloat(updated.quantity.toString()) || 0) * (parseFloat(updated.unitPrice.toString()) || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const addItemToInvoice = (catalogItem: any) => {
    const isService = catalogItem.category === 'Service';
    const price = isService ? catalogItem.price : catalogItem.basePrice;
    
    if (items.length === 1 && items[0].description === '' && items[0].total === 0) {
      updateItem(items[0].id, 'description', catalogItem.name);
      updateItem(items[0].id, 'unitPrice', price);
      return;
    }

    setItems([...items, { 
      id: Math.random().toString(36).substr(2, 9), 
      description: catalogItem.name, 
      quantity: 1, 
      unitPrice: price, 
      total: price 
    }]);
  };

  const handleSave = (status: InvoiceStatus = InvoiceStatus.PAID) => {
    if (!clientInfo.name || !clientInfo.email) {
      setError(t('assign_client_first'));
      return;
    }
    const newInvoice: Invoice = {
      id: editId || Math.random().toString(36).substr(2, 9),
      invoiceNumber: clientInfo.invoiceNumber,
      clientName: clientInfo.name,
      clientEmail: clientInfo.email,
      clientPhone: clientInfo.phone,
      clientAddress: clientInfo.address,
      clientCityPostcode: clientInfo.cityPostcode,
      date: clientInfo.date,
      serviceDate: clientInfo.serviceDate,
      dueDate: clientInfo.dueDate,
      items: items,
      subtotal: totals.subtotal,
      total: totals.total,
      status: status,
      isVatInvoice: false,
      isWholesale: clientType === 'wholesale',
      discountApplied: totals.discount
    };
    const existing = JSON.parse(localStorage.getItem('mdc_invoices') || '[]');
    localStorage.setItem('mdc_invoices', JSON.stringify(editId ? existing.map((i: any) => i.id === editId ? newInvoice : i) : [newInvoice, ...existing]));
    setIsViewMode(true);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center no-print px-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/invoices')} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#20B2AA] transition-all hover:shadow-md">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">SALES <span className="text-[#20B2AA]">REGISTRY</span></h2>
        </div>
        {!isViewMode && (
          <div className="flex gap-4">
             <div className="bg-white p-1.5 rounded-full border border-slate-200 flex items-center shadow-sm">
                <button onClick={() => setClientType('retail')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${clientType === 'retail' ? 'bg-[#FF6B9D] text-white shadow-lg' : 'text-slate-400'}`}>RETAIL</button>
                <button onClick={() => setClientType('wholesale')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${clientType === 'wholesale' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>WHOLESALE</button>
             </div>
            <button onClick={() => setShowStripeModal(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
              <CreditCard size={18} /> STRIPE CARD
            </button>
            <button onClick={() => handleSave()} className="bg-[#20B2AA] text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
              <CheckCircle size={18} /> {t('generate_invoice')}
            </button>
          </div>
        )}
      </div>

      {!isViewMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 no-print px-4">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 space-y-10">
              {error && <div className="p-5 bg-rose-50 text-rose-600 font-bold text-sm rounded-3xl border border-rose-100 flex items-center gap-3 animate-shake"><AlertCircle size={20}/> {error}</div>}
              
              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('client_info')}</h4>
                    <button onClick={() => setShowClientSearch(!showClientSearch)} className="text-[10px] font-black text-[#20B2AA] uppercase flex items-center gap-2 hover:underline">
                      <Search size={14}/> {t('search_member')}
                    </button>
                  </div>
                  {showClientSearch && (
                    <div className="p-4 bg-slate-50 rounded-[2rem] border border-slate-200 max-h-48 overflow-y-auto no-scrollbar space-y-2 shadow-inner">
                      {availableClients.map(c => (
                        <button key={c.id} onClick={() => selectClient(c)} className="w-full text-left p-4 bg-white rounded-2xl border border-slate-100 hover:border-[#20B2AA] text-[11px] font-black uppercase transition-all flex justify-between group">
                          <span className="group-hover:text-[#20B2AA]">{c.businessName || c.name}</span>
                          <span className="text-slate-300 italic">{c.role === UserRole.DISTRIBUTOR ? 'B2B PARTNER' : 'RETAIL CLIENT'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="space-y-4">
                    <input type="text" placeholder={t('client_business')} className="w-full p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 text-[12px] font-bold uppercase outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all" value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})} />
                    <input type="text" placeholder={t('contact_email')} className="w-full p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 text-[12px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all" value={clientInfo.email} onChange={e => setClientInfo({...clientInfo, email: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">DATE CONTROLS</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-4">ISSUANCE</label>
                       <input type="date" className="w-full p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 text-[12px] font-black outline-none" value={clientInfo.date} onChange={e => setClientInfo({...clientInfo, date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase ml-4">SERVICE</label>
                       <input type="date" className="w-full p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 text-[12px] font-black outline-none" value={clientInfo.serviceDate} onChange={e => setClientInfo({...clientInfo, serviceDate: e.target.value})} />
                    </div>
                  </div>
                  <div className="p-6 bg-slate-900 rounded-[2rem] flex items-center justify-between shadow-xl">
                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Tax Reference</span>
                    <span className="text-lg font-black text-white">{clientInfo.invoiceNumber}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-10 border-t border-slate-100">
                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('services_products')}</h4>
                 <div className="space-y-4">
                   {items.map(item => {
                     const isServiceItem = SERVICES.some(s => s.name === item.description);
                     return (
                      <div key={item.id} className="flex gap-4 items-center group animate-in slide-in-from-left-2 duration-300">
                        <div className={`w-2 h-10 rounded-full transition-colors ${isServiceItem ? 'bg-[#FF6B9D]' : item.description ? 'bg-[#20B2AA]' : 'bg-slate-100'}`} />
                        <input type="text" placeholder={`${t('description')}...`} className="flex-1 p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 text-[12px] font-bold uppercase outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                        <input type="number" className="w-20 p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 text-[12px] font-black text-center" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} />
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">£</span>
                           <input type="number" step="0.01" className="w-28 p-5 pl-8 bg-slate-50 rounded-[1.8rem] border border-slate-100 text-[12px] font-black text-right" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', e.target.value)} />
                        </div>
                        <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    );
                   })}
                 </div>
                 <button onClick={() => setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0, total: 0 }])} className="px-8 py-4 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-100 transition-all border border-slate-200">
                   <Plus size={16}/> {t('new_line')}
                 </button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
             {/* QUICK ADD PANEL */}
             <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-2xl flex flex-col">
                <div className="flex bg-slate-100 p-2">
                   <button onClick={() => setQuickTab('services')} className={`flex-1 py-4 rounded-[3rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${quickTab === 'services' ? 'bg-white text-[#FF6B9D] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                      <Activity size={16}/> Services
                   </button>
                   <button onClick={() => setQuickTab('snacks')} className={`flex-1 py-4 rounded-[3rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${quickTab === 'snacks' ? 'bg-white text-[#20B2AA] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                      <ShoppingCart size={16}/> Snacks
                   </button>
                </div>
                <div className="p-6 max-h-[500px] overflow-y-auto no-scrollbar space-y-3 bg-white">
                   {quickTab === 'snacks' ? (
                     PRODUCTS.map(p => (
                       <button key={p.id} onClick={() => addItemToInvoice(p)} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-teal-50 border border-transparent hover:border-[#20B2AA] rounded-2xl transition-all group">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg">🍖</div>
                             <span className="text-[11px] font-black text-slate-700 uppercase group-hover:text-[#20B2AA] tracking-tight">{p.name}</span>
                          </div>
                          <span className="text-[11px] font-black text-slate-400 group-hover:text-slate-900">£{p.basePrice.toFixed(2)}</span>
                       </button>
                     ))
                   ) : (
                     SERVICES.map(s => (
                       <button key={s.id} onClick={() => addItemToInvoice(s)} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-pink-50 border border-transparent hover:border-[#FF6B9D] rounded-2xl transition-all group">
                          <div className="flex items-center gap-4">
                             <span className="text-2xl filter drop-shadow-sm">{s.icon}</span>
                             <span className="text-[11px] font-black text-slate-700 uppercase group-hover:text-[#FF6B9D] tracking-tight">{s.name}</span>
                          </div>
                          <span className="text-[11px] font-black text-slate-400 group-hover:text-slate-900">£{s.price.toFixed(2)}</span>
                       </button>
                     ))
                   )}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Click to add directly to invoice</p>
                </div>
             </div>

             {/* TOTALS SUMMARY */}
             <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-3xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                   <Zap size={150} className="text-[#C6FF00]" />
                </div>
                <div className="space-y-6 relative z-10">
                   <div className="flex justify-between items-center">
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">GROSS SUBTOTAL</p>
                      <p className="text-xl font-black">£{totals.subtotal.toFixed(2)}</p>
                   </div>
                   {totals.discount > 0 && (
                     <div className="flex justify-between items-center animate-in fade-in slide-in-from-right-2">
                       <p className="text-[11px] font-black text-teal-400 uppercase tracking-widest italic">PARTNER DISCOUNT</p>
                       <p className="text-xl font-black text-teal-400">-£{totals.discount.toFixed(2)}</p>
                     </div>
                   )}
                   <div className="pt-8 border-t border-white/10">
                      <p className="text-[11px] font-black text-[#C6FF00] uppercase tracking-[0.4em] mb-4">TOTAL TO BILL</p>
                      <h5 className="text-6xl font-black text-white tracking-tighter">£{totals.total.toFixed(2)}</h5>
                   </div>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[800px] bg-white shadow-2xl rounded-[3rem] p-20 animate-in zoom-in-95 duration-500 text-center">
           <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                 <CheckCircle size={40} />
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Sale <span className="text-[#20B2AA]">Recorded</span></h3>
                <p className="text-slate-500 font-bold italic text-lg mt-4">Invoice saved to master audit records successfully.</p>
              </div>
              <div className="pt-10 flex gap-4">
                 <button onClick={() => window.print()} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl">Print Invoice</button>
                 <button onClick={() => setIsViewMode(false)} className="bg-white border border-slate-200 text-slate-900 px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-md">Next Transaction</button>
              </div>
           </div>
        </div>
      )}

      {showStripeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6">
          <StripePayment 
            amount={totals.total} 
            clientName={clientInfo.name} 
            onSuccess={() => { handleSave(InvoiceStatus.PAID); setShowStripeModal(false); }} 
            onCancel={() => setShowStripeModal(false)} 
          />
        </div>
      )}
    </div>
  );
};

export default InvoiceBuilder;
