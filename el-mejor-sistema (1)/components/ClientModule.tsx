
import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Icons } from '../constants';
import { formatDate, formatSimpleDate } from '../utils/helpers';
import ImageCapture from './ImageCapture';

const ClientModule: React.FC = () => {
  const { clients, addClient, addAttachment } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    birthDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addClient(formData);
    setShowAddForm(false);
    setFormData({ name: '', taxId: '', email: '', phone: '', address: '', birthDate: '' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedClient) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        addAttachment(selectedClient, 'client', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(term) || 
      (c.email && c.email.toLowerCase().includes(term)) || 
      (c.taxId && c.taxId.toLowerCase().includes(term)) ||
      c.phone.includes(term)
    );
  }, [clients, searchTerm]);

  const clientDetail = clients.find(c => c.id === selectedClient);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Clientes</h2>
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl flex items-center gap-2 transition-colors text-sm font-bold shadow-sm"
          >
            <Icons.Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px] md:min-w-0">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 md:px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Identificação</th>
                  <th className="px-4 md:px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-4 md:px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map(client => (
                  <tr 
                    key={client.id} 
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedClient === client.id ? 'bg-blue-50/50' : ''}`}
                    onClick={() => setSelectedClient(client.id)}
                  >
                    <td className="px-4 md:px-6 py-4">
                      <p className="font-medium text-slate-800">{client.name}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[120px] md:max-w-none">{client.email || 'Sem e-mail'}</p>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm text-slate-600">
                      {client.taxId || client.phone || '---'}
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-green-100 text-green-700 whitespace-nowrap">
                        Em dia
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <Icons.ChevronRight className="w-5 h-5 text-slate-400 inline" />
                    </td>
                  </tr>
                ))}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      {searchTerm ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente cadastrado.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Section / Side Panel */}
        <div id="details-panel" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 h-fit lg:sticky lg:top-6">
          {clientDetail ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{clientDetail.name}</h3>
                  <p className="text-xs text-slate-500">Cadastrado em {formatDate(clientDetail.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsCapturing(true)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                    title="Capturar com Câmera"
                  >
                    <Icons.Camera className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                    title="Upload de Arquivo"
                  >
                    <Icons.PackageCheck className="w-5 h-5" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Dados Pessoais</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">CPF/CNPJ</p>
                      <p className="text-sm font-medium text-slate-700">{clientDetail.taxId || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Nascimento</p>
                      <p className="text-sm font-medium text-slate-700">{formatSimpleDate(clientDetail.birthDate || '')}</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Contato</p>
                  <p className="text-sm font-medium text-slate-700">{clientDetail.phone}</p>
                  <p className="text-xs text-slate-500 truncate">{clientDetail.email || 'Sem e-mail'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Endereço</p>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">{clientDetail.address}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                  Documentos Anexos
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{clientDetail.attachments.length}</span>
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-2">
                  {clientDetail.attachments.map(att => {
                    const isPdf = att.url.includes('application/pdf');
                    return (
                      <div key={att.id} className="aspect-square bg-slate-100 rounded-lg overflow-hidden group relative border border-slate-200">
                        {isPdf ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-600">
                            <Icons.FileText className="w-8 h-8" />
                            <span className="text-[8px] font-bold mt-1">PDF</span>
                          </div>
                        ) : (
                          <img src={att.url} alt="Doc" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <a href={att.url} target="_blank" rel="noopener noreferrer">
                            <Icons.Eye className="w-4 h-4 text-white" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-400 transition-colors"
                  >
                    <Icons.Plus className="w-6 h-6" />
                    <span className="text-[10px] mt-1">Anexar</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 md:h-64 flex flex-col items-center justify-center text-slate-400">
              <Icons.Users className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm text-center">Selecione um cliente para ver detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white md:rounded-3xl w-full max-w-lg h-full md:h-auto shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800">Novo Cliente</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <Icons.X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                  <input 
                    required 
                    className="w-full px-4 py-3 md:py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CPF / CNPJ (Opcional)</label>
                  <input 
                    className="w-full px-4 py-3 md:py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base"
                    value={formData.taxId}
                    onChange={e => setFormData({...formData, taxId: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data de Nascimento</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-3 md:py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base"
                    value={formData.birthDate}
                    onChange={e => setFormData({...formData, birthDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                  <input 
                    required 
                    className="w-full px-4 py-3 md:py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-mail (Opcional)</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 md:py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                  <textarea 
                    className="w-full px-4 py-3 md:py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 text-base"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  ></textarea>
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pb-4">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 md:py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold border border-slate-200 sm:border-none"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 md:py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg shadow-blue-100"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Capture UI */}
      {isCapturing && selectedClient && (
        <ImageCapture 
          onCapture={(data) => {
            addAttachment(selectedClient, 'client', data);
            setIsCapturing(false);
          }}
          onClose={() => setIsCapturing(false)}
          title="Capturar Documento"
        />
      )}
    </div>
  );
};

export default ClientModule;
