import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, CheckCheck, Paperclip, Circle, ShieldCheck, BellRing, X, MessageCircle, Bug, User, Loader2 } from 'lucide-react';
import { Client, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../services/supabase';

// Inteface adaptada a la Base de Datos Real
interface Message {
  id: string;
  sender_id: string; // ID de quien envía
  conversation_id: string; // ID del cliente dueño del chat
  content: string; // El texto
  created_at: string;
  is_admin_reply: boolean;
}

const Messages: React.FC = () => {
  const { t } = useLanguage();
  
  // --- ESTADOS DE DATOS ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [role, setRole] = useState<string>('client'); // 'admin' | 'client' | 'distributor'
  const [clients, setClients] = useState<any[]>([]); // Para la sidebar de Admin
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // --- ESTADOS DE CHAT ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // --- UI & UX ---
  const [toast, setToast] = useState<{show: boolean, msg: string, sender: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = role === 'admin';

  // 1. CARGA INICIAL (Autenticación y Rol)
  useEffect(() => {
    checkAuthAndRole();
  }, []);

  const checkAuthAndRole = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Redirigir a login si fuera necesario
        
        setCurrentUser(user);

        // Buscar rol en la tabla clients
        const { data: clientData } = await supabase.from('clients').select('role').eq('id', user.id).single();
        
        // Lógica simple: Si tiene rol 'admin' en DB o si es un email específico
        const userRole = clientData?.role || 'client'; 
        setRole(userRole);

        if (userRole === 'admin') {
            fetchClientsForAdmin();
        } else {
            // Si es cliente normal, su ID es el ID de la conversación
            setSelectedClientId(user.id);
            fetchMessages(user.id);
        }

    } catch (e) {
        console.error("Error Auth:", e);
    }
  };

  // 2. SOLO ADMIN: Cargar lista de clientes para la Sidebar
  const fetchClientsForAdmin = async () => {
      // Traemos todos los clientes de la tabla 'clients'
      const { data } = await supabase.from('clients').select('*');
      if (data) {
          setClients(data);
          // Seleccionar el primero por defecto
          if (data.length > 0) {
              setSelectedClientId(data[0].id);
              fetchMessages(data[0].id);
          }
      }
      setLoading(false);
  };

  // 3. CARGAR MENSAJES (Del cliente seleccionado o del propio usuario)
  const fetchMessages = async (conversationId: string) => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (!error && data) {
          setMessages(data);
      }
      setLoading(false);
      scrollToBottom();
  };

  // 4. REAL-TIME (Suscripción a nuevos mensajes)
  useEffect(() => {
      if (!selectedClientId) return;

      const channel = supabase
        .channel('chat_updates')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedClientId}` },
            (payload) => {
                const newMsg = payload.new as Message;
                setMessages(prev => [...prev, newMsg]);
                scrollToBottom();

                // Mostrar TOAST si el mensaje no es mío
                if (newMsg.sender_id !== currentUser?.id) {
                    setToast({
                        show: true,
                        msg: newMsg.content,
                        sender: newMsg.is_admin_reply ? "Soporte MDC" : "Cliente"
                    });
                    setTimeout(() => setToast(null), 4000);
                }
            }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
  }, [selectedClientId, currentUser]);

  const scrollToBottom = () => {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // 5. ENVIAR MENSAJE (A Supabase)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !currentUser || !selectedClientId) return;

    const textToSend = inputText;
    setInputText(''); // Limpiar input rápido para UX
    setSending(true);

    try {
        const { error } = await supabase.from('messages').insert({
            conversation_id: selectedClientId, // El chat pertenece al cliente seleccionado
            sender_id: currentUser.id,         // Lo envío yo
            content: textToSend,
            is_admin_reply: isAdmin            // Marcamos si es respuesta de admin
        });

        if (error) throw error;
        // No hace falta añadirlo manualmente a 'messages', el Real-time lo hará.
    } catch (err) {
        console.error("Error enviando:", err);
        alert("Error al enviar mensaje");
        setInputText(textToSend); // Restaurar si falló
    } finally {
        setSending(false);
    }
  };

  // Simulación para pruebas (Opcional, guarda en DB real ahora)
  const simulateQuickReply = async () => {
      if (!selectedClientId) return;
      await supabase.from('messages').insert({
          conversation_id: selectedClientId,
          sender_id: 'system_bot', // ID falso para simular
          content: isAdmin ? "Respuesta automática del Distribuidor." : "Hola, un agente revisará tu caso.",
          is_admin_reply: !isAdmin
      });
  };

  // --- RENDERIZADO (TU UI EXACTA) ---
  const selectedClientData = clients.find(c => c.id === selectedClientId);

  return (
    <div className="h-[calc(100vh-100px)] bg-white md:rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden flex animate-in fade-in duration-500 relative">
      
      {/* TOAST POPUP */}
      {toast && (
        <div className="fixed top-24 right-10 z-[10000] animate-in slide-in-from-right-full duration-500">
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
        <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50 hidden md:flex">
          <div className="p-8 space-y-6">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">CHAT <span className="text-[#20B2AA]">MDC</span></h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input type="text" placeholder="Buscar cliente..." className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {clients.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-10">No hay clientes registrados</p>
            ) : clients.map(client => (
              <button 
                key={client.id}
                onClick={() => { setSelectedClientId(client.id); fetchMessages(client.id); }}
                className={`w-full p-6 flex items-center gap-4 transition-all border-l-4 ${selectedClientId === client.id ? 'bg-white border-[#20B2AA] shadow-sm' : 'border-transparent hover:bg-white/60'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${client.role === 'distributor' ? 'bg-teal-50 text-[#20B2AA]' : 'bg-pink-50 text-[#FF6B9D]'}`}>
                  {client.name ? client.name.charAt(0) : 'U'}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-900 uppercase truncate">{client.name || 'Usuario'}</p>
                  <p className="text-[9px] text-slate-400 font-bold truncate mt-1">
                    {client.role || 'Cliente'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 flex flex-col bg-white h-full">
        {/* Header del Chat */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-[#20B2AA]">
              {isAdmin ? <User size={24}/> : <ShieldCheck size={24}/>}
            </div>
            <div>
              <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-tight">
                {isAdmin ? (selectedClientData?.name || 'SELECCIONE CLIENTE') : "SOPORTE CENTRAL MDC"}
              </h4>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                <Circle size={8} className="fill-emerald-500" /> CONEXIÓN SEGURA
              </p>
            </div>
          </div>
          {/* Botón Debug/Simulación */}
          <button onClick={simulateQuickReply} className="text-[9px] font-black uppercase text-amber-500 hover:text-amber-600 flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
            <Bug size={14}/> Test Respuesta
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 md:space-y-12 no-scrollbar bg-slate-50/20">
          {loading && <div className="flex justify-center"><Loader2 className="animate-spin text-[#20B2AA]"/></div>}
          
          {!loading && messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-10">
               <MessageCircle size={80} className="mb-4" />
               <p className="font-black uppercase tracking-widest text-xs">Historial vacío</p>
            </div>
          )}
          
          {messages.map((msg) => {
            // Determinar si el mensaje lo envié YO (para alinearlo a la derecha)
            const isMyMessage = msg.sender_id === currentUser?.id;
            
            return (
              <div key={msg.id} className={`flex ${!isMyMessage ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] md:max-w-[75%] space-y-2 flex flex-col ${!isMyMessage ? 'items-start' : 'items-end'}`}>
                  
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                    {msg.is_admin_reply ? "SOPORTE MDC" : "CLIENTE"}
                  </span>

                  <div className={`px-6 py-4 md:px-8 md:py-5 rounded-[2rem] text-[13px] md:text-[14px] font-bold shadow-xl leading-relaxed break-words ${
                    !isMyMessage 
                    ? 'bg-white text-slate-700 rounded-tl-none border border-slate-100' 
                    : 'bg-[#20B2AA] text-white rounded-tr-none shadow-teal-100'
                  }`}>
                    {msg.content}
                  </div>
                  
                  <div className="flex items-center gap-2 px-4">
                    <p className="text-[10px] font-black text-slate-300 uppercase">
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    {isMyMessage && <CheckCheck size={14} className="text-[#20B2AA]" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 md:p-8 bg-white border-t border-slate-100">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-4 bg-slate-50 p-2 rounded-[3rem] border border-slate-200 focus-within:ring-4 focus-within:ring-teal-50 transition-all shadow-inner">
            <button type="button" className="p-3 md:p-4 text-slate-300 hover:text-[#20B2AA] transition-colors"><Paperclip size={20}/></button>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isAdmin && !selectedClientId ? "Seleccione un cliente..." : "Escriba su mensaje aquí..."} 
              disabled={isAdmin && !selectedClientId}
              className="flex-1 bg-transparent border-none text-[13px] md:text-[15px] font-bold outline-none py-3 md:py-4 px-2 placeholder:text-slate-300"
            />
            <button 
              type="submit" 
              disabled={sending || !inputText.trim()} 
              className="bg-slate-900 text-white w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-2xl hover:bg-[#20B2AA] transition-all active:scale-95 disabled:opacity-20"
            >
              {sending ? <Loader2 size={20} className="animate-spin"/> : <Send size={20} />}
            </button>
          </form>
          <p className="text-center text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mt-4 md:mt-6 hidden md:block">Protocolo de Mensajería Cifrada MDC PRO v5.0</p>
        </div>
      </div>
    </div>
  );
};

export default Messages;