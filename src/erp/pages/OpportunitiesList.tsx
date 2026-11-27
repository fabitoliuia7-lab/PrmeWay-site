import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus } from 'lucide-react';
import { ErpOperationType, logErpFirestoreError, useErp } from '../ErpContext';

export default function OpportunitiesList() {
  const { navigate } = useErp();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [clients, setClients] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const statuses = ['Prospecção', 'Proposta', 'Negociação', 'Ganho', 'Perdido'];

  useEffect(() => {
    const unsubClients = onSnapshot(
      collection(db, 'clients'),
      (snap) => {
        const cmap: Record<string, any> = {};
        snap.forEach(d => {
          cmap[d.id] = d.data();
        });
        setClients(cmap);
      },
      (error) => {
        logErpFirestoreError(error, ErpOperationType.LIST, 'clients');
      }
    );

    const q = query(collection(db, 'opportunities'), orderBy('createdAt', 'desc'));
    const unsubOpps = onSnapshot(
      q,
      (snap) => {
        setOpportunities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        logErpFirestoreError(error, ErpOperationType.LIST, 'opportunities');
        setErrorMsg('Erro ao carregar funil de oportunidades.');
        setLoading(false);
      }
    );

    return () => {
      unsubClients();
      unsubOpps();
    };
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setErrorMsg(null);
    try {
      await updateDoc(doc(db, 'opportunities', id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      logErpFirestoreError(err, ErpOperationType.UPDATE, `opportunities/${id}`);
      setErrorMsg('Não foi possível atualizar o estágio da oportunidade.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Prospecção': return 'border-slate-300';
      case 'Proposta': return 'border-blue-400';
      case 'Negociação': return 'border-amber-400';
      case 'Ganho': return 'border-emerald-500';
      case 'Perdido': return 'border-rose-500';
      default: return 'border-slate-200';
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-220px)]">
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3e83b8] block mb-1">Funil Comercial</span>
          <h1 className="font-heading text-2xl font-bold text-[#16263c]">Oportunidades &amp; Orçamentos</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/opportunities/new')}
          className="flex items-center gap-2 bg-[#16263c] text-white px-4 py-2.5 rounded-md font-semibold text-xs uppercase tracking-wider hover:bg-[#233856] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Oportunidade
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Carregando funil...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto flex-1 pb-4 snap-x">
          {statuses.map(status => {
            const bucketOpps = opportunities.filter(o => o.status === status);
            const totalValue = bucketOpps.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
            return (
              <div key={status} className="flex flex-col bg-white/70 rounded-lg min-w-[280px] max-w-[320px] shrink-0 snap-center border border-[#dfe3e6]">
                <div className={`p-4 border-t-4 rounded-t-lg ${getStatusColor(status)} flex items-center justify-between bg-white`}>
                  <h3 className="font-heading font-bold text-[#16263c] uppercase tracking-wider text-xs">{status}</h3>
                  <span className="bg-[#f7f7f3] text-[#16263c] px-2 py-0.5 rounded text-xs font-bold border border-[#dfe3e6]">{bucketOpps.length}</span>
                </div>

                <div className="px-4 py-2 bg-white border-b border-[#dfe3e6] flex items-center justify-between shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tempo Real</span>
                  <span className="text-xs font-bold text-[#16263c]">MZN {totalValue.toLocaleString()}</span>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                  {bucketOpps.map(opp => (
                    <div
                      key={opp.id}
                      className="bg-white p-4 rounded-lg border border-[#dfe3e6] shadow-sm hover:border-[#16263c]/40 transition-colors cursor-pointer relative group"
                      onClick={() => navigate(`/opportunities/${opp.id}`)}
                    >
                      <h4 className="font-bold text-[#16263c] text-sm mb-1 pr-16">{opp.title}</h4>
                      <p className="text-xs text-slate-500 mb-3 truncate">{clients[opp.clientId]?.name || 'Cliente Desconhecido'}</p>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#b94f22]">MZN {(Number(opp.value) || 0).toLocaleString()}</span>
                        {opp.deadline && (
                          <span className="text-slate-400 font-medium">Até {new Date(opp.deadline).toLocaleDateString('pt-PT')}</span>
                        )}
                      </div>

                      <div className="absolute top-2 right-2">
                        <select
                          aria-label="Mover estágio"
                          className="text-[10px] bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 outline-none font-bold text-slate-600 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            void handleStatusChange(opp.id, e.target.value);
                          }}
                          value={status}
                        >
                          {statuses.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {bucketOpps.length === 0 && (
                    <div className="border border-dashed border-slate-300 rounded-lg p-6 flex items-center justify-center text-slate-400 text-xs font-bold tracking-wider">
                      VAZIO
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
