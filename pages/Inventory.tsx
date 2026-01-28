
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Package, AlertTriangle, Trash2, Edit, X, 
  ShoppingBag, Zap, Filter, Sparkles, ChevronRight, Info, 
  Calendar, AlertCircle, Clock, Landmark, Banknote, ShieldCheck, History
} from 'lucide-react';
import { InventoryItem } from '../types';
import { PRODUCTS, THEME } from '../constants';
import { useLanguage } from '../context/LanguageContext';

const Inventory: React.FC = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    quantity: 0,
    unit: 'Pack 100g',
    unitCost: 0,
    reorderLevel: 10,
    category: 'Snack',
    batchNumber: `L-${Math.floor(1000 + Math.random() * 9000)}`,
    productionDate: new Date().toISOString().split('T')[0],
    expiryDate: '' // Empezamos vacío para obligar a poner la real
  });

  useEffect(() => {
    const saved = localStorage.getItem('mdc_inventory');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  const saveToStorage = (updated: InventoryItem[]) => {
    setItems(updated);
    localStorage.setItem('mdc_inventory', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const inventorySummary = useMemo(() => {
    const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0);
    const lowStockCount = items.filter(i => i.quantity <= i.reorderLevel).length;
    return { totalValue, lowStockCount };
  }, [items]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expiryDate) {
      alert("Por favor, introduce la fecha de caducidad real del lote.");
      return;
    }
    if (editingItem) {
      const updated = items.map(i => i.id === editingItem.id ? { ...i, ...formData } as InventoryItem : i);
      saveToStorage(updated);
    } else {
      const newItem: InventoryItem = {
        ...formData as InventoryItem,
        id: Math.random().toString(36).substr(2, 9),
      };
      saveToStorage([newItem, ...items]);
    }
    closeModal();
  };

  const deleteItem = (id: string) => {
    if(confirm('¿Eliminar del inventario? Esta acción es irreversible.')) {
      saveToStorage(items.filter(i => i.id !== id));
    }
  };

  const openModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({ 
        name: '', 
        quantity: 0, 
        unit: 'Pack 100g', 
        unitCost: 0, 
        reorderLevel: 10, 
        category: 'Snack',
        batchNumber: `L-${Math.floor(1000 + Math.random() * 9000)}`,
        productionDate: new Date().toISOString().split('T')[0],
        expiryDate: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const selectPredefined = (prod: typeof PRODUCTS[0]) => {
    setFormData({
      ...formData,
      name: prod.name,
      category: 'Snack',
      unitCost: prod.basePrice * 0.40, 
      unit: 'Pack 100g',
      reorderLevel: 15,
      batchNumber: `L-${Math.floor(1000 + Math.random() * 9000)}`,
      productionDate: new Date().toISOString().split('T')[0],
      expiryDate: '' // Forzamos a que María elija la fecha
    });
    if (!isModalOpen) setIsModalOpen(true);
  };

  const getExpiryStatus = (dateStr?: string) => {
    if (!dateStr) return { label: 'PENDIENTE', color: 'text-slate-400 bg-slate-50', icon: Info };
    const date = new Date(dateStr);
    const today = new Date();
    const diff = date.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { label: 'CADUCADO', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: AlertCircle };
    if (days <= 30) return { label: `CADUCA EN ${days} DÍAS`, color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock };
    return { label: `OK (${days} DÍAS)`, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: Zap };
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">MASTER <span className="text-[#20B2AA]">STOCK</span></h2>
          <p className="text-slate-500 font-bold italic text-xs mt-2">Control de Trazabilidad y Seguridad Alimentaria UK.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-8">
              <div className="text-right">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Neto Inventario</p>
                 <p className="text-xl font-black text-slate-900 leading-none">£{inventorySummary.totalValue.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => openModal()}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-[#20B2AA] shadow-xl transition-all"
              >
                <Plus size={18} /> Nuevo Lote Manual
              </button>
           </div>
        </div>
      </header>

      <div className="space-y-6">
         <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2 flex items-center gap-3">
           <Sparkles size={16} className="text-amber-400" /> Carga Rápida desde Catálogo Maestro
         </h3>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {PRODUCTS.map(prod => (
              <button 
                key={prod.id} 
                onClick={() => selectPredefined(prod)}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-[#20B2AA] hover:shadow-xl transition-all group flex flex-col items-center text-center space-y-3"
              >
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {prod.icon}
                 </div>
                 <p className="text-[10px] font-black uppercase text-slate-900 leading-tight truncate w-full">{prod.name}</p>
                 <span className="text-[8px] font-black text-[#20B2AA] uppercase tracking-widest">Añadir Stock</span>
              </button>
            ))}
         </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden mt-10">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/20">
           <div className="flex items-center gap-3">
              <Package className="text-[#20B2AA]" size={20} />
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">Inventario Actual en Almacén</h3>
           </div>
           <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text" 
                placeholder="Buscar lote..." 
                className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider outline-none focus:ring-4 focus:ring-teal-50" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-widest text-[8px] border-b border-slate-100">
                <th className="px-8 py-5">Producto / Lote</th>
                <th className="px-8 py-5 text-center">Nivel Stock</th>
                <th className="px-8 py-5 text-center">Caducidad Real</th>
                <th className="px-8 py-5 text-right">Valor (£)</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs">Sin stock registrado</td></tr>
              ) : (
                filteredItems.map((item) => {
                  const status = getExpiryStatus(item.expiryDate);
                  const isLow = item.quantity <= item.reorderLevel;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors group ${isLow ? 'bg-rose-50/30' : ''}`}>
                      <td className="px-8 py-6">
                        <div>
                          <p className="font-black text-slate-900 text-xs tracking-tight uppercase">{item.name}</p>
                          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Batch: {item.batchNumber}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-4 py-2 rounded-xl font-black text-xs ${isLow ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-50 text-slate-900 border border-slate-100'}`}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] font-black text-slate-900">{item.expiryDate}</span>
                            <div className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border inline-flex items-center gap-1 shadow-sm ${status.color}`}>
                              {status.label}
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-slate-900 text-sm">
                        £{(item.quantity * item.unitCost).toFixed(2)}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(item)} className="p-2.5 text-slate-400 hover:text-[#20B2AA] bg-white border border-slate-100 rounded-xl transition-all"><Edit size={16} /></button>
                          <button onClick={() => deleteItem(item.id)} className="p-2.5 text-slate-400 hover:text-rose-500 bg-white border border-slate-100 rounded-xl transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 animate-in zoom-in-95 duration-200 border border-white">
            <div className="flex justify-between items-start mb-10">
               <div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{editingItem ? 'EDITAR' : 'NUEVO'} <span className="text-[#20B2AA]">LOTE</span></h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#20B2AA]"/> UK Food Safety Compliance
                  </p>
               </div>
               <button onClick={closeModal} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"><X size={20}/></button>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
               <div className="space-y-3">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Descripción del Producto</label>
                 <input 
                   required 
                   type="text" 
                   className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold uppercase outline-none focus:ring-4 focus:ring-teal-50 focus:bg-white transition-all shadow-inner" 
                   value={formData.name} 
                   onChange={e => setFormData({...formData, name: e.target.value})} 
                 />
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2"><History size={12}/> Elaboración</label>
                    <input required type="date" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-teal-50 outline-none shadow-inner" value={formData.productionDate} onChange={e => setFormData({...formData, productionDate: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-[#FF6B9D] uppercase tracking-[0.2em] px-2 flex items-center gap-2"><AlertCircle size={12}/> Caducidad REAL</label>
                    <input required type="date" className="w-full px-8 py-5 bg-[#FFF0F5] border border-pink-100 rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-pink-200 outline-none shadow-inner" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Cantidad (Units)</label>
                    <input required type="number" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-2xl font-black focus:ring-4 focus:ring-teal-50 outline-none text-center shadow-inner" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Costo Unit (£)</label>
                    <input required step="0.01" type="number" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-lg font-black focus:ring-4 focus:ring-teal-50 outline-none shadow-inner" value={formData.unitCost} onChange={e => setFormData({...formData, unitCost: parseFloat(e.target.value) || 0})} />
                  </div>
               </div>

               <button className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-3xl hover:bg-[#20B2AA] transition-all flex items-center justify-center gap-4 group mt-6">
                 <Package size={22}/> GUARDAR REGISTRO LOTE
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
