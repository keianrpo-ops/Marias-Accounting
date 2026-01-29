import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle,
  ArrowRight,
  Zap,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { PRODUCTS, PRICING_TIERS } from '../constants';
import { useNavigate } from 'react-router-dom';
import { InvoiceStatus, Order, Invoice } from '../types';
import StripePayment from '../components/StripePayment';
import { db } from '../services/supabase';
import { useLanguage } from '../context/LanguageContext';

const DistributorCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [showPayment, setShowPayment] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Usuario actual (B2B)
  const currentUser = {
    name: localStorage.getItem('userName') || 'Partner MDC',
    email: localStorage.getItem('userEmail') || 'partner@mdc.uk',
  };

  const updateCart = (id: string, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const newVal = Math.max(0, current + delta);
      setError(null);
      return { ...prev, [id]: newVal };
    });
  };

  const cartStats = useMemo(() => {
    let totalUnits = 0;
    let baseTotal = 0;

    Object.entries(cart).forEach(([id, qty]) => {
      const prod = PRODUCTS.find((p) => p.id === id);
      const q = Number(qty) || 0;
      if (prod) {
        totalUnits += q;
        baseTotal += prod.basePrice * q;
      }
    });

    let activeTier = PRICING_TIERS[0];
    for (const tier of [...PRICING_TIERS].reverse()) {
      if (totalUnits >= tier.min) {
        activeTier = tier;
        break;
      }
    }

    const finalTotal = baseTotal * (1 - activeTier.discount);

    return {
      totalUnits,
      baseTotal,
      activeTier,
      finalTotal: Number.isFinite(finalTotal) ? finalTotal : 0,
    };
  }, [cart]);

  const processOrderSuccess = async (paymentId: string) => {
    if (isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const year = new Date().getFullYear();
      const invNumber = `WHS-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

      const orderItems = Object.entries(cart)
        .filter(([_, q]) => (Number(q) || 0) > 0)
        .map(([id, q]) => {
          const p = PRODUCTS.find((x) => x.id === id);
          if (!p) throw new Error(`Producto no encontrado: ${id}`);

          const qty = Number(q) || 0;
          const unitPrice = p.basePrice * (1 - cartStats.activeTier.discount);

          return {
            id: p.id,
            description: p.name,
            quantity: qty,
            unitPrice,
            total: qty * unitPrice,
          };
        });

      if (orderItems.length === 0) throw new Error('El carrito está vacío.');

      // ✅ ID temporal SOLO para local/UI. Supabase genera UUID real al insertar.
      const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // ✅ ORDER (lo que consume Admin Orders + Distributor Portal)
      const newOrder: Order = {
        id: tempId as any,
        orderNumber: invNumber,
        clientName: currentUser.name,
        clientEmail: currentUser.email, // ✅ CRÍTICO para el historial del distribuidor
        total: cartStats.finalTotal,
        status: InvoiceStatus.PAID,
        date: new Date().toISOString().split('T')[0],
        isWholesale: true,
        items: orderItems,
        paymentId,
      };

      // ✅ INVOICE B2B (para panel de ingresos / auditoría)
      const newInvoice: Invoice = {
        ...(newOrder as any),
        invoiceNumber: invNumber,
        clientPhone: '-',
        clientAddress: 'B2B Purchase',
        clientCityPostcode: '-',
        serviceDate: newOrder.date,
        dueDate: newOrder.date,
        subtotal: cartStats.baseTotal,
        isVatInvoice: false,
      };

      // ✅ Guardar
      const savedOrder = await db.orders.save(newOrder);
      console.log('[B2B SAVE] newOrder =>', newOrder);
      console.log('[B2B SAVE] savedOrder =>', savedOrder);

      const ls = JSON.parse(localStorage.getItem('mdc_orders') || '[]');
      console.log('[B2B SAVE] localStorage mdc_orders (top 3) =>', ls.slice(0, 3));
      console.log('[B2B SAVE] localStorage mdc_orders (last 3) =>', ls.slice(-3));

      const dbAll = await db.orders.getAll();
      console.log('[B2B SAVE] db.orders.getAll() count =>', dbAll?.length, dbAll);


      await db.invoices.save(newInvoice);

      const finalOrder = (savedOrder || newOrder) as any;

      // ✅ WhatsApp message
      const msg =
        `🐾 *NUEVO PEDIDO PAGADO - MDC B2B*\n\n` +
        `📄 *Orden:* ${finalOrder?.orderNumber || invNumber}\n` +
        `👤 *Cliente:* ${finalOrder?.clientName || currentUser.name}\n` +
        `📧 *Email:* ${finalOrder?.clientEmail || currentUser.email}\n` +
        `💰 *Total:* £${Number(finalOrder?.total ?? cartStats.finalTotal).toFixed(2)}`;

      const url = `https://wa.me/44759456200?text=${encodeURIComponent(msg)}`;
      setWhatsappLink(url);

      // ✅ Success UI
      setShowPayment(false);
      setOrderSuccess(true);

      // ✅ (Opcional) limpiar carrito para próxima compra
      setCart({});

      // ✅ Notificar a todas las vistas:
      // - storage: compatibilidad cross-tab
      // - mdc:datachanged: evento interno del app (si lo estás usando en DistributorPortal)
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('mdc:datachanged'));
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Error al guardar el pedido en la base de datos.');
      setOrderSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-12 animate-in zoom-in-95 p-8 text-center">
        <div className="w-44 h-44 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-3xl rotate-12 relative">
          <CheckCircle size={90} />
        </div>

        <div className="space-y-4">
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            ¡Pago Confirmado!
          </h2>
          <p className="text-slate-500 font-bold text-xl max-w-lg mx-auto leading-relaxed uppercase tracking-widest italic">
            Tu pedido ha sido registrado en nuestro sistema de operaciones.
          </p>
        </div>

        <div className="flex flex-col gap-5 w-full max-w-sm">
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="bg-[#25D366] text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-all"
            >
              <MessageCircle size={22} /> Avisar a Maria
            </a>
          )}

          <button
            onClick={() => navigate('/')}
            className="text-xs font-black uppercase text-slate-400 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
          >
            Volver al Panel <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-40">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-3">
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none uppercase">
            B2B <span className="text-[#20B2AA]">Stock</span>
          </h2>
          <p className="text-slate-500 font-medium italic text-xl">
            Tarifas Partner: Nivel {cartStats.activeTier.name}
          </p>
        </div>

        <div className="bg-white px-10 py-5 rounded-[2.5rem] border border-slate-100 flex items-center gap-4 shadow-sm">
          <Zap className="text-amber-500" size={24} />
          <p className="text-sm font-black text-slate-900">
            {(cartStats.activeTier.discount * 100).toFixed(0)}% Ahorro B2B
          </p>
        </div>
      </header>

      {error && (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 font-black text-sm animate-shake flex items-center gap-3">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          {PRODUCTS.map((prod) => {
            const qty = Number(cart[prod.id]) || 0;
            const price = prod.basePrice * (1 - cartStats.activeTier.discount);

            return (
              <div
                key={prod.id}
                className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all group p-2"
              >
                <div className="h-60 bg-slate-50 rounded-[2.8rem] flex items-center justify-center relative p-6">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-700"
                  />
                </div>

                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                      {prod.name}
                    </h4>
                    <p className="text-2xl font-black text-[#20B2AA]">£{price.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-full border border-slate-100">
                    <button
                      onClick={() => updateCart(prod.id, -1)}
                      className="p-4 bg-white text-slate-400 hover:text-rose-500 rounded-full transition-all active:scale-90"
                    >
                      <Minus size={22} />
                    </button>

                    <span className="text-3xl font-black text-slate-900">{qty}</span>

                    <button
                      onClick={() => updateCart(prod.id, 1)}
                      className="p-4 bg-slate-900 text-[#C6FF00] hover:scale-110 rounded-full transition-all active:scale-90"
                    >
                      <Plus size={22} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 p-12 rounded-[4.5rem] text-white shadow-3xl sticky top-10 border border-slate-800 ring-8 ring-slate-100">
            <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-8">
              <ShoppingCart size={28} className="text-[#C6FF00]" />
              <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">Tu Carrito</h3>
            </div>

            <div className="space-y-6 mb-12 max-h-[350px] overflow-y-auto no-scrollbar">
              {Object.entries(cart)
                .filter(([_, q]) => (Number(q) || 0) > 0)
                .map(([id, q]) => {
                  const p = PRODUCTS.find((x) => x.id === id)!;
                  const qty = Number(q) || 0;
                  const lineTotal = qty * p.basePrice * (1 - cartStats.activeTier.discount);

                  return (
                    <div key={id} className="flex justify-between items-center text-sm">
                      <span className="font-bold text-white uppercase text-[12px]">
                        {p.name} x {qty}
                      </span>
                      <span className="font-black text-white">£{lineTotal.toFixed(2)}</span>
                    </div>
                  );
                })}
            </div>

            <div className="pt-8 border-t border-white/10 space-y-6 text-center">
              <p className="text-5xl font-black text-[#C6FF00] tracking-tighter leading-none">
                £{cartStats.finalTotal.toFixed(2)}
              </p>

              <button
                onClick={() =>
                  cartStats.totalUnits < 6 ? setError('Pedido mínimo: 6 unidades') : setShowPayment(true)
                }
                className="w-full bg-[#FF6B9D] text-white py-8 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl disabled:opacity-40"
                disabled={cartStats.totalUnits === 0 || isSaving}
              >
                {isSaving
                  ? 'Guardando...'
                  : cartStats.totalUnits < 6
                    ? `Faltan ${6 - cartStats.totalUnits} u.`
                    : 'Pagar y Reservar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPayment && cartStats.finalTotal > 0 && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-6 pointer-events-auto">
          <StripePayment
            amount={cartStats.finalTotal}
            clientName={currentUser.name}
            onSuccess={processOrderSuccess}
            onCancel={() => (isSaving ? null : setShowPayment(false))}
          />
        </div>
      )}
    </div>
  );
};

export default DistributorCatalog;
