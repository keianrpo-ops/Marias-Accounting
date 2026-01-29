
import React, { useState, useEffect } from 'react';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Lock, ShieldCheck, AlertCircle, X, Loader2 } from 'lucide-react';

interface StripePaymentProps {
  amount: number;
  clientName: string;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

const getSafeKey = (key: string): string | null => {
  try {
    const saved = localStorage.getItem('mdc_integrations');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed[key]) return parsed[key];
    }
    const envKeyName = `VITE_${key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).toUpperCase()}`;
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[envKeyName]) {
      // @ts-ignore
      return import.meta.env[envKeyName];
    }
  } catch (e) {}
  return null;
};

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

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Lector de tarjetas no detectado.");

      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: { name: clientName },
      });

      if (stripeError) {
        setError(stripeError.message || "Fallo en la tarjeta.");
        setIsProcessing(false);
      } else if (paymentMethod) {
        onSuccess(paymentMethod.id);
      }
    } catch (err: any) {
      setError("Error en el proceso de pago. Intenta de nuevo.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] p-10 shadow-3xl border border-slate-100 max-w-lg w-full relative z-[1000]">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">PAGO <span className="text-[#20B2AA]">SEGURO</span></h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">MDC Operations UK</p>
        </div>
        <button onClick={onCancel} className="p-3 bg-slate-50 rounded-2xl text-slate-300 hover:text-rose-500 transition-all">
          <X size={20} />
        </button>
      </div>

      <div className="mb-8 p-6 bg-slate-900 rounded-[2rem] text-white flex justify-between items-center">
         <div>
            <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-1">Monto a pagar</p>
            <p className="text-4xl font-black tracking-tighter">£{amount.toFixed(2)}</p>
         </div>
         <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
            <Lock size={20} className="text-[#C6FF00]"/>
         </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-bold flex items-center gap-3 border border-rose-100">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-[1.5rem] shadow-inner">
           <CardElement options={{ 
             style: { 
               base: { 
                 fontSize: '16px', 
                 color: '#0F172A',
                 fontFamily: 'Plus Jakarta Sans, sans-serif',
                 '::placeholder': { color: '#94a3b8' } 
               } 
             } 
           }} />
        </div>

        <button 
          disabled={isProcessing || !stripe}
          type="submit"
          className="w-full bg-[#20B2AA] text-white py-6 rounded-full font-black uppercase text-[12px] tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
          {isProcessing ? 'Procesando...' : `Confirmar Pago £${amount.toFixed(2)}`}
        </button>
        
        <p className="text-center text-[8px] font-black text-slate-300 uppercase tracking-widest">
           Encrypted via Stripe 256-bit TLS
        </p>
      </form>
    </div>
  );
};

const StripePayment: React.FC<StripePaymentProps> = (props) => {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [hasKey, setHasKey] = useState(true);

  useEffect(() => {
    const key = getSafeKey('stripePublicKey');
    if (key) {
      setStripePromise(loadStripe(key));
    } else {
      setHasKey(false);
    }
  }, []);

  if (!hasKey) {
    return (
      <div className="bg-white p-10 rounded-[3rem] text-center max-w-md shadow-2xl">
        <AlertCircle size={40} className="mx-auto text-rose-500 mb-4"/>
        <h3 className="text-xl font-black uppercase">Sin Clave Stripe</h3>
        <p className="text-sm text-slate-500 mt-2">Configura tu clave pública en Ajustes para activar los pagos con tarjeta.</p>
        <button onClick={props.onCancel} className="mt-6 text-xs font-black uppercase text-slate-400 hover:text-slate-900">Cerrar</button>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="bg-white p-12 rounded-[3rem] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#20B2AA]" size={40} />
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default StripePayment;
