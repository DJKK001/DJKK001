
import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Icons, COLORS } from '../constants';
import { formatCurrency, formatDate } from '../utils/helpers';
import { PaymentMethod, PaymentStatus } from '../types';

const FinanceModule: React.FC = () => {
  const { processes, payments, clients, addPayment } = useApp();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState('');

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: PaymentMethod.PIX,
    date: new Date().toISOString().split('T')[0]
  });

  // Estado para o Relatório
  const [reportFilter, setReportFilter] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProcessId) return alert('Selecione um processo');
    addPayment({
      processId: selectedProcessId,
      amount: paymentData.amount,
      method: paymentData.method,
      date: new Date(paymentData.date).toISOString()
    });
    setShowPaymentForm(false);
    setSelectedProcessId('');
    setPaymentData({ amount: 0, method: PaymentMethod.PIX, date: new Date().toISOString().split('T')[0] });
  };

  const pendingProcesses = processes.filter(p => p.openBalance > 0);

  // Lógica de filtragem para o relatório
  const filteredPayments = useMemo(() => {
    const start = new Date(reportFilter.startDate);
    const end = new Date(reportFilter.endDate);
    end.setHours(23, 59, 59, 999);

    return payments.filter(p => {
      const pDate = new Date(p.date);
      return pDate >= start && pDate <= end;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, reportFilter]);

  const reportStats = useMemo(() => {
    const total = filteredPayments.reduce((acc, p) => acc + p.amount, 0);
    const count = filteredPayments.length;
    return { total, count, avg: count > 0 ? total / count : 0 };
  }, [filteredPayments]);

  const setPreset = (type: 'week' | 'month' | 'lastMonth') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'week') {
      start.setDate(now.getDate() - now.getDay());
    } else if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (type === 'lastMonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    setReportFilter({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Estilos para Impressão PDF */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-print-area, #report-print-area * { visibility: visible; }
          #report-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-black text-slate-800">Financeiro</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowReportModal(true)}
            className="bg-white border-2 border-slate-200 text-slate-700 px-3 py-2 md:px-4 md:py-2 rounded-xl flex items-center gap-2 transition-all hover:bg-slate-50 text-sm font-bold shadow-sm"
          >
            <Icons.FileText className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">Relatórios</span>
            <span className="sm:hidden">Relat.</span>
          </button>
          <button 
            onClick={() => setShowPaymentForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-green-100 text-sm font-black uppercase tracking-wider"
          >
            <Icons.DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Lançar Recebimento</span>
            <span className="sm:hidden">Lançar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Statistics Cards */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">A Receber</p>
           <h3 className="text-lg md:text-2xl font-black text-red-500 mt-1">
             {formatCurrency(processes.reduce((acc, p) => acc + p.openBalance, 0))}
           </h3>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Recebido (Total)</p>
           <h3 className="text-lg md:text-2xl font-black text-green-600 mt-1">
             {formatCurrency(payments.reduce((acc, p) => acc + p.amount, 0))}
           </h3>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Pendências</p>
           <h3 className="text-lg md:text-2xl font-black text-slate-800 mt-1">{pendingProcesses.length}</h3>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ticket Médio</p>
           <h3 className="text-lg md:text-2xl font-black text-blue-600 mt-1 truncate">
             {formatCurrency(processes.length ? processes.reduce((acc, p) => acc + p.totalValue, 0) / processes.length : 0)}
           </h3>
        </div>
      </div>

      {/* Main Finance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
        {/* Recent Payments Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
          <div className="px-4 md:px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
             <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-widest">
               <Icons.History className="w-4 h-4 text-blue-500" />
               Últimos Recebimentos
             </h3>
          </div>
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left min-w-[600px]">
               <thead className="bg-slate-100 text-[10px] text-slate-500 uppercase font-black sticky top-0 z-10">
                 <tr>
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3">Cliente / Serviço</th>
                    <th className="px-6 py-3 text-right">Valor</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {payments.slice().reverse().map(payment => {
                   const process = processes.find(p => p.id === payment.processId);
                   const client = clients.find(c => c.id === process?.clientId);
                   return (
                     <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">{formatDate(payment.date).split(',')[0]}</td>
                        <td className="px-6 py-4">
                           <p className="text-xs font-black text-slate-800">{client?.name}</p>
                           <p className="text-[10px] text-blue-600 font-bold uppercase">{process?.documentType}</p>
                           <p className="text-[9px] text-slate-400 font-mono mt-0.5">{process?.protocolNumber}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-green-600 text-right">{formatCurrency(payment.amount)}</td>
                     </tr>
                   );
                 })}
                 {payments.length === 0 && (
                   <tr>
                     <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm font-medium italic">Nenhum lançamento encontrado.</td>
                   </tr>
                 )}
               </tbody>
            </table>
          </div>
        </div>

        {/* Pending Receivables Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
          <div className="px-4 md:px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
             <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-widest">
               <Icons.AlertCircle className="w-4 h-4 text-red-500" />
               Saldos Devedores
             </h3>
          </div>
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left min-w-[600px]">
               <thead className="bg-slate-100 text-[10px] text-slate-500 uppercase font-black sticky top-0 z-10">
                 <tr>
                    <th className="px-6 py-3">Cliente / Serviço</th>
                    <th className="px-6 py-3 text-right">Saldo</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {pendingProcesses.map(process => {
                   const client = clients.find(c => c.id === process.clientId);
                   return (
                     <tr key={process.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                           <p className="text-xs font-black text-slate-800">{client?.name}</p>
                           <p className="text-[10px] text-slate-500 font-bold uppercase">{process.documentType}</p>
                           <div className="flex items-center gap-2 mt-1">
                             <span className="text-[9px] font-mono font-bold text-slate-400">{process.protocolNumber}</span>
                             <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                               process.status === 'Pronto' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                             }`}>
                               {process.status}
                             </span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-red-500 text-right">{formatCurrency(process.openBalance)}</td>
                     </tr>
                   );
                 })}
                 {pendingProcesses.length === 0 && (
                   <tr>
                     <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm font-medium italic">Sem pendências no momento.</td>
                   </tr>
                 )}
               </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: Lançar Pagamento */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
          <div className="bg-white md:rounded-3xl w-full max-w-lg h-full md:h-auto shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-green-50 shrink-0">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Lançar Pagamento</h3>
              <button onClick={() => setShowPaymentForm(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <Icons.X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Processo com Saldo Aberto</label>
                  <select 
                    required
                    className="w-full px-4 py-3 md:py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-green-500 outline-none text-sm font-bold transition-all"
                    value={selectedProcessId}
                    onChange={e => setSelectedProcessId(e.target.value)}
                  >
                    <option value="">Selecione um processo...</option>
                    {pendingProcesses.map(p => {
                      const c = clients.find(cl => cl.id === p.clientId);
                      return <option key={p.id} value={p.id}>{c?.name} - {p.documentType} ({formatCurrency(p.openBalance)})</option>;
                    })}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Valor Pago (R$)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                      <input 
                        type="number"
                        step="0.01"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-green-500 outline-none font-black text-lg transition-all"
                        value={paymentData.amount || ''}
                        onChange={e => setPaymentData({...paymentData, amount: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Data do Recebimento</label>
                     <input 
                      type="date"
                      required
                      className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-green-500 outline-none text-sm font-bold transition-all"
                      value={paymentData.date}
                      onChange={e => setPaymentData({...paymentData, date: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Meio de Recebimento</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(PaymentMethod).map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentData({...paymentData, method})}
                        className={`px-4 py-3 border-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          paymentData.method === method 
                          ? 'bg-green-600 text-white border-green-600 shadow-md' 
                          : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pb-4">
                <button type="button" onClick={() => setShowPaymentForm(false)} className="px-8 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold uppercase text-[10px]">Voltar</button>
                <button type="submit" className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-green-100 transition-all">Confirmar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Relatórios Contábeis (Aprimorado) */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-0 md:p-6 overflow-hidden">
          <div className="bg-white md:rounded-3xl w-full max-w-5xl h-full md:h-auto md:max-h-[95vh] shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icons.FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Relatórios Contábeis</h3>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <Icons.X className="w-7 h-7" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
              {/* Filtros de Período */}
              <section className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 no-print">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Configuração do Período</h4>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase">Data Início</label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm transition-all"
                        value={reportFilter.startDate}
                        onChange={e => setReportFilter({...reportFilter, startDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase">Data Término</label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm transition-all"
                        value={reportFilter.endDate}
                        onChange={e => setReportFilter({...reportFilter, endDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex items-end gap-2 shrink-0 overflow-x-auto pb-1">
                    <button onClick={() => setPreset('week')} className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase hover:border-blue-500 hover:text-blue-600 transition-all whitespace-nowrap">Semana</button>
                    <button onClick={() => setPreset('month')} className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase hover:border-blue-500 hover:text-blue-600 transition-all whitespace-nowrap">Mês Atual</button>
                    <button onClick={() => setPreset('lastMonth')} className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase hover:border-blue-500 hover:text-blue-600 transition-all whitespace-nowrap">Mês Anterior</button>
                  </div>
                </div>
              </section>

              {/* Pré-visualização do Relatório (Aprimorado) */}
              <div id="report-print-area" className="bg-white border-2 border-slate-100 rounded-3xl p-6 md:p-10 shadow-sm print:shadow-none print:border-none">
                <header className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-100 pb-8 mb-8 gap-4">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 mb-1">Extrato de Entradas</h1>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Gestão DocTramite Pro</p>
                    <div className="mt-4 flex flex-wrap gap-4">
                      <p className="text-slate-400 text-[9px] uppercase font-black bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        Início: {formatDate(reportFilter.startDate).split(',')[0]}
                      </p>
                      <p className="text-slate-400 text-[9px] uppercase font-black bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        Fim: {formatDate(reportFilter.endDate).split(',')[0]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl ml-auto mb-2 flex items-center justify-center shadow-lg">
                      <Icons.PieChart className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Relatório Contábil</p>
                  </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                   <div className="bg-green-50/50 p-6 rounded-2xl border-2 border-green-100">
                     <p className="text-[10px] font-black text-green-600 uppercase mb-1 tracking-widest">Faturamento Período</p>
                     <h5 className="text-2xl font-black text-green-700">{formatCurrency(reportStats.total)}</h5>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Qtd. Lançamentos</p>
                     <h5 className="text-2xl font-black text-slate-800">{reportStats.count}</h5>
                   </div>
                   <div className="bg-blue-50/50 p-6 rounded-2xl border-2 border-blue-100">
                     <p className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">Ticket Médio</p>
                     <h5 className="text-2xl font-black text-blue-700">{formatCurrency(reportStats.avg)}</h5>
                   </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] border-b-2 border-slate-100 pb-3">Detalhamento Completo das Entradas</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                      <thead>
                        <tr className="text-[9px] text-slate-400 uppercase font-black border-b border-slate-100">
                          <th className="py-3 px-2">Data</th>
                          <th className="py-3 px-2">Cliente</th>
                          <th className="py-3 px-2">Serviço / Protocolo</th>
                          <th className="py-3 px-2">Responsável</th>
                          <th className="py-3 px-2">Método</th>
                          <th className="py-3 px-2 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPayments.map(p => {
                          const process = processes.find(proc => proc.id === p.processId);
                          const client = clients.find(c => c.id === process?.clientId);
                          return (
                            <tr key={p.id} className="text-[11px] hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-2 text-slate-600 font-bold">{formatDate(p.date).split(',')[0]}</td>
                              <td className="py-4 px-2">
                                <p className="font-black text-slate-800 uppercase">{client?.name}</p>
                              </td>
                              <td className="py-4 px-2">
                                <p className="font-bold text-blue-700 uppercase leading-tight">{process?.documentType}</p>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{process?.protocolNumber}</p>
                              </td>
                              <td className="py-4 px-2">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-black uppercase text-[8px] border border-slate-200">
                                  {process?.responsibleId || 'S/R'}
                                </span>
                              </td>
                              <td className="py-4 px-2 font-bold text-slate-500">{p.method}</td>
                              <td className="py-4 px-2 text-right font-black text-slate-900 text-sm">{formatCurrency(p.amount)}</td>
                            </tr>
                          );
                        })}
                        {filteredPayments.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400 italic font-medium">Nenhum dado financeiro encontrado para o período.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <footer className="mt-20 pt-10 border-t-2 border-slate-100 flex flex-col md:flex-row justify-between items-end gap-8 print:opacity-100 opacity-60">
                   <div>
                     <div className="flex items-center gap-2 mb-2">
                       <Icons.CheckCircle2 className="w-4 h-4 text-green-500" />
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Relatório Validado Digitalmente</p>
                     </div>
                     <p className="text-[9px] text-slate-400 font-bold uppercase">Gerado em {formatDate(new Date().toISOString())}</p>
                     <p className="text-[9px] text-slate-400 font-medium max-w-sm mt-1">Este extrato detalhado é de uso exclusivo para controle interno e prestação de contas dos serviços prestados.</p>
                   </div>
                   <div className="text-right w-full md:w-auto">
                     <div className="w-full md:w-48 h-0.5 bg-slate-300 mb-2 ml-auto"></div>
                     <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Responsável Financeiro</p>
                   </div>
                </footer>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 shrink-0 flex flex-col sm:flex-row justify-end gap-3 rounded-b-3xl no-print">
              <button 
                onClick={() => setShowReportModal(false)}
                className="px-8 py-3 text-slate-600 hover:bg-slate-200 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
              >
                Voltar
              </button>
              <button 
                onClick={handlePrint}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Icons.Download className="w-5 h-5" />
                Imprimir Extrato (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceModule;
