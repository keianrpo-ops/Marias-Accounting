// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  let envUrl: string | undefined;
  let envKey: string | undefined;

  try {
    // Vite: import.meta.env
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      envUrl = import.meta.env.VITE_SUPABASE_URL;
      // @ts-ignore
      envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    }

    // Fallback: process.env
    if (!envUrl && typeof process !== 'undefined' && (process as any).env) {
      // @ts-ignore
      envUrl = (process as any).env.VITE_SUPABASE_URL;
      // @ts-ignore
      envKey = (process as any).env.VITE_SUPABASE_ANON_KEY;
    }
  } catch {}

  if (envUrl && envKey) return { url: envUrl, key: envKey, isActive: true };

  try {
    const savedInt = localStorage.getItem('mdc_integrations');
    if (savedInt) {
      const config = JSON.parse(savedInt);
      if (config?.supabaseUrl && config?.supabaseKey) {
        return { url: config.supabaseUrl, key: config.supabaseKey, isActive: true };
      }
    }
  } catch {}

  return { url: 'https://placeholder.supabase.co', key: 'placeholder-key', isActive: false };
};

const config = getSupabaseConfig();
export const supabase = config.isActive ? createClient(config.url, config.key) : null;

// UUID validator
const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const cryptoRandomId = () => {
  try {
    // @ts-ignore
    return crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  } catch {
    return Math.random().toString(36).slice(2);
  }
};

// ✅ Cross-tab ping (forces "storage" event in other tabs)
const pingStorage = () => {
  try {
    localStorage.setItem('__mdc_ping', String(Date.now()));
  } catch {}
};

// ✅ Event for reliable refresh (same-tab) + ping (cross-tab)
const notifyDataChanged = (type: 'orders' | 'clients' | 'invoices' | 'inventory') => {
  try {
    window.dispatchEvent(new CustomEvent('mdc:datachanged', { detail: { type, ts: Date.now() } }));
  } catch {}
  pingStorage();
};

// ✅ Normalize items so UI always receives InvoiceItem shape
// UI expects: { id, description, quantity, unitPrice, total }
const normalizeItems = (items: any) => {
  const arr = Array.isArray(items) ? items : [];
  return arr.map((it: any) => {
    const description = String(it?.description ?? it?.name ?? it?.title ?? 'Item').trim();
    const quantity = Number(it?.quantity ?? it?.qty ?? 1) || 1;
    const unitPrice = Number(it?.unitPrice ?? it?.unit_price ?? it?.price ?? it?.unit_cost ?? 0) || 0;
    const total = Number(it?.total ?? it?.line_total ?? quantity * unitPrice) || 0;

    return {
      id: String(it?.id ?? cryptoRandomId()),
      description,
      quantity,
      unitPrice,
      total,
    };
  });
};

/**
 * ✅ Helpers to read either snake_case or camelCase from Supabase
 */
const pick = (row: any, snake: string, camel: string) => row?.[snake] ?? row?.[camel];

const normalizeOrderFromDb = (row: any) => {
  if (!row) return row;

  return {
    id: row.id,
    orderNumber: pick(row, 'order_number', 'orderNumber'),
    clientName: pick(row, 'client_name', 'clientName'),
    clientEmail: pick(row, 'client_email', 'clientEmail'),
    items: normalizeItems(pick(row, 'items', 'items') || []),
    total: Number(pick(row, 'total', 'total') || 0),
    status: pick(row, 'status', 'status'),
    date: pick(row, 'date', 'date'),
    isWholesale: Boolean(pick(row, 'is_wholesale', 'isWholesale')),
    paymentId: pick(row, 'payment_id', 'paymentId'),
    shippingAddress: pick(row, 'shipping_address', 'shippingAddress'),
    // keep created_at if exists (useful for sorting/debug)
    createdAt: row.created_at ?? row.createdAt,
  };
};

const toDbOrderPayload = (order: any) => {
  const payload: any = {
    order_number: order.orderNumber,
    client_name: order.clientName,
    client_email: order.clientEmail,
    items: normalizeItems(order.items),
    total: Number(order.total || 0),
    status: order.status,
    date: order.date,
    is_wholesale: Boolean(order.isWholesale),
    payment_id: order.paymentId,
    shipping_address: order.shippingAddress,
  };

  // Only send UUID ids to Supabase
  if (order.id && isUuid(order.id)) payload.id = order.id;

  return payload;
};

