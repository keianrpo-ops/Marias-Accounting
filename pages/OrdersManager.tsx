import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Package,
  Calendar,
  Clock,
  ArrowUpRight,
  ChevronDown,
  ShoppingBag,
} from "lucide-react";
import { db } from "../services/supabase";
import { Order, InvoiceStatus } from "../types";

const OrdersManager: React.FC = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"all" | "wholesale" | "retail">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    const data = await db.orders.getAll();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id: string, status: InvoiceStatus) => {
    await db.orders.updateStatus(id, status);
    await loadOrders();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (Array.isArray(orders) ? orders : []).filter((o: any) => {
      const name = String(o?.clientName ?? "").toLowerCase();
      const num = String(o?.orderNumber ?? "").toLowerCase();

      const matchesSearch = !q || name.includes(q) || num.includes(q);
      const matchesFilter =
        filter === "all" ||
        (filter === "wholesale" ? Boolean(o?.isWholesale) : !Boolean(o?.isWholesale));

      return matchesSearch && matchesFilter;
    });
  }, [orders, search, filter]);

  const stats = useMemo(() => {
    const safe = Array.isArray(orders) ? orders : [];
    return {
      pending: safe.filter((o: any) => o?.status === InvoiceStatus.PAID).length,
      income: safe.reduce((sum: number, o: any) => sum + (Number((o as any)?.total) || 0), 0),
    };
  }, [orders]);

  const statusClasses = (s: InvoiceStatus) => {
    if (s === InvoiceStatus.DELIVERED) return "bg-emerald-50 border-emerald-200 text-emerald-600";
    if (s === InvoiceStatus.SHIPPED) return "bg-indigo-50 border-indigo-200 text-indigo-600";
    if (s === InvoiceStatus.PAID) return "bg-amber-50 border-amber-200 text-amber-600";
    return "bg-slate-50 border-slate-200 text-slate-400";
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
            PEDIDOS <span className="text-[#FF6B9D]">MDC</span>
          </h2>
          <p className="text-slate-500 font-bold italic text-sm">
            Gestión operativa centralizada.
          </p>
        </div>

        <div className="bg-slate-900 p-5 rounded-3xl text-white shadow-xl flex items-center gap-6">
          <div>
            <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest">
              Ingreso
            </p>
            <p className="text-2xl font-black tracking-tighter">£{stats.income.toFixed(2)}</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div>
            <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
              Por procesar
            </p>
            <p className="text-2xl font-black tracking-tighter">{stats.pending}</p>
          </div>
        </div>
      </header>

      <div className="bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            className="w-full pl-14 pr-6 py-4 bg-transparent outline-none font-bold text-sm uppercase tracking-wider"
            placeholder="Buscar por cliente o folio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {(["all", "wholesale", "retail"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-6 py-3 rounded-full text-[10px] font-black uppercase transition-all ${
                filter === k
                  ? k === "all"
                    ? "bg-slate-900 text-white"
                    : k === "wholesale"
                    ? "bg-[#20B2AA] text-white"
                    : "bg-[#FF6B9D] text-white"
                  : "text-slate-400"
              }`}
            >
              {k === "all" ? "Todos" : k === "wholesale" ? "B2B" : "Retail"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
              Cargando pedidos...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
            <ShoppingBag size={42} className="mx-auto text-slate-200 mb-3" />
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
              No hay pedidos
            </p>
          </div>
        ) : (
          filtered.map((order: any) => (
            <div
              key={order?.id}
              className="bg-white p-7 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 hover:border-slate-300 transition-all"
            >
              <div
                className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shrink-0 shadow-inner ${
                  order?.isWholesale ? "bg-teal-50 text-[#20B2AA]" : "bg-pink-50 text-[#FF6B9D]"
                }`}
              >
                <Package size={28} />
              </div>

              <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
                  <span className="text-lg font-black text-slate-900 uppercase tracking-tighter truncate">
                    {order?.clientName ?? "—"}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      order?.isWholesale ? "bg-teal-100 text-teal-600" : "bg-pink-100 text-pink-600"
                    }`}
                  >
                    {order?.isWholesale ? "DISTRIBUIDOR" : "RETAIL"}
                  </span>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <Calendar size={12} /> {order?.date ?? "—"}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock size={12} /> {order?.orderNumber ?? "—"}
                  </span>
                </div>
              </div>

              <div className="text-center md:text-right shrink-0">
                <p className="text-2xl font-black text-slate-900">
                  £{Number(order?.total ?? 0).toFixed(2)}
                </p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {(Array.isArray(order?.items) ? order.items.length : 0)} items
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                <div className="relative">
                  <select
                    className={`w-full md:w-48 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border transition-all cursor-pointer appearance-none ${statusClasses(
                      order?.status
                    )}`}
                    value={order?.status}
                    onChange={(e) => updateStatus(String(order?.id), e.target.value as InvoiceStatus)}
                  >
                    <option value={InvoiceStatus.PAID}>Pagado (Pendiente)</option>
                    <option value={InvoiceStatus.SHIPPED}>Enviado</option>
                    <option value={InvoiceStatus.DELIVERED}>Entregado</option>
                    <option value={InvoiceStatus.CANCELLED}>Cancelado</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40"
                  />
                </div>

                <button
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="flex items-center justify-center gap-2 text-[10px] font-black text-[#20B2AA] hover:underline uppercase tracking-widest"
                >
                  Ver Detalle <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersManager;
