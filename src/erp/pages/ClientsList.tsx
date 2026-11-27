import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Search, ChevronRight } from 'lucide-react';
import { ErpOperationType, logErpFirestoreError, useErp } from '../ErpContext';

export default function ClientsList() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { navigate } = useErp();

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('name'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setClients(data);
        setLoading(false);
      },
      (error) => {
        logErpFirestoreError(error, ErpOperationType.LIST, 'clients');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filtered = clients.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Gestão de Clientes</h1>
        <button
          type="button"
          onClick={() => navigate('/clients/new')}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          NOVO CLIENTE
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3 w-full sm:w-1/2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-slate-700 bg-transparent text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Carregando clientes...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">Nenhum cliente encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 font-bold bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Contato</th>
                  <th className="px-6 py-3 text-right">Status</th>
                  <th className="px-6 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {filtered.map(client => (
                  <tr
                    key={client.id}
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div className="font-medium text-slate-900">{client.name}</div>
                      <div className="text-xs text-slate-500">{client.company}</div>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {client.email || client.phone || '-'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        client.status === 'Ativo' || client.status === 'Ganho' || client.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : client.status === 'Novo' || client.status === 'Qualificado' || client.status === 'Lead'
                            ? 'bg-indigo-100 text-indigo-700'
                            : client.status === 'Perdido'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                      }`}>
                        {client.status === 'Active' ? 'ATIVO' : client.status === 'Lead' ? 'LEAD' : (client.status || 'INATIVO').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 inline-block" />
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
