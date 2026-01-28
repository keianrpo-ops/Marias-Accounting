
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Package, AlertTriangle, Trash2, Edit, X, 
  ShoppingBag, Zap, Filter, Sparkles, ChevronRight, Info, 
  Calendar, AlertCircle, Clock, Landmark, Banknote
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
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    const saved = localStorage.getItem('mdc_inventory');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  const saveToStorage = (updated: InventoryItem[]) => {
    setItems(updated);
    localStorage.setItem('mdc_inventory', JSON.stringify(updated));
  };

  const inventorySummary = useMemo(() => {
    const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0);
    const lowStockCount = items.filter(i => i.quantity <= i.reorderLevel).length;
    return { totalValue, lowStockCount };
  }, [items]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
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
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
      reorderLevel: 15
    });
  };

  const getExpiryStatus = (dateStr?: string) => {
    if (!dateStr) return { label: 'N/A', color: 'text-slate-400 bg-slate-50', icon: Info };
    const date = new Date(dateStr);
    const today = new Date();
    const diff = date.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { label: t('expired'), color: 'text-rose-600 bg-rose-50 border-rose-100', icon: AlertCircle };
    if (days <= 30) return { label: `${t('expires_in')} ${days} ${t('days')}`, color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock };
    return { label: `OK (${days} ${t('days')})`, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: Zap };
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">{t('stock_management').split(' ')[0]} <span className="text-[#20B2AA]">{t('stock_management').split(' ')[1]}</span></h2>
          <p className="text-slate-500 font-medium italic text-sm">{t('traceability_desc')}</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="w-full md:w-auto bg-slate-900 text-white px-8 py-3.5 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-[#20B2AA] shadow-xl transition-all"
        >
          <Plus size={18} /> {t('new_batch')}
        </button>
      </div>

      {/* Panel de Valorización UK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex items-center justify-between shadow-2xl relative overflow-hidden group">
           <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:rotate-12 transition-transform"><Banknote size={140}/></div>
           <div className="relative z-10">
              <p className="text-[#C6FF00] text-[10px] font-black uppercase tracking-[0.3em] mb-2">{t('total_value')}</p>
              <h4 className="text-4xl font-black tracking-tighter">£{inventorySummary.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
           </div>
           <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md">
              <Landmark size={30} className="text-[#C6FF00]" />
           </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 flex items-center justify-between shadow-lg">
           <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{t('critical_stock')}</p>
              <h4 className={`text-4xl font-black tracking-tighter ${inventorySummary.lowStockCount > 0 ? 'text-rose-500' : 'text-slate-900'}`}>{inventorySummary.lowStockCount} Lotes</h4>
           </div>
           <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${inventorySummary.lowStockCount > 0 ? 'bg-rose-50 text-rose-500 animate-pulse' : 'bg-slate-50 text-slate-300'}`}>
              <AlertTriangle size={30} />
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/20">
           <div className="flex items-center gap-3">
              <Package className="text-[#20B2AA]" size={20} />
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">{t('inventory_general')}</h3>
           </div>
           <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text" 
                placeholder={t('search_placeholder')} 
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
                <th className="px-8 py-5">{t('product_batch')}</th>
                <th className="px-8 py-5 text-center">{t('stock_level')}</th>
                <th className="px-8 py-5 text-center">Trazabilidad / Caducidad</th>
                <th className="px-8 py-5 text-right">Valor Neto (£)</th>
                <th className="px-8 py-5 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center opacity-30"><Package size={50} className="mx-auto"/><p className="mt-4 font-black uppercase tracking-widest text-[10px]">Almacén vacío</p></td></tr>
              ) : (
                filteredItems.map((item) => {
                  const status = getExpiryStatus(item.expiryDate);
                  const isLow = item.quantity <= item.reorderLevel;
                  const StatusIcon = status.icon;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors group ${isLow ? 'bg-rose-50/30' : ''}`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] uppercase shadow-sm border ${isLow ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-slate-100 text-slate-400 border-white'}`}>
                            {item.name.substring(0,2)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-xs tracking-tight uppercase">{item.name}</p>
                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Batch: {item.batchNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-4 py-2 rounded-xl font-black text-xs ${isLow ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-50 text-slate-900 border border-slate-100'}`}>
                          {item.quantity} <span className="text-[8px] opacity-70 ml-0.5 uppercase">{item.unit}</span>
                        </span>
                        {isLow && <p className="text-[7px] font-black uppercase text-rose-500 mt-2 animate-pulse tracking-tighter">REABASTECER (Meta: {item.reorderLevel})</p>}
                      </td>
                      <td className="px-8 py-6 text-center">
                         <div className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border inline-flex items-center gap-2 shadow-sm ${status.color}`}>
                           <StatusIcon size={12} />
                           {status.label}
                         </div>
                         <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">Producción: {item.productionDate}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-sm font-black text-slate-900 tracking-tight">£{(item.quantity * item.unitCost).toFixed(2)}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">£{item.unitCost.toFixed(2)}/u</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(item)} className="p-2.5 text-slate-400 hover:text-[#20B2AA] bg-white border border-slate-100 rounded-xl shadow-sm transition-all hover:border-[#20B2AA]">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => deleteItem(item.id)} className="p-2.5 text-slate-400 hover:text-rose-500 bg-white border border-slate-100 rounded-xl shadow-sm transition-all hover:border-rose-200">
                            <Trash2 size={16} />
                          </button>
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
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] p-12 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-10">
               <div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{editingItem ? 'EDITAR' : 'NUEVO'} <span className="text-[#20B2AA]">LOTE</span></h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 italic">{t('food_safety')}</p>
               </div>
               <button onClick={closeModal} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"><X size={20}/></button>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
               <div className="space-y-3">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">{t('description').toUpperCase()}</label>
                 <input 
                   required 
                   type="text" 
                   className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold uppercase outline-none focus:ring-4 focus:ring-teal-50 focus:bg-white transition-all shadow-inner" 
                   value={formData.name} 
                   onChange={e => setFormData({...formData, name: e.target.value})} 
                   placeholder="PREMIUM SALMON BITES"
                 />
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Nº LOTE / BATCH</label>
                    <input required type="text" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-teal-50 outline-none shadow-inner" value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">{t('expiry_date').toUpperCase()}</label>
                    <input required type="date" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-teal-50 outline-none shadow-inner" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">CANTIDAD (PACKS)</label>
                    <input required type="number" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-2xl font-black focus:ring-4 focus:ring-teal-50 outline-none text-center shadow-inner" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">{t('alert_level').toUpperCase()}</label>
                    <input required type="number" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-2xl font-black focus:ring-4 focus:ring-teal-50 outline-none text-center shadow-inner" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: parseInt(e.target.value) || 0})} />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8 pt-2">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">COSTO UNITARIO (£)</label>
                    <input required step="0.01" type="number" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-lg font-black focus:ring-4 focus:ring-teal-50 outline-none shadow-inner" value={formData.unitCost} onChange={e => setFormData({...formData, unitCost: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">FECHA PRODUCCIÓN</label>
                    <input required type="date" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-teal-50 outline-none shadow-inner" value={formData.productionDate} onChange={e => setFormData({...formData, productionDate: e.target.value})} />
                  </div>
               </div>

               <button className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-3xl hover:bg-[#20B2AA] hover:-translate-y-1 transition-all flex items-center justify-center gap-4 group mt-6">
                 <Package size={22} className="group-hover:rotate-12 transition-transform" /> {t('sync_stock').toUpperCase()}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
