import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { supabase } from '../services/supabase';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Intentar Loguear con Supabase
      if (supabase) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (authError) throw authError;

        if (authData.user) {
            // 2. Si entra, buscar qué rol tiene en la tabla 'clients'
            const { data: clientData, error: clientError } = await supabase
              .from('clients')
              .select('role')
              .eq('id', authData.user.id)
              .single();

            // Si no está en la tabla clients, asumimos que es Admin si el email coincide (puedes cambiar esto)
            // O si la tabla dice que es ADMIN
            let finalRole = UserRole.CLIENT;

            if (clientData) {
               finalRole = clientData.role as UserRole;
            } else {
               // Fallback: si el usuario existe en Auth pero no en clients, podría ser un Admin superusuario manual
               // Aquí puedes poner tu email de administrador para forzar el rol
               if (email.toLowerCase().includes('keianrpo@gmail.com')) {
                   finalRole = UserRole.ADMIN;
               }
            }

            onLogin(finalRole);
            navigate('/');
            return;
        }
      } 
      
      // Fallback por si Supabase no está configurado (modo demo antiguo)
      // ESTO LO PUEDES QUITAR CUANDO YA TENGAS TU CUENTA ADMIN CREADA
      if (password === '42016383' && (email.toLowerCase() === 'keianrpo@gmail.com')) {
         onLogin(UserRole.ADMIN);
         navigate('/');
         return;
      }
      
      throw new Error('User not found or connection failed');

    } catch (err: any) {
      console.error(err);
      setError('Invalid credentials. Please check your email and password.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-50 rounded-full blur-[100px] opacity-60 pointer-events-none"/>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-50 rounded-full blur-[100px] opacity-60 pointer-events-none"/>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10 animate-in slide-in-from-bottom-4 duration-700">
           <div className="inline-flex p-4 bg-white rounded-[2rem] shadow-xl mb-6 rotate-3">
             <ShieldCheck size={32} className="text-[#20B2AA]" />
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">{t('login_platform')}</h1>
           <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{t('encrypted_system')}</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8 animate-in zoom-in-95 duration-500">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3 group">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2 group-focus-within:text-[#20B2AA] transition-colors">
                  <Mail size={12} /> Email
               </label>
               <input 
                 autoFocus
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:ring-4 focus:ring-teal-50 transition-all shadow-inner text-slate-800"
                 placeholder="admin@mdc.com"
               />
            </div>

            <div className="space-y-3 group">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2 group-focus-within:text-[#20B2AA] transition-colors">
                  <Lock size={12} /> {t('access_key')}
               </label>
               <input 
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] border-none font-bold outline-none focus:ring-4 focus:ring-teal-50 transition-all shadow-inner text-slate-800"
                 placeholder="••••••••"
               />
            </div>

            {error && (
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3 text-rose-600 text-xs font-bold animate-bounce">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                {error}
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 hover:bg-[#20B2AA] shadow-2xl shadow-teal-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : t('enter_ecosystem')}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => navigate('/info')} 
              className="text-[10px] font-black text-[#20B2AA] uppercase tracking-widest hover:underline flex items-center justify-center gap-2 mx-auto"
            >
              <Info size={14} /> {t('want_be_distributor')}
            </button>
          </div>

          <div className="pt-4 flex items-center justify-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
             <Lock size={10} /> Secure SSL Connection
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;