
import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, CheckCheck, Paperclip, Dog, Circle, ShieldCheck, BellRing, X, MessageCircle, Bug, User } from 'lucide-react';
// Fix: Added UserRole to imports from types
import { Client, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

const Messages: React.FC = () => {
  const { t } = useLanguage();
  
  const [role] = useState<string>(() => {
    const r = localStorage.getItem('userRole') || 'distributor';
    return r.toLowerCase();
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState<{ [clientId: string]: Message[] }>({});
  const [toast, setToast] = useState<{show: boolean, msg: string, sender: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const DISTRIBUTOR_ID = '3';
  const isAdmin = role === 'admin';
  const isDistributor = role === 'distributor' || role === 'distribuidor';

  // 1. CARGA E INICIALIZACIÓN CRÍTICA
  useEffect(() => {
    // Asegurar que existan clientes para que el Admin pueda seleccionarlos
    let savedClients = JSON.parse(localStorage.getItem('mdc_clients') || '[]');
    
    if (savedClients.length === 0) {
      // Fix: dummy data updated to match Client interface properties correctly
      savedClients = [
        { id: '1', name: 'Oliver Smith', email: 'oliver@example.com', phone: '07123 456789', addressLine1: '12 Barking Lane', city: 'London', postcode: 'E1 1AA', invoicesSent: 0, role: UserRole.CLIENT, status: 'approved', createdAt: new Date().toISOString(), pets: [] },
        { id: '2', name: 'Emily Barker', email: 'emily.b@test.co.uk', phone: '07234 567890', addressLine1: '45 Tail Street', city: 'Manchester', postcode: 'M1 1BB', invoicesSent: 0, role: UserRole.CLIENT, status: 'approved', createdAt: new Date().toISOString(), pets: [] },
        // Fix: Use role property from UserRole instead of non-existent isDistributor
        { id: '3', name: 'Bristol Partners B2B', email: 'bristol@partners.mdc.uk', phone: '07345 678901', addressLine1: '8 Woof Garden', city: 'Bristol', postcode: 'BS1 1CC', invoicesSent: 0, role: UserRole.DISTRIBUTOR, status: 'approved', createdAt: new Date().toISOString(), pets: [] },
      ];
      localStorage.setItem('mdc_clients', JSON.stringify(savedClients));
    }
    setClients(savedClients);
    
    // Cargar chats
    const currentChats = JSON.parse(localStorage.getItem('mdc_chats') || '{}');
    setChats(currentChats);

    // Auto-selección para evitar que el input esté bloqueado
    if (isDistributor) {
      setSelectedClientId(DISTRIBUTOR_ID);
    } else if (isAdmin) {
      // Intentar seleccionar Bristol Partners (ID 3) por defecto para el ensayo
      const bristol = savedClients.find((c: Client) => c.id === DISTRIBUTOR_ID);
      if (bristol) {
        setSelectedClientId(bristol.id);
      } else if (savedClients.length > 0) {
        setSelectedClientId(savedClients[0].id);
      }
    }
  }, [isAdmin, isDistributor]);

  // 2. SINCRONIZACIÓN EN TIEMPO REAL
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mdc_chats' && e.newValue) {
        const newChats = JSON.parse(e.newValue);
        setChats(newChats);
        
        // Notificación Toast si llega mensaje nuevo
        const activeId = isDistributor ? DISTRIBUTOR_ID : selectedClientId;
        if (activeId && newChats[activeId]) {
          const msgs = newChats[activeId];
          if (msgs.length > 0) {
            const last = msgs[msgs.length - 1];
            const sentByAdmin = last.senderId === 'admin';
            
            // Mostrar toast si el mensaje NO lo envié yo en esta pestaña
            if ((isAdmin && !sentByAdmin) || (isDistributor && sentByAdmin)) {
              setToast({
                show: true,
                msg: last.text,
                sender: sentByAdmin ? "Maria's Dog Corner" : "Bristol Partners"
              });
              setTimeout(() => setToast(null), 4000);
            }
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAdmin, isDistributor, selectedClientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, selectedClientId]);

  // 3. ENVÍO DE MENSAJES
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim()) return;

    const targetId = isDistributor ? DISTRIBUTOR_ID : selectedClientId;
    if (!targetId) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId: isAdmin ? 'admin' : DISTRIBUTOR_ID,
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const currentStorage = JSON.parse(localStorage.getItem('mdc_chats') || '{}');
    const updatedChats = {
      ...currentStorage,
      [targetId]: [...(currentStorage[targetId] || []), newMessage]
    };

    // Guardar en LocalStorage y actualizar estado
    localStorage.setItem('mdc_chats', JSON.stringify(updatedChats));
    setChats(updatedChats); 
    setMessage('');

    // Disparar evento para otras pestañas
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'mdc_chats',
      newValue: JSON.stringify(updatedChats)
    }));
  };

  const simulateQuickReply = () => {
    const targetId = isDistributor ? DISTRIBUTOR_ID : selectedClientId;
    if (!targetId) return;

    const replySender = isAdmin ? DISTRIBUTOR_ID : 'admin';
    const replyText = isAdmin ? "Respuesta automática del Distribuidor Bristol." : "Hola, soy Maria. Mensaje recibido.";

    const currentStorage = JSON.parse(localStorage.getItem('mdc_chats') || '{}');
    const newMessage = {
      id: `sim_${Date.now()}`,
      senderId: replySender,
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = {
      ...currentStorage,
      [targetId]: [...(currentStorage[targetId] || []), newMessage]
    };

    localStorage.setItem('mdc_chats', JSON.stringify(updated));
    setChats(updated);
    window.dispatchEvent(new StorageEvent('storage', { key: 'mdc_chats', newValue: JSON.stringify(updated) }));
  };

  const activeChatId = isDistributor ? DISTRIBUTOR_ID : selectedClientId;
  const currentMessages = activeChatId ? (chats[activeChatId] || []) : [];
  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="h-[calc(100vh-180px)] bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden flex animate-in fade-in duration-500 relative">
      
      {/* TOAST POPUP */}
      {toast && (
        <div className="fixed top-10 right-10 z-[10000] animate-in slide-in-from-right-full duration-500">
           <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-3xl border border-white/10 flex items-center gap-5 min-w-[320px]">
              <div className="w-12 h-12 bg-[#20B2AA] rounded-2xl flex items-center justify-center shrink-0 shadow-lg animate-bounce">
                <BellRing size={24} className="text-white" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">{toast.sender}</p>
                <p className="text-sm font-bold mt-1 text-slate-100 truncate">{toast.msg}</p>
              </div>
              <button onClick={() => setToast(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
           </div>
        </div>
      )}

      {/* Sidebar - Admin Only */}
      {isAdmin && (
        <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
          <div className="p-8 space-y-6">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">CHAT <span className="text-[#20B2AA]">MDC</span></h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input type="text" placeholder="Buscar cliente..." className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {clients.map(client => (
              <button 
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={`w-full p-6 flex items-center gap-4 transition-all border-l-4 ${selectedClientId === client.id ? 'bg-white border-[#20B2AA] shadow-sm' : 'border-transparent hover:bg-white/60'}`}
              >
                {/* Fix: Using role property from UserRole instead of non-existent isDistributor */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${client.role === UserRole.DISTRIBUTOR ? 'bg-teal-50 text-[#20B2AA]' : 'bg-pink-50 text-[#FF6B9D]'}`}>
                  {client.name.charAt(0)}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-900 uppercase truncate">{client.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold truncate mt-1">
                    {chats[client.id] ? chats[client.id].slice(-1)[0]?.text : 'Haz clic para chatear'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-[#20B2AA]">
              {isAdmin ? <User size={24}/> : <ShieldCheck size={24}/>}
            </div>
            <div>
              <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-tight">
                {isAdmin ? (selectedClient?.name || 'SELECCIONE UN CLIENTE') : "SOPORTE CENTRAL MDC"}
              </h4>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                <Circle size={8} className="fill-emerald-500" /> EN LÍNEA
              </p>
            </div>
          </div>
          <button onClick={simulateQuickReply} className="text-[9px] font-black uppercase text-amber-500 hover:text-amber-600 flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
            <Bug size={14}/> Simular Respuesta
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar bg-slate-50/20">
          {currentMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-10">
               <MessageCircle size={80} className="mb-4" />
               <p className="font-black uppercase tracking-widest text-xs">Historial vacío</p>
            </div>
          )}
          
          {currentMessages.map((msg, idx) => {
            const isMsgAdmin = msg.senderId === 'admin';
            
            return (
              <div key={idx} className={`flex ${isMsgAdmin ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[75%] space-y-2 flex flex-col ${isMsgAdmin ? 'items-start' : 'items-end'}`}>
                  
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                    {isMsgAdmin ? "MARIA'S DOG CORNER (ADMIN)" : "CLIENTE / DISTRIBUIDOR"}
                  </span>

                  <div className={`px-8 py-5 rounded-[2.5rem] text-[14px] font-bold shadow-xl leading-relaxed ${
                    isMsgAdmin 
                    ? 'bg-[#20B2AA] text-white rounded-tl-none shadow-teal-100' 
                    : 'bg-[#FF6B9D] text-white rounded-tr-none shadow-pink-100'
                  }`}>
                    {msg.text}
                  </div>
                  
                  <div className="flex items-center gap-2 px-4">
                    <p className="text-[10px] font-black text-slate-300 uppercase">{msg.timestamp}</p>
                    {isMsgAdmin && <CheckCheck size={16} className="text-[#20B2AA]" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-8 bg-white border-t border-slate-100">
          <form onSubmit={handleSendMessage} className="flex items-center gap-4 bg-slate-50 p-2 rounded-[3rem] border border-slate-200 focus-within:ring-8 focus-within:ring-teal-50 transition-all shadow-inner">
            <button type="button" className="p-4 text-slate-300 hover:text-[#20B2AA] transition-colors"><Paperclip size={24}/></button>
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isAdmin && !selectedClientId ? "Seleccione un cliente a la izquierda para escribir..." : "Escriba su mensaje aquí..."} 
              disabled={isAdmin && !selectedClientId}
              className="flex-1 bg-transparent border-none text-[15px] font-bold outline-none py-4 px-2 placeholder:text-slate-300"
            />
            <button 
              type="submit" 
              disabled={!message.trim() || (isAdmin && !selectedClientId)} 
              className="bg-slate-900 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:bg-[#20B2AA] transition-all active:scale-95 disabled:opacity-20"
            >
              <Send size={24} />
            </button>
          </form>
          <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mt-6">Protocolo de Mensajería Cifrada MDC PRO v5.0</p>
        </div>
      </div>
    </div>
  );
};

export default Messages;
