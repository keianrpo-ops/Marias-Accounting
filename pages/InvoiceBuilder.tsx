import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import {
  Plus,
  Trash2,
  Loader2,
  FileText,
  AlertTriangle,
  ExternalLink,
  Save,
} from "lucide-react";

type ClientRow = {
  id: string;
  email: string | null;
  business_name: string | null;
  name: string | null;
};

type InvoiceInsert = {
  invoice_number?: string | null;
  order_number?: string | null;
  client_id?: string | null;
  client_email?: string | null;
  client_name?: string | null;
  items?: any;
  subtotal?: number | null;
  total?: number | null;
  status?: string | null;
  date?: string | null;
  payment_method?: string | null;
  is_wholesale?: boolean | null;
  pdf_url?: string | null;
  pdf_path?: string | null;
};

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

const pad = (n: number, len = 6) => String(n).padStart(len, "0");

const InvoiceBuilder: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [clientId, setClientId] = useState<string>("");

  const [orderNumber, setOrderNumber] = useState("");
  const [status, setStatus] = useState("draft");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [items, setItems] = useState<LineItem[]>([
    { description: "Item", quantity: 1, unitPrice: 0 },
  ]);

  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);
  const [createdInvoiceNumber, setCreatedInvoiceNumber] = useState<string | null>(null);
  const [createdPdfUrl, setCreatedPdfUrl] = useState<string | null>(null);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
    const total = subtotal; // si luego agregas taxes/shipping, ajustas aquí
    return { subtotal, total };
  }, [items]);

  const loadClients = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!supabase) {
        setError("Supabase client is not configured.");
        setClients([]);
        return;
      }

      // si tu RLS permite listar clients, esto funciona.
      // si no, tendrás que filtrar o hacerlo desde admin panel con service role.
      const res = await supabase
        .from("clients")
        .select("id, email, business_name, name")
        .order("business_name", { ascending: true });

      if (res.error) throw res.error;

      const list = (res.data || []) as ClientRow[];
      setClients(list);

      // Preselecciono el primero si existe
      if (!clientId && list.length > 0) setClientId(list[0].id);
    } catch (e: any) {
      console.error("[Load clients error]", e);
      setError(e?.message || "Failed to load clients (RLS?).");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const nextInvoiceNumber = async (): Promise<string> => {
    // Busca el último invoice_number tipo INV-000001 y suma 1
    const res = await supabase
      .from("invoices")
      .select("invoice_number, created_at")
      .not("invoice_number", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (res.error) throw res.error;

    const last = res.data?.[0]?.invoice_number || "INV-000000";
    const m = String(last).match(/INV-(\d+)/i);
    const n = m ? Number(m[1]) : 0;
    return `INV-${pad(n + 1)}`;
  };

  const addItem = () => {
    setItems((prev) => [...prev, { description: "Item", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const createInvoice = async () => {
    if (!supabase) return;

    setError(null);
    setSaving(true);
    setCreatedInvoiceId(null);
    setCreatedInvoiceNumber(null);
    setCreatedPdfUrl(null);

    try {
      if (!clientId) throw new Error("Select a client.");

      const client = clients.find((c) => c.id === clientId);
      if (!client) throw new Error("Client not found.");

      const invNumber = await nextInvoiceNumber();

      const payload: InvoiceInsert = {
        invoice_number: invNumber,
        order_number: orderNumber || null,
        client_id: client.id,
        client_email: (client.email || "").trim().toLowerCase() || null,
        client_name: client.business_name || client.name || null,
        items: items.map((it) => ({
          description: String(it.description || "Item").trim(),
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
          total: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
        })),
        subtotal: totals.subtotal,
        total: totals.total,
        status,
        date,
        is_wholesale: true,
      };

      const res = await supabase
        .from("invoices")
        .insert(payload)
        .select("id, invoice_number, pdf_url")
        .single();

      if (res.error) throw res.error;

      setCreatedInvoiceId(res.data.id);
      setCreatedInvoiceNumber(res.data.invoice_number || invNumber);
      setCreatedPdfUrl(res.data.pdf_url || null);
    } catch (e: any) {
      console.error("[Create invoice error]", e);
      setError(e?.message || "Failed to create invoice.");
    } finally {
      setSaving(false);
    }
  };

  const generatePdf = async () => {
    if (!supabase) return;
    if (!createdInvoiceId && !createdInvoiceNumber) {
      setError("Create an invoice first.");
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      // Intento 1: por invoice_id
      let inv = createdInvoiceId
        ? await supabase.functions.invoke("get-invoice-pdf", { body: { invoice_id: createdInvoiceId } })
        : { data: null as any, error: null as any };

      // Intento 2: por invoice_number
      if (inv.error && createdInvoiceNumber) {
        inv = await supabase.functions.invoke("get-invoice-pdf", {
          body: { invoice_number: createdInvoiceNumber },
        });
      }

      if (inv.error) throw inv.error;

      const payload = inv.data || {};
      const pdfUrl =
        payload.pdf_url || payload.url || payload.signedUrl || payload.signed_url;

      if (!pdfUrl || typeof pdfUrl !== "string") {
        throw new Error("Edge function did not return a valid PDF url.");
      }

      setCreatedPdfUrl(pdfUrl);

      // Intento guardar en DB (si RLS lo permite)
      if (createdInvoiceId) {
        await supabase
          .from("invoices")
          .update({
            pdf_url: pdfUrl,
            pdf_generated_at: new Date().toISOString(),
          })
          .eq("id", createdInvoiceId);
      }

      window.open(pdfUrl, "_blank", "noreferrer");
    } catch (e: any) {
      console.error("[Generate PDF error]", e);
      setError(e?.message || "Failed to generate invoice PDF.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <FileText /> Invoice Builder
        </h1>
        <p className="text-slate-500 font-bold text-sm mt-1">
          Creates a draft invoice in Supabase and can generate PDF via Edge Function.
        </p>

        {error && (
          <div className="mt-6 bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="text-amber-700" size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-900">
                Warning
              </p>
              <p className="text-amber-900 font-bold mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
          {loading ? (
            <div className="flex items-center gap-3 text-slate-500 font-bold">
              <Loader2 className="animate-spin" size={18} /> Loading…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Client
                  </p>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-slate-200 font-bold text-sm text-slate-900 outline-none"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {(c.business_name || c.name || c.email || "Client") + ` • ${c.id.slice(0, 8)}…`}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 font-bold mt-2">
                    If this list is empty: your RLS on clients blocks SELECT.
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Order Number (optional)
                  </p>
                  <input
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-slate-200 font-bold text-sm text-slate-900 outline-none"
                    placeholder="ORD-000123"
                  />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Status / Date
                  </p>
                  <div className="flex gap-3">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-1/2 p-3 rounded-2xl border border-slate-200 font-bold text-sm text-slate-900 outline-none"
                    >
                      <option value="draft">draft</option>
                      <option value="paid">paid</option>
                      <option value="void">void</option>
                    </select>

                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-1/2 p-3 rounded-2xl border border-slate-200 font-bold text-sm text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Line Items
                  </p>
                  <button
                    onClick={addItem}
                    className="px-4 py-2 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 transition-colors"
                    type="button"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 border border-slate-100 rounded-3xl p-4"
                    >
                      <div className="md:col-span-7">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Description
                        </p>
                        <input
                          value={it.description}
                          onChange={(e) => updateItem(idx, { description: e.target.value })}
                          className="w-full p-3 rounded-2xl border border-slate-200 font-bold text-sm text-slate-900 outline-none bg-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Qty
                        </p>
                        <input
                          type="number"
                          value={it.quantity}
                          onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                          className="w-full p-3 rounded-2xl border border-slate-200 font-bold text-sm text-slate-900 outline-none bg-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Unit (£)
                        </p>
                        <input
                          type="number"
                          value={it.unitPrice}
                          onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                          className="w-full p-3 rounded-2xl border border-slate-200 font-bold text-sm text-slate-900 outline-none bg-white"
                        />
                      </div>

                      <div className="md:col-span-1 flex items-end justify-end">
                        <button
                          onClick={() => removeItem(idx)}
                          className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-red-50 hover:text-red-600 transition-colors"
                          type="button"
                          aria-label="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="md:col-span-12 text-right text-xs font-black text-slate-600">
                        Line total: £{((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-end gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Subtotal
                    </p>
                    <p className="text-xl font-black text-slate-900">
                      £{totals.subtotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col md:flex-row gap-3">
                <button
                  onClick={createInvoice}
                  disabled={saving}
                  className="flex-1 px-6 py-4 rounded-3xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-60"
                  type="button"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {saving ? "Saving…" : "Create Draft Invoice"}
                </button>

                <button
                  onClick={generatePdf}
                  disabled={generating || !createdInvoiceId}
                  className="flex-1 px-6 py-4 rounded-3xl bg-white border border-slate-200 text-slate-900 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-60"
                  type="button"
                >
                  {generating ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                  {generating ? "Generating…" : "Generate PDF"}
                </button>
              </div>

              {createdInvoiceId && (
                <div className="mt-6 bg-slate-50 border border-slate-100 rounded-3xl p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Created
                  </p>
                  <p className="text-sm font-black text-slate-900 mt-1">
                    {createdInvoiceNumber || "INV"} • id:{createdInvoiceId}
                  </p>

                  {createdPdfUrl ? (
                    <a
                      href={createdPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                    >
                      <ExternalLink size={14} /> Open PDF
                    </a>
                  ) : (
                    <p className="text-xs font-bold text-slate-400 mt-3">
                      PDF not generated yet.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceBuilder;
