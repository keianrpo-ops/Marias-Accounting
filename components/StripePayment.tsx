
import React, { useState, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Lock, ShieldCheck, AlertCircle, CreditCard } from 'lucide-react';

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

    // NOTA PARA PRODUCCIÓN: 
    // Aquí deberías llamar a tu backend para obtener un `client_secret` de un PaymentIntent.
    // Como estamos en una app frontend pura, simulamos la confirmación después de validar la tarjeta localmente.
    
    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: { name: clientName },
    });

    if (stripeError) {
      setError(stripeError.message || "Error al procesar la tarjeta.");
      setIsProcessing(false);
    } else {
      // Simulación de delay de red para confirmación
      setTimeout(() => {
        onSuccess(paymentMethod.id);
        setIsProcessing(false);
      }, 2000);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 max-w-lg w-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Checkout <span className="text-[#20B2AA]">Secure</span></h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
            <Lock size={12} /> Powered by Stripe Official SDK
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total to pay</p>
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
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Cardholder Name</label>
          <input 
            type="text" 
            required 
            defaultValue={clientName}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-50 outline-none transition-all"
          />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Card Details</label>
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-[1.8rem] shadow-inner">
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

        <div className="pt-6 flex flex-col gap-3">
          <button 
            type="submit"
            disabled={isProcessing || !stripe}
            className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all shadow-xl ${
              isProcessing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-[#20B2AA] hover:-translate-y-1'
            }`}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>Pay £{amount.toFixed(2)} Now</>
            )}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full py-4 text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[9px] transition-colors"
          >
            Cancel Transaction
          </button>
        </div>
      </form>

      <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-center gap-6 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all">
         <ShieldCheck size={16} />
         <p className="text-[9px] font-black uppercase tracking-widest">PCI-DSS Compliant • SSL Encrypted</p>
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