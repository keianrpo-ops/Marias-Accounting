
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Zap, Dog, ShoppingBag, 
  Heart, Sparkles, ArrowUpRight,
  Globe, Users
} from 'lucide-react';
import { PRODUCTS, SERVICES, PRICING_TIERS } from '../constants';

const DistributorLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#FCFCFA] min-h-screen font-sans selection:bg-[#20B2AA] selection:text-white overflow-x-hidden text-slate-900">
      
      {/* SEAL OF TRUST */}
      <div className="fixed bottom-8 left-8 z-[500] animate-in slide-in-from-left-8 duration-1000">
         <div className="bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center gap-4 hover:border-[#20B2AA] transition-colors group cursor-help">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-[#20B2AA] group-hover:scale-110 transition-transform">
               <ShieldCheck size={18} />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">APHA Certified</p>
               <p className="text-[11px] font-black text-slate-900 flex items-center gap-1">
                 UK • U1596090
               </p>
            </div>
         </div>
      </div>

      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 px-8 py-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center pointer-events-auto">
          <div className="flex items-center gap-3 bg-white/70 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
             <div className="w-7 h-7 bg-gradient-to-br from-[#20B2AA] to-[#20B2AA]/80 rounded-lg flex items-center justify-center text-white">
                <Dog size={16} />
             </div>
             <span className="text-xs font-black text-slate-900 tracking-[0.2em] uppercase">MDC <span className="text-[#FF6B9D]">PRO</span></span>
          </div>
          <div className="flex items-center gap-3 bg-white/70 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-100 shadow-sm">
             <button onClick={() => navigate('/login')} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 px-6 py-2 transition-colors">Login</button>
             <button onClick={() => navigate('/register')} className="bg-slate-900 text-white px-7 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#20B2AA] transition-all shadow-md active:scale-95">Partner Program</button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-48 pb-32 px-8 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#20B2AA]/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[10%] left-[-5%] w-[30%] h-[30%] bg-[#FF6B9D]/5 blur-[100px] rounded-full"></div>

        <div className="max-w-7xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-full mb-10 animate-in fade-in slide-in-from-bottom-2">
             <Sparkles size={14} className="text-[#20B2AA]"/>
             <span className="text-[9px] font-black uppercase tracking-[0.4em]">Official 2025 B2B Network</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-[-0.04em] leading-[1.1] uppercase mb-10 max-w-5xl">
            Precision Nutrition <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#20B2AA] to-[#FF6B9D]">for Professional Retail.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-slate-500 text-lg md:text-xl font-medium leading-relaxed mb-14">
            Licensed UK manufacturing meets artisan quality. We supply high-margin natural treats to the most discerning pet businesses in the United Kingdom.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5">
             <button onClick={() => navigate('/register')} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-lg hover:bg-[#20B2AA] hover:-translate-y-1 transition-all flex items-center gap-3 group">
                Apply for Access <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
             </button>
             <button onClick={() => navigate('/register')} className="bg-white text-slate-900 border border-slate-200 px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-sm hover:bg-slate-50 hover:-translate-y-1 transition-all flex items-center gap-3 group">
                Explore Services <Heart size={16} className="text-[#FF6B9D]"/>
             </button>
          </div>
        </div>
      </section>

      {/* CORE VALUES BENTO */}
      <section className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-4 py-10">
         <div className="md:col-span-2 bg-[#F8F9FA] p-10 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between group hover:border-[#20B2AA]/30 transition-all">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#20B2AA] shadow-sm border border-slate-50">
               <ShieldCheck size={24} />
            </div>
            <div>
               <h3 className="text-2xl font-black uppercase tracking-tight mb-3">Certified Quality.</h3>
               <p className="text-slate-500 font-medium text-sm leading-relaxed">Our Bristol facility is fully APHA certified, ensuring every batch meets the highest UK safety and hygiene benchmarks for pet nutrition.</p>
            </div>
         </div>

         <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div className="w-12 h-12 bg-[#C6FF00] text-slate-900 rounded-xl flex items-center justify-center shadow-md">
               <Globe size={24} />
            </div>
            <div>
               <h3 className="text-2xl font-black uppercase tracking-tight mb-3 italic">100% UK.</h3>
               <p className="text-slate-400 font-medium text-sm leading-relaxed">No imports. Pure British protein sourced from high-welfare farms.</p>
            </div>
         </div>

         <div className="bg-[#FF6B9D] p-10 rounded-[2.5rem] text-white flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
               <Zap size={24} className="text-[#C6FF00] fill-[#C6FF00]"/>
            </div>
            <div>
               <h3 className="text-2xl font-black uppercase tracking-tight mb-3">High ROI.</h3>
               <p className="text-pink-50/80 font-medium text-sm leading-relaxed">Strategic pricing designed to maximize your retail margins.</p>
            </div>
         </div>
      </section>

      {/* PRODUCT CATALOG - USING IMAGES */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-20 gap-6 border-b border-slate-100 pb-10">
            <div className="space-y-2">
               <span className="text-[10px] font-black text-[#20B2AA] uppercase tracking-[0.5em]">Inventory Selection</span>
               <h2 className="text-5xl font-black text-slate-900 tracking-tight uppercase">Premium <span className="text-slate-300 italic">Assets.</span></h2>
            </div>
            <p className="max-w-xs text-slate-400 text-xs font-medium leading-loose md:text-right">
              Slowly dehydrated specimens. Single ingredient purity. Lab tested for nutritional integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {PRODUCTS.map((product) => (
              <div key={product.id} className="group bg-white rounded-3xl border border-slate-100 hover:border-[#20B2AA]/50 hover:shadow-[0_20px_50px_rgba(32,178,170,0.08)] transition-all overflow-hidden p-8 flex flex-col">
                 <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center mb-8 relative group-hover:bg-[#20B2AA]/5 transition-colors overflow-hidden">
                    {/* IMAGEN DEL PRODUCTO CON FALLBACK */}
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        // Si falla la imagen, ocultamos el img y mostramos el icono como fallback
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('span');
                          fallback.className = 'text-8xl';
                          fallback.innerText = product.icon;
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                    <div className="absolute top-4 right-4 px-3 py-1 bg-white border border-slate-100 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Batch Traceable
                    </div>
                 </div>

                 <div className="space-y-2 mb-8 flex-1">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{product.name}</h3>
                    <div className="flex items-center gap-2">
                       <span className="px-2.5 py-1 bg-slate-100 rounded-md text-[8px] font-black text-slate-500 uppercase">Single Protein</span>
                       <div className="h-1 w-1 rounded-full bg-slate-200"></div>
                       <span className="text-[9px] font-bold text-slate-400">UK Origin</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-2 mt-2">
                      {product.description}
                    </p>
                 </div>

                 <div className="flex justify-between items-end pt-6 border-t border-slate-50">
                    <div>
                       <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">MSRP Retail</p>
                       <p className="text-2xl font-black text-slate-900">£{product.basePrice.toFixed(2)}</p>
                    </div>
                    <button onClick={() => navigate('/register')} className="w-10 h-10 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-[#C6FF00] transition-all">
                       <ArrowUpRight size={20} />
                    </button>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICE SECTION */}
      <section className="py-32 px-8 bg-[#FDFDFB]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
           <div className="space-y-10">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-[#FF6B9D]/10 text-[#FF6B9D] rounded-full text-[9px] font-black uppercase tracking-widest border border-[#FF6B9D]/20">
                 <Users size={14}/> Professional Care
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight uppercase leading-[1.1]">Elite Daycare <br/> <span className="text-[#FF6B9D]">Experience.</span></h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-lg">
                Exclusive daycare and pet sitting services designed for active, healthy routines. We provide the same integrity in our care as we do in our products.
              </p>
              <div className="flex flex-wrap gap-4">
                 {SERVICES.slice(0, 3).map(s => (
                   <div key={s.id} className="px-5 py-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-3 shadow-sm">
                      <span className="text-lg">{s.icon}</span>
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{s.name}</span>
                   </div>
                 ))}
              </div>
              <div className="pt-4">
                 <button onClick={() => navigate('/register')} className="bg-slate-900 text-white px-10 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-md hover:bg-[#FF6B9D] transition-all">
                    Book Consultation
                 </button>
              </div>
           </div>
           
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B9D]/5 rounded-full blur-2xl"></div>
              <h4 className="text-xl font-black uppercase tracking-tight italic text-[#FF6B9D]">Partner Benefits Program</h4>
              <div className="space-y-4">
                 {PRICING_TIERS.map((tier) => (
                   <div key={tier.name} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all group">
                      <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{tier.min}+ Monthly Units</p>
                         <p className="text-lg font-black text-slate-900 uppercase tracking-tighter">{tier.name}</p>
                      </div>
                      <div className="text-right">
                         <span className="text-3xl font-black text-[#20B2AA]">-{tier.discount * 100}%</span>
                         <p className="text-[8px] font-black text-slate-300 uppercase mt-1">Partner Discount</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-48 text-center px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900 pointer-events-none">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#20B2AA]/10 via-transparent to-[#FF6B9D]/10"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 space-y-12">
           <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight uppercase leading-[1.1]">
             Elevate your <span className="text-[#C6FF00]">Pet Business</span> today.
           </h2>
           <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
             Join the network of premium UK retailers who trust Maria's Dog Corner for supply integrity and care excellence.
           </p>
           <div className="pt-8 flex flex-col sm:flex-row gap-6 justify-center items-center">
             <button onClick={() => navigate('/register')} className="bg-[#C6FF00] text-slate-900 px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:scale-105 transition-all">
                Become a Partner
             </button>
             <button onClick={() => navigate('/login')} className="text-white flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] hover:text-[#20B2AA] transition-colors">
                Existing Login <ArrowRight size={18}/>
             </button>
           </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pt-24 pb-12 bg-white border-t border-slate-50">
        <div className="max-w-7xl mx-auto px-8">
           <div className="flex flex-col md:flex-row justify-between items-center gap-12 pb-16 mb-16 border-b border-slate-50">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                    <Dog size={22} />
                 </div>
                 <p className="text-xl font-black text-slate-900 uppercase tracking-tight">MDC <span className="text-[#FF6B9D]">PRO</span></p>
              </div>
              <div className="flex flex-wrap justify-center gap-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">
                 <button className="hover:text-slate-900 transition-colors">Regulatory</button>
                 <button className="hover:text-slate-900 transition-colors">Supply Chain</button>
                 <button className="hover:text-slate-900 transition-colors">Compliance</button>
                 <button className="hover:text-slate-900 transition-colors">Contact</button>
              </div>
           </div>
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.5em]">© 2025 Maria’s Dog Corner Ltd • Bristol, UK</p>
              <div className="flex items-center gap-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                 <div className="flex items-center gap-2"><Globe size={14} className="text-[#20B2AA]"/> UK South 1</div>
                 <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-[#FF6B9D]"/> Gov. Regulated</div>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default DistributorLanding;
