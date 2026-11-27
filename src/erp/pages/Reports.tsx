import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
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
  Cell,
  Legend,
} from 'recharts';
import { ErpOperationType, logErpFirestoreError } from '../ErpContext';

export default function Reports() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const oppsSnap = await getDocs(collection(db, 'opportunities'));
        setOpportunities(oppsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        logErpFirestoreError(err, ErpOperationType.LIST, 'opportunities');
        setErrorMsg('Erro ao carregar dados dos relatórios.');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const oppsByStatusCount = opportunities.reduce((acc, curr) => {
    const key = curr.status || 'Sem Estado';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const oppsStatusData = Object.keys(oppsByStatusCount).map(key => ({
    name: key,
    value: oppsByStatusCount[key],
  }));

  const COLORS = ['#16263c', '#3e83b8', '#b94f22', '#10b981', '#d97706'];

  const oppsByMonth = opportunities.reduce((acc, curr) => {
    if (curr.status === 'Ganho' && curr.createdAt?.toDate) {
      const date = curr.createdAt.toDate();
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      acc[monthYear] = (acc[monthYear] || 0) + (Number(curr.value) || 0);
    }
    return acc;
  }, {} as Record<string, number>);

  const wonOppsTrend = Object.keys(oppsByMonth).map(key => ({
    name: key,
    Total: oppsByMonth[key],
  }));

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando Relatórios...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3e83b8] block mb-1">Indicadores</span>
          <h1 className="font-heading text-2xl font-bold text-[#16263c]">Relatórios de Vendas</h1>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-[#dfe3e6] shadow-sm">
          <h2 className="font-heading text-xs font-bold text-[#16263c] uppercase tracking-widest mb-6">Pipeline de Oportunidades</h2>
          <div className="h-[300px]">
            {oppsStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={oppsStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {oppsStatusData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sem dados</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#dfe3e6] shadow-sm">
          <h2 className="font-heading text-xs font-bold text-[#16263c] uppercase tracking-widest mb-6">Faturamento de Vendas (Ganhos) por Mês</h2>
          <div className="h-[300px]">
            {wonOppsTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wonOppsTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={val => `MZN ${Number(val) / 1000}k`} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val) => `MZN ${Number(val).toLocaleString()}`} />
                  <Bar dataKey="Total" fill="#b94f22" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs text-center px-4">
                Não há dados suficientes. Tente marcar uma oportunidade como &quot;Ganho&quot;.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
