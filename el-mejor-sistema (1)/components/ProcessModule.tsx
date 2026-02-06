
import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Icons, DOCUMENT_TYPES } from '../constants';
import { formatDate, formatCurrency } from '../utils/helpers';
import { ProcessStatus, PaymentStatus, ServiceChannel, PaymentMethod } from '../types';
import ImageCapture from './ImageCapture';

const ProcessModule: React.FC = () => {
  const { processes, clients, addProcess, updateProcessStatus, addAttachment } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    clientId: '',
    documentType: '',
    totalValue: 0,
    initialPayment: 0,
    paymentMethod: PaymentMethod.PIX,
    channel: ServiceChannel.PRESENTIAL,
    responsibleId: '', // Nome escrito do responsável
    observations: ''
  });

  const filteredClientsForForm = useMemo(() => {
    const term = clientSearchTerm.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(term) || 
      (c.taxId && c.taxId.toLowerCase().includes(term))
    );
  }, [clients, clientSearchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) return alert('Selecione um cliente');
    if (!formData.responsibleId) return alert('Informe o responsável técnico');
    addProcess(formData);
    setShowAddForm(false);
    setFormData({ 
      clientId: '', 
      documentType: '', 
      totalValue: 0, 
      initialPayment: 0, 
      paymentMethod: PaymentMethod.PIX, 
      channel: ServiceChannel.PRESENTIAL, 
      responsibleId: '',
      observations: ''
    });
    setClientSearchTerm('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedProcess) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        addAttachment(selectedProcess, 'process', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatusChange = (id: string, newStatus: ProcessStatus) => {
    const err = updateProcessStatus(id, newStatus);
    if (err) {
      setError(err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const processDetail = processes.find(p => p.id === selectedProcess);
  const clientOfProcess = clients.find(c => c.id === processDetail?.clientId);

  return (
    <div className="space-y-6">
      {error && (
        <div className="fixed top-20 right-4 md:right-8 z-[60] bg-red-50 border-l-4 border-red-500 p-4 shadow-lg animate-in slide-in-from-top-4">
          <p className="text-red-800 font-bold text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-black text-slate-800">Processos</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 text-sm font-bold"
        >
          <Icons.Plus className="w-4 h-4" />
          Novo Processo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Processos */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Protocolo</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Serviço / Cliente</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Canal</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processes.slice().reverse().map(process => {
                  const client = clients.find(c => c.id === process.clientId);
                  return (
                    <tr 
                      key={process.id} 
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedProcess === process.id ? 'bg-blue-50/50' : ''}`} 
                      onClick={() => setSelectedProcess(process.id)}
                    >
                      <td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-500">{process.protocolNumber}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-sm">{client?.name || '---'}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">{process.documentType}</p>
                      </td>
                      <td className="px-6 py-4">
                        {process.channel === ServiceChannel.WHATSAPP ? (
                          <div className="flex items-center gap-1.5 text-green-600">
                            <Icons.MessageCircle className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase">WhatsApp</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-blue-600">
                            <Icons.Users className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase">Presencial</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={`font-black text-sm ${process.openBalance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {formatCurrency(process.openBalance)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detalhes do Processo */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 h-fit lg:sticky lg:top-6">
          {processDetail ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-800">{processDetail.protocolNumber}</h3>
                  <p className="text-sm font-bold text-slate-500 uppercase">{clientOfProcess?.name}</p>
                </div>
                <div className={`p-2 rounded-lg ${processDetail.openBalance > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                   <Icons.DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fluxo de Trabalho</p>
                 <div className="grid grid-cols-2 gap-2">
                    {Object.values(ProcessStatus).map(st => (
                      <button 
                        key={st}
                        onClick={() => handleStatusChange(processDetail.id, st)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          processDetail.status === st ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 border border-slate-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Resumo Financeiro</p>
                 <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Valor Total:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(processDetail.totalValue)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Valor Pago:</span>
                      <span className="font-bold text-green-600">{formatCurrency(processDetail.paidValue)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                      <span className="font-black text-slate-800">Saldo Pendente:</span>
                      <span className="font-black text-red-500">{formatCurrency(processDetail.openBalance)}</span>
                    </div>
                 </div>
              </div>

              {processDetail.observations && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-[10px] font-black text-amber-600 uppercase mb-2">Observações</p>
                  <p className="text-xs text-amber-800 leading-relaxed italic">
                    "{processDetail.observations}"
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anexos & Documentos</h4>
                  <div className="flex gap-2">
                    <button onClick={() => setIsCapturing(true)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"><Icons.Camera className="w-4 h-4" /></button>
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><Icons.Plus className="w-4 h-4" /></button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   {processDetail.attachments.map(att => (
                     <div key={att.id} className="relative group aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                        <img src={att.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-2 text-center">
                           <a href={att.url} target="_blank" className="text-white/50 hover:text-white"><Icons.Eye className="w-5 h-5" /></a>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Icons.FileText className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest text-center">Selecione um processo para<br/>ver os detalhes e histórico</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Processo */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
           <div className="bg-white md:rounded-3xl w-full max-w-2xl h-full md:h-auto shadow-2xl p-8 max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-300">
              <div className="flex justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
                    <Icons.Plus className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Abertura de Processo</h3>
                </div>
                <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <Icons.X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                 {/* Cliente com buscador */}
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Buscar Cliente Solicitante</label>
                   <div className="relative mb-3">
                     <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input 
                      type="text"
                      placeholder="Nome ou CPF/CNPJ do cliente..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm focus:border-blue-500 outline-none transition-all"
                      value={clientSearchTerm}
                      onChange={e => setClientSearchTerm(e.target.value)}
                     />
                   </div>
                   <select 
                    required 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl text-sm outline-none transition-all font-medium" 
                    value={formData.clientId} 
                    onChange={e => setFormData({...formData, clientId: e.target.value})}
                   >
                     <option value="">Selecione o Cliente na lista filtrada</option>
                     {filteredClientsForForm.map(c => <option key={c.id} value={c.id}>{c.name} {c.taxId ? `(${c.taxId})` : ''}</option>)}
                     {filteredClientsForForm.length === 0 && <option disabled>Nenhum cliente encontrado</option>}
                   </select>
                 </div>

                 {/* Serviço (Texto Livre) */}
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Descrição do Serviço (Livre)</label>
                   <input 
                    required 
                    placeholder="Ex: Apostilamento de Haia - Certidão de Nascimento" 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl text-sm outline-none transition-all font-medium" 
                    value={formData.documentType} 
                    onChange={e => setFormData({...formData, documentType: e.target.value})} 
                   />
                 </div>

                 {/* Valores Financeiros */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Valor Total do Trâmite (R$)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        required 
                        placeholder="0,00" 
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl text-sm font-bold outline-none transition-all" 
                        onChange={e => setFormData({...formData, totalValue: Number(e.target.value)})} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Valor de Entrada / Sinal (R$)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="0,00" 
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl text-sm font-bold text-green-600 outline-none transition-all" 
                        onChange={e => setFormData({...formData, initialPayment: Number(e.target.value)})} 
                      />
                    </div>
                 </div>

                 {/* Canal e Responsável */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Canal de Atendimento</label>
                      <div className="flex gap-2">
                         <button 
                          type="button" 
                          onClick={() => setFormData({...formData, channel: ServiceChannel.PRESENTIAL})}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${
                            formData.channel === ServiceChannel.PRESENTIAL ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white border-slate-100 text-slate-400'
                          }`}
                         >
                           Presencial
                         </button>
                         <button 
                          type="button" 
                          onClick={() => setFormData({...formData, channel: ServiceChannel.WHATSAPP})}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${
                            formData.channel === ServiceChannel.WHATSAPP ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white border-slate-100 text-slate-400'
                          }`}
                         >
                           WhatsApp
                         </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Responsável Técnico</label>
                      <input 
                        required 
                        placeholder="Nome do responsável técnico..."
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl text-sm outline-none transition-all font-medium" 
                        value={formData.responsibleId} 
                        onChange={e => setFormData({...formData, responsibleId: e.target.value})}
                      />
                    </div>
                 </div>

                 {/* Observações */}
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Observações / Notas Importantes</label>
                   <textarea 
                    placeholder="Detalhes adicionais sobre o processo, urgências ou avisos..."
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl text-sm outline-none transition-all font-medium h-24 resize-none"
                    value={formData.observations}
                    onChange={e => setFormData({...formData, observations: e.target.value})}
                   />
                 </div>

                 <div className="pt-4">
                   <button 
                    type="submit" 
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95"
                   >
                     Gerar Protocolo e Abrir Processo
                   </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {isCapturing && selectedProcess && (
        <ImageCapture 
          onCapture={(data) => { addAttachment(selectedProcess, 'process', data); setIsCapturing(false); }}
          onClose={() => setIsCapturing(false)}
        />
      )}
    </div>
  );
};

export default ProcessModule;
