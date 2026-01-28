import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, CheckCircle, Package, ArrowRight, Zap, AlertCircle, ShoppingBag, TrendingUp } from 'lucide-react';
import { PRODUCTS, PRICING_TIERS, THEME } from '../constants';
import { useNavigate } from 'react-router-dom';
import { InventoryItem, InvoiceStatus, UserRole, AppNotification } from '../types';
import StripePayment from '../components/StripePayment';
import { useLanguage } from '../context/LanguageContext';

const DistributorCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [showPayment, setShowPayment] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const currentUser = { name: "Distribuidor Partner Bristol", email: "bristol@partners.mdc.uk" };

  useEffect(() => {
    const savedInv = JSON.parse(localStorage.getItem('mdc_inventory') || '[]');
    setInventory(savedInv);
  }, []);

  const addNotification = (notif: Partial<AppNotification>) => {
    const saved = JSON.parse(localStorage.getItem('mdc_notifications') || '[]');
    const fullNotif = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleString(),
      read: false,
      ...notif
    };
    localStorage.setItem('mdc_notifications', JSON.stringify([fullNotif, ...saved]));
    window.dispatchEvent(new Event('storage'));
  };

  const updateCart = (id: string, delta: number) => {
    setCart(prev => {
      const current = prev[id] || 0;
      const newVal = Math.max(0, current + delta);
      
      const prod = PRODUCTS.find(p => p.id === id);
      const invItem = inventory.find(i => i.name === prod?.name);
      
      if (invItem && newVal > invItem.quantity) {
        setError(`Lo sentimos, stock insuficiente para ${prod?.name}. Máximo disponible: ${invItem.quantity}`);
        return prev;
      }
      
      setError(null);
      return { ...prev, [id]: newVal };
    });
  };

  const cartStats = useMemo(() => {
    let totalUnits = 0;
    let baseTotal = 0;
    (Object.entries(cart) as [string, number][]).forEach(([id, qty]) => {
      const prod = PRODUCTS.find(p => p.id === id);
      if (prod) {
        totalUnits += qty;
        baseTotal += prod.basePrice * qty;
      }
    });

    let activeTier = PRICING_TIERS[0];
    for (const tier of [...PRICING_TIERS].reverse()) {
      if (totalUnits >= tier.min) { activeTier = tier; break; }
    }
    const discount = baseTotal * activeTier.discount;
    const finalTotal = baseTotal - discount;
    return { totalUnits, baseTotal, activeTier, discount, finalTotal };
  }, [cart]);

  const handleStartCheckout = () => {
    if (cartStats.totalUnits < 6) {
      alert("El pedido mínimo para distribuidores es de 6 unidades totales.");
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    let updatedInventory = [...inventory];
    (Object.entries(cart) as [string, number][]).forEach(([id, qty]) => {
      if (qty > 0) {
        const prod = PRODUCTS.find(p => p.id === id)!;
        const invItem = updatedInventory.find(i => i.name === prod.name);
        if (invItem) invItem.quantity -= qty;
      }
    });

    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invNumber = `WHS-${year}-${randomNum}`;
    
    const newInvoice = {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNumber: invNumber,
      clientName: currentUser.name,
      clientEmail: currentUser.email,
      clientPhone: '07000 000000',
      clientAddress: 'Distribuidor Autorizado MDC',
      clientCityPostcode: 'Bristol UK',
      date: new Date().toISOString().split('T')[0],
      serviceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: (Object.entries(cart) as [string, number][]).filter(([_, qty]) => qty > 0).map(([id, qty]) => {
        const p = PRODUCTS.find(x => x.id === id)!;
        return {
          id,
          description: p.name,
          quantity: qty,
          unitPrice: p.basePrice * (1 - cartStats.activeTier.discount),
          total: qty * (p.basePrice * (1 - cartStats.activeTier.discount))
        };
      }),
      subtotal: cartStats.finalTotal,
      total: cartStats.finalTotal,
      status: InvoiceStatus.PAID,
      isWholesale: true,
      discountApplied: cartStats.discount,
      paymentId: paymentId,
      paymentMethod: 'Stripe',
      paidAt: new Date().toISOString()
    };

    const existingInvoices = JSON.parse(localStorage.getItem('mdc_invoices') || '[]');
    localStorage.setItem('mdc_invoices', JSON.stringify([newInvoice, ...existingInvoices]));
    localStorage.setItem('mdc_inventory', JSON.stringify(updatedInventory));
    
    addNotification({
      title: 'Nuevo Pedido Mayorista',
      message: `El Distribuidor ${currentUser.name} ha realizado un pedido de £${cartStats.finalTotal.toFixed(2)}.`,
      type: 'order',
      targetRole: UserRole.ADMIN
    });

    addNotification({
      title: 'Pedido Confirmado',
      message: `Tu pedido ${invNumber} por £${cartStats.finalTotal.toFixed(2)} ha sido procesado con éxito.`,
      type: 'payment',
      targetRole: UserRole.DISTRIBUTOR
    });

    setShowPayment(false);
    setOrderSuccess(true);
    setTimeout(() => navigate('/orders'), 3000);
  };

  if (orderSuccess) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-700">
        <div className="w-40 h-40 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-3xl shadow-emerald-100 rotate-12"><CheckCircle size={80} /></div>
        <div className="text-center">
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter">{t('order_completed')}</h2>
          <p className="text-slate-500 font-bold italic text-xl uppercase tracking-widest mt-4">{t('transaction_processed')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-40">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-3">
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">{t('catalog_b2b').split(' ')[0]} <span className="text-[#20B2AA]">{t('catalog_b2b').split(' ')[1]}</span></h2>
          <p className="text-slate-500 font-medium italic text-xl">{t('partner_price')}</p>
        </div>
        <div className="bg-white px-10 py-5 rounded-[2.5rem] border border-slate-100 flex items-center gap-4 shadow-sm">
          <Zap className="text-amber-500" size={24} />
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('distributor_tier')}</p>
            <p className="text-sm font-black text-slate-900">Partner {cartStats.activeTier.name} ({(cartStats.activeTier.discount * 100).toFixed(0)}%)</p>
          </div>
        </div>
      </header>

      {error && (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 font-black text-sm flex items-center gap-4 animate-shake">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          {PRODUCTS.map(prod => {
            const invItem = inventory.find(i => i.name === prod.name);
            const stock = invItem?.quantity || 0;
            const isOutOfStock = stock === 0;
            const discountedPrice = prod.basePrice * (1 - cartStats.activeTier.discount);
            const unitMargin = prod.basePrice - discountedPrice;

            return (
              <div key={prod.id} className={`bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all group ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}>
                 <div className="h-56 bg-white flex items-center justify-center relative overflow-hidden p-6">
                    <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle, ${THEME.primary} 0%, transparent 70%)` }} />
                    {/* Fixed: Property 'image' does not exist on PRODUCTS type, using any cast */}
                    <img 
                      src={(prod as any).image} 
                      alt={prod.name} 
                      className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f8fafc/94a3b8?text=Snack+Gourmet';
                      }}
                    />
                    {isOutOfStock && <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center"><span className="text-white font-black text-xs uppercase tracking-[0.3em]">Sin Existencias</span></div>}
                    
                    {/* Badge de Margen de Ganancia */}
                    <div className="absolute top-4 left-4 bg-emerald-500 text-white px-4 py-2 rounded-full font-black text-[9px] uppercase shadow-lg flex items-center gap-2">
                       <TrendingUp size={12}/> {t('profit_per_unit')}: £{unitMargin.toFixed(2)}
                    </div>
                 </div>
                 <div className="p-10 space-y-6">
                    <div className="flex justify-between items-start">
                       <div>
                          <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{prod.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">PVP: £{prod.basePrice.toFixed(2)}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-2xl font-black text-[#20B2AA]">£{discountedPrice.toFixed(2)}</p>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Tu Precio B2B</p>
                       </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{(prod as any).description}</p>
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-[2.2rem] border border-slate-100">
                       <button 
                         onClick={() => updateCart(prod.id, -1)} 
                         disabled={isOutOfStock}
                         className="p-4 text-slate-400 hover:text-rose-500 transition-all active:scale-90"
                       >
                         <Minus size={22}/>
                       </button>
                       <span className="text-2xl font-black text-slate-900">{cart[prod.id] || 0}</span>
                       <button 
                         onClick={() => updateCart(prod.id, 1)} 
                         disabled={isOutOfStock || (cart[prod.id] || 0) >= stock}
                         className="p-4 text-[#20B2AA] hover:scale-110 transition-all active:scale-90"
                       >
                         <Plus size={22}/>
                       </button>
                    </div>
                 </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-3xl sticky top-10 border border-white/5">
              <div className="flex items-center gap-4 mb-10"><ShoppingCart size={28} className="text-[#C6FF00]" /><h3 className="font-black text-2xl uppercase tracking-tighter">Tu Pedido</h3></div>
              <div className="space-y-6 mb-12 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                 {(Object.entries(cart) as [string, number][]).filter(([_, qty]) => qty > 0).map(([id, qty]) => {
                   const p = PRODUCTS.find(x => x.id === id)!;
                   const discountedItemPrice = p.basePrice * (1 - cartStats.activeTier.discount);
                   return (
                    <div key={id} className="flex justify-between items-center text-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-white">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase">£{discountedItemPrice.toFixed(2)} x {qty}</span>
                      </div>
                      <span className="font-black">£{(qty * discountedItemPrice).toFixed(2)}</span>
                    </div>
                   );
                 })}
                 {Object.values(cart).every(q => q === 0) && <p className="text-slate-500 italic text-center py-10 font-bold uppercase tracking-widest text-xs">Añade productos para comenzar</p>}
              </div>
              <div className="pt-8 border-t border-white/10 space-y-6">
                 <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nivel: {cartStats.activeTier.name}</span><span className="text-emerald-400 font-black">-{cartStats.activeTier.discount * 100}%</span></div>
                 <div className="flex justify-between items-end pt-4"><span className="text-2xl font-black uppercase tracking-tighter text-teal-400">Total B2B:</span><span className="text-5xl font-black text-[#C6FF00] tracking-tighter">£{cartStats.finalTotal.toFixed(2)}</span></div>
                 <button 
                  onClick={handleStartCheckout} 
                  disabled={cartStats.totalUnits < 6} 
                  className="w-full bg-[#FF6B9D] text-white py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl mt-10 hover:bg-[#FF4081] hover:scale-105 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {cartStats.totalUnits < 6 ? t('min_order').replace('{0}', (6 - cartStats.totalUnits).toString()) : t('pay_stripe')}
                </button>
              </div>
           </div>
        </div>
      </div>

      {showPayment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6">
          <StripePayment 
            amount={cartStats.finalTotal} 
            clientName={currentUser.name}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowPayment(false)}
          />
        </div>
      )}
    </div>
  );
};

export default DistributorCatalog;