
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, ArrowLeft, CheckCircle, Search, AlertCircle, Zap, CreditCard, X, Dog, ShoppingCart, Activity, Printer, Landmark, Globe, Phone, Mail, ExternalLink } from 'lucide-react';
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
  const [businessSettings, setBusinessSettings] = useState<any>(null);

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
    const settings = JSON.parse(localStorage.getItem('mdc_business_settings') || '{}');
    setAvailableClients(savedClients);
    setBusinessSettings(settings);
    
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
    window.dispatchEvent(new Event('storage'));
  };

  // MARÍA: Este es tu link de pago personalizado que llevará la referencia de la factura
  const stripePaymentLink = `https://buy.stripe.com/test_cNieVfdwubiOgWJeJTgMw01?client_reference_id=${clientInfo.invoiceNumber}`;

  const PrintableContent = () => (
    <div className="bg-white text-slate-900 font-sans min-h-[1120px] w-full max-w-[800px] mx-auto overflow-hidden">
         <div className="bg-gradient-to-r from-[#FF6B9D] via-[#FF8C6B] to-[#FFB347] p-12 relative flex justify-between items-center text-white">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center p-2 border border-white/30 shadow-xl">
                  <Dog size={48} />
                </div>
                <div>
                  <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Maria's</h1>
                  <h2 className="text-4xl font-black tracking-tighter uppercase leading-none ml-6">Dog Corner</h2>
                  <p className="text-[12px] font-black uppercase tracking-[0.3em] mt-3 opacity-90">Professional Pet Services • Bristol, UK</p>
                </div>
            </div>
            <div className="bg-white/90 p-6 rounded-2xl shadow-xl min-w-[180px] text-center border border-white">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">INVOICE #</p>
               <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{clientInfo.invoiceNumber}</p>
            </div>
         </div>

         <div className="p-16 space-y-16">
            <div className="grid grid-cols-2 gap-20 items-start">
               <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em]">FROM:</h4>
                  <div className="space-y-1.5">
                    <p className="text-base font-black text-slate-900 uppercase tracking-tight">Maria's Dog Corner</p>
                    <p className="text-xs text-slate-500 font-medium">Maria Blanco</p>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                       {businessSettings?.address || '87 Portview, Avonmouth'}<br/>
                       {businessSettings?.cityPostcode || 'Bristol, BS11 9JE, UK'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-2"><Phone size={12}/> {businessSettings?.phone || '07594 562 00'}</div>
                    <div className="flex items-center gap-3 text-xs text-slate-500"><Mail size={12}/> {businessSettings?.email || 'info@mariasdogcorner.co.uk'}</div>
                    <div className="flex items-center gap-3 text-xs text-[#20B2AA] font-bold"><Globe size={12}/> www.mariasdogcorner.co.uk</div>
                  </div>
               </div>

               <div className="bg-slate-50/50 p-8 rounded-3xl space-y-5 border border-slate-100 shadow-inner">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Date</span>
                     <span className="text-xs font-black text-slate-900">{clientInfo.date}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Date</span>
                     <span className="text-xs font-black text-slate-900">{clientInfo.serviceDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Due</span>
                     <span className="text-xs font-black text-[#FF6B9D]">{clientInfo.dueDate}</span>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em]">BILL TO:</h4>
               <div className="border-4 border-[#FF6B9D]/10 bg-[#FF6B9D]/5 p-10 rounded-[2.5rem] space-y-4 shadow-sm">
                  <div className="flex gap-4">
                     <span className="text-[11px] font-black text-slate-900 uppercase min-w-[120px]">Costumer Name:</span>
                     <span className="text-base font-black uppercase text-slate-900">{clientInfo.name}</span>
                  </div>
                  <div className="flex gap-4">
                     <span className="text-[11px] font-black text-slate-400 uppercase min-w-[120px]">Client Address:</span>
                     <span className="text-xs font-bold text-slate-500">{clientInfo.address}</span>
                  </div>
                  <div className="flex gap-4">
                     <span className="text-[11px] font-black text-slate-400 uppercase min-w-[120px]">City, Postcode:</span>
                     <span className="text-xs font-bold text-slate-500">{clientInfo.cityPostcode}</span>
                  </div>
                  <div className="flex gap-4">
                     <span className="text-[11px] font-black text-slate-400 uppercase min-w-[120px]">Email or Phone:</span>
                     <span className="text-xs font-bold text-slate-500">{clientInfo.email} / {clientInfo.phone}</span>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em]">SERVICES PROVIDED</h4>
               <div className="rounded-[2.5rem] overflow-hidden border-2 border-slate-100 shadow-sm">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-[#FF6B9D] text-white">
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">DESCRIPTION</th>
                           <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest">QTY</th>
                           <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest">UNIT PRICE/AMOUNT</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-8 py-6 text-sm font-bold uppercase text-slate-700">{item.description}</td>
                             <td className="px-8 py-6 text-center text-xs font-bold text-slate-400">[{item.quantity}]</td>
                             <td className="px-8 py-6 text-right text-sm font-black text-slate-900">
                                <div className="flex items-center justify-end gap-10">
                                   <span className="text-slate-300 font-bold">[£{item.unitPrice.toFixed(2)}]</span>
                                   <span>[£{item.total.toFixed(2)}]</span>
                                </div>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end pt-10">
               <div className="bg-amber-50/50 p-8 rounded-[2rem] border border-amber-100 shadow-inner">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">VAT Status:</p>
                  <p className="text-[9px] font-medium text-amber-800 italic leading-relaxed">
                     Not VAT registered. All prices exclude VAT as business is below registration threshold.
                  </p>
               </div>
               
               <div className="space-y-6">
                  <div className="bg-amber-50 p-6 rounded-2xl flex justify-between items-center px-10 border border-amber-100/50 shadow-sm">
                     <span className="text-[11px] font-black text-slate-900 uppercase">Subtotal:</span>
                     <span className="text-xl font-black">£{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="bg-gradient-to-r from-[#20B2AA] to-[#6366f1] p-6 rounded-2xl flex justify-between items-center px-10 text-white shadow-2xl ring-4 ring-white/20">
                     <span className="text-[13px] font-black uppercase tracking-[0.2em]">TOTAL:</span>
                     <div className="bg-white text-slate-900 px-10 py-3 rounded-xl shadow-lg">
                        <span className="text-3xl font-black tracking-tighter">£{totals.total.toFixed(2)}</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-20 border-t-2 border-slate-50">
               <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] mb-10">PAYMENT OPTIONS</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[2.5rem] border-2 border-indigo-100 space-y-6 relative overflow-hidden group shadow-sm">
                     <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Landmark size={80}/></div>
                     <div className="flex items-center gap-3 text-[#6366f1]">
                        <div className="w-2.5 h-2.5 bg-[#6366f1] rounded-full animate-pulse"></div>
                        <p className="text-[11px] font-black uppercase tracking-widest">Bank Transfer (Preferred)</p>
                     </div>
                     <div className="space-y-3 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        <p>Account: <span className="text-slate-900 font-black">{businessSettings?.accountName || "Maria's Dog Corner"}</span></p>
                        <p>Sort Code: <span className="text-slate-900 font-black text-xl tracking-widest">{businessSettings?.sortCode || "04-03-33"}</span></p>
                        <p>Account Number: <span className="text-slate-900 font-black text-xl tracking-widest">{businessSettings?.accountNumber || "30716413"}</span></p>
                        <p className="pt-2 italic">Reference: <span className="text-[#FF6B9D] font-black">{clientInfo.invoiceNumber}</span></p>
                     </div>
                  </div>

                  <div className="bg-white p-10 rounded-[2.5rem] border-2 border-[#6366f1] flex justify-between items-center shadow-sm relative overflow-hidden">
                     <div className="space-y-5 z-10">
                        <div className="flex items-center gap-3 text-[#6366f1]">
                           <div className="w-2.5 h-2.5 bg-[#6366f1] rounded-full"></div>
                           <p className="text-[11px] font-black uppercase tracking-widest">Pay Secure with Card</p>
                        </div>
                        <ol className="text-[9px] font-bold text-slate-400 uppercase space-y-2 list-decimal ml-4">
                           <li>Scan the QR code</li>
                           <li>Verify amount matches £{totals.total.toFixed(2)}</li>
                           <li>Confirm payment in Stripe</li>
                        </ol>
                        <a href={stripePaymentLink} target="_blank" rel="noreferrer" className="no-print inline-flex items-center gap-2 text-[10px] font-black text-[#6366f1] uppercase border-b-2 border-indigo-100 pb-1 hover:text-[#20B2AA] transition-colors">
                           Online Payment Link <ExternalLink size={12}/>
                        </a>
                     </div>
                     <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center p-2 border border-slate-100 group relative shadow-md z-10">
                        {/* MARÍA: Este código QR ahora lleva la información dinámica de tu pago de Stripe */}
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(stripePaymentLink)}`} 
                          alt="Stripe Payment QR" 
                          className="w-full h-full object-contain group-hover:scale-105 transition-all duration-500"
                        />
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[0.5px] opacity-100 flex flex-col items-center justify-center group-hover:opacity-0 transition-opacity">
                           <CreditCard size={16} className="text-slate-900 mb-1"/>
                           <p className="text-[8px] font-black text-slate-900 uppercase">SCAN TO PAY</p>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="text-center mt-20 space-y-4">
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] max-w-sm mx-auto">Thank you for trusting Maria’s Dog Corner with your beloved pet’s care! □</p>
                  <div className="h-[2px] bg-slate-100 w-48 mx-auto rounded-full"></div>
               </div>
            </div>
         </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center no-print px-4 gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/invoices')} className="p-4 bg-white border border-slate-200 rounded-3xl text-slate-400 hover:text-[#20B2AA] transition-all hover:shadow-lg">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">SALES <span className="text-[#20B2AA]">SYSTEM</span></h2>
        </div>
        {!isViewMode ? (
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
             <div className="bg-white p-1.5 rounded-full border border-slate-200 flex items-center shadow-sm w-full md:w-auto">
                <button onClick={() => setClientType('retail')} className={`flex-1 md:flex-none px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${clientType === 'retail' ? 'bg-[#FF6B9D] text-white shadow-xl' : 'text-slate-400'}`}>RETAIL</button>
                <button onClick={() => setClientType('wholesale')} className={`flex-1 md:flex-none px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${clientType === 'wholesale' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}>WHOLESALE</button>
             </div>
            <button onClick={() => setShowStripeModal(true)} className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3">
              <CreditCard size={18} /> STRIPE CARD
            </button>
            <button onClick={() => handleSave()} className="flex-1 md:flex-none bg-[#20B2AA] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3">
              <CheckCircle size={18} /> {t('generate_invoice')}
            </button>
          </div>
        ) : (
          <div className="flex gap-4 w-full md:w-auto">
             <button onClick={() => window.print()} className="flex-1 md:flex-none bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:bg-[#20B2AA] transition-all">
               <Printer size={20}/> Print Professional Invoice
             </button>
             <button onClick={() => setIsViewMode(false)} className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-900 px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-md hover:bg-slate-50">Back to Editor</button>
          </div>
        )}
      </div>

      {!isViewMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 no-print px-4">
          <div className="lg:col-span-3 space-y-10">
            <div className="bg-white rounded-[4rem] p-12 shadow-2xl border border-slate-100 space-y-12">
              {error && <div className="p-6 bg-rose-50 text-rose-600 font-bold text-sm rounded-[2.5rem] border border-rose-100 flex items-center gap-4 animate-shake"><AlertCircle size={24}/> {error}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">{t('client_info')}</h4>
                    <button onClick={() => setShowClientSearch(!showClientSearch)} className="text-[11px] font-black text-[#20B2AA] uppercase flex items-center gap-3 hover:underline">
                      <Search size={16}/> {t('search_member')}
                    </button>
                  </div>
                  {showClientSearch && (
                    <div className="p-6 bg-slate-50 rounded-[3rem] border border-slate-200 max-h-60 overflow-y-auto no-scrollbar space-y-3 shadow-inner">
                      {availableClients.map(c => (
                        <button key={c.id} onClick={() => selectClient(c)} className="w-full text-left p-6 bg-white rounded-3xl border border-slate-100 hover:border-[#20B2AA] text-[12px] font-black uppercase transition-all flex justify-between group shadow-sm">
                          <span className="group-hover:text-[#20B2AA]">{c.businessName || c.name}</span>
                          <span className="text-slate-300 italic text-[9px]">{c.role === UserRole.DISTRIBUTOR ? 'B2B PARTNER' : 'RETAIL CLIENT'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="space-y-5">
                    <input type="text" placeholder={t('client_business')} className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-[13px] font-bold uppercase outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all shadow-inner" value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})} />
                    <input type="text" placeholder={t('contact_email')} className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-[13px] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all shadow-inner" value={clientInfo.email} onChange={e => setClientInfo({...clientInfo, email: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-8">
                  <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">DATE CONTROLS</h4>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-6">ISSUANCE</label>
                       <input type="date" className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-[13px] font-black outline-none shadow-inner" value={clientInfo.date} onChange={e => setClientInfo({...clientInfo, date: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-6">SERVICE</label>
                       <input type="date" className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-[13px] font-black outline-none shadow-inner" value={clientInfo.serviceDate} onChange={e => setClientInfo({...clientInfo, serviceDate: e.target.value})} />
                    </div>
                  </div>
                  <div className="p-8 bg-slate-900 rounded-[2.5rem] flex items-center justify-between shadow-2xl ring-4 ring-slate-100">
                    <span className="text-[11px] font-black text-teal-400 uppercase tracking-[0.3em]">Tax Reference</span>
                    <span className="text-2xl font-black text-white tracking-tighter">{clientInfo.invoiceNumber}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-8 pt-12 border-t border-slate-100">
                 <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">{t('services_products')}</h4>
                 <div className="space-y-5">
                   {items.map(item => {
                     const isServiceItem = SERVICES.some(s => s.name === item.description);
                     return (
                      <div key={item.id} className="flex gap-6 items-center group animate-in slide-in-from-left-2 duration-300">
                        <div className={`w-2.5 h-12 rounded-full transition-colors shrink-0 shadow-sm ${isServiceItem ? 'bg-[#FF6B9D]' : item.description ? 'bg-[#20B2AA]' : 'bg-slate-100'}`} />
                        <input type="text" placeholder={`${t('description')}...`} className="flex-1 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-[13px] font-bold uppercase outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 transition-all shadow-inner" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                        <input type="number" className="w-24 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-[13px] font-black text-center shadow-inner" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} />
                        <div className="relative">
                           <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">£</span>
                           <input type="number" step="0.01" className="w-32 p-6 pl-10 bg-slate-50 rounded-[2rem] border border-slate-100 text-[13px] font-black text-right shadow-inner" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', e.target.value)} />
                        </div>
                        <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-[1.5rem] transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={20}/>
                        </button>
                      </div>
                    );
                   })}
                 </div>
                 <button onClick={() => setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0, total: 0 }])} className="px-12 py-5 bg-slate-50 text-slate-500 rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm active:scale-95">
                   <Plus size={20}/> {t('new_line')}
                 </button>
              </div>
            </div>
          </div>

          <div className="space-y-10">
             <div className="bg-white rounded-[4rem] border border-slate-200 overflow-hidden shadow-2xl flex flex-col">
                <div className="flex bg-slate-100 p-2.5">
                   <button onClick={() => setQuickTab('services')} className={`flex-1 py-5 rounded-[3.5rem] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${quickTab === 'services' ? 'bg-white text-[#FF6B9D] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                      <Activity size={18}/> Services
                   </button>
                   <button onClick={() => setQuickTab('snacks')} className={`flex-1 py-5 rounded-[3.5rem] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${quickTab === 'snacks' ? 'bg-white text-[#20B2AA] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                      <ShoppingCart size={18}/> Snacks
                   </button>
                </div>
                <div className="p-8 max-h-[600px] overflow-y-auto no-scrollbar space-y-4 bg-white">
                   {quickTab === 'snacks' ? (
                     PRODUCTS.map(p => (
                       <button key={p.id} onClick={() => addItemToInvoice(p)} className="w-full flex justify-between items-center p-5 bg-slate-50 hover:bg-teal-50 border border-transparent hover:border-[#20B2AA] rounded-[2rem] transition-all group shadow-sm">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-inner text-2xl group-hover:scale-110 transition-transform">{p.icon}</div>
                             <span className="text-[12px] font-black text-slate-700 uppercase group-hover:text-[#20B2AA] tracking-tight text-left">{p.name}</span>
                          </div>
                          <span className="text-[12px] font-black text-slate-400 group-hover:text-slate-900">£{p.basePrice.toFixed(2)}</span>
                       </button>
                     ))
                   ) : (
                     SERVICES.map(s => (
                       <button key={s.id} onClick={() => addItemToInvoice(s)} className="w-full flex justify-between items-center p-5 bg-slate-50 hover:bg-pink-50 border border-transparent hover:border-[#FF6B9D] rounded-[2rem] transition-all group shadow-sm">
                          <div className="flex items-center gap-5">
                             <span className="text-3xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-500">{s.icon}</span>
                             <span className="text-[12px] font-black text-slate-700 uppercase group-hover:text-[#FF6B9D] tracking-tight text-left">{s.name}</span>
                          </div>
                          <span className="text-[12px] font-black text-slate-400 group-hover:text-slate-900">£{s.price.toFixed(2)}</span>
                       </button>
                     ))
                   )}
                </div>
             </div>

             <div className="bg-slate-900 p-12 rounded-[4.5rem] text-white shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] space-y-10 relative overflow-hidden ring-8 ring-slate-100">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                   <Zap size={200} className="text-[#C6FF00]" />
                </div>
                <div className="space-y-8 relative z-10">
                   <div className="flex justify-between items-center">
                      <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em]">GROSS SUBTOTAL</p>
                      <p className="text-2xl font-black">£{totals.subtotal.toFixed(2)}</p>
                   </div>
                   {totals.discount > 0 && (
                     <div className="flex justify-between items-center animate-in fade-in slide-in-from-right-2">
                       <p className="text-[12px] font-black text-teal-400 uppercase tracking-[0.3em] italic">PARTNER DISCOUNT</p>
                       <p className="text-2xl font-black text-teal-400">-£{totals.discount.toFixed(2)}</p>
                     </div>
                   )}
                   <div className="pt-10 border-t border-white/10">
                      <p className="text-[12px] font-black text-[#C6FF00] uppercase tracking-[0.4em] mb-6 leading-none">TOTAL TO BILL</p>
                      <h5 className="text-7xl font-black text-white tracking-tighter leading-none">£{totals.total.toFixed(2)}</h5>
                   </div>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="max-w-[900px] mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
           <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem] flex items-center justify-between no-print shadow-sm">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><CheckCircle size={32}/></div>
                 <div>
                    <h3 className="text-xl font-black text-emerald-900 uppercase">Sale Recorded Successfully</h3>
                    <p className="text-emerald-600 font-bold text-sm">Invoice #{clientInfo.invoiceNumber} is now part of the master audit.</p>
                 </div>
              </div>
           </div>
           
           <div className="flex justify-center w-full">
              <div className="w-full max-w-[800px] print-only border-2 border-slate-50 rounded-[4rem] shadow-2xl">
                 <PrintableContent />
              </div>
           </div>
        </div>
      )}

      {showStripeModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-6 pointer-events-auto">
          <StripePayment 
            amount={totals.total} 
            clientName={clientInfo.name} 
            onSuccess={(pid) => { handleSave(InvoiceStatus.PAID); setShowStripeModal(false); }} 
            onCancel={() => setShowStripeModal(false)} 
          />
        </div>
      )}
    </div>
  );
};

export default InvoiceBuilder;
