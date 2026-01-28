
import React, { useState } from 'react';
import { Dog, Lock, Mail, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      // Credenciales simples para demo
      if (password === '1234' && (user.toLowerCase() === 'admin' || user.toLowerCase() === 'distribuidor' || user.toLowerCase() === 'distributor')) {
        const finalRole = (user.toLowerCase() === 'distribuidor' || user.toLowerCase() === 'distributor') ? UserRole.DISTRIBUTOR : UserRole.ADMIN;
        onLogin(finalRole);
        navigate('/');
      } else {
        setError('Invalid credentials for this portal');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex w-24 h-24 bg-gradient-to-tr from-[#20B2AA] to-[#FF6B9D] rounded-[2.5rem] items-center justify-center text-white shadow-[0_20px_50px_rgba(32,178,170,0.3)] mb-8 rotate-3">
            <Dog size={48} />
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">MDC <span className="text-[#20B2AA]">PRO</span></h1>
          <p className="text-slate-500 mt-2 font-medium italic">B2B & Retail Management Platform</p>
        </div>

        <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-white space-y-8 animate-in zoom-in-95 duration-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Username (admin / distributor)</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#20B2AA] transition-colors" size={20} />
                <input 
                  type="text" 
                  required
                  placeholder="e.g. admin"
                  className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-teal-50 outline-none transition-all shadow-inner"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Access Key</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#20B2AA] transition-colors" size={20} />
                <input 
                  type="password" 
                  required
                  placeholder="••••"
                  className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-teal-50 outline-none transition-all shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
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
              {loading ? 'Verifying...' : 'Enter Ecosystem'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => navigate('/info')} 
              className="text-[10px] font-black text-[#20B2AA] uppercase tracking-widest hover:underline flex items-center justify-center gap-2 mx-auto"
            >
              <Info size={14} /> I want to be a Distributor
            </button>
          </div>

          <div className="pt-4 flex items-center justify-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
            <ShieldCheck size={14} /> MDC Encrypted System
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