const normalizeInvoiceFromDb = (row: any) => {
  if (!row) return row;

  return {
    id: row.id,
    invoiceNumber: pick(row, 'invoice_number', 'invoiceNumber'),
    orderNumber: pick(row, 'order_number', 'orderNumber'),
    clientName: pick(row, 'client_name', 'clientName'),
    clientEmail: pick(row, 'client_email', 'clientEmail'),
    clientPhone: pick(row, 'client_phone', 'clientPhone'),
    clientAddress: pick(row, 'client_address', 'clientAddress'),
    clientCityPostcode: pick(row, 'client_city_postcode', 'clientCityPostcode'),
    date: pick(row, 'date', 'date'),
    serviceDate: pick(row, 'service_date', 'serviceDate'),
    dueDate: pick(row, 'due_date', 'dueDate'),
    items: normalizeItems(pick(row, 'items', 'items') || []),
    subtotal: Number(pick(row, 'subtotal', 'subtotal') || 0),
    total: Number(pick(row, 'total', 'total') || 0),
    status: pick(row, 'status', 'status'),
    isVatInvoice: Boolean(pick(row, 'is_vat_invoice', 'isVatInvoice')),
    isWholesale: Boolean(pick(row, 'is_wholesale', 'isWholesale')),
    discountApplied: Number(pick(row, 'discount_applied', 'discountApplied') || 0),
    paymentId: pick(row, 'payment_id', 'paymentId'),
    createdAt: row.created_at ?? row.createdAt,
  };
};

const toDbInvoicePayload = (invoice: any) => {
  const payload: any = {
    invoice_number: invoice.invoiceNumber,
    order_number: invoice.orderNumber,
    client_name: invoice.clientName,
    client_email: invoice.clientEmail,
    client_phone: invoice.clientPhone,
    client_address: invoice.clientAddress,
    client_city_postcode: invoice.clientCityPostcode,
    date: invoice.date,
    service_date: invoice.serviceDate,
    due_date: invoice.dueDate,
    items: normalizeItems(invoice.items),
    subtotal: Number(invoice.subtotal || 0),
    total: Number(invoice.total || 0),
    status: invoice.status,
    is_vat_invoice: Boolean(invoice.isVatInvoice),
    is_wholesale: Boolean(invoice.isWholesale),
    discount_applied: Number(invoice.discountApplied || 0),
    payment_id: invoice.paymentId,
  };

  if (invoice.id && isUuid(invoice.id)) payload.id = invoice.id;

  return payload;
};

// small helpers
const readLS = (key: string) => {
  try {
    const raw = localStorage.getItem(key);
    return JSON.parse(raw || '[]');
  } catch {
    return [];
  }
};
const writeLS = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
  // same-tab refresh
  pingStorage();
};

