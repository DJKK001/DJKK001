
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Icons } from '../constants';
import { GoogleGenAI } from "@google/genai";
import { formatCurrency } from '../utils/helpers';

const AIAssistant: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { clients, processes, payments } = useApp();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Olá! Sou o assistente do DocTramite. Posso te ajudar com estatísticas, buscas de processos ou análise financeira. O que precisa?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Contexto compactado para a IA
      const context = {
        total_clientes: clients.length,
        total_processos: processes.length,
        financeiro: {
          total_recebido: payments.reduce((acc, p) => acc + p.amount, 0),
          total_pendente: processes.reduce((acc, p) => acc + p.openBalance, 0),
          ticket_medio: processes.length ? (processes.reduce((acc, p) => acc + p.totalValue, 0) / processes.length) : 0
        },
        ultimos_processos: processes.slice(-5).map(p => ({
          protocolo: p.protocolNumber,
          cliente: clients.find(c => c.id === p.clientId)?.name,
          status: p.status,
          saldo: p.openBalance
        }))
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é o assistente inteligente do DocTramite Pro.
          DADOS ATUAIS DO SISTEMA: ${JSON.stringify(context)}
          REGRAS: 
          1. Responda de forma curta e profissional.
          2. Use dados reais fornecidos acima.
          3. Se o usuário perguntar sobre algo que não está nos dados, diga que não tem acesso a essa informação específica.
          PERGUNTA DO USUÁRIO: ${userMsg}`,
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || 'Desculpe, tive um problema ao processar sua resposta.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Erro ao conectar com a IA. Verifique sua conexão.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6 backdrop-blur-sm bg-slate-900/20">
      <div className="bg-white w-full max-w-lg h-[80vh] md:h-[600px] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-in slide-in-from-bottom-10">
        <header className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
              <Icons.CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest">Assistente IA</h4>
              <p className="text-[10px] text-blue-100 font-bold uppercase">Online e Pronto</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg">
            <Icons.X className="w-6 h-6" />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <div className="relative">
            <input 
              type="text"
              placeholder="Pergunte sobre dívidas, processos ou finanças..."
              className="w-full pl-4 pr-12 py-4 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-90"
            >
              <Icons.ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-[9px] text-slate-400 mt-3 font-bold uppercase tracking-widest">
            Alimentado por Gemini AI Flash
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
