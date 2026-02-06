
import React, { useState } from 'react';
import { Icons, COLORS } from '../constants';
import { useApp } from '../store/AppContext';
import { formatDate } from '../utils/helpers';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { currentUser, logout, isSynced, notifications, markNotificationsRead, clearNotifications } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!currentUser) return null;

  const menuItems = [
    { id: 'dashboard', label: 'Início', icon: Icons.PieChart },
    { id: 'clients', label: 'Clientes', icon: Icons.Users },
    { id: 'processes', label: 'Processos', icon: Icons.FileText },
    { id: 'finance', label: 'Financeiro', icon: Icons.DollarSign },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className={`${isSidebarOpen ? 'md:w-64' : 'md:w-20'} hidden md:flex bg-slate-900 text-white transition-all duration-300 flex-col shrink-0`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          {isSidebarOpen ? (
            <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">DocTramite</span>
          ) : (
            <Icons.CheckCircle2 className="w-8 h-8 text-blue-400" />
          )}
        </div>
        <nav className="flex-1 mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-4 transition-all ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-6 h-6 shrink-0" />
              {isSidebarOpen && <span className="ml-4 font-bold">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 bg-slate-950/50 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black">{currentUser.name.charAt(0)}</div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase">{currentUser.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Header & Main */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0 relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm shrink-0 z-20">
          <div className="flex items-center gap-3">
             <h1 className="text-lg md:text-xl font-black text-slate-800">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h1>
            {isSynced && (
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-green-600 uppercase">Sync</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Botão de Notificações */}
            <div className="relative">
              <button 
                onClick={() => { setShowNotifications(!showNotifications); markNotificationsRead(); }}
                className="p-2.5 hover:bg-slate-100 rounded-full relative transition-colors text-slate-500"
              >
                <Icons.AlertCircle className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Notificações */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl z-40 overflow-hidden animate-in fade-in zoom-in-95">
                    <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800 uppercase">Atividade Recente</span>
                      <button onClick={clearNotifications} className="text-[10px] text-blue-600 font-bold hover:underline">Limpar</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                      {notifications.map(notif => (
                        <div key={notif.id} className={`p-4 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                          <p className="text-[11px] text-slate-500">
                            <span className="font-bold text-slate-800">{notif.userName}</span> {notif.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">{formatDate(notif.timestamp)}</p>
                        </div>
                      ))}
                      {notifications.length === 0 && <p className="p-8 text-center text-slate-400 text-xs">Sem atividades recentes.</p>}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button onClick={logout} className="p-2.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors">
              <Icons.LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Nav Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex md:hidden h-16 z-40 items-center justify-around">
        {menuItems.map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`}>
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
