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
  MapPin,
  Phone,
  Building2,
  Stethoscope,
  Dog,
  Save,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

type ActiveTab = "overview" | "orders" | "profile" | "pets";
type ClientRole = "client" | "distributor";

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

interface ClientRow {
  id: string;
  role?: ClientRole | null;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  postcode?: string | null;
  image?: string | null;

  business_name?: string | null;
  vat_number?: string | null;
  business_type?: string | null;

  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;

  // En tu Register lo guardas concatenado en vet_info: "Dr/Clínica: X - Tel: Y"
  vet_info?: string | null;

  updated_at?: string | null;
}

interface PetRow {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  age: string | null;
  gender: "male" | "female" | string;
  image: string | null;
  microchip: string | null;
  medical_conditions: string | null;
  allergies: string | null;
  is_neutered: boolean | null;
  created_at?: string | null;
}

interface ProfileState {
  id: string;
  role: ClientRole;

  name: string;
  email: string;

  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;

  image: string;

  // distributor
  businessName: string;
  businessType: string;
  vatNumber: string;

  // client
  emergencyContactName: string;
  emergencyContactPhone: string;
  vetName: string;
  vetPhone: string;
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
  if (raw && typeof raw === "object") return Object.values(raw as Record<string, unknown>).filter(Boolean) as OrderItem[];
  return [];
}

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function parseVetInfo(vet_info?: string | null): { vetName: string; vetPhone: string } {
  if (!vet_info) return { vetName: "", vetPhone: "" };
  // Formato actual: "Dr/Clínica: X - Tel: Y"
  const nameMatch = vet_info.match(/Dr\/Cl[ií]nica:\s*(.*?)(?:\s*-\s*Tel:|$)/i);
  const phoneMatch = vet_info.match(/Tel:\s*(.*)$/i);
  return {
    vetName: (nameMatch?.[1] || "").trim(),
    vetPhone: (phoneMatch?.[1] || "").trim(),
  };
}

function buildVetInfo(vetName: string, vetPhone: string) {
  const n = vetName.trim();
  const p = vetPhone.trim();
  if (!n && !p) return "";
  if (n && !p) return `Dr/Clínica: ${n}`;
  if (!n && p) return `Tel: ${p}`;
  return `Dr/Clínica: ${n} - Tel: ${p}`;
}

const DEFAULT_BUSINESS_TYPES = ["Retail Store", "Vet Clinic", "Grooming Salon", "Online Store", "Distributor"];

const isEffectivelyEmptyTempPet = (p: PetRow) => {
  if (!p.id.startsWith("tmp_")) return false;
  const hasAny =
    !!p.name?.trim() ||
    !!p.breed?.trim() ||
    !!p.age?.trim() ||
    !!p.gender?.trim() ||
    !!p.image ||
    !!p.microchip?.trim() ||
    !!p.medical_conditions?.trim() ||
    !!p.allergies?.trim() ||
    !!p.is_neutered;
  return !hasAny;
};

