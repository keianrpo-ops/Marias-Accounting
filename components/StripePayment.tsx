
import React, { useState, useEffect } from 'react';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from 'https://esm.sh/@stripe/react-stripe-js@^5.5.0';
import { loadStripe, Stripe } from 'https://esm.sh/@stripe/stripe-js@^8.6.4';
import { Lock, ShieldCheck, AlertCircle, X } from 'lucide-react';

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
    if (!cardElement) {
      setIsProcessing(false);
      return;
    }

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: { name: clientName },
    });

    if (stripeError) {
      setError(stripeError.message || "Error processing card.");
      setIsProcessing(false);
    } else {
      setTimeout(() => {
        onSuccess(paymentMethod.id);
        setIsProcessing(false);
      }, 1500);
    }
  };

  return (
    <div className="bg-white rounded-[3.5rem] p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-slate-100 max-w-lg w-full animate-in zoom-in-95 duration-300 relative z-[1000] ring-1 ring-slate-100 pointer-events-auto text-slate-900">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Secure <span className="text-[#20B2AA]">Payment</span></h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">MDC Real-Time Gateway</p>
        </div>
        <button onClick={onCancel} className="p-3 bg-slate-50 rounded-2xl text-slate-300 hover:text-rose-500 transition-all active:scale-90">
          <X size={20} />
        </button>
      </div>

      <div className="mb-10 p-6 bg-slate-900 rounded-[2rem] text-white flex justify-between items-end shadow-xl">
         <div>
            <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-1">Total a cobrar</p>
            <p className="text-4xl font-black tracking-tighter">£{amount.toFixed(2)}</p>
         </div>
         <div className="text-right">
            <Lock size={20} className="text-[#C6FF00] inline-block mb-2"/>
         </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-bold flex items-center gap-3 border border-rose-100">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Detalles de Tarjeta</label>
           <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] shadow-inner focus-within:ring-4 focus-within:ring-teal-50 transition-all">
             <CardElement 
               options={{
                 style: {
                   base: {
                     fontSize: '16px',
                     color: '#0F172A',
                     '::placeholder': { color: '#94a3b8' },
                   },
                 },
               }}
             />
           </div>
        </div>

        <button 
          disabled={isProcessing || !stripe}
          type="submit"
          className="w-full bg-slate-900 text-white py-6 rounded-full font-black uppercase text-[12px] tracking-widest shadow-2xl hover:bg-[#20B2AA] transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Procesando...
            </>
          ) : (
            <>
              <ShieldCheck size={18} /> Pagar £{amount.toFixed(2)}
            </>
          )}
        </button>
        <div className="flex justify-center gap-4 text-[9px] font-black text-slate-300 uppercase tracking-widest pt-2">
           <span className="flex items-center gap-1"><Lock size={10}/> SSL 256-bit</span>
           <span className="flex items-center gap-1"><ShieldCheck size={10}/> PCI Compliant</span>
        </div>
      </form>
    </div>
  );
};

const StripePayment: React.FC<StripePaymentProps> = (props) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    const savedInt = localStorage.getItem('mdc_integrations');
    if (savedInt) {
      const config = JSON.parse(savedInt);
      if (config.stripePublicKey) {
        setStripePromise(loadStripe(config.stripePublicKey));
      }
    }
  }, []);

  if (!stripePromise) {
    return (
      <div className="bg-white p-10 rounded-[2rem] shadow-2xl border border-rose-100 text-center max-w-md pointer-events-auto text-slate-900">
        <AlertCircle size={40} className="mx-auto text-rose-500 mb-4"/>
        <h3 className="text-xl font-black text-slate-900 uppercase">Configuración Incompleta</h3>
        <p className="text-sm text-slate-500 mt-2">Por favor, introduce tu <strong>Stripe Public Key</strong> en el menú de Ajustes para activar los pagos con tarjeta.</p>
        <button onClick={props.onCancel} className="mt-6 text-xs font-black uppercase text-[#20B2AA] hover:underline">Volver</button>
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
