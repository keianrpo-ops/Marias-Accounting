
import React, { useState, useEffect } from 'react';
import { Plus, Search, Receipt, Trash2, ShoppingCart, Sparkles, Home, Filter, X, Edit2, AlertTriangle, CheckCircle } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../constants';

interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  isLoss: boolean;
}

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({ 
    description: '', 
    amount: '', 
    category: EXPENSE_CATEGORIES[0], 
    isLoss: false 
  });

  useEffect(() => {
    const saved = localStorage.getItem('mdc_expenses');
    if (saved) {
      setExpenses(JSON.parse(saved));
    }
    setIsLoading(false);
  }, []);

  const saveToStorage = (updated: ExpenseItem[]) => {
    setExpenses(updated);
    localStorage.setItem('mdc_expenses', JSON.stringify(updated));
  };

  const openModal = (expense?: ExpenseItem) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category,
        isLoss: expense.isLoss
      });
    } else {
      setEditingExpense(null);
      setFormData({ description: '', amount: '', category: EXPENSE_CATEGORIES[0], isLoss: false });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;
    
    const amountNum = parseFloat(formData.amount) || 0;

    if (editingExpense) {
      const updated = expenses.map(ex => ex.id === editingExpense.id ? { 
        ...ex, 
        description: formData.description,
        amount: amountNum,
        category: formData.category,
        isLoss: formData.isLoss
      } : ex);
      saveToStorage(updated);
    } else {
      const item: ExpenseItem = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        category: formData.category,
        description: formData.description,
        amount: amountNum,
        isLoss: formData.isLoss
      };
      saveToStorage([item, ...expenses]);
    }
    
    setIsModalOpen(false);
  };

  const removeExpense = (id: string) => {
    if(confirm('¿Eliminar registro de gasto? Esta acción es permanente.')) {
      const updated = expenses.filter(e => e.id !== id);
      saveToStorage(updated);
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.isLoss ? 0 : e.amount), 0);
  const foodPrepTotal = expenses.filter(e => e.category.includes('Ingredientes')).reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Control de <span className="text-[#FF6B9D]">Gastos</span></h2>
          <p className="text-slate-500 font-medium italic text-sm">Monitorización de costos y logística Maria's Dog Corner UK.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-[#FF6B9D] shadow-xl transition-all"
        >
          <Plus size={16} /> Registrar Gasto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Egresos Operativos" value={`£${totalExpenses.toFixed(2)}`} icon={Receipt} color="teal" />
        <StatCard title="Inversión Recetas" value={`£${foodPrepTotal.toFixed(2)}`} icon={ShoppingCart} color="indigo" />
        <StatCard title="Logística & Envío" value={`£${expenses.filter(e => e.category.includes('Logística')).reduce((s,e) => s+e.amount, 0).toFixed(2)}`} icon={Sparkles} color="emerald" />
        <StatCard title="Pérdidas Netas" value={`£${expenses.filter(e => e.isLoss).reduce((s,e) => s+e.amount, 0).toFixed(2)}`} icon={AlertTriangle} color="amber" />
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/20">
           <div className="flex items-center gap-3">
              <Filter className="text-slate-400" size={18}/>
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs">Registro Maestro de Egresos</h3>
           </div>
           <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text" 
                placeholder="Filtrar movimientos..." 
                className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider outline-none focus:ring-4 focus:ring-pink-50" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[9px] border-b border-slate-100">
                <th className="px-8 py-5">Fecha / Cat</th>
                <th className="px-8 py-5">Descripción</th>
                <th className="px-8 py-5 text-right">Importe</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr><td colSpan={4} className="py-24 text-center opacity-20"><Home size={60} className="mx-auto"/><p className="mt-4 font-black uppercase tracking-widest text-xs">Sin registros que mostrar</p></td></tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className={`group hover:bg-slate-50/50 transition-colors ${expense.isLoss ? 'bg-amber-50/10' : ''}`}>
                    <td className="px-8 py-6">
                      <p className="text-slate-400 font-black text-[9px] uppercase">{expense.date}</p>
                      <span className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest bg-slate-900 text-white inline-block mt-1">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-bold text-slate-800 text-xs uppercase tracking-tight">{expense.description}</td>
                    <td className={`px-8 py-6 text-right font-black text-sm ${expense.isLoss ? 'text-rose-600' : 'text-slate-900'}`}>
                      £{expense.amount.toFixed(2)}
                      {expense.isLoss && <p className="text-[7px] font-black uppercase text-amber-600">Pérdida empresarial</p>}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(expense)} className="p-2.5 text-slate-400 hover:text-[#20B2AA] transition-all bg-white border border-slate-100 rounded-xl shadow-sm hover:border-[#20B2AA]">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => removeExpense(expense.id)} className="p-2.5 text-slate-400 hover:text-rose-500 transition-all bg-white border border-slate-100 rounded-xl shadow-sm hover:border-rose-200">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-8">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{editingExpense ? 'Editar' : 'Registrar'} <span className="text-[#FF6B9D]">Gasto</span></h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">HMRC Sole Trader Compliance</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"><X size={20}/></button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Concepto Detallado</label>
                 <input 
                   required
                   type="text" 
                   className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-pink-50" 
                   value={formData.description}
                   onChange={e => setFormData({...formData, description: e.target.value})}
                   placeholder="Ej: Suministros Packaging Bristol"
                 />
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Monto Neto (£)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black focus:ring-4 focus:ring-pink-50 outline-none" 
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Clasificación</label>
                    <select 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
               </div>

               <div className="flex items-center gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-100">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, isLoss: !formData.isLoss})}
                    className={`w-12 h-6 rounded-full transition-all relative ${formData.isLoss ? 'bg-amber-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${formData.isLoss ? 'left-6.5' : 'left-0.5'}`} />
                  </button>
                  <label className="text-[9px] font-black uppercase text-amber-800 tracking-wider">Reportar como pérdida oficial</label>
               </div>

               <button className="w-full bg-slate-900 text-white py-5 rounded-full font-black uppercase tracking-[0.3em] text-[10px] shadow-xl hover:bg-[#FF6B9D] transition-all flex items-center justify-center gap-3">
                 {editingExpense ? <CheckCircle size={16}/> : <Plus size={16}/>}
                 {editingExpense ? 'Actualizar Registro' : 'Confirmar Gasto'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: any, color: string }> = ({ title, value, icon: Icon, color }) => {
  const colorMap: any = { teal: 'bg-[#20B2AA]', indigo: 'bg-indigo-600', emerald: 'bg-emerald-500', amber: 'bg-[#f59e0b]' };
  return (
    <div className="refined-card p-6 border border-slate-200 flex items-center gap-4 hover:-translate-y-1 transition-all">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${colorMap[color]}`}><Icon size={20} /></div>
      <div>
        <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest leading-none mb-1">{title}</p>
        <h4 className="text-lg font-black text-slate-900 tracking-tighter leading-none">{value}</h4>
      </div>
    </div>
  );
};

export default Expenses;
