
import React, { useState } from 'react';
// Importamos directamente desde CDN para evitar errores de resolución local en Vite
import { loadStripe } from 'https://esm.sh/@stripe/stripe-js@5.6.0';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from 'https://esm.sh/@stripe/react-stripe-js@3.1.1?external=react,react-dom';
import { Lock, ShieldCheck, AlertCircle } from 'lucide-react';

// REMPLAZA ESTA KEY con tu "Publishable key" de Stripe Dashboard
const stripePromise = loadStripe('pk_test_51PqXXXXXYourRealKeyHereXXXXX');

interface StripePaymentProps {
  amount: number;
  clientName: string;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

const CheckoutForm: React.FC<StripePaymentProps> = ({ amount, clientName, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: { name: clientName },
    });

    if (stripeError) {
      setError(stripeError.message || "Error al procesar la tarjeta.");
      setIsProcessing(false);
    } else {
      setTimeout(() => {
        onSuccess(paymentMethod.id);
        setIsProcessing(false);
      }, 2000);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] p-10 md:p-14 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-300 border border-slate-100 max-w-lg w-full">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Checkout <span className="text-[#20B2AA]">Secure</span></h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
            <Lock size={12} /> Encrypted Payment Infrastructure
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount Due</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">£{amount.toFixed(2)}</p>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[11px] font-bold flex items-center gap-3 animate-shake">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Cardholder Name</label>
          <input 
            type="text" 
            required 
            defaultValue={clientName}
            className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-teal-50 outline-none transition-all"
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Card Details</label>
          <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.2rem] shadow-inner">
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#0F172A',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    '::placeholder': { color: '#94a3b8' },
                  },
                  invalid: { color: '#FF6B9D' },
                },
              }}
            />
          </div>
        </div>

        <div className="pt-6 flex flex-col gap-4">
          <button 
            type="submit"
            disabled={isProcessing || !stripe}
            className={`w-full py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-3 transition-all shadow-2xl ${
              isProcessing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-[#20B2AA] hover:-translate-y-1'
            }`}
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>Pay £{amount.toFixed(2)} Now</>
            )}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full py-4 text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[10px] transition-colors"
          >
            Cancel Transaction
          </button>
        </div>
      </form>

      <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-center gap-8 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all">
         <ShieldCheck size={18} />
         <p className="text-[10px] font-black uppercase tracking-widest">PCI-DSS Compliant • SSL 256-bit</p>
      </div>
    </div>
  );
};

const StripePayment: React.FC<StripePaymentProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default StripePayment;