const ClientPortal: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [pets, setPets] = useState<PetRow[]>([]);
  const petsRef = useRef<PetRow[]>([]);
  useEffect(() => {
    petsRef.current = pets;
  }, [pets]);

  const [petsLoading, setPetsLoading] = useState(false);

  const [profile, setProfile] = useState<ProfileState>({
    id: "",
    role: "client",
    name: "",
    email: "",

    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",

    image: "",

    businessName: "",
    businessType: "Retail Store",
    vatNumber: "",

    emergencyContactName: "",
    emergencyContactPhone: "",
    vetName: "",
    vetPhone: "",
  });

  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isSavingPets, setIsSavingPets] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string>("");
  const [okMsg, setOkMsg] = useState<string>("");

  // Para marcar en UI cuál mascota falla
  const [petNameErrors, setPetNameErrors] = useState<Record<string, boolean>>({});

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

  // Snapshot para detectar cambios (dirty state)
  const [profileSnapshot, setProfileSnapshot] = useState<string>("");
  const isProfileDirty = useMemo(() => {
    if (!profileSnapshot) return false;
    return JSON.stringify(profile) !== profileSnapshot;
  }, [profile, profileSnapshot]);

  const [petsSnapshot, setPetsSnapshot] = useState<string>("");
  const isPetsDirty = useMemo(() => {
    if (!petsSnapshot) return false;
    return JSON.stringify(pets) !== petsSnapshot;
  }, [pets, petsSnapshot]);

  const clearMessages = () => {
    setErrorMsg("");
    setOkMsg("");
  };

  const loadPets = useCallback(async (userId: string) => {
    setPetsLoading(true);
    try {
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!mountedRef.current) return;

      const list = (data || []) as PetRow[];
      setPets(list);
      setPetsSnapshot(JSON.stringify(list));
      setPetNameErrors({});
    } catch (e: any) {
      console.error(e);
      if (!mountedRef.current) return;
      setErrorMsg(e?.message || "Error loading pets.");
    } finally {
      if (mountedRef.current) setPetsLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    clearMessages();

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

      const [{ data: client, error: clientErr }, { data: ords, error: ordErr }] = await Promise.all([profileQuery, ordersQuery]);

      if (clientErr) throw clientErr;
      if (ordErr) throw ordErr;

      if (!mountedRef.current) return;

      const c = (client || {}) as ClientRow;
      const role = (c.role || "client") as ClientRole;
      const { vetName, vetPhone } = parseVetInfo(c.vet_info);

      const nextProfile: ProfileState = {
        id: c.id || user.id,
        role,
        name: c.name || "",
        email: user.email || c.email || "",

        phone: c.phone || "",
        addressLine1: c.address_line1 || "",
        addressLine2: c.address_line2 || "",
        city: c.city || "",
        postcode: c.postcode || "",

        image: c.image || "",

        businessName: c.business_name || "",
        businessType: c.business_type || "Retail Store",
        vatNumber: c.vat_number || "",

        emergencyContactName: c.emergency_contact_name || "",
        emergencyContactPhone: c.emergency_contact_phone || "",

        vetName,
        vetPhone,
      };

      setProfile(nextProfile);
      setProfileSnapshot(JSON.stringify(nextProfile));
      setOrders((ords || []) as Order[]);

      // Cargar mascotas si es cliente
      if (role === "client") {
        await loadPets(user.id);
      } else {
        setPets([]);
        setPetsSnapshot(JSON.stringify([]));
      }
    } catch (e: any) {
      console.error(e);
      if (!mountedRef.current) return;
      setErrorMsg(e?.message || "Something went wrong loading your data.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [navigate, loadPets]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = useCallback((order: Order) => setSelectedOrder(order), []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/login");
  }, [navigate]);

  // ✅ Bucket `images`
  const uploadProfileImage = useCallback(
    async (file: File) => {
      const maxBytes = 3 * 1024 * 1024;
      if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");
      if (file.size > maxBytes) throw new Error("Image too large. Max 3MB.");
      if (!profile.id) throw new Error("Missing profile id.");

      setUploadingImage(true);
      clearMessages();

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `profiles/${profile.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("images").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      const bustedUrl = `${publicUrl}?v=${Date.now()}`;

      if (!mountedRef.current) return;
      setProfile((p) => ({ ...p, image: bustedUrl }));
      setOkMsg("Profile image updated.");
    },
    [profile.id]
  );

  const handleProfileImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadProfileImage(file);
      } catch (err: any) {
        console.error(err);
        if (!mountedRef.current) return;
        setErrorMsg(err?.message || "Error uploading image.");
      } finally {
        if (mountedRef.current) setUploadingImage(false);
      }
    },
    [uploadProfileImage]
  );

  const validateProfile = (p: ProfileState) => {
    if (!p.name.trim()) return "Name is required.";
    if (!p.phone.trim()) return "Phone is required.";
    if (!p.addressLine1.trim()) return "Address is required.";
    if (!p.city.trim()) return "City is required.";
    if (!p.postcode.trim()) return "Postcode is required.";

    if (p.role === "distributor") {
      if (!p.businessName.trim()) return "Business name is required.";
      if (!p.businessType.trim()) return "Business type is required.";
      if (!p.vatNumber.trim()) return "VAT/NIT is required.";
    } else {
      if (!p.emergencyContactName.trim()) return "Emergency contact name is required.";
      if (!p.emergencyContactPhone.trim()) return "Emergency contact phone is required.";
    }
    return "";
  };

  const handleSaveProfile = useCallback(async () => {
    clearMessages();
    const validationError = validateProfile(profile);
    if (validationError) {
      setErrorMsg(validationError);
      setActiveTab("profile");
      return;
    }

    setIsSavingProfile(true);

    try {
      const payload: Partial<ClientRow> = {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        address_line1: profile.addressLine1.trim(),
        address_line2: profile.addressLine2.trim(),
        city: profile.city.trim(),
        postcode: profile.postcode.trim(),
        image: profile.image,
        updated_at: new Date().toISOString(),
      };

      if (profile.role === "distributor") {
        payload.business_name = profile.businessName.trim();
        payload.business_type = profile.businessType.trim();
        payload.vat_number = profile.vatNumber.trim();
      } else {
        payload.emergency_contact_name = profile.emergencyContactName.trim();
        payload.emergency_contact_phone = profile.emergencyContactPhone.trim();
        payload.vet_info = buildVetInfo(profile.vetName, profile.vetPhone);
      }

      const { error } = await supabase.from("clients").update(payload).eq("id", profile.id);
      if (error) throw error;

      if (!mountedRef.current) return;
      setProfileSnapshot(JSON.stringify(profile));
      setOkMsg("Profile saved.");
      setIsEditingImage(false);
    } catch (e: any) {
      console.error(e);
      if (!mountedRef.current) return;
      setErrorMsg(e?.message || "Error saving profile.");
    } finally {
      if (mountedRef.current) setIsSavingProfile(false);
    }
  }, [profile]);

  const addEmptyPet = () => {
    const tempId = `tmp_${Math.random().toString(36).slice(2)}`;
    const newPet: PetRow = {
      id: tempId,
      owner_id: profile.id,
      name: "",
      breed: "",
      age: "",
      gender: "male",
      image: null,
      microchip: "",
      medical_conditions: "",
      allergies: "",
      is_neutered: false,
    };
    setPets((prev) => [...prev, newPet]);
  };

  const removePet = (petId: string) => {
    setPets((prev) => prev.filter((p) => p.id !== petId));
    setPetNameErrors((prev) => {
      const copy = { ...prev };
      delete copy[petId];
      return copy;
    });
  };

  const updatePet = (petId: string, patch: Partial<PetRow>) => {
    setPets((prev) => prev.map((p) => (p.id === petId ? { ...p, ...patch } : p)));
    if (patch.name !== undefined) {
      setPetNameErrors((prev) => ({ ...prev, [petId]: !patch.name?.trim() }));
    }
  };

  const uploadPetImage = async (petId: string, file: File) => {
    const maxBytes = 3 * 1024 * 1024;
    if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");
    if (file.size > maxBytes) throw new Error("Image too large. Max 3MB.");
    if (!profile.id) throw new Error("Missing user id.");

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const filePath = `pets/${profile.id}/${petId}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("images").getPublicUrl(filePath);
    const bustedUrl = `${data.publicUrl}?v=${Date.now()}`;

    updatePet(petId, { image: bustedUrl });
  };

  const handleSavePets = async () => {
    clearMessages();
    if (profile.role !== "client") return;

    setIsSavingPets(true);

    try {
      // 1) Tomar estado más reciente (evitar “estado viejo”)
      const currentPetsRaw = petsRef.current || [];

      // 2) Auto-remover temporales completamente vacías (evita el error fantasma)
      const currentPets = currentPetsRaw.filter((p) => !isEffectivelyEmptyTempPet(p));

      // Si removimos alguno, reflejarlo en UI para que no vuelva a molestar
      if (currentPets.length !== currentPetsRaw.length) {
        setPets(currentPets);
      }

      // 3) Validación estricta: toda mascota que se vaya a guardar debe tener nombre
      const nameErrs: Record<string, boolean> = {};
      currentPets.forEach((p) => {
        nameErrs[p.id] = !p.name?.trim();
      });
      setPetNameErrors(nameErrs);

      const firstMissing = currentPets.find((p) => !p.name?.trim());
      if (firstMissing) {
        const idx = currentPets.findIndex((p) => p.id === firstMissing.id);
        setErrorMsg(`Each pet must have a name. Missing on pet #${idx + 1} (id: ${firstMissing.id}).`);
        setActiveTab("pets");
        return;
      }

      // 4) Detectar eliminadas vs snapshot y borrarlas en DB
      let snapshotPets: PetRow[] = [];
      try {
        snapshotPets = petsSnapshot ? (JSON.parse(petsSnapshot) as PetRow[]) : [];
      } catch {
        snapshotPets = [];
      }

      const prevIds = new Set(snapshotPets.map((p) => p.id).filter(Boolean));
      const currentIds = new Set(currentPets.map((p) => p.id).filter(Boolean));
      const removedIds = Array.from(prevIds).filter((id) => !currentIds.has(id) && !id.startsWith("tmp_"));

      if (removedIds.length > 0) {
        const { error: delErr } = await supabase.from("pets").delete().in("id", removedIds);
        if (delErr) throw delErr;
      }

      // 5) Separa existentes vs nuevos
      const existing = currentPets.filter((p) => !p.id.startsWith("tmp_"));
      const created = currentPets.filter((p) => p.id.startsWith("tmp_"));

      // Upsert existentes (por id)
      if (existing.length > 0) {
        const payload = existing.map((p) => ({
          id: p.id,
          owner_id: profile.id,
          name: p.name?.trim(),
          breed: p.breed?.trim() ? p.breed.trim() : null,
          age: p.age?.trim() ? p.age.trim() : null,
          gender: p.gender,
          image: p.image || null,
          microchip: p.microchip?.trim() ? p.microchip.trim() : null,
          medical_conditions: p.medical_conditions?.trim() ? p.medical_conditions.trim() : null,
          allergies: p.allergies?.trim() ? p.allergies.trim() : null,
          is_neutered: !!p.is_neutered,
        }));

        const { error } = await supabase.from("pets").upsert(payload, { onConflict: "id" });
        if (error) throw error;
      }

      // Insert nuevos (sin id tmp)
      if (created.length > 0) {
        const payload = created.map((p) => ({
          owner_id: profile.id,
          name: p.name?.trim(),
          breed: p.breed?.trim() ? p.breed.trim() : null,
          age: p.age?.trim() ? p.age.trim() : null,
          gender: p.gender,
          image: p.image || null,
          microchip: p.microchip?.trim() ? p.microchip.trim() : null,
          medical_conditions: p.medical_conditions?.trim() ? p.medical_conditions.trim() : null,
          allergies: p.allergies?.trim() ? p.allergies.trim() : null,
          is_neutered: !!p.is_neutered,
        }));

        const { error } = await supabase.from("pets").insert(payload);
        if (error) throw error;
      }

      // Recargar desde DB para obtener ids reales y snapshot correcto
      await loadPets(profile.id);

      setOkMsg("Pets saved.");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || "Error saving pets.");
    } finally {
      setIsSavingPets(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="animate-spin text-teal-500" />
      </div>
    );
  }

  const isClient = profile.role === "client";
  const headerName = (profile.name || "Cliente").split(" ")[0];

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8 font-sans text-slate-900">
      {(errorMsg || okMsg) && (
        <div
          className={cn(
            "max-w-7xl mx-auto mb-6 rounded-2xl border p-4 text-sm",
            errorMsg ? "border-red-100 bg-red-50" : "border-emerald-100 bg-emerald-50"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {errorMsg ? (
                <AlertTriangle className="text-red-600" size={18} />
              ) : (
                <CheckCircle className="text-emerald-600" size={18} />
              )}
              <p className={cn("font-semibold", errorMsg ? "text-red-700" : "text-emerald-700")}>{errorMsg || okMsg}</p>
            </div>
            <button
              onClick={clearMessages}
              className={cn("hover:opacity-80", errorMsg ? "text-red-700" : "text-emerald-700")}
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto mb-8 bg-white p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border-4 border-white shadow-lg relative group">
            {profile.image ? (
              <img src={profile.image} className="w-full h-full object-cover" alt="Profile avatar" />
            ) : (
              <User className="text-slate-300" aria-hidden="true" />
            )}

            <button
              onClick={() => {
                setIsEditingImage(true);
                setActiveTab("profile");
              }}
              className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              aria-label="Edit profile image"
            >
              <Camera className="text-white" size={20} />
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-black uppercase">
              Hola, <span className="text-teal-500">{headerName}</span>
            </h1>
            <span className="text-[10px] font-bold uppercase bg-slate-100 px-3 py-1 rounded-full text-slate-500 flex items-center gap-1 w-fit">
              <ShieldCheck size={12} /> {isClient ? "Cliente" : "Distribuidor"}
            </span>
            <p className="text-xs text-slate-400 mt-1">{profile.email}</p>
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

            <button
              onClick={() => setActiveTab("profile")}
              className={cn(
                "w-full p-4 rounded-xl flex gap-3 items-center text-xs font-bold uppercase",
                activeTab === "profile" ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-600"
              )}
            >
              <User size={18} /> Mi Perfil
            </button>

            {isClient && (
              <button
                onClick={() => setActiveTab("pets")}
                className={cn(
                  "w-full p-4 rounded-xl flex gap-3 items-center text-xs font-bold uppercase",
                  activeTab === "pets" ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-600"
                )}
              >
                <Dog size={18} /> Mascotas
              </button>
            )}

            <Link to="/messages" className="w-full p-4 rounded-xl flex gap-3 items-center text-xs font-bold uppercase hover:bg-slate-50 text-slate-600">
              <MessageSquare size={18} /> Mensajes
            </Link>
          </div>

          {(isProfileDirty || isPetsDirty) && (
            <div className="bg-white p-4 rounded-[2rem] shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Cambios sin guardar</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (profileSnapshot) setProfile(JSON.parse(profileSnapshot));
                    if (petsSnapshot) setPets(JSON.parse(petsSnapshot));
                    setPetNameErrors({});
                    clearMessages();
                    setOkMsg("Changes discarded.");
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs font-black uppercase hover:bg-slate-50"
                >
                  Descartar
                </button>

                <button
                  onClick={async () => {
                    if (activeTab === "pets") {
                      await handleSavePets();
                    } else {
                      await handleSaveProfile();
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase hover:bg-teal-600 flex items-center justify-center gap-2"
                >
                  <Save size={14} /> Guardar
                </button>
              </div>
            </div>
          )}
        </div>

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
                      <p className="text-xs text-slate-400 mt-2">Cuando hagas tu primer pedido, aparecerá aquí.</p>
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
                  {orders.length === 0 ? (
                    <div className="text-center py-10 opacity-80">
                      <Package size={40} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-bold uppercase">Aún no hay pedidos</p>
                    </div>
                  ) : (
                    orders.map((order) => (
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
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === "profile" && (
              <>
                <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                  <User className="text-teal-500" /> Mi Perfil
                </h2>

                {(isEditingImage || uploadingImage) && (
                  <div className="mb-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <Camera size={14} /> Foto / Logo
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
                        {profile.image ? (
                          <img src={profile.image} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          <User className="text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input type="file" accept="image/*" onChange={handleProfileImageChange} disabled={uploadingImage} />
                        <p className="text-xs text-slate-500 mt-2">Max 3MB. Formato JPG/PNG recomendado.</p>
                      </div>
                      <button onClick={() => setIsEditingImage(false)} className="p-2 rounded-full hover:bg-white" aria-label="close">
                        <X />
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Nombre">
                    <input
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                    />
                  </Field>

                  <Field label="Email (no editable)">
                    <input
                      value={profile.email}
                      disabled
                      className="w-full p-4 bg-slate-100 rounded-xl font-bold text-sm outline-none opacity-70 cursor-not-allowed"
                    />
                  </Field>

                  <Field label="Teléfono">
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={profile.phone}
                        onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full pl-11 p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                      />
                    </div>
                  </Field>

                  <Field label="Ciudad">
                    <input
                      value={profile.city}
                      onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                      className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                    />
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Dirección (línea 1)">
                      <div className="relative">
                        <MapPin size={16} className="absolute left-4 top-5 text-slate-400" />
                        <textarea
                          value={profile.addressLine1}
                          onChange={(e) => setProfile((p) => ({ ...p, addressLine1: e.target.value }))}
                          className="w-full pl-11 p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all resize-none h-20"
                        />
                      </div>
                    </Field>
                  </div>

                  <div className="md:col-span-2">
                    <Field label="Dirección (línea 2) (opcional)">
                      <input
                        value={profile.addressLine2}
                        onChange={(e) => setProfile((p) => ({ ...p, addressLine2: e.target.value }))}
                        className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                      />
                    </Field>
                  </div>

                  <Field label="Postcode">
                    <input
                      value={profile.postcode}
                      onChange={(e) => setProfile((p) => ({ ...p, postcode: e.target.value }))}
                      className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                    />
                  </Field>

                  {profile.role === "distributor" && (
                    <>
                      <div className="md:col-span-2 mt-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <Building2 size={14} /> Datos del negocio
                        </p>
                      </div>

                      <Field label="Business name">
                        <input
                          value={profile.businessName}
                          onChange={(e) => setProfile((p) => ({ ...p, businessName: e.target.value }))}
                          className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                        />
                      </Field>

                      <Field label="Business type">
                        <select
                          value={profile.businessType}
                          onChange={(e) => setProfile((p) => ({ ...p, businessType: e.target.value }))}
                          className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                        >
                          {DEFAULT_BUSINESS_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="VAT / NIT">
                        <input
                          value={profile.vatNumber}
                          onChange={(e) => setProfile((p) => ({ ...p, vatNumber: e.target.value }))}
                          className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                        />
                      </Field>
                    </>
                  )}

                  {profile.role === "client" && (
                    <>
                      <div className="md:col-span-2 mt-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <ShieldCheck size={14} /> Contacto de emergencia
                        </p>
                      </div>

                      <Field label="Emergency contact name">
                        <input
                          value={profile.emergencyContactName}
                          onChange={(e) => setProfile((p) => ({ ...p, emergencyContactName: e.target.value }))}
                          className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                        />
                      </Field>

                      <Field label="Emergency contact phone">
                        <input
                          value={profile.emergencyContactPhone}
                          onChange={(e) => setProfile((p) => ({ ...p, emergencyContactPhone: e.target.value }))}
                          className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                        />
                      </Field>

                      <div className="md:col-span-2 mt-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <Stethoscope size={14} /> Veterinario
                        </p>
                      </div>

                      <Field label="Vet / Clinic name">
                        <input
                          value={profile.vetName}
                          onChange={(e) => setProfile((p) => ({ ...p, vetName: e.target.value }))}
                          className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                        />
                      </Field>

                      <Field label="Vet phone">
                        <input
                          value={profile.vetPhone}
                          onChange={(e) => setProfile((p) => ({ ...p, vetPhone: e.target.value }))}
                          className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                        />
                      </Field>
                    </>
                  )}
                </div>

                <div className="mt-8 flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">{isProfileDirty ? "Tienes cambios sin guardar." : "Perfil sincronizado."}</div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={!isProfileDirty || isSavingProfile || uploadingImage}
                    className="bg-slate-900 text-white px-6 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-teal-600 transition-all disabled:opacity-50 disabled:hover:bg-slate-900 flex items-center gap-2"
                  >
                    {isSavingProfile ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Guardar perfil
                  </button>
                </div>
              </>
            )}

            {activeTab === "pets" && isClient && (
              <>
                <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                  <Dog className="text-teal-500" /> Mascotas
                </h2>

                {petsLoading ? (
                  <div className="py-10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-teal-500" />
                  </div>
                ) : (
                  <>
                    {pets.length === 0 && (
                      <div className="text-center py-10 opacity-80 border border-dashed border-slate-200 rounded-[2rem]">
                        <Dog size={44} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-bold uppercase">No hay mascotas registradas</p>
                        <p className="text-xs text-slate-400 mt-2">Agrega una mascota para completar su expediente.</p>
                      </div>
                    )}

                    <div className="space-y-6">
                      {pets.map((pet, idx) => {
                        const hasNameError = !!petNameErrors[pet.id];
                        return (
                          <div
                            key={pet.id}
                            className={cn(
                              "p-6 rounded-[2rem] border bg-slate-50",
                              hasNameError ? "border-red-300" : "border-slate-100"
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center relative">
                                  {pet.image ? <img src={pet.image} className="w-full h-full object-cover" alt={pet.name || `Pet ${idx + 1}`} /> : <Dog className="text-slate-300" />}
                                  <label className="absolute inset-0 opacity-0 hover:opacity-100 bg-black/30 flex items-center justify-center cursor-pointer transition-opacity">
                                    <Camera className="text-white" size={18} />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (e) => {
                                        try {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          await uploadPetImage(pet.id, file);
                                          setOkMsg("Pet image updated.");
                                        } catch (err: any) {
                                          setErrorMsg(err?.message || "Error uploading pet image.");
                                        }
                                      }}
                                    />
                                  </label>
                                </div>

                                <div>
                                  <p className="text-xs font-black uppercase text-slate-400">Mascota #{idx + 1}</p>
                                  <input
                                    value={pet.name || ""}
                                    onChange={(e) => updatePet(pet.id, { name: e.target.value })}
                                    className={cn(
                                      "text-lg font-black bg-transparent outline-none w-[220px] max-w-[60vw]",
                                      hasNameError ? "text-red-600" : ""
                                    )}
                                    placeholder="Nombre"
                                  />
                                  {hasNameError && <p className="text-[11px] font-bold text-red-600 mt-1">El nombre es obligatorio.</p>}
                                </div>
                              </div>

                              <button onClick={() => removePet(pet.id)} className="p-2 rounded-full hover:bg-white text-red-500" aria-label="Remove pet">
                                <Trash2 size={18} />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <Field label="Raza">
                                <input
                                  value={pet.breed || ""}
                                  onChange={(e) => updatePet(pet.id, { breed: e.target.value })}
                                  className="w-full p-4 bg-white rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                                />
                              </Field>

                              <Field label="Edad">
                                <input
                                  value={pet.age || ""}
                                  onChange={(e) => updatePet(pet.id, { age: e.target.value })}
                                  className="w-full p-4 bg-white rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                                />
                              </Field>

                              <Field label="Género">
                                <select
                                  value={pet.gender || "male"}
                                  onChange={(e) => updatePet(pet.id, { gender: e.target.value })}
                                  className="w-full p-4 bg-white rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                                >
                                  <option value="male">Macho</option>
                                  <option value="female">Hembra</option>
                                </select>
                              </Field>

                              <Field label="Esterilizado">
                                <button
                                  type="button"
                                  onClick={() => updatePet(pet.id, { is_neutered: !pet.is_neutered })}
                                  className={cn(
                                    "w-full p-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all",
                                    pet.is_neutered ? "bg-teal-600 text-white" : "bg-white text-slate-500 border border-slate-200"
                                  )}
                                >
                                  {pet.is_neutered ? "Sí" : "No"}
                                </button>
                              </Field>

                              <div className="md:col-span-2">
                                <Field label="Condiciones médicas (opcional)">
                                  <input
                                    value={pet.medical_conditions || ""}
                                    onChange={(e) => updatePet(pet.id, { medical_conditions: e.target.value })}
                                    className="w-full p-4 bg-white rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                                  />
                                </Field>
                              </div>

                              <div className="md:col-span-2">
                                <Field label="Alergias (opcional)">
                                  <input
                                    value={pet.allergies || ""}
                                    onChange={(e) => updatePet(pet.id, { allergies: e.target.value })}
                                    className="w-full p-4 bg-white rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                                  />
                                </Field>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row gap-3">
                      <button
                        type="button"
                        onClick={addEmptyPet}
                        className="w-full md:w-auto px-6 py-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-black uppercase text-xs tracking-widest hover:border-teal-500 hover:text-teal-600 flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Agregar mascota
                      </button>

                      <button
                        onClick={handleSavePets}
                        disabled={!isPetsDirty || isSavingPets}
                        className="w-full md:flex-1 bg-slate-900 text-white px-6 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-teal-600 transition-all disabled:opacity-50 disabled:hover:bg-slate-900 flex items-center justify-center gap-2"
                      >
                        {isSavingPets ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Guardar mascotas
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

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
