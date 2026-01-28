
import React, { useState } from 'react';
import { CreditCard, Lock, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StripePaymentProps {
  amount: number;
  clientName: string;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

const StripePayment: React.FC<StripePaymentProps> = ({ amount, clientName, onSuccess, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    // Simulated Stripe Processing
    setTimeout(() => {
      if (Math.random() > 0.05) { // 95% success rate for simulation
        const mockPaymentId = `pi_${Math.random().toString(36).substring(2, 15)}`;
        onSuccess(mockPaymentId);
      } else {
        setError("Your card was declined. Please try another payment method.");
        setIsProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 max-w-lg w-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Checkout <span className="text-[#20B2AA]">Secure</span></h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
            <Lock size={12} /> Powered by Stripe UK
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total a pagar</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">£{amount.toFixed(2)}</p>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[11px] font-bold flex items-center gap-3 animate-shake">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nombre en la tarjeta</label>
          <input 
            type="text" 
            required 
            defaultValue={clientName}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-50 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Detalles de Tarjeta</label>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
            <CreditCard size={20} className="text-slate-400" />
            <input 
              type="text" 
              required 
              placeholder="4242 4242 4242 4242" 
              className="bg-transparent border-none text-sm font-bold focus:ring-0 w-full outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
             <input type="text" placeholder="MM / YY" className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-50 outline-none" />
             <input type="text" placeholder="CVC" className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-50 outline-none" />
          </div>
        </div>

        <div className="pt-6 flex flex-col gap-3">
          <button 
            type="submit"
            disabled={isProcessing}
            className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all shadow-xl ${
              isProcessing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-[#20B2AA] hover:-translate-y-1'
            }`}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>Pagar £{amount.toFixed(2)}</>
            )}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full py-4 text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[9px] transition-colors"
          >
            Cancelar Pago
          </button>
        </div>
      </form>

      <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-center gap-6 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all">
         <ShieldCheck size={16} />
         <p className="text-[9px] font-black uppercase tracking-widest">Pago Encriptado AES-256</p>
      </div>
    </div>
  );
};

export default StripePayment;
