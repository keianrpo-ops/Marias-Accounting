import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../services/supabase";
import { Order } from "../types";
import { ArrowLeft, Package } from "lucide-react";

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const all = await db.orders.getAll();
      const found = (Array.isArray(all) ? all : []).find((o: any) => String(o?.id) === String(id));

      setOrder(found || null);
      setLoading(false);
    };

    load();
  }, [id]);

  if (loading) {
    return <div className="p-20 text-center font-black">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="p-20 text-center space-y-6">
        <p className="font-black text-red-500">Order not found</p>
        <button
          onClick={() => navigate("/orders")}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-12 space-y-10 animate-in fade-in">
      <button
        onClick={() => navigate("/orders")}
        className="flex items-center gap-2 text-sm font-black text-slate-600 hover:text-black"
      >
        <ArrowLeft size={18} /> Back to Orders
      </button>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-teal-50 rounded-3xl flex items-center justify-center">
            <Package size={36} className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-3xl font-black">{order.orderNumber}</h2>
            <p className="text-slate-500 font-bold">{order.clientName}</p>
            <p className="text-xs text-slate-400">{order.clientEmail}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-2 text-sm">
            <h3 className="font-black mb-4">Order Info</h3>
            <p><b>Date:</b> {order.date}</p>
            <p><b>Status:</b> {order.status}</p>
            <p><b>Total:</b> £{Number(order.total || 0).toFixed(2)}</p>
            <p><b>Wholesale:</b> {order.isWholesale ? "Yes" : "No"}</p>

            {/* ✅ campo correcto */}
            {order.shippingAddress ? (
              <p><b>Shipping:</b> {order.shippingAddress}</p>
            ) : null}
          </div>

          <div>
            <h3 className="font-black mb-4">Items</h3>

            {(order.items || []).length === 0 ? (
              <p className="text-slate-400 italic text-sm">No items registered for this order.</p>
            ) : (
              <div className="space-y-3">
                {(order.items || []).map((item, idx) => (
                  <div key={item.id || idx} className="p-4 bg-slate-50 rounded-xl border text-sm">
                    {/* ✅ campos correctos */}
                    <p className="font-black">{item.description}</p>
                    <div className="flex justify-between text-slate-600 mt-2">
                      <span>Qty: {item.quantity}</span>
                      <span>Unit: £{Number(item.unitPrice || 0).toFixed(2)}</span>
                    </div>
                    <p className="mt-2 font-black text-slate-900">
                      Line Total: £{Number(item.total || (item.quantity * item.unitPrice) || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
