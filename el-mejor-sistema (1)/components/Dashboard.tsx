
import React from 'react';
import { useApp } from '../store/AppContext';
import { Icons, COLORS } from '../constants';
import { formatCurrency } from '../utils/helpers';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ProcessStatus } from '../types';

const Dashboard: React.FC = () => {
  const { processes, clients } = useApp();

  const kpis = [
    { 
      label: 'Documentos em Trâmite', 
      value: processes.filter(p => p.status === ProcessStatus.TRANSIT).length, 
      icon: Icons.Clock, 
      color: 'bg-blue-100 text-blue-600' 
    },
    { 
      label: 'Prontos (Aguardando Pagamento)', 
      value: processes.filter(p => p.status === ProcessStatus.READY && p.openBalance > 0).length, 
      icon: Icons.AlertCircle, 
      color: 'bg-amber-100 text-amber-600' 
    },
    { 
      label: 'Pagos e Não Entregues', 
      value: processes.filter(p => p.status === ProcessStatus.READY && p.openBalance <= 0).length, 
      icon: Icons.PackageCheck, 
      color: 'bg-indigo-100 text-indigo-600' 
    },
    { 
      label: 'Clientes Inadimplentes', 
      value: processes.filter(p => p.openBalance > 0).reduce((acc: Set<string>, p) => acc.add(p.clientId), new Set()).size, 
      icon: Icons.Users, 
      color: 'bg-red-100 text-red-600' 
    },
  ];

  const financialStats = processes.reduce((acc, p) => ({
    total: acc.total + p.totalValue,
    paid: acc.paid + p.paidValue,
    toReceive: acc.toReceive + p.openBalance
  }), { total: 0, paid: 0, toReceive: 0 });

  const statusData = [
    { name: 'Elaboração', value: processes.filter(p => p.status === ProcessStatus.ELABORATION).length },
    { name: 'Em Trâmite', value: processes.filter(p => p.status === ProcessStatus.TRANSIT).length },
    { name: 'Pronto', value: processes.filter(p => p.status === ProcessStatus.READY).length },
    { name: 'Entregue', value: processes.filter(p => p.status === ProcessStatus.DELIVERED).length },
  ];

  const PIE_COLORS = [COLORS.info, COLORS.warning, COLORS.success, COLORS.secondary];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${kpi.color}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-slate-800">{kpi.value}</span>
            </div>
            <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Icons.DollarSign className="w-5 h-5 text-green-500" />
            Resumo Financeiro
          </h3>
          <div className="grid grid-cols-3 gap-8">
             <div>
               <p className="text-sm text-slate-500 mb-1">Total Negociado</p>
               <p className="text-2xl font-bold text-slate-800">{formatCurrency(financialStats.total)}</p>
             </div>
             <div>
               <p className="text-sm text-slate-500 mb-1">Total Recebido</p>
               <p className="text-2xl font-bold text-green-600">{formatCurrency(financialStats.paid)}</p>
             </div>
             <div>
               <p className="text-sm text-slate-500 mb-1">A Receber</p>
               <p className="text-2xl font-bold text-red-500">{formatCurrency(financialStats.toReceive)}</p>
             </div>
          </div>
          <div className="mt-8 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[financialStats]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="paid" name="Recebido" fill={COLORS.success} radius={[4, 4, 0, 0]} barSize={60} />
                <Bar dataKey="toReceive" name="Pendente" fill={COLORS.danger} radius={[4, 4, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6">Processos por Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {statusData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }}></div>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
