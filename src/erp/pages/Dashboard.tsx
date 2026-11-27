import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, ShoppingBag, FolderKanban, Calendar, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ErpOperationType, logErpFirestoreError, useErp } from '../ErpContext';

export default function Dashboard() {
  const { navigate } = useErp();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalSales: 0,
    inTransit: 0,
    totalOpps: 0,
    totalOppValue: 0,
    pendingTasks: 0,
  });
  const [oppsData, setOppsData] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#38bdf8', '#818cf8', '#fbbf24', '#34d399', '#fb7185'];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [clientsSnap, salesSnap, oppsSnap, tasksSnap] = await Promise.all([
          getDocs(collection(db, 'clients')),
          getDocs(collection(db, 'sales')),
          getDocs(collection(db, 'opportunities')),
          getDocs(query(collection(db, 'tasks'), where('status', '==', 'Pendente'))),
        ]);

        let inTransitCount = 0;
        salesSnap.forEach(docSnap => {
          const st = docSnap.data().status;
          if (st === 'In Transit' || st === 'Em Trânsito') {
            inTransitCount++;
          }
        });

        const oppsCountByStatus: Record<string, number> = {};
        let totalValue = 0;
        oppsSnap.forEach(docSnap => {
          const data = docSnap.data();
          const status = data.status || 'Sem status';
          oppsCountByStatus[status] = (oppsCountByStatus[status] || 0) + 1;

          let val = data.value || 0;
          if (typeof val === 'string') val = parseFloat(val) || 0;
          totalValue += val;
        });

        const oppsChartData = Object.keys(oppsCountByStatus).map(key => ({
          name: key,
          Quantidade: oppsCountByStatus[key],
          value: oppsCountByStatus[key]
        }));
        setOppsData(oppsChartData);

        const tasksList: any[] = [];
        tasksSnap.forEach(docSnap => {
          tasksList.push({ id: docSnap.id, ...docSnap.data() });
        });
        tasksList.sort((a, b) => {
          const dateA = a.date?.toDate?.() || new Date(0);
          const dateB = b.date?.toDate?.() || new Date(0);
          return dateA.getTime() - dateB.getTime();
        });
        setTodayTasks(tasksList.slice(0, 5));

        setStats({
          totalClients: clientsSnap.size,
          totalSales: salesSnap.size,
          inTransit: inTransitCount,
          totalOpps: oppsSnap.size,
          totalOppValue: totalValue,
          pendingTasks: tasksSnap.size,
        });
      } catch (err) {
        logErpFirestoreError(err, ErpOperationType.LIST, 'erp_dashboard');
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, []);

  if (loading) {
    return <div className="text-slate-500 p-8">Carregando dashboard...</div>;
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="#475569" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${name} (${value})`}
      </text>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/clients')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-200 transition-colors"
        >
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total de Clientes</p>
            <p className="text-2xl font-extrabold text-slate-900">{stats.totalClients}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => navigate('/opportunities')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-200 transition-colors"
        >
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Valor em Pipeline</p>
            <p className="text-2xl font-extrabold text-indigo-600">MZN {stats.totalOppValue.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => navigate('/sales')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-200 transition-colors"
        >
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Importações ({stats.inTransit} em trânsito)</p>
            <p className="text-2xl font-extrabold text-slate-900">{stats.totalSales}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => navigate('/agenda')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-200 transition-colors"
        >
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Follow-ups Pendentes</p>
            <p className="text-2xl font-extrabold text-amber-600">{stats.pendingTasks}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 uppercase mb-6">Distribuição do Funil</h2>
          <div className="h-[300px]">
            {oppsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={oppsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={renderCustomizedLabel}
                  >
                    {oppsData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Nenhuma oportunidade cadastrada
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 uppercase mb-6">Oportunidades por Estágio</h2>
          <div className="h-[300px]">
            {oppsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={oppsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="Quantidade" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Nenhuma oportunidade cadastrada
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase">Alertas de Follow-up (Agenda)</h2>
          <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100">PRÓXIMOS EVENTOS</span>
        </div>

        <div className="flex flex-col gap-2 relative">
          <div className="absolute left-[15px] top-4 bottom-0 w-px bg-slate-100" style={{ width: '2px' }} />

          {todayTasks.length > 0 ? (
            todayTasks.map((task) => (
              <div key={task.id} className="relative pl-12 py-3 group">
                <div className={`absolute left-0 top-[18px] w-8 h-8 -ml-1 rounded-full border-[3px] border-white flex items-center justify-center text-white ${task.priority === 'Alta' ? 'bg-rose-500' : task.priority === 'Média' ? 'bg-amber-500' : 'bg-blue-400'}`}>
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 group-hover:border-indigo-200 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-800">{task.title}</p>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white text-slate-500 border border-slate-200 shadow-sm shrink-0">
                      {task.date?.toDate?.()?.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) || '-'}
                    </span>
                  </div>
                  {task.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{task.description}</p>}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 pl-12 text-slate-400 text-sm">
              Nenhum follow-up pendente.{' '}
              <button
                type="button"
                onClick={() => navigate('/agenda')}
                className="text-indigo-500 hover:underline font-medium cursor-pointer"
              >
                Adicionar na agenda.
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
