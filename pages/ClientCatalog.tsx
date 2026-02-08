import React, { useMemo, useState } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  ArrowLeft,
  CheckCircle,
  Package,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { PRODUCTS } from '../constants';
import StripePayment from '../components/StripePayment';

const ClientCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [search, setSearch] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- HELPER PARA PRECIOS ---
  const getProductPrice = (product: any) => {
    if (!product) return 0;
    return Number(product.basePrice || product.price || 0);
  };

  // 1. Filtrado
  const filteredProducts = useMemo(() => {
    const s = search.toLowerCase().trim();
    return PRODUCTS.filter((p) => (p.name?.toLowerCase() || '').includes(s));
  }, [search]);

  // 2. Totales
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = PRODUCTS.find((p) => p.id === id);
    const price = getProductPrice(product);
    return sum + price * qty;
  }, 0);

  // Manejo de Cantidades
  const updateCart = (id: string, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);

      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  // 3. INICIAR EL PROCESO
  const handleInitiateCheckout = () => {
    if (totalItems === 0) return;
    setShowPaymentModal(true);
  };

  // Utilidad: número de orden
  const makeOrderNumber = () => `B2C-${Date.now()}`;

  // 4. GUARDAR ORDEN (después de confirmación de Stripe)
  const handlePaymentSuccess = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      // La tabla orders exige: order_number, client_name, client_email, items, total, status (todos NOT NULL)
      const clientName = (user.email?.split('@')[0] || 'Client').trim();
      const orderNumber = makeOrderNumber();

      const orderItems = Object.entries(cart).map(([id, qty]) => {
        const product = PRODUCTS.find((p) => p.id === id);
        const unitPrice = getProductPrice(product);

        return {
          id,
          description: product?.name || 'Producto',
          unitPrice,
          quantity: qty,
          total: unitPrice * qty,
        };
      });

      // INSERT corregido para coincidir con tu esquema real (según la query que mostraste)
      const { error } = await supabase.from('orders').insert({
        order_number: orderNumber,
        client_name: clientName,
        client_email: user.email ?? '',
        items: orderItems,          // jsonb
        total: Number(totalPrice),  // numeric
        status: 'paid',
        is_wholesale: false,        // B2C
        // created_at NO es necesario (tiene default now()), pero si quieres forzarlo, déjalo:
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setShowPaymentModal(false);
      setCart({});
      alert('¡Pago exitoso! Tu pedido ha sido procesado.');
      navigate('/orders');
    } catch (error: any) {
      console.error('Error saving order:', error);
      alert('El pago pasó, pero hubo un error guardando la orden. Contáctanos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-sans text-slate-900 relative">
      {/* --- MODAL STRIPE --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-red-400 font-bold flex items-center gap-2"
            >
              CERRAR <X size={20} />
            </button>

            <StripePayment
              amount={totalPrice}
              onSuccess={handlePaymentSuccess}
              onClose={() => setShowPaymentModal(false)}
            />
          </div>
        </div>
      )}

      {/* SECCIÓN IZQUIERDA: CATÁLOGO */}
      <div className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-slate-900 flex items-center gap-2 text-sm font-bold mb-2 transition-colors"
            >
              <ArrowLeft size={16} /> VOLVER AL DASHBOARD
            </button>
            <h1 className="text-4xl font-black text-[#20B2AA] tracking-tighter uppercase">
              B2C STOCK
            </h1>
            <p className="text-slate-500 font-medium italic">
              Catálogo Cliente VIP -{' '}
              <span className="text-slate-900 font-bold">Pago Seguro Online</span>
            </p>
          </div>
        </div>

        <div className="relative mb-8 max-w-xl">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[2rem] shadow-sm font-bold text-slate-600 focus:ring-2 focus:ring-[#20B2AA] outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {filteredProducts.map((product) => {
            const qty = cart[product.id] || 0;
            const displayPrice = getProductPrice(product);

            return (
              <div
                key={product.id}
                className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-lg transition-all flex flex-col items-center text-center group"
              >
                <div className="w-32 h-32 mb-4 relative">
                  {product.image ? (
                    <img
                      src={product.image}
                      className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                      <Package size={32} />
                    </div>
                  )}
                </div>

                <h3 className="font-black text-slate-900 text-lg leading-tight mb-1 uppercase">
                  {product.name}
                </h3>

                <p className="text-[#20B2AA] font-black text-xl mb-6">
                  £{displayPrice.toFixed(2)}
                </p>

                <div className="w-full bg-slate-50 rounded-full p-1.5 flex items-center justify-between mt-auto">
                  <button
                    onClick={() => updateCart(product.id, -1)}
                    disabled={qty === 0}
                    className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-500 disabled:opacity-50 transition-colors"
                  >
                    <Minus size={18} strokeWidth={3} />
                  </button>

                  <span className="font-black text-lg w-8">{qty}</span>

                  <button
                    onClick={() => updateCart(product.id, 1)}
                    className="w-10 h-10 bg-[#0f172a] text-white rounded-full shadow-sm flex items-center justify-center hover:bg-[#20B2AA] transition-colors"
                  >
                    <Plus size={18} strokeWidth={3} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN DERECHA: CARRITO & CHECKOUT */}
      <div className="w-[400px] bg-[#0f172a] text-white p-8 flex flex-col shadow-2xl relative z-10">
        <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 mb-8">
          <ShoppingCart className="text-[#20B2AA]" /> Tu Pedido
        </h2>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar-dark">
          {Object.keys(cart).length === 0 ? (
            <div className="text-center opacity-30 mt-20">
              <p className="font-bold uppercase tracking-widest text-sm">
                Carrito Vacío
              </p>
            </div>
          ) : (
            Object.entries(cart).map(([id, qty]) => {
              const product = PRODUCTS.find((p) => p.id === id);
              if (!product) return null;

              const price = getProductPrice(product);

              return (
                <div
                  key={id}
                  className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10"
                >
                  <div>
                    <p className="font-bold text-sm text-white mb-1">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      £{price.toFixed(2)} x {qty}
                    </p>
                  </div>
                  <p className="font-black text-[#20B2AA]">
                    £{(price * qty).toFixed(2)}
                  </p>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-8 border-t border-white/10 pt-8">
          <div className="flex justify-between items-end mb-6">
            <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">
              Total a Pagar
            </span>
            <span className="text-4xl font-black text-[#20B2AA]">
              £{totalPrice.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleInitiateCheckout}
            disabled={totalItems === 0 || loading}
            className="w-full bg-[#ec4899] hover:bg-[#db2777] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-pink-500/20"
          >
            {loading ? (
              'Procesando...'
            ) : (
              <>
                <CheckCircle size={18} /> Pagar Ahora
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientCatalog;
