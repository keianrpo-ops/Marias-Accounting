import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Calendar,
  Filter,
  Clock,
  CheckCircle2,
  Truck,
  ShoppingBag,
  ArrowUpRight
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { Order, InvoiceStatus } from '../types';

const ClientOrders: React.FC = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');

  // -------------------------
  // Helpers (evitan pantallazo blanco)
  // -------------------------
  const safeLower = (v: any) => String(v ?? '').toLowerCase();

  const getOrderNumber = (order: any) =>
    order?.orderNumber ?? order?.order_number ?? `#${String(order?.id ?? '').slice(0, 6)}`;

  const normalizeStatus = (s: any): InvoiceStatus => {
    const up = String(s ?? '').toUpperCase();
    // Si tu enum usa PAID/SHIPPED/DELIVERED/CANCELLED, esto lo alinea.
    // Si llega algo raro, cae a PAID? NO. Mejor: retorna como viene (pero seguro).
    return (up as InvoiceStatus) || (InvoiceStatus.PAID as InvoiceStatus);
  };

  const getItemsArray = (items: any): any[] => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        return Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? Object.values(parsed) : []);
      } catch {
        return [];
      }
    }
    if (typeof items === 'object') return Object.values(items);
    return [];
  };

  const getDisplayDate = (order: any) => {
    const raw = order?.date ?? order?.created_at ?? order?.createdAt;
    if (!raw) return '';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return d.toLocaleDateString();
  };

  // -------------------------
  // Fetch
  // -------------------------
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setOrders([]);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('client_email', user.email)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Guardamos tal cual; el render usa getters seguros para snake_case/camelCase
      setOrders((data as any) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Filtrado (CORREGIDO: nunca vuelve a reventar por undefined.toLowerCase)
  // -------------------------
  const filteredOrders = useMemo(() => {
    const q = safeLower(searchTerm);

    return orders.filter((order: any) => {
      const orderNumber = getOrderNumber(order);
      const total = order?.total ?? 0;

      const matchesSearch =
        safeLower(orderNumber).includes(q) ||
        safeLower(total).includes(q);

      const st = normalizeStatus(order?.status);
      const matchesStatus = statusFilter === 'all' || st === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // -------------------------
  // Stats
  // -------------------------
  const stats = useMemo(() => {
    const spent = orders.reduce((acc: number, curr: any) => acc + (Number(curr?.total) || 0), 0);

    const active = orders.filter((o: any) => {
      const st = normalizeStatus(o?.status);
      return st === InvoiceStatus.PAID || st === InvoiceStatus.SHIPPED;
    }).length;

    return {
      total: orders.length,
      active,
      spent
    };
  }, [orders]);

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case InvoiceStatus.SHIPPED:
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case InvoiceStatus.DELIVERED:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case InvoiceStatus.CANCELLED:
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return <Clock size={14} />;
      case InvoiceStatus.SHIPPED:
        return <Truck size={14} />;
      case InvoiceStatus.DELIVERED:
        return <CheckCircle2 size={14} />;
      default:
        return <Package size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 bg-slate-200 rounded-full" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header y Resumen */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">MIS PEDIDOS</h1>
          <p className="text-slate-500 font-medium">Gestiona y rastrea tus compras recientes.</p>
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Gastado</p>
            <p className="text-xl font-black text-slate-900">£{stats.spent.toFixed(2)}</p>
          </div>
          <div className="bg-[#20B2AA] px-6 py-3 rounded-2xl shadow-lg shadow-teal-500/20 text-white">
            <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">Pedidos Activos</p>
            <p className="text-xl font-black">{stats.active}</p>
          </div>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10 backdrop-blur-xl bg-white/90">
        <div className="relative w-full md:w-96 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#20B2AA] transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por # de pedido..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#20B2AA] outline-none transition-all font-bold text-sm text-slate-700 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          <Filter size={16} className="text-slate-400 mr-2 shrink-0" />
          {(['all', InvoiceStatus.PAID, InvoiceStatus.SHIPPED, InvoiceStatus.DELIVERED, InvoiceStatus.CANCELLED] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {status === 'all' ? 'Todos' : status}
              </button>
            )
          )}
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="grid gap-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order: any) => {
            const orderNumber = getOrderNumber(order);
            const st = normalizeStatus(order?.status);
            const itemsCount = getItemsArray(order?.items).length;

            return (
              <div
                key={order.id}
                className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:border-[#20B2AA] hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-300 cursor-pointer relative overflow-hidden"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#20B2AA]/10 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  {/* Info principal */}
                  <div className="flex items-center gap-5 w-full md:w-auto">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                        st === InvoiceStatus.DELIVERED ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      <Package size={24} />
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-black text-slate-900">{orderNumber}</span>

                        <span
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(
                            st
                          )}`}
                        >
                          {getStatusIcon(st)} {st}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {getDisplayDate(order)}
                        </span>
                        <span className="flex items-center gap-1">{itemsCount} items</span>
                      </div>
                    </div>
                  </div>

                  {/* Precio y acción */}
                  <div className="flex items-center justify-between w-full md:w-auto gap-8">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                      <p className="text-2xl font-black text-slate-900">£{Number(order?.total ?? 0).toFixed(2)}</p>
                    </div>

                    <button className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-[#20B2AA] group-hover:text-white flex items-center justify-center transition-colors">
                      <ArrowUpRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <ShoppingBag size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              No tienes pedidos {statusFilter !== 'all' ? 'con este filtro' : 'aún'}
            </h3>
            <p className="text-slate-400 max-w-xs mx-auto mb-8">
              {searchTerm ? 'Intenta buscando con otro número de pedido.' : 'Explora nuestro catálogo y consiente a tu mascota hoy mismo.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/catalog')}
                className="px-8 py-3 bg-[#FF6B9D] hover:bg-[#ff528e] text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg shadow-pink-500/20"
              >
                Ir a la Tienda
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientOrders;