export const db = {
  orders: {
    async getAll() {
      // Prefer Supabase
      if (supabase) {
        try {
          // ✅ Order by created_at if exists; otherwise you still get consistent results
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) return data.map(normalizeOrderFromDb);
          if (error) console.error('Supabase orders getAll:', error.message);
        } catch (e) {
          console.error(e);
        }
      }

      // Fallback LocalStorage
      const local = readLS('mdc_orders');
      return (Array.isArray(local) ? local : []).map((o: any) => ({
        ...o,
        items: normalizeItems(o?.items),
        total: Number(o?.total || 0),
      }));
    },

    async save(order: any) {
      // Build safe normalized order for UI/storage
      const safeOrder = {
        ...order,
        items: normalizeItems(order?.items),
        total: Number(order?.total || 0),
        clientEmail: String(order?.clientEmail || '').trim(), // ✅ enforce
      };

      // ✅ If Supabase active: save FIRST, then store the returned normalized row locally
      if (supabase) {
        try {
          const payload = toDbOrderPayload(safeOrder);

          const { data, error } = await supabase.from('orders').insert([payload]).select().single();

          if (error) {
            console.error('Error Supabase Orders save:', error.message, payload);
          } else if (data) {
            const normalized = normalizeOrderFromDb(data);

            const existing = readLS('mdc_orders');
            writeLS('mdc_orders', [normalized, ...(Array.isArray(existing) ? existing : [])]);

            notifyDataChanged('orders');
            return normalized;
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Fallback offline
      const existing = readLS('mdc_orders');
      writeLS('mdc_orders', [safeOrder, ...(Array.isArray(existing) ? existing : [])]);

      notifyDataChanged('orders');
      return safeOrder;
    },

    async updateStatus(id: string, status: string) {
      // Update LocalStorage
      const existing = readLS('mdc_orders');
      const updated = (Array.isArray(existing) ? existing : []).map((o: any) =>
        String(o?.id) === String(id) ? { ...o, status } : o
      );
      writeLS('mdc_orders', updated);
      notifyDataChanged('orders');

      // Update Supabase if UUID
      if (supabase && isUuid(id)) {
        try {
          const { error } = await supabase.from('orders').update({ status }).eq('id', id);
          if (error) console.error('Supabase orders updateStatus:', error.message);
        } catch {}
      }
    },
  },

  invoices: {
    async getAll() {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) return data.map(normalizeInvoiceFromDb);
          if (error) console.error('Supabase invoices getAll:', error.message);
        } catch {}
      }

      const local = readLS('mdc_invoices');
      return (Array.isArray(local) ? local : []).map((inv: any) => ({
        ...inv,
        items: normalizeItems(inv?.items),
        subtotal: Number(inv?.subtotal || 0),
        total: Number(inv?.total || 0),
      }));
    },

    async save(invoice: any) {
      const safeInvoice = {
        ...invoice,
        items: normalizeItems(invoice?.items),
        subtotal: Number(invoice?.subtotal || 0),
        total: Number(invoice?.total || 0),
        clientEmail: String(invoice?.clientEmail || '').trim(), // ✅ enforce
      };

      if (supabase) {
        try {
          const payload = toDbInvoicePayload(safeInvoice);
          const { data, error } = await supabase.from('invoices').insert([payload]).select().single();

          if (error) {
            console.error('Error Supabase Invoices save:', error.message, payload);
          } else if (data) {
            const normalized = normalizeInvoiceFromDb(data);

            const existing = readLS('mdc_invoices');
            writeLS('mdc_invoices', [normalized, ...(Array.isArray(existing) ? existing : [])]);

            notifyDataChanged('invoices');
            return normalized;
          }
        } catch (e) {
          console.error(e);
        }
      }

      const existing = readLS('mdc_invoices');
      writeLS('mdc_invoices', [safeInvoice, ...(Array.isArray(existing) ? existing : [])]);

      notifyDataChanged('invoices');
      return safeInvoice;
    },
  },

  clients: {
    async getAll() {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('clients').select('*').order('name');
          if (!error && data) return data;
          if (error) console.error('Supabase clients getAll:', error.message);
        } catch {}
      }
      return readLS('mdc_clients');
    },

    async create(client: any) {
      // Local first (offline safe)
      const existing = readLS('mdc_clients');
      writeLS('mdc_clients', [...(Array.isArray(existing) ? existing : []), client]);
      notifyDataChanged('clients');

      if (supabase) {
        try {
          const { data, error } = await supabase.from('clients').insert([client]).select().single();
          if (!error && data) return data;
          if (error) console.error('Supabase clients create:', error.message);
        } catch {}
      }

      return client;
    },
  },

  inventory: {
    async getAll() {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('inventory').select('*');
          if (!error && data) return data;
          if (error) console.error('Supabase inventory getAll:', error.message);
        } catch {}
      }
      return readLS('mdc_inventory');
    },

    async updateStock(id: string, newQty: number) {
      const existing = readLS('mdc_inventory');
      const updated = (Array.isArray(existing) ? existing : []).map((i: any) =>
        String(i?.id) === String(id) ? { ...i, quantity: newQty } : i
      );
      writeLS('mdc_inventory', updated);
      notifyDataChanged('inventory');

      if (supabase && isUuid(id)) {
        try {
          const { error } = await supabase.from('inventory').update({ quantity: newQty }).eq('id', id);
          if (error) console.error('Supabase inventory updateStock:', error.message);
        } catch {}
      }
    },
  },
};
