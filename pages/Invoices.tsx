import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import {
  FileText,
  ExternalLink,
  Loader2,
  RefreshCcw,
  AlertTriangle,
  Search,
} from "lucide-react";

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  order_number: string | null;
  client_id: string | null;
  client_email: string | null;
  client_name?: string | null;
  total: number | null;
  status: string | null;
  date: string | null;
  created_at: string | null;
  pdf_url: string | null;
  pdf_path: string | null;
  pdf_generated_at: string | null;
};

const money = (n: any) => `£${Number(n || 0).toFixed(2)}`;

const Invoices: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = (q || "").trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((r) => {
      const hay = [
        r.invoice_number,
        r.order_number,
        r.client_email,
        r.client_name,
        r.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(term);
    });
  }, [rows, q]);

  const loadInvoices = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!supabase) {
        setError("Supabase client is not configured. Check env vars.");
        setRows([]);
        return;
      }

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      if (!authData?.user) {
        setError("No active session. Please login again.");
        setRows([]);
        return;
      }

      const uid = authData.user.id;
      const emailLower = (authData.user.email || "").trim().toLowerCase();

      // 1) Primero por client_id (correcto)
      let res = await supabase
        .from("invoices")
        .select(
          "id, invoice_number, order_number, client_id, client_email, client_name, total, status, date, created_at, pdf_url, pdf_path, pdf_generated_at"
        )
        .eq("client_id", uid)
        .order("created_at", { ascending: false });

      // 2) Fallback por email (legacy)
      if (!res.error && (res.data || []).length === 0 && emailLower) {
        res = await supabase
          .from("invoices")
          .select(
            "id, invoice_number, order_number, client_id, client_email, client_name, total, status, date, created_at, pdf_url, pdf_path, pdf_generated_at"
          )
          .eq("client_email", emailLower)
          .order("created_at", { ascending: false });
      }

      if (res.error) throw res.error;

      setRows((res.data || []) as InvoiceRow[]);
    } catch (e: any) {
      console.error("[Invoices load error]", e);
      setError(e?.message || "Failed to load invoices.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePdf = async (invoice: InvoiceRow) => {
    if (!supabase) return;

    setLoadingPdf(invoice.id);
    setError(null);

    try {
      // Intento 1: por invoice_id (lo más seguro)
      let inv = await supabase.functions.invoke("get-invoice-pdf", {
        body: { invoice_id: invoice.id },
      });

      // Si tu función usa invoice_number, intento 2
      if (inv.error && invoice.invoice_number) {
        inv = await supabase.functions.invoke("get-invoice-pdf", {
          body: { invoice_number: invoice.invoice_number },
        });
      }

      if (inv.error) throw inv.error;

      // Normalizo posibles respuestas: { pdf_url } o { url } o { signedUrl }
      const payload = inv.data || {};
      const pdfUrl =
        payload.pdf_url || payload.url || payload.signedUrl || payload.signed_url;

      if (!pdfUrl || typeof pdfUrl !== "string") {
        throw new Error(
          "Edge function did not return a valid PDF url (pdf_url/url/signedUrl)."
        );
      }

      // Actualizo en DB para no regenerar cada vez (si RLS lo permite)
      // Si falla por RLS, igual abrimos el PDF y listo.
      await supabase
        .from("invoices")
        .update({
          pdf_url: pdfUrl,
          pdf_generated_at: new Date().toISOString(),
        })
        .eq("id", invoice.id);

      // Refresco lista y abro
      await loadInvoices();
      window.open(pdfUrl, "_blank", "noreferrer");
    } catch (e: any) {
      console.error("[Generate PDF error]", e);
      setError(e?.message || "Failed to generate invoice PDF.");
    } finally {
      setLoadingPdf(null);
    }
  };

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <FileText className="text-slate-900" /> Invoices
            </h1>
            <p className="text-slate-500 text-sm font-bold mt-1">
              Your invoice history from Supabase.
            </p>
          </div>

          <button
            onClick={loadInvoices}
            className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 transition-colors"
            type="button"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>

        <div className="mt-6 bg-white border border-slate-100 rounded-3xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
            <Search className="text-slate-400" size={18} />
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by invoice number, order, email, status…"
            className="w-full outline-none font-bold text-sm text-slate-800 placeholder:text-slate-400"
          />
        </div>

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
              <p className="text-amber-800 text-xs font-bold mt-2">
                If you see RLS errors, you must add SELECT policy on invoices and
                (optional) UPDATE policy for pdf_url updates.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Results: {filtered.length}
            </p>
          </div>

          {loading ? (
            <div className="p-10 flex items-center justify-center gap-3 text-slate-500 font-bold">
              <Loader2 className="animate-spin" size={18} />
              Loading invoices…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-900 font-black uppercase tracking-widest text-xs">
                No invoices found
              </p>
              <p className="text-slate-400 font-bold text-xs mt-2">
                If you expect invoices, confirm they are linked by client_id or
                client_email.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <div
                  key={inv.id}
                  className="px-6 py-5 flex items-center justify-between gap-6"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">
                      {inv.invoice_number || "INVOICE"}
                      {inv.order_number ? (
                        <span className="text-slate-400 font-bold">
                          {" "}
                          • {inv.order_number}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[11px] text-slate-400 font-bold mt-1">
                      {inv.date ||
                        (inv.created_at ? String(inv.created_at).slice(0, 10) : "—")}
                      {" • "}
                      {String(inv.status || "draft").toUpperCase()}
                      {inv.client_email ? ` • ${inv.client_email}` : ""}
                    </p>

                    {inv.pdf_path ? (
                      <p className="text-[10px] font-bold text-slate-300 mt-2">
                        pdf_path: {inv.pdf_path}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <p className="text-base font-black text-slate-900">
                      {money(inv.total)}
                    </p>

                    {inv.pdf_url ? (
                      <a
                        href={inv.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors flex items-center gap-2"
                      >
                        <ExternalLink size={14} />
                        PDF
                      </a>
                    ) : (
                      <button
                        onClick={() => generatePdf(inv)}
                        disabled={loadingPdf === inv.id}
                        className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-60"
                        type="button"
                      >
                        {loadingPdf === inv.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <FileText size={14} />
                        )}
                        {loadingPdf === inv.id ? "Generating…" : "Generate PDF"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-xs text-slate-400 font-bold">
          Note: If pdf_url is null but pdf_path exists, your PDF generation is
          not writing back to invoices.pdf_url (or RLS blocks update).
        </div>
      </div>
    </div>
  );
};

export default Invoices;
