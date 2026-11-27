import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Search } from 'lucide-react';
import { ErpOperationType, logErpFirestoreError, useErp } from '../ErpContext';

export default function SalesList() {
  const { navigate } = useErp();
  const [sales, setSales] = useState<any[]>([]);
  const [clients, setClients] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribeClients = onSnapshot(
      collection(db, 'clients'),
      (snapshot) => {
        const clientsMap: Record<string, any> = {};
        snapshot.forEach(d => {
          clientsMap[d.id] = d.data();
        });
        setClients(clientsMap);
      },
      (error) => {
        logErpFirestoreError(error, ErpOperationType.LIST, 'clients');
      }
    );

    const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
    const unsubscribeSales = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }));
        setSales(data);
        setLoading(false);
      },
      (error) => {
        logErpFirestoreError(error, ErpOperationType.LIST, 'sales');
        setLoading(false);
      }
    );

    return () => {
      unsubscribeClients();
      unsubscribeSales();
    };
  }, []);

  const filtered = sales.filter(s =>
    (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (clients[s.clientId]?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Negotiating': return 'bg-indigo-100 text-indigo-700';
      case 'Purchased': return 'bg-sky-100 text-sky-700';
      case 'In Transit': return 'bg-blue-100 text-blue-700';
      case 'Customs': return 'bg-orange-100 text-orange-700';
      case 'Delivered': return 'bg-emerald-100 text-emerald-700';
      case 'Cancelled': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'Pending': return 'PENDENTE';
      case 'Negotiating': return 'NEGOCIANDO';
      case 'Purchased': return 'COMPRADO';
      case 'In Transit': return 'EM TRÂNSITO';
      case 'Customs': return 'ALFÂNDEGA';
      case 'Delivered': return 'ENTREGUE';
      case 'Cancelled': return 'CANCELADO';
      default: return String(status || '').toUpperCase();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Importações e Vendas</h1>
        <button
          type="button"
          onClick={() => navigate('/sales/new')}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          NOVA OPERAÇÃO
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3 w-full sm:w-1/2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por referência ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-slate-700 bg-transparent text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Carregando dados...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">Nenhuma operação encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 font-bold bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3">Referência</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {filtered.map(sale => (
                  <tr
                    key={sale.id}
                    onClick={() => navigate(`/sales/${sale.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {sale.title}
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-medium text-slate-700">{clients[sale.clientId]?.name || 'Cliente Desconhecido'}</span>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {sale.type}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(sale.status)}`}>
                        {translateStatus(sale.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-slate-900">
                      {sale.amount ? `MZN ${Number(sale.amount).toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
