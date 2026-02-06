
import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Icons } from '../constants';

const AuthModule: React.FC = () => {
  const { login, users } = useApp();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username)) {
      setError('');
    } else {
      setError('Usuário não encontrado ou sem permissão.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-blue-500/30">
            <Icons.CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">DocTramite Pro</h1>
          <p className="text-slate-400 text-sm mt-2">Acesse seu painel de consultoria</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Usuário</label>
            <div className="relative">
              <Icons.Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text"
                placeholder="Ex: admin ou operador1"
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 animate-shake">
              <Icons.AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-200 text-xs font-medium">{error}</p>
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-500/30 active:scale-95"
          >
            Entrar no Sistema
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">Acesso Rápido (Demonstração)</p>
          <div className="flex justify-center gap-2">
            {users.map(u => (
              <button 
                key={u.id}
                onClick={() => setUsername(u.username)}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[10px] text-slate-400 font-bold transition-all"
              >
                {u.username}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModule;
