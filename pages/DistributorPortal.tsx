import React, { useMemo, useEffect, useState, useRef } from 'react';
import {
  ShoppingBag, Zap, Package, Star, DollarSign, Activity,
  Building2, MapPin, User, ShieldCheck, Save, X, Camera, Loader2, LogOut,
  ChevronDown, Mail, FileText, Eye, EyeOff, Key, AlertTriangle, ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PRICING_TIERS, PRODUCTS } from '../constants';
import { supabase } from '../services/supabase';
import { Order } from '../types';

type ClientRow = {
  id: string;
  email?: string | null;
  business_name?: string | null;
  name?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  city?: string | null;
  postcode?: string | null;
  vat_number?: string | null;
  business_type?: string | null;
  image?: string | null;
  password_hint?: string | null;
};

type InvoiceRow = {
  id: string;
  invoice_number?: string | null;
  order_number?: string | null;
  client_email?: string | null;
  client_id?: string | null;
  total?: number | null;
  status?: string | null;
  date?: string | null;
  created_at?: string | null;
  pdf_url?: string | null;
};

const DistributorPortal: React.FC = () => {
  const navigate = useNavigate();

  // --- DATA ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [profile, setProfile] = useState<ClientRow>({
    id: '',
    business_name: '',
    name: '',
    phone: '',
    address_line1: '',
    city: '',
    postcode: '',
    vat_number: '',
    business_type: '',
    image: null,
    password_hint: '',
    email: ''
  });

  const [editForm, setEditForm] = useState<any>({});
  const [passwordData, setPasswordData] = useState('');
  const [sessionEmail, setSessionEmail] = useState('');
  const [sessionUserId, setSessionUserId] = useState<string>('');

  // --- UI ---
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const safeLower = (s: string) => (s || '').trim().toLowerCase();

  // ---------------------------
  // Helpers: normalize order row
  // ---------------------------
  const normalizeItems = (items: any) => {
    const arr = Array.isArray(items) ? items : [];
    return arr.map((it: any) => {
      const description = String(it?.description ?? it?.name ?? it?.title ?? 'Item').trim();
      const quantity = Number(it?.quantity ?? it?.qty ?? 1) || 1;
      const unitPrice = Number(it?.unitPrice ?? it?.unit_price ?? it?.price ?? 0) || 0;
      const total = Number(it?.total ?? quantity * unitPrice) || 0;
      return { id: String(it?.id ?? `${Date.now()}`), description, quantity, unitPrice, total };
    });
  };

  const normalizeOrder = (row: any): any => ({
    id: row?.id,
    orderNumber: row?.order_number ?? row?.orderNumber,
    clientName: row?.client_name ?? row?.clientName,
    clientEmail: row?.client_email ?? row?.clientEmail,
    items: normalizeItems(row?.items),
    total: Number(row?.total || 0),
    status: row?.status,
    date: row?.date,
    isWholesale: Boolean(row?.is_wholesale ?? row?.isWholesale),
    paymentId: row?.payment_id ?? row?.paymentId,
    createdAt: row?.created_at,
  });

  // ---------------------------
  // Load session + profile + data
  // ---------------------------
  useEffect(() => {
    const boot = async () => {
      try {
        setLoading(true);

        if (!supabase) {
          setOrdersError('Supabase is not active. Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
          navigate('/');
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData?.user) {
          navigate('/');
          return;
        }

        const user = authData.user;
        const myEmail = (user.email || '').trim();
        const myEmailLower = safeLower(myEmail);

        setSessionEmail(myEmail);
        setSessionUserId(user.id);

        // Profile: try by id, else by email
        let loadedClient: ClientRow | null = null;

        try {
          const { data: byId, error: e1 } = await supabase
            .from('clients')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          if (!e1 && byId) loadedClient = byId as ClientRow;
        } catch {}

        if (!loadedClient) {
          try {
            const { data: byEmail, error: e2 } = await supabase
              .from('clients')
              .select('*')
              .ilike('email', myEmailLower) // ok: email may be stored with different case
              .maybeSingle();
            if (!e2 && byEmail) loadedClient = byEmail as ClientRow;
          } catch {}
        }

        if (loadedClient) {
          const row = loadedClient as ClientRow;
          setProfile({ ...row, email: myEmail });
          setEditForm({ ...row, email: myEmail });
          setPasswordData(row.password_hint || '');
        } else {
          const fallback: ClientRow = {
            id: user.id,
            email: myEmail,
            name: (user.user_metadata as any)?.name || '',
            business_name: '',
            phone: '',
            address_line1: '',
            city: '',
            postcode: '',
            vat_number: '',
            business_type: '',
            image: null,
            password_hint: ''
          };
          setProfile(fallback);
          setEditForm(fallback);
          setPasswordData('');
        }

        await Promise.all([
          loadOrders({ myEmailLower, myUserId: user.id }),
          loadInvoices({ myEmailLower, myUserId: user.id }),
        ]);

      } catch (err: any) {
        console.error('Boot error:', err);
        setOrdersError(err?.message || 'Failed to load distributor portal.');
      } finally {
        setLoading(false);
      }
    };

    /**
     * ✅ ORDERS: robust linking
     * 1) Try by client_id (correct & future-proof)
     * 2) Fallback by client_email (for legacy rows where client_id is null)
     */
    const loadOrders = async ({ myEmailLower, myUserId }: { myEmailLower: string; myUserId: string }) => {
      setLoadingOrders(true);
      setOrdersError(null);

      try {
        // --- 1) by client_id ---
        const byId = await supabase!
          .from('orders')
          .select('*')
          .eq('is_wholesale', true)
          .eq('client_id', myUserId)
          .order('created_at', { ascending: false });

        if (byId.error) throw byId.error;

        let rows = byId.data || [];

        // --- 2) fallback by client_email ---
        if (rows.length === 0) {
          const byEmail = await supabase!
            .from('orders')
            .select('*')
            .eq('is_wholesale', true)
            // ✅ IMPORTANT: use eq because you INSERT lower(email) already
            .eq('client_email', myEmailLower)
            .order('created_at', { ascending: false });

          if (byEmail.error) throw byEmail.error;
          rows = byEmail.data || [];

          // If fallback returned rows, warn that client_id is missing in DB
          if (rows.length > 0) {
            setOrdersError(
              `Orders found for ${myEmailLower}, but they are NOT linked by client_id yet. ` +
              `This is a DB legacy issue (client_id is null). Fix: backfill orders.client_id from clients.`
            );
          }
        }

        const normalized = rows.map(normalizeOrder);
        setOrders(normalized);

        if (rows.length === 0) {
          setOrdersError(
            `No wholesale orders found for this account (${myEmailLower}). ` +
            `If you believe there are orders in DB, check RLS policies and verify orders.client_email/client_id linkage.`
          );
        }
      } catch (e: any) {
        console.error('[Orders load error]', e);
        const msg =
          String(e?.status) === '403'
            ? 'Access denied (RLS). Your user cannot read orders yet. Add RLS policy for orders SELECT.'
            : (e?.message || 'Could not load orders.');
        setOrdersError(msg);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };

    /**
     * ✅ INVOICES: same logic (client_id first, fallback email)
     * plus safe select if pdf_url column doesn't exist
     */
    const loadInvoices = async ({ myEmailLower, myUserId }: { myEmailLower: string; myUserId: string }) => {
      setLoadingInvoices(true);
      setInvoicesError(null);

      const trySelect = async (cols: string) => {
        return await supabase!
          .from('invoices')
          .select(cols)
          .eq('client_id', myUserId)
          .order('created_at', { ascending: false });
      };

      try {
        // 1) try by client_id (with pdf_url)
        let res = await trySelect('id, invoice_number, order_number, client_email, client_id, total, status, date, created_at, pdf_url');

        if (res.error) {
          const msg = String(res.error.message || '').toLowerCase();
          const isUndefinedColumn = msg.includes('column') && msg.includes('does not exist');
          if (!isUndefinedColumn) throw res.error;

          // retry without pdf_url
          res = await trySelect('id, invoice_number, order_number, client_email, client_id, total, status, date, created_at');
          if (res.error) throw res.error;
        }

        let rows = res.data || [];

        // 2) fallback by email if none by client_id
        if (rows.length === 0) {
          // try with pdf_url
          const byEmailTry = await supabase!
            .from('invoices')
            .select('id, invoice_number, order_number, client_email, client_id, total, status, date, created_at, pdf_url')
            .eq('client_email', myEmailLower)
            .order('created_at', { ascending: false });

          if (byEmailTry.error) {
            const msg = String(byEmailTry.error.message || '').toLowerCase();
            const isUndefinedColumn = msg.includes('column') && msg.includes('does not exist');
            if (!isUndefinedColumn) throw byEmailTry.error;

            const byEmailNoPdf = await supabase!
              .from('invoices')
              .select('id, invoice_number, order_number, client_email, client_id, total, status, date, created_at')
              .eq('client_email', myEmailLower)
              .order('created_at', { ascending: false });

            if (byEmailNoPdf.error) throw byEmailNoPdf.error;
            rows = byEmailNoPdf.data || [];
          } else {
            rows = byEmailTry.data || [];
          }

          if (rows.length > 0) {
            setInvoicesError(
              `Invoices found for ${myEmailLower}, but they are NOT linked by client_id yet. ` +
              `Backfill invoices.client_id from clients (same approach as orders).`
            );
          }
        }

        setInvoices(rows as InvoiceRow[]);
      } catch (e: any) {
        console.error('[Invoices load error]', e);
        const msg =
          String(e?.status) === '403'
            ? 'Access denied (RLS). Your user cannot read invoices yet. Add RLS policy for invoices SELECT.'
            : (e?.message || 'Could not load invoices.');
        setInvoicesError(msg);
        setInvoices([]);
      } finally {
        setLoadingInvoices(false);
      }
    };

    boot();

    const handleClickOutside = (event: any) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navigate]);

  // ---------------------------
  // Photo upload
  // ---------------------------
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase) return;
    if (!e.target.files || e.target.files.length === 0) return;

    setUploadingPhoto(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${editForm.id || 'unknown'}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file, {
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      setEditForm((prev: any) => ({ ...prev, image: data.publicUrl }));
    } catch (error: any) {
      alert(`Error uploading photo: ${error.message}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ---------------------------
  // Save profile + password
  // ---------------------------
  const handleSaveProfile = async () => {
    if (!supabase) return;
    setIsSaving(true);

    try {
      let passwordChanged = false;

      if (passwordData && passwordData !== profile.password_hint) {
        if (passwordData.length < 6) {
          alert('Password must be at least 6 characters.');
          setIsSaving(false);
          return;
        }

        const { error: passError } = await supabase.auth.updateUser({ password: passwordData });
        if (passError) throw passError;
        passwordChanged = true;
      }

      const dataToUpdate = {
        ...editForm,
        password_hint: passwordData,
        email: sessionEmail,
      };

      const { error: dbError } = await supabase.from('clients').upsert(dataToUpdate);
      if (dbError) throw dbError;

      setProfile(dataToUpdate);
      setIsProfileOpen(false);
      alert(passwordChanged ? 'Profile & Password updated successfully.' : 'Profile updated successfully.');
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    localStorage.clear();
    navigate('/');
  };

  // ---------------------------
  // Stats
  // ---------------------------
  const stats = useMemo(() => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    if (safeOrders.length === 0) {
      return {
        totalSpent: 0,
        points: 0,
        unitsThisMonth: 0,
        currentTier: PRICING_TIERS[0],
        totalMargin: 0,
      };
    }

    const totalSpent = safeOrders.reduce((sum, o: any) => sum + (Number(o?.total) || 0), 0);
    const points = Math.floor(totalSpent / 10);

    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const unitsThisMonth = safeOrders.reduce((sum, o: any) => {
      const d = String(o?.date || '');
      const isThisMonth = d.startsWith(ym);
      if (!isThisMonth) return sum;

      const items = Array.isArray(o?.items) ? o.items : [];
      return sum + items.reduce((s: number, i: any) => s + (Number(i?.quantity) || 0), 0);
    }, 0);

    let totalMargin = 0;
    safeOrders.forEach((order: any) => {
      const items = Array.isArray(order?.items) ? order.items : [];
      items.forEach((item: any) => {
        const product = PRODUCTS.find((p: any) => p.name === item?.description);
        if (!product) return;
        const base = Number((product as any).basePrice) || 0;
        const unit = Number(item?.unitPrice) || 0;
        const qty = Number(item?.quantity) || 0;
        totalMargin += (base - unit) * qty;
      });
    });

    let currentTier = PRICING_TIERS[0];
    for (const tier of [...PRICING_TIERS].reverse()) {
      if (unitsThisMonth >= tier.min) {
        currentTier = tier;
        break;
      }
    }

    return { totalSpent, points, unitsThisMonth, currentTier, totalMargin };
  }, [orders]);

  const displayName = profile.business_name || profile.name || 'Distributor';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin text-[#20B2AA]" size={28} />
          <span className="text-slate-500 font-bold">Loading distributor portal…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* HEADER */}
      <header className="bg-white sticky top-0 z-30 border-b border-slate-100 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#20B2AA] rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Building2 className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
              {displayName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-xs text-slate-500 font-medium">Verified Distributor</p>
              {sessionEmail && (
                <span className="text-[10px] text-slate-400 font-bold ml-2">{sessionEmail}</span>
              )}
              {sessionUserId && (
                <span className="text-[10px] text-slate-300 font-bold ml-2">uid:{sessionUserId.slice(0, 8)}…</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Link
            to="/catalog"
            className="hidden md:flex bg-[#20B2AA] hover:bg-[#1a908a] text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] shadow-md flex items-center gap-2 transition-all hover:-translate-y-0.5"
          >
            <ShoppingBag size={16} /> Place Order
          </Link>

          {/* MENU PERFIL */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-2 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm overflow-hidden flex items-center justify-center relative">
                {profile.image ? (
                  <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-slate-300" size={20} />
                )}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">My Account</p>
                <p className="text-[9px] text-slate-400 font-medium">Settings</p>
              </div>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* MODAL PERFIL */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-4 w-[420px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-5">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                  <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <User size={16} className="text-[#20B2AA]" /> Account Profile
                  </h3>
                  <button
                    onClick={() => setIsProfileOpen(false)}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    type="button"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar space-y-8">
                  {/* Foto */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-28 h-28 rounded-full border-4 border-slate-50 shadow-inner overflow-hidden group bg-slate-100">
                      {editForm.image ? (
                        <img src={editForm.image} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="text-slate-300 m-auto mt-6" size={40} />
                      )}
                      <label className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        {uploadingPhoto ? (
                          <Loader2 className="text-white animate-spin" size={24} />
                        ) : (
                          <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                        )}
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wide">Update Logo</p>
                  </div>

                  {/* Credenciales */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <ShieldCheck size={14} className="text-[#20B2AA]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Access Credentials
                      </span>
                    </div>

                    <div className="relative group">
                      <Mail size={16} className="absolute left-4 top-3.5 text-slate-400" />
                      <input
                        disabled
                        value={sessionEmail}
                        className="w-full pl-12 pr-4 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs border border-transparent cursor-not-allowed"
                      />
                    </div>

                    <div className="relative group">
                      <Key size={16} className="absolute left-4 top-3.5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData}
                        onChange={(e) => setPasswordData(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-[#20B2AA] outline-none transition-all placeholder:text-slate-400"
                        placeholder="Enter your password"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3.5 text-slate-400 hover:text-[#20B2AA] transition-colors"
                        type="button"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 font-bold">
                      Password is updated in Supabase Auth. “password_hint” is stored for display.
                    </p>
                  </div>

                  {/* Business */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <FileText size={14} className="text-[#20B2AA]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Business Info
                      </span>
                    </div>

                    <input
                      value={editForm.business_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#20B2AA]"
                      placeholder="Business Name"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={editForm.vat_number || ''}
                        onChange={(e) => setEditForm({ ...editForm, vat_number: e.target.value })}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#20B2AA]"
                        placeholder="VAT ID"
                      />
                      <input
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#20B2AA]"
                        placeholder="Contact Name"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <MapPin size={14} className="text-[#20B2AA]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Location
                      </span>
                    </div>

                    <input
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#20B2AA]"
                      placeholder="Phone"
                    />
                    <input
                      value={editForm.address_line1 || ''}
                      onChange={(e) => setEditForm({ ...editForm, address_line1: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#20B2AA]"
                      placeholder="Address"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        value={editForm.city || ''}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#20B2AA]"
                        placeholder="City"
                      />
                      <input
                        value={editForm.postcode || ''}
                        onChange={(e) => setEditForm({ ...editForm, postcode: e.target.value })}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#20B2AA]"
                        placeholder="Postcode"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-100 flex gap-3 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors flex items-center justify-center gap-2 flex-1 font-bold text-[10px] uppercase tracking-wider"
                    type="button"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving || uploadingPhoto}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#20B2AA] transition-all flex-[2] shadow-lg shadow-slate-200"
                    type="button"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                    {isSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto p-8 space-y-12 animate-in fade-in duration-700">
        {ordersError && (
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="text-amber-600" size={18} />
            </div>
            <div className="flex-1">
              <p className="font-black text-amber-900 uppercase tracking-widest text-[10px]">
                Orders not loading / not linked
              </p>
              <p className="text-amber-800 font-bold text-sm mt-1">{ordersError}</p>
              <p className="text-amber-700 text-xs mt-2">
                Fix in DB: backfill orders.client_id from clients for legacy rows.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <CardStat title="Profit Margin" value={`£${stats.totalMargin.toFixed(0)}`} sub="Estimated Margin" icon={DollarSign} color="emerald" />
          <CardStat title="Points Balance" value={stats.points.toLocaleString()} sub="Redeemable" icon={Zap} color="amber" />
          <CardStat title="Monthly Units" value={stats.unitsThisMonth.toString()} sub="This Month" icon={Package} color="indigo" />
          <CardStat title="Total Orders" value={orders.length.toString()} sub="Wholesale History" icon={Activity} color="teal" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 min-h-[520px] flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                  <ShoppingBag className="text-[#20B2AA]" size={20} /> Recent Orders
                </h3>
                <p className="text-slate-400 font-bold text-xs mt-1">
                  Showing your wholesale orders only.
                </p>
              </div>

              <Link
                to="/catalog"
                className="bg-slate-900 hover:bg-[#20B2AA] text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] shadow-md flex items-center gap-2 transition-all"
              >
                <ShoppingBag size={16} /> New order
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {loadingOrders ? (
                <div className="h-full flex items-center justify-center gap-3 text-slate-500 font-bold">
                  <Loader2 className="animate-spin" size={18} />
                  Loading orders…
                </div>
              ) : orders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem]">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                    <Package size={26} className="text-slate-300" />
                  </div>
                  <p className="text-slate-900 font-black uppercase text-xs tracking-widest text-center">
                    No orders visible
                  </p>
                  <p className="text-slate-400 font-bold text-xs mt-2 text-center max-w-md">
                    If orders exist in DB but not here, check linkage by client_id or client_email for {safeLower(sessionEmail)}.
                  </p>
                  <Link to="/catalog" className="mt-6 text-[#20B2AA] text-xs font-black uppercase tracking-widest hover:underline">
                    Place a new order
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((o: any) => (
                    <div
                      key={o?.id || o?.orderNumber}
                      className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center hover:bg-white hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#20B2AA] border border-slate-200">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 uppercase text-xs tracking-wide">
                            {o?.orderNumber || 'PENDING'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                            {o?.date || (o?.createdAt ? String(o.createdAt).slice(0, 10) : '—')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-sm">£{Number(o?.total || 0).toFixed(2)}</p>
                        <span className="text-[8px] uppercase font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 mt-1 inline-block">
                          {o?.status || 'Processing'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoice history */}
            <div className="mt-10 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={16} className="text-[#20B2AA]" /> Invoice History
                </h4>
                <Link to="/orders" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#20B2AA]">
                  View all
                </Link>
              </div>

              {invoicesError && (
                <p className="mt-3 text-xs font-bold text-amber-700">{invoicesError}</p>
              )}

              {loadingInvoices ? (
                <div className="mt-4 flex items-center gap-2 text-slate-500 font-bold text-xs">
                  <Loader2 className="animate-spin" size={14} /> Loading invoices…
                </div>
              ) : invoices.length === 0 ? (
                <p className="mt-4 text-xs text-slate-400 font-bold">
                  No invoices found for {safeLower(sessionEmail)}.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {invoices.slice(0, 5).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-5 py-4"
                    >
                      <div>
                        <p className="text-xs font-black text-slate-900">
                          {inv.invoice_number || 'INVOICE'}
                          {inv.order_number ? <span className="text-slate-400 font-bold"> • {inv.order_number}</span> : null}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                          {inv.date || (inv.created_at ? String(inv.created_at).slice(0, 10) : '—')} • {String(inv.status || 'draft').toUpperCase()}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="text-sm font-black text-slate-900">£{Number(inv.total || 0).toFixed(2)}</p>

                        {(inv as any).pdf_url ? (
                          <a
                            href={(inv as any).pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#20B2AA] transition-colors flex items-center gap-2"
                          >
                            <ExternalLink size={14} /> PDF
                          </a>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            PDF pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tier card */}
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <Star size={180} />
            </div>
            <div className="relative z-10 mb-8">
              <h3 className="text-[#C6FF00] font-black uppercase tracking-[0.3em] text-[10px] mb-2 flex items-center gap-2">
                <ShieldCheck size={14} /> Partner Tiers
              </h3>
              <p className="text-3xl font-black tracking-tighter leading-none">
                Volume <br />Discounts
              </p>
              <p className="text-white/60 text-xs font-bold mt-3">
                Current tier: <span className="text-white">{stats.currentTier.name}</span>
              </p>
            </div>

            <div className="space-y-3 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {PRICING_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${
                    stats.currentTier.name === tier.name
                      ? 'bg-[#C6FF00] border-[#C6FF00] text-slate-900 shadow-lg shadow-[#C6FF00]/20'
                      : 'border-white/10 bg-white/5 opacity-70'
                  }`}
                >
                  <div>
                    <span className="font-black text-xs uppercase block flex items-center gap-2">
                      {tier.name}
                      {stats.currentTier.name === tier.name && (
                        <div className="w-2 h-2 bg-slate-900 rounded-full animate-pulse" />
                      )}
                    </span>
                    <span className="text-[8px] uppercase font-bold opacity-70">{tier.min}+ units/mo</span>
                  </div>
                  <span className="font-black text-lg">-{tier.discount * 100}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const CardStat = ({ title, value, sub, icon: Icon, color }: any) => {
  const colorMap: any = {
    teal: 'bg-[#20B2AA]',
    indigo: 'bg-indigo-600',
    amber: 'bg-[#f59e0b]',
    emerald: 'bg-emerald-500',
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:-translate-y-1 transition-all hover:shadow-md">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.25em] mb-1">{title}</p>
      <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h4>
      <p className="text-slate-400 text-[9px] mt-1 font-bold italic opacity-60">{sub}</p>
    </div>
  );
};

export default DistributorPortal;
