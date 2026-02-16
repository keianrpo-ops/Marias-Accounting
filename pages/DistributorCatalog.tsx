import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle,
  ArrowRight,
  Zap,
  AlertCircle,
  MessageCircle,
  FileText,
  X,
  Loader2,
} from 'lucide-react';
import { PRODUCTS, PRICING_TIERS } from '../constants';
import { useNavigate } from 'react-router-dom';
import { InvoiceStatus } from '../types';
import StripePayment from '../components/StripePayment';
import { supabase } from '../services/supabase';
import { useLanguage } from '../context/LanguageContext';

type AuthUserInfo = {
  id: string;
  email: string;
  name: string;
  business_name?: string;
};

const DistributorCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [step, setStep] = useState<'catalog' | 'invoice_preview' | 'stripe' | 'success'>('catalog');

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // ✅ Usuario real (Supabase Auth)
  const [user, setUser] = useState<AuthUserInfo | null>(null);

  // Drafts (se generan antes de Stripe para mostrar preview)
  const [draftInvoiceNumber, setDraftInvoiceNumber] = useState<string>('');
  const [draftOrderItems, setDraftOrderItems] = useState<any[]>([]);
  const [draftTotals, setDraftTotals] = useState<{
    subtotal: number;
    total: number;
    discountPct: number;
    tierName: string;
    totalUnits: number;
  }>({ subtotal: 0, total: 0, discountPct: 0, tierName: PRICING_TIERS[0].name, totalUnits: 0 });

  // =========================
  // 1) Cargar usuario REAL + perfil (clients)
  // =========================
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoadingUser(true);

        if (!supabase) {
          setError('Supabase no está activo. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
          return;
        }

        const { data, error: authErr } = await supabase.auth.getUser();
        const authUser = data?.user;

        if (authErr || !authUser?.email || !authUser?.id) {
          navigate('/');
          return;
        }

        const email = (authUser.email || '').trim();
        const fallbackName =
          (authUser.user_metadata?.name as string) ||
          (email.split('@')[0] || 'Partner MDC');

        // Traer datos del cliente (tabla clients) para business_name si existe
        const { data: clientData } = await supabase
          .from('clients')
          .select('id,email,name,business_name')
          .eq('id', authUser.id)
          .single();

        const resolved: AuthUserInfo = {
          id: authUser.id,
          email,
          name: clientData?.name || fallbackName,
          business_name: clientData?.business_name || '',
        };

        if (!alive) return;
        setUser(resolved);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'Error cargando sesión del distribuidor.');
      } finally {
        if (alive) setLoadingUser(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [navigate]);

  const updateCart = (id: string, delta: number) => {
    setCart((prev) => {
      const current = Number(prev[id]) || 0;
      const newVal = Math.max(0, current + delta);
      setError(null);
      return { ...prev, [id]: newVal };
    });
  };

  // =========================
  // 2) Calcular tier, subtotal y total
  // =========================
  const cartStats = useMemo(() => {
    let totalUnits = 0;
    let subtotal = 0;

    Object.entries(cart).forEach(([id, qty]) => {
      const prod = PRODUCTS.find((p) => p.id === id);
      const q = Number(qty) || 0;
      if (prod && q > 0) {
        totalUnits += q;
        subtotal += (Number((prod as any).basePrice) || 0) * q;
      }
    });

    let activeTier = PRICING_TIERS[0];
    for (const tier of [...PRICING_TIERS].reverse()) {
      if (totalUnits >= tier.min) {
        activeTier = tier;
        break;
      }
    }

    const discountPct = Number(activeTier.discount) || 0;
    const total = subtotal * (1 - discountPct);

    return {
      totalUnits,
      subtotal: Number.isFinite(subtotal) ? subtotal : 0,
      activeTier,
      discountPct,
      total: Number.isFinite(total) ? total : 0,
    };
  }, [cart]);

  // =========================
  // 3) Consecutivo centralizado (RECOMENDADO con RPC)
  // =========================
  const getNextInvoiceNumber = async (): Promise<string> => {
    try {
      if (supabase) {
        const { data, error: rpcErr } = await supabase.rpc('next_invoice_number', {
          p_prefix: 'WHS',
        });
        if (!rpcErr && data && typeof data === 'string') return data;
      }
    } catch (e) {
      console.warn('RPC next_invoice_number no disponible o falló. Usando fallback.', e);
    }

    // Fallback (NO garantiza unicidad)
    const year = new Date().getFullYear();
    return `WHS-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  // =========================
  // 4) Construir items + guardar draft para preview
  // =========================
  const buildDraft = async () => {
    if (!user?.email) throw new Error('No hay usuario autenticado.');

    const items = Object.entries(cart)
      .filter(([_, q]) => (Number(q) || 0) > 0)
      .map(([id, q]) => {
        const p = PRODUCTS.find((x) => x.id === id);
        if (!p) throw new Error(`Producto no encontrado: ${id}`);

        const qty = Number(q) || 0;
        const unitBase = Number((p as any).basePrice) || 0;
        const unitPrice = unitBase * (1 - cartStats.discountPct);

        return {
          id: (p as any).id,
          description: (p as any).name,
          quantity: qty,
          unitPrice,
          total: qty * unitPrice,
        };
      });

    if (items.length === 0) throw new Error('El carrito está vacío.');

    const invoiceNumber = await getNextInvoiceNumber();

    setDraftInvoiceNumber(invoiceNumber);
    setDraftOrderItems(items);
    setDraftTotals({
      subtotal: cartStats.subtotal,
      total: cartStats.total,
      discountPct: cartStats.discountPct,
      tierName: cartStats.activeTier.name,
      totalUnits: cartStats.totalUnits,
    });

    return { invoiceNumber, items };
  };

  // =========================
  // 5) Click: ir a Preview (antes de Stripe)
  // =========================
  const goToInvoicePreview = async () => {
    try {
      setError(null);
      if (cartStats.totalUnits < 6) {
        setError('Pedido mínimo: 6 unidades');
        return;
      }
      await buildDraft();
      setStep('invoice_preview');
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'No se pudo preparar la factura.');
    }
  };

  // =========================
  // 6) Guardar en Supabase DIRECTO (evita que el wrapper dañe client_email)
  // =========================
const finalizePaidOrder = async (paymentId: string) => {
  if (isSaving) return;
  if (!supabase) return;
  if (!user?.email || !user?.id) return;

  setIsSaving(true);
  setError(null);

  try {
    // Asegurar draft
    let invNumber = draftInvoiceNumber;
    let items = draftOrderItems;

    if (!invNumber || !items || items.length === 0) {
      const rebuilt = await buildDraft();
      invNumber = rebuilt.invoiceNumber;
      items = rebuilt.items;
    }

    const todayIso = new Date().toISOString();
    const today = todayIso.split('T')[0];

    const clientEmail = String(user.email || '').trim().toLowerCase();
    const clientName = String(user.business_name || user.name || 'Partner MDC').trim();

    // =========================
    // INSERT: orders (snake_case real)
    // =========================
    const orderInsert = {
      order_number: invNumber,
      status: 'paid', // mantener consistente con tu tabla
      total: Number(draftTotals.total || cartStats.total),
      is_wholesale: true,

      // ✅ LINK REAL (esto es lo que te estaba rompiendo el dashboard cuando quedaba partner@mdc.uk)
      client_email: clientEmail,
      client_id: user.id,
      client_name: clientName,

      items: items, // jsonb

      // ⚠️ date: solo si tu tabla orders realmente tiene columna "date"
      // (en tus screenshots se ve "date" en tu modelo/normalización, pero si no existe quítala)
      date: today,

      payment_id: paymentId,

      // ⚠️ created_at: solo si NO tienes default now() o quieres forzarlo
      // si tu tabla ya tiene default, puedes quitar esta línea
      created_at: todayIso,
    };

    const { data: savedOrder, error: orderErr } = await supabase
      .from('orders')
      .insert(orderInsert)
      .select('id, order_number')
      .single();

    if (orderErr) throw orderErr;

    // =========================
    // INSERT: invoices (mínimo viable)
    // ⚠️ OJO: NO invento columnas.
    // Mantengo solo campos que normalmente existen en tu tabla invoices
    // y que tu app ya usa: invoice_number, order_number, client_* , items, subtotal, total, status, is_wholesale, payment_id, created_at
    // =========================
    const invoiceInsert = {
      invoice_number: invNumber,

      // ✅ más robusto que order_id (porque tu tabla invoices puede no tener order_id)
      // si tu tabla invoices NO tiene order_number, entonces cambia por order_id y asegúrate que exista.
      order_number: invNumber,

      status: 'paid',
      total: Number(draftTotals.total || cartStats.total),
      subtotal: Number(draftTotals.subtotal || cartStats.subtotal),
      is_wholesale: true,

      client_email: clientEmail,
      client_name: clientName,

      // ⚠️ client_id solo si tu tabla invoices lo tiene.
      // Si NO existe, comenta esta línea.
      client_id: user.id,

      items: items,
      payment_id: paymentId,

      // ⚠️ created_at solo si no tienes default now()
      created_at: todayIso,
    };

    const { error: invErr } = await supabase.from('invoices').insert(invoiceInsert);
    if (invErr) throw invErr;

    // WhatsApp notify
    const msg =
      `🐾 *NUEVO PEDIDO PAGADO - MDC B2B*\n\n` +
      `📄 *Orden:* ${invNumber}\n` +
      `👤 *Cliente:* ${clientName}\n` +
      `📧 *Email:* ${clientEmail}\n` +
      `💰 *Total:* £${Number(orderInsert.total).toFixed(2)}`;

    const url = `https://wa.me/44759456200?text=${encodeURIComponent(msg)}`;
    setWhatsappLink(url);

    // UI success
    setStep('success');
    setOrderSuccess(true);

    // limpiar carrito
    setCart({});

    // refrescar vistas (si las usas)
    try {
      window.dispatchEvent(new Event('mdc:datachanged'));
      localStorage.setItem('__mdc_ping', String(Date.now()));
    } catch {}
  } catch (e: any) {
    console.error(e);
    setError(e?.message || 'Error al guardar pedido y factura en la base de datos.');
    setStep('catalog');
  } finally {
    setIsSaving(false);
  }
};

  // =========================
  // UI: Success
  // =========================
  if (orderSuccess || step === 'success') {
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
            Tu pedido y tu factura quedaron registrados en el sistema.
          </p>
          {draftInvoiceNumber && (
            <p className="text-slate-900 font-black text-sm">
              Invoice #: <span className="text-[#20B2AA]">{draftInvoiceNumber}</span>
            </p>
          )}
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

  // =========================
  // UI: Main
  // =========================
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
          {user?.email && (
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Sesión: {user.email}
            </p>
          )}
        </div>

        <div className="bg-white px-10 py-5 rounded-[2.5rem] border border-slate-100 flex items-center gap-4 shadow-sm">
          <Zap className="text-amber-500" size={24} />
          <p className="text-sm font-black text-slate-900">
            {(Number(cartStats.activeTier.discount) * 100).toFixed(0)}% Ahorro B2B
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
          {PRODUCTS.map((prod: any) => {
            const qty = Number(cart[prod.id]) || 0;
            const price =
              (Number(prod.basePrice) || 0) *
              (1 - (Number(cartStats.activeTier.discount) || 0));

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
                    <p className="text-2xl font-black text-[#20B2AA]">
                      £{price.toFixed(2)}
                    </p>
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
              <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">
                Tu Carrito
              </h3>
            </div>

            <div className="space-y-6 mb-10 max-h-[350px] overflow-y-auto no-scrollbar">
              {Object.entries(cart)
                .filter(([_, q]) => (Number(q) || 0) > 0)
                .map(([id, q]) => {
                  const p: any = PRODUCTS.find((x: any) => x.id === id)!;
                  const qty = Number(q) || 0;
                  const lineTotal =
                    qty *
                    (Number(p.basePrice) || 0) *
                    (1 - (Number(cartStats.activeTier.discount) || 0));

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
                £{cartStats.total.toFixed(2)}
              </p>

              {/* ✅ Paso 1: PREVIEW FACTURA */}
              <button
                onClick={goToInvoicePreview}
                className="w-full bg-[#FF6B9D] text-white py-7 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl disabled:opacity-40 flex items-center justify-center gap-3"
                disabled={cartStats.totalUnits === 0 || isSaving}
              >
                {isSaving ? (
                  'Guardando...'
                ) : cartStats.totalUnits < 6 ? (
                  `Faltan ${6 - cartStats.totalUnits} u.`
                ) : (
                  <>
                    <FileText size={18} /> Ver Factura y Pagar
                  </>
                )}
              </button>

              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                Se mostrará la factura antes de abrir Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          MODAL: Invoice Preview (ANTES DE STRIPE)
         ========================= */}
      {step === 'invoice_preview' && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-6 pointer-events-auto">
          <div className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Invoice Preview
                </p>
                <p className="text-lg font-black text-slate-900">
                  {draftInvoiceNumber || 'WHS-...'}
                </p>
              </div>
              <button
                onClick={() => setStep('catalog')}
                className="p-2 rounded-full hover:bg-slate-200 transition-colors"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Preview simple (tu PDF exacto lo haces luego; aquí es preview antes de Stripe) */}
            <div className="p-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Maria’s Dog Corner</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1">Professional Pet Services • Bristol, UK</p>

                  <div className="mt-5 text-xs text-slate-600 space-y-1">
                    <p className="font-black text-slate-900">FROM:</p>
                    <p>Maria’s Dog Corner</p>
                    <p>87 Portview Road, Avonmouth</p>
                    <p>Bristol, BS11 9JE, UK</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-w-[260px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice #</p>
                  <p className="text-xl font-black text-slate-900">{draftInvoiceNumber}</p>

                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <p><span className="font-black">Tier:</span> {draftTotals.tierName}</p>
                    <p><span className="font-black">Units:</span> {draftTotals.totalUnits}</p>
                    <p><span className="font-black">Discount:</span> {(draftTotals.discountPct * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">BILL TO:</p>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm">
                  <p className="font-black text-slate-900">
                    {user?.business_name || user?.name || 'Partner MDC'}
                  </p>
                  <p className="text-slate-500 font-bold">{user?.email}</p>
                </div>
              </div>

              <div className="mt-8 border border-slate-200 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Unit</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {draftOrderItems.map((it, idx) => (
                    <div key={`${it.id}-${idx}`} className="grid grid-cols-12 px-4 py-3 text-sm">
                      <div className="col-span-6 font-bold text-slate-900">{it.description}</div>
                      <div className="col-span-2 text-right font-black">{Number(it.quantity)}</div>
                      <div className="col-span-2 text-right font-bold">£{Number(it.unitPrice).toFixed(2)}</div>
                      <div className="col-span-2 text-right font-black">£{Number(it.total).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-500">Subtotal</span>
                    <span className="font-black text-slate-900">£{Number(draftTotals.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-500">Discount</span>
                    <span className="font-black text-slate-900">
                      -{(Number(draftTotals.discountPct) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-lg border-t border-slate-200 pt-3">
                    <span className="font-black text-slate-900">TOTAL</span>
                    <span className="font-black text-[#20B2AA]">£{Number(draftTotals.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={() => setStep('catalog')}
                  className="px-6 py-4 rounded-2xl border border-slate-200 font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-50"
                >
                  Volver
                </button>

                <button
                  onClick={() => setStep('stripe')}
                  className="px-8 py-4 rounded-2xl bg-[#20B2AA] text-white font-black uppercase tracking-widest text-[10px] hover:bg-[#1a908a] shadow-lg"
                >
                  Continuar a Pago (Stripe)
                </button>
              </div>

              <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Esta factura es un preview. Se guardará como pagada cuando Stripe confirme el pago.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          MODAL: Stripe (DESPUÉS DEL PREVIEW)
         ========================= */}
      {step === 'stripe' && cartStats.total > 0 && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-6 pointer-events-auto">
          <StripePayment
            amount={Number(draftTotals.total || cartStats.total)}
            clientName={user?.business_name || user?.name || 'Partner MDC'}
            onSuccess={(paymentId: string) => finalizePaidOrder(paymentId)}
            onCancel={() => (isSaving ? null : setStep('invoice_preview'))}
          />
        </div>
      )}
    </div>
  );
};

export default DistributorCatalog;
