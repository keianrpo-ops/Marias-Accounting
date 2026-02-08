import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  MessageSquare,
  ShieldCheck,
  Clock,
  Package,
  User,
  X,
  Loader2,
  ShoppingBag,
  LogOut,
  List,
  ChevronRight,
  Camera,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

type ActiveTab = "overview" | "orders";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string;
  order_number?: string;
  items?: unknown;
}

interface ProfileState {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  image: string;
  password_hint: string;
}

const currencyGBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 2,
});

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });

function safeParseOrderItems(raw: unknown): OrderItem[] {
  try {
    if (!raw) return [];
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      return normalizeItems(parsed);
    }
    return normalizeItems(raw);
  } catch {
    return [];
  }
}

function normalizeItems(raw: unknown): OrderItem[] {
  if (Array.isArray(raw)) return raw.filter(Boolean) as OrderItem[];

  // si viene como objeto {0:{...},1:{...}} o {itemId:{...}}
  if (raw && typeof raw === "object") {
    const values = Object.values(raw as Record<string, unknown>);
    return values.filter(Boolean) as OrderItem[];
  }

  return [];
}

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

const ClientPortal: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [profile, setProfile] = useState<ProfileState>({
    id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    image: "",
    password_hint: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string>("");

  // Evita setState si el componente se desmonta
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    return { totalOrders: orders.length, totalSpent };
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 3), [orders]);

  const parsedItems = useMemo(() => safeParseOrderItems(selectedOrder?.items), [selectedOrder]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const user = userRes?.user;
      if (!user) {
        navigate("/login");
        return;
      }

      const profileQuery = supabase.from("clients").select("*").eq("id", user.id).single();
      const ordersQuery = supabase
        .from("orders")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      const [{ data: client, error: clientErr }, { data: ords, error: ordErr }] = await Promise.all([
        profileQuery,
        ordersQuery,
      ]);

      if (clientErr) throw clientErr;
      if (ordErr) throw ordErr;

      if (!mountedRef.current) return;

      if (client) {
        setProfile({
          id: client.id,
          name: client.name || "",
          email: user.email || "",
          phone: client.phone || "",
          address: client.address_line1 || "",
          city: client.city || "",
          image: client.image || "",
          password_hint: client.password_hint || "",
        });
      }

      setOrders((ords || []) as Order[]);
    } catch (e: any) {
      console.error(e);
      if (!mountedRef.current) return;
      setErrorMsg(e?.message || "Something went wrong loading your data.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = useCallback((order: Order) => {
    setSelectedOrder(order);
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/login");
  }, [navigate]);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validaciones mínimas (profesional)
        const maxBytes = 3 * 1024 * 1024; // 3MB
        if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");
        if (file.size > maxBytes) throw new Error("Image too large. Max 3MB.");

        if (!profile.id) throw new Error("Missing profile id.");

        setUploadingImage(true);
        setErrorMsg("");

        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const fileName = `${profile.id}/avatar.${ext}`; // ruta estable (1 avatar por usuario)

        const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600",
        });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
        const publicUrl = data.publicUrl;

        // Cache-bust para que el browser no muestre la imagen anterior
        const bustedUrl = `${publicUrl}?v=${Date.now()}`;

        if (!mountedRef.current) return;
        setProfile((prev) => ({ ...prev, image: bustedUrl }));
      } catch (e: any) {
        console.error("Error uploading image:", e);
        if (!mountedRef.current) return;
        setErrorMsg(e?.message || "Error uploading image.");
      } finally {
        if (mountedRef.current) setUploadingImage(false);
      }
    },
    [profile.id]
  );

  const handleSaveProfile = useCallback(async () => {
    setIsSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        address_line1: profile.address.trim(),
        city: profile.city.trim(),
        password_hint: profile.password_hint.trim(),
        image: profile.image,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("clients").update(payload).eq("id", profile.id);
      if (error) throw error;

      if (!mountedRef.current) return;
      setIsEditing(false);
    } catch (e: any) {
      console.error(e);
      if (!mountedRef.current) return;
      setErrorMsg(e?.message || "Error saving profile.");
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8 font-sans text-slate-900">
      {/* ERROR BANNER */}
      {errorMsg && (
        <div className="max-w-7xl mx-auto mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <p className="text-red-700 font-semibold">{errorMsg}</p>
            <button
              onClick={() => setErrorMsg("")}
              className="text-red-700/70 hover:text-red-700"
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8 bg-white p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border-4 border-white shadow-lg relative group">
            {profile.image ? (
              <img src={profile.image} className="w-full h-full object-cover" alt="Profile avatar" />
            ) : (
              <User className="text-slate-300" aria-hidden="true" />
            )}

            <button
              onClick={() => setIsEditing(true)}
              className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              aria-label="Edit profile"
            >
              <Camera className="text-white" size={20} />
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-black uppercase">
              Hola, <span className="text-teal-500">{(profile.name || "Cliente").split(" ")[0]}</span>
            </h1>
            <span className="text-[10px] font-bold uppercase bg-slate-100 px-3 py-1 rounded-full text-slate-500 flex items-center gap-1 w-fit">
              <ShieldCheck size={12} /> Cliente
            </span>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex gap-2">
          <Link
            to="/catalog"
            className="bg-slate-900 text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center gap-2 shadow-lg"
          >
            <ShoppingBag size={16} /> Ir a Comprar
          </Link>
          <button
            onClick={handleLogout}
            className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:text-red-500"
            aria-label="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SIDEBAR */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[2rem] text-center shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase">Pedidos</p>
              <p className="text-2xl font-black">{stats.totalOrders}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] text-center shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase">Gastado</p>
              <p className="text-2xl font-black">{currencyGBP.format(stats.totalSpent)}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[2rem] shadow-sm space-y-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "w-full p-4 rounded-xl flex gap-3 items-center text-xs font-bold uppercase",
                activeTab === "overview" ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-600"
              )}
            >
              <Activity size={18} /> Resumen
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={cn(
                "w-full p-4 rounded-xl flex gap-3 items-center text-xs font-bold uppercase",
                activeTab === "orders" ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-600"
              )}
            >
              <List size={18} /> Mis Pedidos
            </button>

            <Link
              to="/messages"
              className="w-full p-4 rounded-xl flex gap-3 items-center text-xs font-bold uppercase hover:bg-slate-50 text-slate-600"
            >
              <MessageSquare size={18} /> Mensajes
            </Link>

            <button
              onClick={() => setIsEditing(true)}
              className="w-full p-4 rounded-xl flex gap-3 items-center text-xs font-bold uppercase hover:bg-slate-50 text-slate-600"
            >
              <User size={18} /> Mi Perfil
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm min-h-[500px]">
            {activeTab === "overview" && (
              <>
                <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                  <Clock className="text-teal-500" /> Reciente
                </h2>

                <div className="space-y-4">
                  {orders.length === 0 && (
                    <div className="text-center py-10 opacity-80">
                      <ShoppingBag size={40} className="mx-auto mb-2" />
                      <p className="text-xs font-bold uppercase">Sin pedidos</p>
                    </div>
                  )}

                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleOpenModal(order)}
                      className="bg-slate-50 p-6 rounded-[2rem] flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-all"
                      role="button"
                      tabIndex={0}
                    >
                      <div>
                        <p className="font-black text-sm">#{order.order_number || order.id.slice(0, 6)}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg">{currencyGBP.format(Number(order.total) || 0)}</p>
                        <span className="text-[9px] font-black uppercase bg-white px-2 py-1 rounded">{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "orders" && (
              <>
                <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                  <List className="text-teal-500" /> Historial
                </h2>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleOpenModal(order)}
                      className="border border-slate-100 p-6 rounded-[2rem] flex justify-between items-center cursor-pointer hover:shadow-md transition-all"
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <Package size={18} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="font-black text-sm">#{order.order_number || order.id.slice(0, 6)}</p>
                          <p className="text-[10px] uppercase font-bold text-slate-400">{formatDate(order.created_at)}</p>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <span className="text-[9px] font-black uppercase bg-slate-100 px-2 py-1 rounded">{order.status}</span>
                        <p className="font-black text-xl">{currencyGBP.format(Number(order.total) || 0)}</p>
                        <ChevronRight size={18} className="text-slate-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ORDER MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-0 overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-slate-50 p-6 flex justify-between items-center border-b border-slate-100">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Pedido</p>
                <h3 className="text-2xl font-black">#{selectedOrder.order_number || selectedOrder.id.slice(0, 6)}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"
                aria-label="Close order"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
              {parsedItems.length > 0 ? (
                parsedItems.map((item, i) => {
                  const line = (Number(item.price) || 0) * (Number(item.quantity) || 0);
                  return (
                    <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-xs bg-slate-100 w-6 h-6 flex items-center justify-center rounded">
                          {item.quantity}
                        </span>
                        <span className="font-bold text-sm text-slate-700">{item.name}</span>
                      </div>
                      <span className="font-bold text-sm">{currencyGBP.format(line)}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs font-bold text-slate-400 uppercase">Sin detalles de items</p>
              )}
            </div>

            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest opacity-70">Total Pagado</span>
              <span className="text-2xl font-black">{currencyGBP.format(Number(selectedOrder.total) || 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE DRAWER */}
      {isEditing && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsEditing(false)} />
          <div className="relative bg-white w-full max-w-md h-full p-8 shadow-2xl animate-in slide-in-from-right overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-xl uppercase">Editar Perfil</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="hover:bg-slate-100 p-2 rounded-full transition-colors"
                aria-label="Close profile"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 space-y-6">
              {/* AVATAR */}
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="relative w-28 h-28 rounded-full bg-slate-100 border-4 border-slate-50 shadow-md overflow-hidden group">
                  {uploadingImage ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
                      <Loader2 className="animate-spin text-teal-500" />
                    </div>
                  ) : (
                    <>
                      {profile.image ? (
                        <img src={profile.image} className="w-full h-full object-cover" alt="Profile avatar" />
                      ) : (
                        <User className="text-slate-300 w-12 h-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                      <label
                        htmlFor="upload-avatar"
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                        aria-label="Upload new avatar"
                      >
                        <Camera className="text-white" />
                      </label>
                    </>
                  )}
                </div>

                <input
                  type="file"
                  id="upload-avatar"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                <p className="text-[10px] uppercase font-bold text-slate-400">Clic en la foto para cambiar</p>
              </div>

              {/* FIELDS */}
              <div className="space-y-4">
                <Field label="Nombre">
                  <input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </Field>

                <Field label="Teléfono">
                  <input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </Field>

                <Field label="Dirección">
                  <textarea
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all resize-none h-24"
                  />
                </Field>

                <Field label="Ciudad">
                  <input
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </Field>

                <Field label="Pista Contraseña">
                  <input
                    value={profile.password_hint}
                    onChange={(e) => setProfile({ ...profile, password_hint: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </Field>
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving || uploadingImage}
              className="w-full bg-slate-900 text-white p-4 rounded-xl font-black uppercase text-xs tracking-widest mt-4 shadow-xl shadow-slate-300/50 hover:bg-teal-600 transition-all disabled:opacity-60 disabled:hover:bg-slate-900"
            >
              {isSaving ? <Loader2 className="animate-spin mx-auto" /> : "GUARDAR CAMBIOS"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">{label}</label>
    {children}
  </div>
);

export default ClientPortal;
